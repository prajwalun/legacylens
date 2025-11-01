// Pre-scanned demo data for instant demonstrations
import type { ScanResult, Finding } from '@/types';

/**
 * Demo scan for a "messy" Node.js/Express application
 * Shows various critical to low severity issues
 */
export const DEMO_SCAN_MESSY: ScanResult = {
  id: 'demo-messy-nodejs',
  repoUrl: 'https://github.com/demo/messy-api',
  status: 'completed',
  findings: [
    {
      id: '1',
      ruleId: 'hardcoded-secrets',
      category: 'security',
      severity: 'critical',
      eta: 'easy',
      file: 'src/config/database.js',
      line: 12,
      snippet: 'const dbUrl = "postgresql://admin:password123@localhost/mydb";',
      title: 'Hardcoded database credentials in connection string',
      explanation: 'Database credentials are exposed in source code. Anyone with repository access can see the password. This is a critical security vulnerability that could lead to unauthorized database access.',
      fix: 'const dbUrl = process.env.DATABASE_URL;\n// Add to .env: DATABASE_URL=postgresql://...\n// Add .env to .gitignore',
      timeline: {
        t3m: 'TODO: why is password hardcoded?',
        t6m: 'FIXME: breaks staging deployment',
        t1y: 'Cannot rotate credentials safely',
        t2y: 'Database breach via exposed creds',
      },
      minutesSaved: 17,
    },
    {
      id: '2',
      ruleId: 'sql-injection',
      category: 'security',
      severity: 'critical',
      eta: 'medium',
      file: 'src/api/users.js',
      line: 45,
      snippet: 'db.query("SELECT * FROM users WHERE id=" + userId)',
      title: 'SQL injection vulnerability in user lookup',
      explanation: 'User input is directly concatenated into SQL query without sanitization. Attackers can inject malicious SQL to access or modify data.',
      fix: 'db.query("SELECT * FROM users WHERE id=$1", [userId])',
      timeline: {
        t3m: 'Works fine in normal usage',
        t6m: 'Security scanner flags this',
        t1y: 'Exploit attempt appears in logs',
        t2y: 'Data breach via SQL injection',
      },
      minutesSaved: 19,
    },
    {
      id: '3',
      ruleId: 'no-http-timeout',
      category: 'reliability',
      severity: 'high',
      eta: 'easy',
      file: 'src/api/payment.js',
      line: 88,
      snippet: 'fetch("https://payment-api.com/charge", { method: "POST", body })',
      title: 'Payment API call missing timeout configuration',
      explanation: 'HTTP request to payment gateway has no timeout. Under network issues, requests can hang indefinitely causing cascading failures.',
      fix: 'fetch("https://payment-api.com/charge", {\n  method: "POST",\n  body,\n  signal: AbortSignal.timeout(5000)\n})',
      timeline: {
        t3m: 'Occasional slow requests noticed',
        t6m: 'Timeouts during peak traffic',
        t1y: 'Cascading failures in production',
        t2y: 'Entire payment system unstable',
      },
      minutesSaved: 14,
    },
    {
      id: '4',
      ruleId: 'empty-catch',
      category: 'reliability',
      severity: 'medium',
      eta: 'easy',
      file: 'src/utils/logger.js',
      line: 23,
      snippet: 'try { fs.writeFileSync(logFile, data); } catch (e) {}',
      title: 'Empty catch block silently swallows logging errors',
      explanation: 'Errors during logging are silently ignored. This makes debugging production issues extremely difficult.',
      fix: 'try {\n  fs.writeFileSync(logFile, data);\n} catch (e) {\n  console.error("Logging failed:", e);\n  // Consider fallback logging strategy\n}',
      timeline: {
        t3m: 'Some logs mysteriously missing',
        t6m: 'Debugging becomes nightmare',
        t1y: 'Production bugs go undetected',
        t2y: 'Critical errors invisible',
      },
      minutesSaved: 9,
    },
    {
      id: '5',
      ruleId: 'god-file',
      category: 'maintainability',
      severity: 'low',
      eta: 'large',
      file: 'src/controllers/api.js',
      line: 1,
      snippet: '// File with 847 lines containing mixed concerns',
      title: 'API controller file has grown to 847 lines',
      explanation: 'This file handles authentication, validation, business logic, and responses all in one place. Makes testing and maintenance difficult.',
      fix: '// Split into separate files:\n// - auth.js (authentication)\n// - validators.js (input validation)\n// - handlers.js (business logic)\n// - responses.js (response formatting)',
      timeline: {
        t3m: 'File getting unwieldy',
        t6m: 'Merge conflicts on every PR',
        t1y: 'Nobody dares touch this file',
        t2y: 'The file everyone fears',
      },
      minutesSaved: 5,
    },
    {
      id: '6',
      ruleId: 'todo-clusters',
      category: 'maintainability',
      severity: 'low',
      eta: 'easy',
      file: 'src/services/notifications.js',
      line: 67,
      snippet: '// TODO: Add retry logic\n// TODO: Handle rate limiting\n// FIXME: Memory leak here\n// TODO: Add tests',
      title: 'Notification service has 4 unresolved TODOs',
      explanation: 'Multiple TODO comments indicate incomplete implementation. The memory leak FIXME is particularly concerning.',
      fix: '// Create GitHub issues for each TODO:\n// - Issue #123: Add retry logic to notifications\n// - Issue #124: Implement rate limiting\n// - Issue #125: Fix memory leak in notification queue\n// - Issue #126: Add notification service tests',
      timeline: {
        t3m: 'TODOs accumulate',
        t6m: 'Nobody remembers the context',
        t1y: 'TODOs become permanent comments',
        t2y: 'Archaeological mystery',
      },
      minutesSaved: 5,
    },
  ],
  stats: {
    totalFiles: 234,
    totalLines: 15847,
    languages: ['JavaScript', 'TypeScript'],
    frameworks: ['Express', 'Node.js'],
    criticalCount: 2,
    highCount: 1,
    mediumCount: 1,
    lowCount: 2,
    totalMinutes: 69,
  },
  logs: [
    { timestamp: Date.now() - 60000, phase: 'plan', message: 'Initializing agent...' },
    { timestamp: Date.now() - 58000, phase: 'plan', message: 'Connecting to repository...' },
    { timestamp: Date.now() - 55000, phase: 'plan', message: 'Cloning codebase...' },
    { timestamp: Date.now() - 50000, phase: 'plan', message: 'Analyzing codebase structure...' },
    { timestamp: Date.now() - 48000, phase: 'plan', message: 'Detected: JavaScript, TypeScript, Express' },
    { timestamp: Date.now() - 45000, phase: 'hunt', message: 'Agent: Hunting for issues...' },
    { timestamp: Date.now() - 43000, phase: 'hunt', message: '✓ Security: 2 issues' },
    { timestamp: Date.now() - 41000, phase: 'hunt', message: '✓ Reliability: 2 issues' },
    { timestamp: Date.now() - 39000, phase: 'hunt', message: '✓ Maintainability: 2 issues' },
    { timestamp: Date.now() - 30000, phase: 'explain', message: 'Agent: Generating timeline predictions...' },
    { timestamp: Date.now() - 28000, phase: 'explain', message: '└─ Analyzing 6 findings...' },
    { timestamp: Date.now() - 15000, phase: 'explain', message: 'Agent: Calculating future pain impact...' },
    { timestamp: Date.now() - 10000, phase: 'write', message: 'Agent: Compiling refactor roadmap...' },
    { timestamp: Date.now() - 8000, phase: 'write', message: '└─ Prioritizing by severity × effort...' },
    { timestamp: Date.now() - 5000, phase: 'write', message: '✓ Scan complete - Found 6 issues' },
    { timestamp: Date.now() - 3000, phase: 'write', message: '✓ Time saved: 1.2 hours' },
  ],
  createdAt: Date.now() - 60000,
};

