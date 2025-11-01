// Agent workflow nodes (plan, hunt, explain, write)
import type { AgentState, Finding } from "@/types";
import { runAllDetectors, getRepoMetadata } from "@/lib/detectors";
import { generateTimeline, generateExplanation, generateFix } from "@/lib/utils/timeline";
import { calculateSeverity, calculateETA, calculateMinutesSaved } from "@/lib/utils/scoring";
import { v4 as uuidv4 } from "uuid";

/**
 * Helper to create a log entry
 */
function createLog(
  phase: AgentState['logs'][0]['phase'],
  message: string
): AgentState['logs'][0] {
  return {
    timestamp: Date.now(),
    phase,
    message,
  };
}

/**
 * NODE 1: PLAN
 * - Connect to GitHub repository
 * - Get repository metadata (languages, frameworks)
 * - Log strategy
 */
export async function planNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[Agent] PLAN phase starting...');
  
  try {
    const logs = [
      createLog('plan', 'Initializing agent...'),
      createLog('plan', 'Connecting to repository...'),
      createLog('plan', 'Analyzing codebase structure...'),
    ];
    
    // Get metadata using GitHub API
    const metadata = await getRepoMetadata(state.repoUrl);
    
    // Log strategy
    const langs = metadata.languages.join(', ') || 'Unknown';
    const frameworks = metadata.frameworks.join(', ') || 'None detected';
    
    logs.push(
      createLog(
        'plan',
        `Detected: ${langs}${frameworks !== 'None detected' ? ', ' + frameworks : ''}`
      )
    );
    
    logs.push(
      createLog(
        'plan',
        `Files: ${metadata.totalFiles} | Strategy: Security → Reliability → Maintainability`
      )
    );
    
    console.log('[Agent] PLAN phase complete');
    
    return {
      repoMetadata: metadata,
      logs,
    };
    
  } catch (error: any) {
    console.error('[Agent] PLAN phase failed:', error);
    return {
      error: error.message,
      logs: [createLog('plan', `Error: ${error.message}`)],
    };
  }
}

/**
 * NODE 2: HUNT
 * - Run GitHub-based detectors
 * - Collect findings
 * - Log results by category
 */
export async function huntNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[Agent] HUNT phase starting...');
  
  // Skip if there was an error in previous phase
  if (state.error) {
    console.log('[Agent] HUNT phase skipped due to error');
    return {};
  }
  
  try {
    const logs = [
      createLog('hunt', 'Agent: Hunting for issues...'),
    ];
    
    // Run all detectors using GitHub API
    console.log('[Agent] Running GitHub-based detectors...');
    const findings = await runAllDetectors(state.repoUrl);
    
    // Log results by category
    const securityCount = findings.filter(f => f.category === 'security').length;
    const reliabilityCount = findings.filter(f => f.category === 'reliability').length;
    const maintainabilityCount = findings.filter(f => f.category === 'maintainability').length;
    
    logs.push(createLog('hunt', `✓ Security: ${securityCount} issues`));
    logs.push(createLog('hunt', `✓ Reliability: ${reliabilityCount} issues`));
    logs.push(createLog('hunt', `✓ Maintainability: ${maintainabilityCount} issues`));
    
    console.log(`[Agent] HUNT phase complete - Found ${findings.length} issues`);
    
    return {
      findings,
      logs,
    };
    
  } catch (error: any) {
    console.error('[Agent] HUNT phase failed:', error);
    return {
      error: error.message,
      logs: [createLog('hunt', `Error: ${error.message}`)],
    };
  }
}

/**
 * NODE 3: EXPLAIN
 * - Generate timeline predictions for each finding
 * - Generate explanations with GPT-4
 * - Generate fix suggestions
 * - Calculate severity and ETA
 * - Enrich findings with all AI content
 */
