// Security issue detectors
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
 * Detect hardcoded secrets (API keys, tokens, passwords)
 */
export async function detectHardcodedSecrets(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Security] Detecting hardcoded secrets...');
    
    const patterns = [
      'API_KEY.*=.*["\'][A-Za-z0-9]{20,}["\']',
      'SECRET.*=.*["\'][^"\']{10,}["\']',
      'PASSWORD.*=.*["\'][^"\']+["\']',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        const findings = results
          .filter(r => !r.summary?.includes('process.env')) // Exclude env vars
          .map(r => ({
            ruleId: 'hardcoded-secrets',
            category: 'security' as Category,
            file: r.filepath,
            line: r.linestart || 0,
            snippet: r.summary || '',
          }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Security] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Security] ✓ Found ${allResults.length} potential hardcoded secrets`);
    return allResults;
  } catch (error) {
    console.error('[Security] Error in detectHardcodedSecrets:', error);
    return [];
  }
}

/**
 * Detect hardcoded database credentials in connection strings
 */
export async function detectHardcodedCredentials(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Security] Detecting hardcoded credentials...');
    
    const patterns = [
      'postgresql://[^@]+:[^@]+@',
      'mysql://[^@]+:[^@]+@',
      'mongodb://[^@]+:[^@]+@',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        const findings = results.map(r => ({
          ruleId: 'hardcoded-credentials',
          category: 'security' as Category,
          file: r.filepath,
          line: r.linestart || 0,
          snippet: r.summary || '',
        }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Security] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Security] ✓ Found ${allResults.length} hardcoded credentials`);
    return allResults;
  } catch (error) {
    console.error('[Security] Error in detectHardcodedCredentials:', error);
    return [];
  }
}

/**
 * Detect SQL injection vulnerabilities (string concatenation in queries)
 */
export async function detectSQLInjection(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Security] Detecting SQL injection risks...');
    
    const patterns = [
      'query\\(.*\\+.*\\)',
      'execute\\(.*\\+.*\\)',
      'SELECT.*\\+.*FROM',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        const findings = results.map(r => ({
          ruleId: 'sql-injection',
          category: 'security' as Category,
          file: r.filepath,
          line: r.linestart || 0,
          snippet: r.summary || '',
        }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Security] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Security] ✓ Found ${allResults.length} potential SQL injection risks`);
    return allResults;
  } catch (error) {
    console.error('[Security] Error in detectSQLInjection:', error);
    return [];
  }
}

/**
 * Detect dangerous eval/exec usage
 */
export async function detectEvalUsage(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Security] Detecting eval/exec usage...');
    
    const patterns = [
      '\\beval\\s*\\(',
      '\\bexec\\s*\\(',
      'new Function\\s*\\(',
    ];
    
    const allResults: DetectorResult[] = [];
    
    for (const pattern of patterns) {
      try {
        const results = await searchCode(repoId, pattern);
        const findings = results.map(r => ({
          ruleId: 'eval-usage',
          category: 'security' as Category,
          file: r.filepath,
          line: r.linestart || 0,
          snippet: r.summary || '',
        }));
        allResults.push(...findings);
      } catch (error) {
        console.error(`[Security] Error searching pattern ${pattern}:`, error);
      }
    }
    
    console.log(`[Security] ✓ Found ${allResults.length} eval/exec usages`);
    return allResults;
  } catch (error) {
    console.error('[Security] Error in detectEvalUsage:', error);
    return [];
  }
}

/**
 * Detect exposed .env files (should be in .gitignore)
 */
export async function detectExposedEnvFiles(repoId: string): Promise<DetectorResult[]> {
  try {
    console.log('[Security] Detecting exposed .env files...');
    
    // Search for .env files
    const results = await searchCode(repoId, '^\\.env$');
    
    // Filter out .env.example and .env.local (those are okay)
    const findings = results
      .filter(r => {
        const filename = r.filepath.split('/').pop() || '';
        return filename === '.env' && !r.filepath.includes('example');
      })
      .map(r => ({
        ruleId: 'exposed-env',
        category: 'security' as Category,
        file: r.filepath,
        line: r.linestart || 0,
        snippet: r.summary || '.env file committed to repository',
      }));
    
    console.log(`[Security] ✓ Found ${findings.length} exposed .env files`);
    return findings;
  } catch (error) {
    console.error('[Security] Error in detectExposedEnvFiles:', error);
    return [];
  }
}

