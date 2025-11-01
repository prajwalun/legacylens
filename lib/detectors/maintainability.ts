// Maintainability issue detectors
import { searchCode, getRepositoryStatus } from '@/lib/tools/greptile';
import type { Category } from '@/types';

export interface DetectorResult {
  ruleId: string;
  category: Category;
  file: string;
  line: number;
  snippet: string;
}

/**
 * Detect god files (files with > 500 lines)
 * Note: This is an approximation based on search results
 */
export async function detectGodFiles(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Maintainability] Detecting god files...');
    
    // Search for common patterns that would appear multiple times in large files
    const patterns = [
      'function\\s+\\w+',
      'class\\s+\\w+',
      'export\\s+(function|class|const)',
    ];
    
    const fileOccurrences = new Map<string, number>();
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        results.forEach(r => {
          const count = fileOccurrences.get(r.filepath) || 0;
          fileOccurrences.set(r.filepath, count + 1);
        });
      } catch (error) {
        console.error(`[Maintainability] Error searching pattern ${pattern}:`, error);
      }
    }
    
    // Files with many functions/classes are likely large
    const findings: DetectorResult[] = [];
    for (const [filepath, count] of fileOccurrences.entries()) {
      if (count > 15) { // Heuristic: 15+ functions/classes = likely > 500 LOC
        findings.push({
          ruleId: 'god-file',
          category: 'maintainability' as Category,
          file: filepath,
          line: 1,
          snippet: `Large file with ${count}+ functions/classes (likely > 500 lines)`,
        });
      }
    }
    
    console.log(`[Maintainability] ✓ Found ${findings.length} god files`);
    return findings;
  } catch (error) {
    console.error('[Maintainability] Error in detectGodFiles:', error);
    return [];
  }
}

/**
 * Detect long functions (> 75 lines)
 * Note: Approximation based on character count in code
 */
export async function detectLongFunctions(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Maintainability] Detecting long functions...');
    
    // Search for function definitions
    // The summary from Greptile will give us context about function size
    const patterns = [
      'function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{',
      'def\\s+\\w+\\s*\\([^)]*\\):',
      '\\w+\\s*:\\s*\\([^)]*\\)\\s*=>',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        // Filter for functions that likely have a lot of code
        const findings = results
          .filter(r => {
            const snippet = r.summary || '';
            // Heuristic: if snippet is very long, function is probably long
            return snippet.length > 500; // Long summary = long function
          })
          .slice(0, 20) // Limit results
          .map(r => ({
            ruleId: 'long-function',
            category: 'maintainability' as Category,
            file: r.filepath,
            line: r.linestart || 0,
            snippet: r.summary?.slice(0, 200) + '...' || '',
          }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Maintainability] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Maintainability] ✓ Found ${allResults.length} long functions`);
    return allResults;
  } catch (error) {
    console.error('[Maintainability] Error in detectLongFunctions:', error);
    return [];
  }
}

/**
 * Detect magic numbers (hardcoded numbers without const)
 */
export async function detectMagicNumbers(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Maintainability] Detecting magic numbers...');
    
    // Search for numeric literals (excluding common ones: 0, 1, 100, 1000)
    const pattern = '(?<!const\\s+)\\b([2-9]|[1-9][0-9]{1,})\\b';
    
    const results = await searchCode(repoId, pattern);
    const findings = results
      .filter(r => {
        const snippet = r.summary || '';
        // Exclude common patterns that are okay
        return !snippet.includes('const ') && 
               !snippet.includes('enum ') &&
               !snippet.includes('setTimeout') &&
               !snippet.includes('setInterval') &&
               !snippet.match(/[0-1]|100|1000/); // Exclude 0, 1, 100, 1000
      })
      .slice(0, 25) // Limit results (magic numbers are very common)
      .map(r => ({
        ruleId: 'magic-numbers',
        category: 'maintainability' as Category,
        file: r.filepath,
        line: r.linestart || 0,
        snippet: r.summary || '',
      }));
    
    console.log(`[Maintainability] ✓ Found ${findings.length} magic numbers`);
    return findings;
  } catch (error) {
    console.error('[Maintainability] Error in detectMagicNumbers:', error);
    return [];
  }
}

/**
 * Detect TODO clusters (files with 3+ TODOs in close proximity)
 */
export async function detectTODOClusters(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Maintainability] Detecting TODO clusters...');
    
    // Search for TODO comments
    const pattern = 'TODO|FIXME|HACK|XXX';
    
    const results = await searchCode(repoId, pattern);
    
    // Group by file
    const fileGroups = new Map<string, typeof results>();
    results.forEach(r => {
      const existing = fileGroups.get(r.filepath) || [];
      existing.push(r);
      fileGroups.set(r.filepath, existing);
    });
    
    // Find files with 3+ TODOs
    const findings: DetectorResult[] = [];
    for (const [filepath, todos] of fileGroups.entries()) {
      if (todos.length >= 3) {
        // Check if they're close together (within 50 lines)
        const lines = todos
          .map(t => t.linestart || 0)
          .filter(l => l > 0)
          .sort((a, b) => a - b);
        
        // Check for clusters
        let hasCluster = false;
        for (let i = 0; i < lines.length - 2; i++) {
          if (lines[i + 2] - lines[i] <= 50) {
            hasCluster = true;
            break;
          }
        }
        
        if (hasCluster || todos.length >= 5) {
          findings.push({
            ruleId: 'todo-clusters',
            category: 'maintainability' as Category,
            file: filepath,
            line: lines[0] || 1,
            snippet: `${todos.length} TODO/FIXME comments clustered in this file`,
          });
        }
      }
    }
    
    console.log(`[Maintainability] ✓ Found ${findings.length} TODO clusters`);
    return findings;
  } catch (error) {
    console.error('[Maintainability] Error in detectTODOClusters:', error);
    return [];
  }
}