export async function explainNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[Agent] EXPLAIN phase starting...');
  
  // Skip if there was an error or no findings
  if (state.error || !state.findings || state.findings.length === 0) {
    console.log('[Agent] EXPLAIN phase skipped');
    return {};
  }
  
  try {
    const logs = [
      createLog('explain', 'Agent: Generating timeline predictions...'),
      createLog('explain', `└─ Analyzing ${state.findings.length} findings...`),
    ];
    
    console.log(`[Agent] Enriching ${state.findings.length} findings...`);
    
    // Process findings in batches of 5 to respect rate limits
    const enrichedFindings: Finding[] = [];
    
    for (let i = 0; i < state.findings.length; i += 5) {
      const batch = state.findings.slice(i, i + 5);
      
      const batchResults = await Promise.all(
        batch.map(async (finding) => {
          try {
            // Generate timeline, explanation, and fix in parallel
            const [timeline, explanation, fix] = await Promise.all([
              generateTimeline(finding.ruleId, finding.file, finding.snippet),
              generateExplanation(finding.ruleId, finding.file, finding.snippet),
              generateFix(finding.ruleId, finding.snippet),
            ]);
            
            // Calculate severity and ETA
            const severity = calculateSeverity(finding.ruleId);
            const eta = calculateETA(finding.ruleId, finding.snippet);
            const minutesSaved = calculateMinutesSaved(severity, eta);
            
            // Create enriched finding
            const enriched: Finding = {
              id: uuidv4(),
              ruleId: finding.ruleId,
              category: finding.category,
              severity,
              eta,
              file: finding.file,
              line: finding.line,
              snippet: finding.snippet,
              title: explanation.split('.')[0] || `${finding.ruleId.replace(/-/g, ' ')}`,
              explanation,
              fix,
              timeline,
              minutesSaved,
            };
            
            return enriched;
          } catch (error) {
            console.error(`[Agent] Error enriching finding:`, error);
            
            // Return minimal finding if enrichment fails
            return {
              id: uuidv4(),
              ruleId: finding.ruleId,
              category: finding.category,
              severity: calculateSeverity(finding.ruleId),
              eta: 'medium' as const,
              file: finding.file,
              line: finding.line,
              snippet: finding.snippet,
              title: `${finding.ruleId.replace(/-/g, ' ')} in ${finding.file}`,
              explanation: 'Unable to generate explanation',
              fix: '// Fix could not be generated',
              timeline: {
                t3m: 'Issue detected',
                t6m: 'Problem persists',
                t1y: 'Refactor needed',
                t2y: 'Technical debt grows',
              },
              minutesSaved: 10,
            };
          }
        })
      );
      
      enrichedFindings.push(...batchResults);
      
      // Log progress
      console.log(`[Agent] Enriched ${enrichedFindings.length}/${state.findings.length} findings`);
      
      // Small delay between batches
      if (i + 5 < state.findings.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logs.push(createLog('explain', 'Agent: Calculating future pain impact...'));
    
    console.log('[Agent] EXPLAIN phase complete');
    
    return {
      enrichedFindings,
      logs,
    };
    
  } catch (error: any) {
    console.error('[Agent] EXPLAIN phase failed:', error);
    return {
      error: error.message,
      logs: [createLog('explain', `Error: ${error.message}`)],
    };
  }
}

/**
 * NODE 4: WRITE
 * - Calculate final statistics
 * - Sort findings by priority
 * - Log completion
 */
export async function writeNode(state: AgentState): Promise<Partial<AgentState>> {
  console.log('[Agent] WRITE phase starting...');
  
  // Skip if there was an error or no enriched findings
  if (state.error || !state.enrichedFindings || state.enrichedFindings.length === 0) {
    console.log('[Agent] WRITE phase skipped');
    return {};
  }
  
  try {
    const logs = [
      createLog('write', 'Agent: Compiling refactor roadmap...'),
    ];
    
    // Calculate statistics
    const criticalCount = state.enrichedFindings.filter(f => f.severity === 'critical').length;
    const highCount = state.enrichedFindings.filter(f => f.severity === 'high').length;
    const mediumCount = state.enrichedFindings.filter(f => f.severity === 'medium').length;
    const lowCount = state.enrichedFindings.filter(f => f.severity === 'low').length;
    const totalMinutes = state.enrichedFindings.reduce((sum, f) => sum + f.minutesSaved, 0);
    
    logs.push(createLog('write', '└─ Prioritizing by severity × effort...'));
    logs.push(createLog('write', `✓ Scan complete - Found ${state.enrichedFindings.length} issues`));
    logs.push(
      createLog('write', `✓ Time saved: ${Math.round(totalMinutes / 60 * 10) / 10} hours`)
    );
    
    console.log('[Agent] WRITE phase complete');
    console.log(`[Agent] Stats: Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount}, Low: ${lowCount}`);
    
    return {
      logs,
    };
    
  } catch (error: any) {
    console.error('[Agent] WRITE phase failed:', error);
    return {
      error: error.message,
      logs: [createLog('write', `Error: ${error.message}`)],
    };
  }
}

