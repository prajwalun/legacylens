// AI-powered detector using Greptile /query endpoint
// This is the CORRECT way to use Greptile - semantic AI analysis instead of 30+ pattern searches

import { queryForIssues, indexRepository, waitForIndexing, formatRepoId, parseRepoUrl, getRepositoryStatus } from '@/lib/tools/greptile';
import { DetectorResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';

type LogCallback = (phase: string, message: string) => void | Promise<void>;

/**
 * Helper function to wait for indexing with progress callbacks
 */
async function waitForIndexingWithProgress(
  repoId: string,
  maxWaitTime: number,
  onProgress: (progress: { filesProcessed: number; numFiles: number; status: string }) => void
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 3000; // Poll every 3 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await getRepositoryStatus(repoId);
    
    // Call progress callback
    onProgress({
      filesProcessed: status.filesProcessed,
      numFiles: status.numFiles,
      status: status.status
    });
    
    if (status.status === 'completed' || status.status === 'COMPLETED') {
      return true;
    }
    
    if (status.status === 'failed' || status.status === 'FAILED') {
      throw new Error('Repository indexing failed');
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  return false;
}

/**
 * Run AI-powered code analysis using Greptile's /query endpoint with real-time logging
 * This approach:
 * - Makes 1 AI query instead of 30+ pattern searches
 * - Understands code semantically (not just regex)
 * - Finds issues that regex might miss
 * - Handles 410 errors properly
 * - Streams progress updates in real-time
 */
export async function runGreptileDetectors(repoUrl: string, logCallback?: LogCallback): Promise<DetectorResult[]> {
  const log = (phase: string, message: string) => {
    console.log(`[Greptile Detector] ${message}`);
    if (logCallback) {
      logCallback(phase, message);
    }
  };
  
  log('hunt', '🔮 Initializing Greptile AI...');
  
  try {
    // Parse repository URL
    const { owner, repo } = parseRepoUrl(repoUrl);
    log('hunt', `Connecting to ${owner}/${repo}...`);
    
    // Index repository
    log('hunt', 'Submitting repository for indexing...');
    const repoId = await indexRepository(repoUrl, false);
    log('hunt', '✓ Repository submitted');
    
    // Wait for indexing to complete with progress updates
    log('hunt', 'Indexing codebase with Greptile AI...');
    const startTime = Date.now();
    const indexed = await waitForIndexingWithProgress(repoId, 300000, (progress) => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log('hunt', `└─ Indexing: ${progress.filesProcessed}/${progress.numFiles} files (${elapsed}s)`);
    });
    
    if (!indexed) {
      throw new Error('Repository indexing timed out after 5 minutes');
    }
    
    log('hunt', '✓ Indexing complete!');
    
    // Query for issues using AI
    log('hunt', 'Querying Greptile AI for security issues...');
    log('hunt', '└─ This may take 30-60 seconds...');
    const sessionId = `scan-${uuidv4()}`;
    const findings = await queryForIssues(repoId, sessionId);
    
    log('hunt', `✓ AI analysis complete - Found ${findings.length} issues`);
    
    // Map Greptile findings to our DetectorResult format
    const results: DetectorResult[] = findings.map((f: any) => ({
      ruleId: f.ruleId || 'unknown-issue',
      category: mapCategory(f.category),
      file: f.file || 'unknown',
      line: f.line || 0,
      snippet: f.snippet || 'No snippet available',
    }));
    
    // Log breakdown by category
    const security = results.filter(r => r.category === 'security').length;
    const reliability = results.filter(r => r.category === 'reliability').length;
    const maintainability = results.filter(r => r.category === 'maintainability').length;
    
    console.log(`[Greptile Detector] Breakdown - Security: ${security}, Reliability: ${reliability}, Maintainability: ${maintainability}`);
    
    return results;
    
  } catch (error: any) {
    console.error('[Greptile Detector] ❌ Analysis failed:', error.message);
    
    // Don't throw - let the caller decide what to do
    // This allows fallback to GitHub API detector
    throw error;
  }
}

/**
 * Map Greptile's category names to our Category type
 */
function mapCategory(category: string): 'security' | 'reliability' | 'maintainability' {
  const normalized = category?.toLowerCase() || '';
  
  if (normalized.includes('security') || normalized.includes('vulnerability')) {
    return 'security';
  }
  
  if (normalized.includes('reliability') || normalized.includes('error') || normalized.includes('bug')) {
    return 'reliability';
  }
  
  return 'maintainability';
}

/**
 * Hybrid detector: Quick GitHub API scan, then deep Greptile AI scan if critical issues found
 * Best of both worlds - fast for clean repos, thorough for risky ones
 */
export async function runHybridDetectors(repoUrl: string, logCallback?: LogCallback): Promise<DetectorResult[]> {
  const log = (phase: string, message: string) => {
    console.log(`[Hybrid Detector] ${message}`);
    if (logCallback) {
      logCallback(phase, message);
    }
  };
  
  log('hunt', '⚖️  Starting hybrid analysis...');
  
  // Step 1: Quick scan with GitHub API (20 seconds)
  log('hunt', 'Phase 1: Quick pattern-based scan...');
  const { runAllDetectors } = await import('./index');
  const quickFindings = await runAllDetectors(repoUrl);
  
  log('hunt', `✓ Quick scan found ${quickFindings.length} issues`);
  
  // Step 2: Check if we need deep scan
  const hasCriticalIssues = quickFindings.some(f => 
    f.category === 'security' && 
    (f.ruleId.includes('injection') || f.ruleId.includes('secret') || f.ruleId.includes('eval'))
  );
  
  if (hasCriticalIssues) {
    log('hunt', '⚠️  Critical security issues detected!');
    log('hunt', 'Phase 2: Running deep AI analysis...');
    
    try {
      const aiFindings = await runGreptileDetectors(repoUrl, logCallback);
      log('hunt', `✓ Deep scan found ${aiFindings.length} additional issues`);
      
      // Merge and deduplicate findings
      const merged = deduplicateFindings([...quickFindings, ...aiFindings]);
      log('hunt', `✅ Total unique findings: ${merged.length}`);
      
      return merged;
    } catch (error) {
      log('hunt', '⚠️  Deep scan failed, using quick scan results only');
      return quickFindings;
    }
  }
  
  log('hunt', '✅ No critical issues, quick scan sufficient');
  return quickFindings;
}

/**
 * Deduplicate findings based on file + line + ruleId
 */
function deduplicateFindings(findings: DetectorResult[]): DetectorResult[] {
  const seen = new Set<string>();
  const unique: DetectorResult[] = [];
  
  for (const finding of findings) {
    const key = `${finding.file}:${finding.line}:${finding.ruleId}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(finding);
    }
  }
  
  return unique;
}