/**
 * Demo scan for a "clean" Python/Flask application
 * Shows minimal issues (well-maintained code)
 */
export const DEMO_SCAN_CLEAN: ScanResult = {
  id: 'demo-clean-python',
  repoUrl: 'https://github.com/demo/clean-api',
  status: 'completed',
  findings: [
    {
      id: '1',
      ruleId: 'magic-numbers',
      category: 'maintainability',
      severity: 'low',
      eta: 'easy',
      file: 'app/config.py',
      line: 15,
      snippet: 'if retries > 3:',
      title: 'Magic number in retry logic',
      explanation: 'The number 3 is hardcoded. Extract to a named constant for better maintainability.',
      fix: 'MAX_RETRIES = 3\nif retries > MAX_RETRIES:',
      timeline: {
        t3m: 'Noticed during code review',
        t6m: 'Inconsistent across codebase',
        t1y: 'Hard to tune performance',
        t2y: 'Configuration nightmare',
      },
      minutesSaved: 5,
    },
    {
      id: '2',
      ruleId: 'magic-numbers',
      category: 'maintainability',
      severity: 'low',
      eta: 'easy',
      file: 'app/rate_limiter.py',
      line: 28,
      snippet: 'if request_count > 100:',
      title: 'Magic number in rate limiting',
      explanation: 'Rate limit threshold is hardcoded. Should be configurable for different environments.',
      fix: 'RATE_LIMIT_THRESHOLD = int(os.getenv("RATE_LIMIT", "100"))\nif request_count > RATE_LIMIT_THRESHOLD:',
      timeline: {
        t3m: 'Works fine for now',
        t6m: 'Need different limits per tier',
        t1y: 'Cannot adjust without deployment',
        t2y: 'Inflexible system design',
      },
      minutesSaved: 5,
    },
  ],
  stats: {
    totalFiles: 87,
    totalLines: 4532,
    languages: ['Python'],
    frameworks: ['Flask'],
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 2,
    totalMinutes: 10,
  },
  logs: [
    { timestamp: Date.now() - 30000, phase: 'plan', message: 'Initializing agent...' },
    { timestamp: Date.now() - 28000, phase: 'plan', message: 'Connecting to repository...' },
    { timestamp: Date.now() - 26000, phase: 'plan', message: 'Cloning codebase...' },
    { timestamp: Date.now() - 24000, phase: 'plan', message: 'Analyzing codebase structure...' },
    { timestamp: Date.now() - 22000, phase: 'plan', message: 'Detected: Python, Flask' },
    { timestamp: Date.now() - 20000, phase: 'hunt', message: 'Agent: Hunting for issues...' },
    { timestamp: Date.now() - 18000, phase: 'hunt', message: '✓ Security: 0 issues' },
    { timestamp: Date.now() - 16000, phase: 'hunt', message: '✓ Reliability: 0 issues' },
    { timestamp: Date.now() - 14000, phase: 'hunt', message: '✓ Maintainability: 2 issues' },
    { timestamp: Date.now() - 10000, phase: 'explain', message: 'Agent: Generating timeline predictions...' },
    { timestamp: Date.now() - 8000, phase: 'explain', message: '└─ Analyzing 2 findings...' },
    { timestamp: Date.now() - 5000, phase: 'explain', message: 'Agent: Calculating future pain impact...' },
    { timestamp: Date.now() - 3000, phase: 'write', message: 'Agent: Compiling refactor roadmap...' },
    { timestamp: Date.now() - 2000, phase: 'write', message: '✓ Scan complete - Found 2 issues' },
    { timestamp: Date.now() - 1000, phase: 'write', message: '✓ Time saved: 0.2 hours' },
  ],
  createdAt: Date.now() - 30000,
};

