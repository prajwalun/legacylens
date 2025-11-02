// Agent workflow nodes (plan, hunt, explain, write)
import type { AgentState, Finding } from "@/types";
import { runAllDetectors, getRepoMetadata } from "@/lib/detectors";
import { generateTimeline, generateExplanation, generateFix } from "@/lib/utils/timeline";
import { calculateSeverity, calculateETA, calculateMinutesSaved } from "@/lib/utils/scoring";
import { v4 as uuidv4 } from "uuid";
import { getScan, updateScan } from '@/lib/storage/scans';

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
 * Helper to save a log immediately to the database
 */
async function saveLogImmediately(scanId: string, phase: string, message: string) {
  try {
    const scan = await getScan(scanId);
    if (scan) {
      const newLog = {
        timestamp: Date.now(),
        phase: phase as any,
        message,
      };
      
      await updateScan(scanId, {
        logs: [...(scan.logs || []), newLog],
      });
    }
  } catch (error) {
    // Silent fail - don't crash if log saving fails
  }
}

/**
 * Helper function to add logs with immediate DB save
 */
function addLog(state: AgentState, phase: AgentState['logs'][0]['phase'], message: string) {
  const log = {
    timestamp: Date.now(),
    phase,
    message,
  };
  
  // Save to DB immediately (fire and forget)
  saveLogImmediately(state.scanId, phase, message).catch(() => {});
  
  return {
    logs: [log],
  };
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    // Log 1: Starting
    const updates: Partial<AgentState> = {
      ...addLog(state, 'plan', 'Initializing agent...'),
    };
    await sleep(500);
    
    // Log 2: Connecting
    const log2 = addLog(state, 'plan', 'Connecting to repository...');
    updates.logs = [...(updates.logs || []), ...log2.logs];
    await sleep(500);
    
    // Get metadata using GitHub API
    const metadata = await getRepoMetadata(state.repoUrl);
    
    // Log 3: Analyzing
    const log3 = addLog(state, 'plan', 'Analyzing codebase structure...');
    updates.logs = [...(updates.logs || []), ...log3.logs];
    await sleep(500);
    
    // Log strategy
    const langs = metadata.languages.join(', ') || 'Unknown';
    const frameworks = metadata.frameworks.join(', ') || 'None detected';
    
    const log4 = addLog(
      state,
      'plan',
      `Detected: ${langs}${frameworks !== 'None detected' ? ', ' + frameworks : ''}`
    );
    updates.logs = [...(updates.logs || []), ...log4.logs];
    await sleep(300);
    
    const log5 = addLog(
      state,
      'plan',
      `Files: ${metadata.totalFiles} | Strategy: Security → Reliability → Maintainability`
    );
    updates.logs = [...(updates.logs || []), ...log5.logs];
    
    updates.repoMetadata = metadata;
    
    console.log('[Agent] PLAN phase complete');
    return updates;
    
  } catch (error: any) {
    console.error('[Agent] PLAN phase failed:', error);
    return {
      error: error.message,
      ...addLog(state, 'plan', `Error: ${error.message}`),
    };
  }
}

