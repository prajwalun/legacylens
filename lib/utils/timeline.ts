// Timeline prediction generator using GPT-4
import { callGPT4JSON } from '@/lib/tools/llm';

export interface TimelinePrediction {
  t3m: string;  // 3 months
  t6m: string;  // 6 months
  t1y: string;  // 1 year
  t2y: string;  // 2 years
}

/**
 * Generate future timeline predictions for a code issue
 */
export async function generateTimeline(
  ruleId: string,
  file: string,
  snippet: string
): Promise<TimelinePrediction> {
  const prompt = `You are predicting how a code issue will worsen over time.

Issue Type: ${ruleId}
File: ${file}
Code: ${snippet.slice(0, 300)}

Generate 4 short predictions (max 8 words each) from the perspective of future developers discovering this issue:
- 3 months from now
- 6 months from now  
- 1 year from now
- 2 years from now

Format as JSON:
{
  "t3m": "TODO: why is this hardcoded?",
  "t6m": "FIXME: breaks in staging",
  "t1y": "Can't rotate credentials safely",
  "t2y": "Security incident waiting to happen"
}

Be specific and realistic. Use developer language (TODOs, FIXMEs). Keep each prediction under 8 words.`;

  try {
    const response = await callGPT4JSON<TimelinePrediction>(prompt);
    
    // Validate response has all required fields
    if (!response.t3m || !response.t6m || !response.t1y || !response.t2y) {
      console.warn('[Timeline] Incomplete response from GPT-4, using fallback');
      return getFallbackTimeline(ruleId);
    }
    
    return response;
  } catch (error) {
    console.error('[Timeline] Error generating timeline:', error);
    // Return fallback timeline on error
    return getFallbackTimeline(ruleId);
  }
}

/**
 * Fallback timelines for each rule type
 * Used when GPT-4 API fails or returns invalid data
 */
function getFallbackTimeline(ruleId: string): TimelinePrediction {
  const fallbacks: Record<string, TimelinePrediction> = {
    'hardcoded-secrets': {
      t3m: 'TODO: why hardcoded?',
      t6m: 'FIXME: can\'t rotate keys',
      t1y: 'Security audit flags this',
      t2y: 'Major security incident risk',
    },
    'hardcoded-credentials': {
      t3m: 'Works but smells bad',
      t6m: 'Can\'t change password safely',
      t1y: 'Credentials leaked in git history',
      t2y: 'Database breach via exposed creds',
    },
    'sql-injection': {
      t3m: 'Works but feels wrong',
      t6m: 'Security scan detects vulnerability',
      t1y: 'Exploit attempt in logs',
      t2y: 'Data breach via injection',
    },
    'eval-usage': {
      t3m: 'Code review flags this',
      t6m: 'Security policy violation',
      t1y: 'XSS attack vector identified',
      t2y: 'Remote code execution exploit',
    },
    'exposed-env': {
      t3m: 'Secrets visible in repo',
      t6m: 'Keys leaked on GitHub',
      t1y: 'Unauthorized API access',
      t2y: 'Costly security breach',
    },
    'no-http-timeout': {
      t3m: 'Occasional slow requests',
      t6m: 'Timeouts under load',
      t1y: 'Cascading failures in production',
      t2y: 'Entire service becomes unstable',
    },
    'empty-catch': {
      t3m: 'Errors silently ignored',
      t6m: 'Debugging becomes nightmare',
      t1y: 'Production bugs go unnoticed',
      t2y: 'Data corruption undetected',
    },
    'no-validation': {
      t3m: 'Invalid data sneaks through',
      t6m: 'Database integrity issues',
      t1y: 'Users exploit missing validation',
      t2y: 'Major data corruption incident',
    },
    'unhandled-promise': {
      t3m: 'Occasional unhandled rejection warnings',
      t6m: 'Production errors not logged',
      t1y: 'Silent failures in background',
      t2y: 'Critical operations fail silently',
    },
    'god-file': {
      t3m: 'File getting unwieldy',
      t6m: 'Merge conflicts every PR',
      t1y: 'Nobody dares touch it',
      t2y: 'The file everyone fears',
    },
    'long-function': {
      t3m: 'Function hard to understand',
      t6m: 'Bugs hide in complexity',
      t1y: 'Refactor becomes too risky',
      t2y: 'Nobody can modify safely',
    },
    'magic-numbers': {
      t3m: 'TODO: what does 50 mean?',
      t6m: 'FIXME: need to change limit',
      t1y: 'Can\'t find all instances',
      t2y: 'Inconsistent limits everywhere',
    },
    'todo-clusters': {
      t3m: 'TODOs pile up',
      t6m: 'Nobody remembers context',
      t1y: 'TODOs become permanent comments',
      t2y: 'Archaeological mystery for future devs',
    },
  };
  
  return fallbacks[ruleId] || {
    t3m: 'Issue noticed',
    t6m: 'Problem worsens',
    t1y: 'Refactor needed',
    t2y: 'Technical debt grows',
  };
}

/**
 * Generate timelines for multiple findings in batches
 * Respects rate limits by processing 5 at a time with delays
 */
export async function generateTimelines(
  findings: Array<{ ruleId: string; file: string; snippet: string }>
): Promise<TimelinePrediction[]> {
  if (findings.length === 0) {
    return [];
  }

  console.log(`[Timeline] Generating timelines for ${findings.length} findings...`);
  
  const results: TimelinePrediction[] = [];
  
  // Process in batches of 5 to respect rate limits
  for (let i = 0; i < findings.length; i += 5) {
    const batch = findings.slice(i, i + 5);
    console.log(`[Timeline] Batch ${Math.floor(i / 5) + 1}/${Math.ceil(findings.length / 5)} (${batch.length} items)...`);
    
    const batchResults = await Promise.all(
      batch.map(f => generateTimeline(f.ruleId, f.file, f.snippet))
    );
    
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + 5 < findings.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`[Timeline] ✓ Generated ${results.length} timelines`);
  
  return results;
}