/**
 * Demo scan with error (for testing error states)
 */
export const DEMO_SCAN_FAILED: ScanResult = {
  id: 'demo-failed-scan',
  repoUrl: 'https://github.com/demo/private-repo',
  status: 'failed',
  findings: [],
  stats: {
    totalFiles: 0,
    totalLines: 0,
    languages: [],
    frameworks: [],
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    totalMinutes: 0,
  },
  logs: [
    { timestamp: Date.now() - 10000, phase: 'plan', message: 'Initializing agent...' },
    { timestamp: Date.now() - 8000, phase: 'plan', message: 'Connecting to repository...' },
    { timestamp: Date.now() - 5000, phase: 'plan', message: 'Error: Repository not accessible (404)' },
  ],
  createdAt: Date.now() - 10000,
};

/**
 * Export all demo scans as a lookup object
 */
export const DEMO_SCANS: Record<string, ScanResult> = {
  [DEMO_SCAN_MESSY.id]: DEMO_SCAN_MESSY,
  [DEMO_SCAN_CLEAN.id]: DEMO_SCAN_CLEAN,
  [DEMO_SCAN_FAILED.id]: DEMO_SCAN_FAILED,
};

/**
 * Helper to load a specific demo scan
 */
export function loadDemoScan(type: 'messy' | 'clean' | 'failed'): ScanResult {
  switch (type) {
    case 'messy':
      return DEMO_SCAN_MESSY;
    case 'clean':
      return DEMO_SCAN_CLEAN;
    case 'failed':
      return DEMO_SCAN_FAILED;
    default:
      return DEMO_SCAN_MESSY;
  }
}

/**
 * Check if a scan ID is a demo scan
 */
export function isDemoScan(scanId: string): boolean {
  return scanId in DEMO_SCANS;
}

