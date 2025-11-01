// Reliability issue detectors
import { searchCode } from '@/lib/tools/greptile';
import type { Category } from '@/types';

export interface DetectorResult {
  ruleId: string;
  category: Category;
  file: string;
  line: number;
  snippet: string;
}

/**
 * Detect HTTP calls without timeout configuration
 */
export async function detectMissingHTTPTimeouts(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Reliability] Detecting missing HTTP timeouts...');
    
    const patterns = [
      'fetch\\([^)]+\\)',
      'axios\\.(get|post|put|delete)\\(',
      'requests\\.(get|post)\\(',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        // Filter for calls that likely don't have timeout
        // (This is a heuristic - false positives are okay)
        const findings = results
          .filter(r => {
            const snippet = r.summary || '';
            return !snippet.includes('timeout') && !snippet.includes('AbortController');
          })
          .map(r => ({
            ruleId: 'no-http-timeout',
            category: 'reliability' as Category,
            file: r.filepath,
            line: r.linestart || 0,
            snippet: r.summary || '',
          }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Reliability] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Reliability] ✓ Found ${allResults.length} HTTP calls without timeouts`);
    return allResults;
  } catch (error) {
    console.error('[Reliability] Error in detectMissingHTTPTimeouts:', error);
    return [];
  }
}

/**
 * Detect empty catch blocks that swallow errors
 */
export async function detectEmptyCatchBlocks(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Reliability] Detecting empty catch blocks...');
    
    const patterns = [
      'catch.*\\{\\s*\\}',
      'except:\\s*pass',
      'catch\\s*\\([^)]+\\)\\s*\\{\\s*\\}',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        const findings = results.map(r => ({
          ruleId: 'empty-catch',
          category: 'reliability' as Category,
          file: r.filepath,
          line: r.linestart || 0,
          snippet: r.summary || '',
        }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Reliability] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Reliability] ✓ Found ${allResults.length} empty catch blocks`);
    return allResults;
  } catch (error) {
    console.error('[Reliability] Error in detectEmptyCatchBlocks:', error);
    return [];
  }
}

/**
 * Detect API routes without input validation
 */
export async function detectNoInputValidation(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Reliability] Detecting missing input validation...');
    
    const patterns = [
      'app\\.(get|post|put|delete)\\([^)]+\\)',
      '@app\\.route',
      'router\\.(get|post|put|delete)\\(',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        // Filter for routes that likely don't have validation
        const findings = results
          .filter(r => {
            const snippet = r.summary || '';
            return !snippet.includes('validate') && 
                   !snippet.includes('schema') && 
                   !snippet.includes('zod') &&
                   !snippet.includes('joi');
          })
          .slice(0, 20) // Limit to avoid too many results
          .map(r => ({
            ruleId: 'no-validation',
            category: 'reliability' as Category,
            file: r.filepath,
            line: r.linestart || 0,
            snippet: r.summary || '',
          }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Reliability] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Reliability] ✓ Found ${allResults.length} routes without validation`);
    return allResults;
  } catch (error) {
    console.error('[Reliability] Error in detectNoInputValidation:', error);
    return [];
  }
}

/**
 * Detect promises without catch handlers
 */
export async function detectUnhandledPromises(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Reliability] Detecting unhandled promises...');
    
    // Search for .then() without .catch()
    const pattern = '\\.then\\([^)]+\\)(?!\\s*\\.catch)';
    
    const results = await searchCode(repoId, pattern);
    const findings = results
      .filter(r => {
        const snippet = r.summary || '';
        // Make sure it's actually a promise chain without catch
        return snippet.includes('.then') && !snippet.includes('.catch');
      })
      .slice(0, 30) // Limit results
      .map(r => ({
        ruleId: 'unhandled-promise',
        category: 'reliability' as Category,
        file: r.filepath,
        line: r.linestart || 0,
        snippet: r.summary || '',
      }));
    
    console.log(`[Reliability] ✓ Found ${findings.length} unhandled promises`);
    return findings;
  } catch (error) {
    console.error('[Reliability] Error in detectUnhandledPromises:', error);
    return [];
  }
}