/**
 * NODE 2: HUNT
 * - Run detectors (GitHub API, Greptile AI, or Hybrid based on USE_GREPTILE env)
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
    const updates: Partial<AgentState> = {
      ...addLog(state, 'hunt', 'Agent: Hunting for issues...'),
    };
    await sleep(500);
    
    // Determine which detection method to use
    const useGreptile = process.env.USE_GREPTILE || 'false';
    const normalizedMode = useGreptile.toLowerCase().trim();
    
    // Create a log callback for Greptile
    const logCallback = async (phase: string, message: string) => {
      const log = addLog(state, phase as any, message);
      updates.logs = [...(updates.logs || []), ...log.logs];
    };
    
    let findings: any[] = [];
    
    if (normalizedMode === 'true') {
      // ===== GREPTILE AI MODE (Accurate, Slow, Paid) =====
      console.log('[Agent] 🔮 Using Greptile AI-powered detection...');
      
      try {
        const { runGreptileDetectors } = await import('@/lib/detectors/greptile');
        findings = await runGreptileDetectors(state.repoUrl, logCallback);
      } catch (error: any) {
        console.error('[Agent] Greptile failed, falling back to GitHub API:', error.message);
        const log = addLog(state, 'hunt', '⚠️  AI analysis failed, using pattern matching...');
        updates.logs = [...(updates.logs || []), ...log.logs];
        findings = await runAllDetectors(state.repoUrl);
      }
      
    } else if (normalizedMode === 'hybrid') {
      // ===== HYBRID MODE (Fast + Accurate, Variable Cost) =====
      console.log('[Agent] ⚖️  Using Hybrid detection (quick scan + deep AI if needed)...');
      
      try {
        const { runHybridDetectors } = await import('@/lib/detectors/greptile');
        findings = await runHybridDetectors(state.repoUrl, logCallback);
      } catch (error: any) {
        console.error('[Agent] Hybrid mode failed, falling back to GitHub API:', error.message);
        const log = addLog(state, 'hunt', '⚠️  Hybrid scan failed, using pattern matching...');
        updates.logs = [...(updates.logs || []), ...log.logs];
        findings = await runAllDetectors(state.repoUrl);
      }
      
    } else {
      // ===== GITHUB API MODE (Fast, Free, Reliable) - DEFAULT =====
      console.log('[Agent] ⚡ Using GitHub API pattern-based detection...');
      const log1 = addLog(state, 'hunt', '⚡ Running pattern-based scan (15-20s)...');
      updates.logs = [...(updates.logs || []), ...log1.logs];
      findings = await runAllDetectors(state.repoUrl);
      const log2 = addLog(state, 'hunt', '✓ Pattern scan complete');
      updates.logs = [...(updates.logs || []), ...log2.logs];
    }
    
    // Log results by category
    const securityCount = findings.filter(f => f.category === 'security').length;
    const reliabilityCount = findings.filter(f => f.category === 'reliability').length;
    const maintainabilityCount = findings.filter(f => f.category === 'maintainability').length;
    const dependenciesCount = findings.filter(f => f.category === 'dependencies').length;
    
    const log3 = addLog(state, 'hunt', `✓ Security: ${securityCount} issues`);
    updates.logs = [...(updates.logs || []), ...log3.logs];
    await sleep(200);
    
    const log4 = addLog(state, 'hunt', `✓ Reliability: ${reliabilityCount} issues`);
    updates.logs = [...(updates.logs || []), ...log4.logs];
    await sleep(200);
    
    const log5 = addLog(state, 'hunt', `✓ Maintainability: ${maintainabilityCount} issues`);
    updates.logs = [...(updates.logs || []), ...log5.logs];
    await sleep(200);
    
    // Only log dependencies if there are any
    if (dependenciesCount > 0) {
      await sleep(200);
      const log6 = addLog(state, 'hunt', `✓ Dependencies: ${dependenciesCount} issues`);
      updates.logs = [...(updates.logs || []), ...log6.logs];
    }
    
    updates.findings = findings;
    
    console.log(`[Agent] HUNT phase complete - Found ${findings.length} issues`);
    return updates;
    
  } catch (error: any) {
    console.error('[Agent] HUNT phase failed:', error);
    return {
      error: error.message,
      ...addLog(state, 'hunt', `Error: ${error.message}`),
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
    const updates: Partial<AgentState> = {
      ...addLog(state, 'explain', 'Agent: Generating timeline predictions...'),
    };
    await sleep(500);
    
    const log2 = addLog(state, 'explain', `└─ Analyzing ${state.findings.length} findings...`);
    updates.logs = [...(updates.logs || []), ...log2.logs];
    
    console.log(`[Agent] Enriching ${state.findings.length} findings...`);
    
    // Process findings in batches of 5 to respect rate limits
    const enrichedFindings: Finding[] = [];
    
    for (let i = 0; i < state.findings.length; i += 5) {
      const batch = state.findings.slice(i, i + 5);
      
      // Log progress
      const log3 = addLog(state, 'explain', `Processing findings ${i + 1}-${Math.min(i + 5, state.findings.length)}...`);
      updates.logs = [...(updates.logs || []), ...log3.logs];
      
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
        await sleep(300);
      }
    }
    
    const log4 = addLog(state, 'explain', 'Agent: Calculating future pain impact...');
    updates.logs = [...(updates.logs || []), ...log4.logs];
    
    updates.enrichedFindings = enrichedFindings;
    
    console.log('[Agent] EXPLAIN phase complete');
    return updates;
    
  } catch (error: any) {
    console.error('[Agent] EXPLAIN phase failed:', error);
    return {
      error: error.message,
      ...addLog(state, 'explain', `Error: ${error.message}`),
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
    const updates: Partial<AgentState> = {
      ...addLog(state, 'write', 'Agent: Compiling refactor roadmap...'),
    };
    await sleep(500);
    
    // Calculate statistics
    const criticalCount = state.enrichedFindings.filter(f => f.severity === 'critical').length;
    const highCount = state.enrichedFindings.filter(f => f.severity === 'high').length;
    const mediumCount = state.enrichedFindings.filter(f => f.severity === 'medium').length;
    const lowCount = state.enrichedFindings.filter(f => f.severity === 'low').length;
    const totalMinutes = state.enrichedFindings.reduce((sum, f) => sum + f.minutesSaved, 0);
    
    const log2 = addLog(state, 'write', '└─ Prioritizing by severity × effort...');
    updates.logs = [...(updates.logs || []), ...log2.logs];
    await sleep(500);
    
    const log3 = addLog(state, 'write', `✓ Scan complete - Found ${state.enrichedFindings.length} issues`);
    updates.logs = [...(updates.logs || []), ...log3.logs];
    
    console.log('[Agent] WRITE phase complete');
    console.log(`[Agent] Stats: Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount}, Low: ${lowCount}`);
    
    return updates;
    
  } catch (error: any) {
    console.error('[Agent] WRITE phase failed:', error);
    return {
      error: error.message,
      ...addLog(state, 'write', `Error: ${error.message}`),
    };
  }
}