/**
 * Generate a human-readable explanation for a finding
 */
export async function generateExplanation(
  ruleId: string,
  file: string,
  snippet: string
): Promise<string> {
  const prompt = `Explain this code issue in 2 sentences. Be specific and actionable.

Issue Type: ${ruleId}
File: ${file}
Code: ${snippet.slice(0, 300)}

Format: 2 sentences, ~30 words total. First sentence explains the issue. Second sentence explains the impact.`;

  try {
    const response = await callGPT4JSON<{ explanation: string }>(
      prompt + '\n\nRespond with JSON: {"explanation": "your explanation here"}'
    );
    return response.explanation || getFallbackExplanation(ruleId);
  } catch (error) {
    console.error('[Timeline] Error generating explanation:', error);
    return getFallbackExplanation(ruleId);
  }
}

/**
 * Fallback explanations for each rule type
 */
function getFallbackExplanation(ruleId: string): string {
  const fallbacks: Record<string, string> = {
    'hardcoded-secrets': 'This code contains hardcoded API keys or secrets that should be in environment variables. If these credentials leak through version control, they cannot be rotated without code changes.',
    'hardcoded-credentials': 'Database credentials are hardcoded in the connection string, making it impossible to rotate passwords without code changes. These credentials are visible in version control history.',
    'sql-injection': 'This query uses string concatenation to build SQL, making it vulnerable to SQL injection attacks. User input should be parameterized to prevent malicious queries.',
    'eval-usage': 'The code uses eval() or exec() which allows arbitrary code execution. This is a major security risk that can be exploited to run malicious code.',
    'exposed-env': 'The .env file is committed to version control, exposing sensitive credentials. This file should be in .gitignore and credentials should be managed securely.',
    'no-http-timeout': 'HTTP requests lack timeout configuration, which can cause the application to hang indefinitely. This leads to resource exhaustion and poor user experience under high load.',
    'empty-catch': 'Errors are caught but not handled, causing silent failures. This makes debugging extremely difficult and can lead to data corruption going unnoticed.',
    'no-validation': 'API endpoints lack input validation, allowing invalid or malicious data into the system. This can lead to data integrity issues and security vulnerabilities.',
    'unhandled-promise': 'Promises lack .catch() handlers, causing unhandled rejections. Errors in async operations will fail silently without proper logging or recovery.',
    'god-file': 'This file has grown too large and complex (likely >500 lines), making it difficult to understand and maintain. Large files lead to merge conflicts and discourage refactoring.',
    'long-function': 'This function is too long (likely >75 lines), making it hard to understand and test. Long functions often hide multiple responsibilities that should be split.',
    'magic-numbers': 'Numeric literals are used directly without named constants, making the code hard to understand and maintain. Changes require hunting for all instances.',
    'todo-clusters': 'Multiple TODO/FIXME comments indicate technical debt and incomplete work. These comments often lose context over time and become permanent fixtures.',
  };
  
  return fallbacks[ruleId] || 'This code pattern may lead to issues in the future. Consider refactoring to improve maintainability and reduce technical debt.';
}

/**
 * Generate a code fix suggestion
 */
export async function generateFix(
  ruleId: string,
  snippet: string
): Promise<string> {
  const prompt = `Suggest a minimal code fix for this issue. Show ONLY the fixed code, no explanations.

Issue Type: ${ruleId}
Original Code: ${snippet.slice(0, 300)}

Respond with JSON: {"fix": "the fixed code here"}

Keep it concise (max 5 lines).`;

  try {
    const response = await callGPT4JSON<{ fix: string }>(prompt);
    return response.fix || getFallbackFix(ruleId);
  } catch (error) {
    console.error('[Timeline] Error generating fix:', error);
    return getFallbackFix(ruleId);
  }
}

/**
 * Fallback fixes for common issues
 */
function getFallbackFix(ruleId: string): string {
  const fallbacks: Record<string, string> = {
    'hardcoded-secrets': 'const API_KEY = process.env.API_KEY;\n// Add to .env: API_KEY=your_key_here',
    'hardcoded-credentials': 'const dbUrl = process.env.DATABASE_URL;\n// Add to .env: DATABASE_URL=postgresql://...',
    'sql-injection': 'db.query("SELECT * FROM users WHERE id = $1", [userId])',
    'eval-usage': '// Remove eval() and use safer alternatives like JSON.parse()',
    'exposed-env': '// Add .env to .gitignore\n// Rotate all exposed credentials',
    'no-http-timeout': 'fetch(url, { signal: AbortSignal.timeout(5000) })',
    'empty-catch': 'catch (error) {\n  console.error("Operation failed:", error);\n  throw error;\n}',
    'no-validation': '// Add validation: const schema = z.object({ ... });\n// schema.parse(req.body);',
    'unhandled-promise': 'promise.then(handler).catch(error => {\n  console.error("Error:", error);\n});',
    'god-file': '// Split into smaller modules:\n// - Extract related functions\n// - Group by responsibility',
    'long-function': '// Break into smaller functions:\n// 1. Extract helper functions\n// 2. Each function does one thing',
    'magic-numbers': 'const MAX_RETRIES = 3;\n// Use the constant instead of literal',
    'todo-clusters': '// Create issues for TODOs\n// Remove or complete them',
  };
  
  return fallbacks[ruleId] || '// Refactor this code to follow best practices';
}

