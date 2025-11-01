# Detectors

Code issue detection system using Greptile search patterns.

## Overview

The detector system identifies three categories of code issues:
- **Security** - Vulnerabilities and security risks
- **Reliability** - Error handling and robustness issues
- **Maintainability** - Code quality and technical debt

## Files

- **`security.ts`** - 5 security detectors
- **`reliability.ts`** - 4 reliability detectors
- **`maintainability.ts`** - 4 maintainability detectors
- **`index.ts`** - Detector registry and orchestration
- **`test-detectors.ts`** - Test suite

**Total:** 13 detectors

## Security Detectors

### 1. Hardcoded Secrets
**Rule ID:** `hardcoded-secrets`

Detects hardcoded API keys, secrets, and passwords in code.

**Patterns:**
```regex
API_KEY.*=.*["'][A-Za-z0-9]{20,}["']
SECRET.*=.*["'][^"']{10,}["']
PASSWORD.*=.*["'][^"']+["']
```

**Example:**
```typescript
const API_KEY = "sk_live_1234567890abcdef"; // ❌ Detected
```

### 2. Hardcoded Credentials
**Rule ID:** `hardcoded-credentials`

Detects database credentials in connection strings.

**Patterns:**
```regex
postgresql://[^@]+:[^@]+@
mysql://[^@]+:[^@]+@
mongodb://[^@]+:[^@]+@
```

**Example:**
```typescript
const dbUrl = "postgresql://user:pass@localhost/db"; // ❌ Detected
```

### 3. SQL Injection
**Rule ID:** `sql-injection`

Detects string concatenation in SQL queries (vulnerable to injection).

**Patterns:**
```regex
query\(.*\+.*\)
execute\(.*\+.*\)
SELECT.*\+.*FROM
```

**Example:**
```typescript
db.query("SELECT * FROM users WHERE id=" + userId); // ❌ Detected
```

### 4. Eval Usage
**Rule ID:** `eval-usage`

Detects dangerous dynamic code execution.

**Patterns:**
```regex
\beval\s*\(
\bexec\s*\(
new Function\s*\(
```

**Example:**
```typescript
eval(userInput); // ❌ Detected
```

### 5. Exposed .env Files
**Rule ID:** `exposed-env`

Detects committed .env files (should be in .gitignore).

**Pattern:**
```regex
^\.env$
```

## Reliability Detectors

### 1. Missing HTTP Timeouts
**Rule ID:** `no-http-timeout`

Detects HTTP calls without timeout configuration (can hang indefinitely).

**Patterns:**
```regex
fetch\([^)]+\)
axios\.(get|post|put|delete)\(
requests\.(get|post)\(
```

**Example:**
```typescript
fetch('https://api.example.com/data'); // ❌ No timeout
```

### 2. Empty Catch Blocks
**Rule ID:** `empty-catch`

Detects catch blocks that swallow errors without handling.

**Patterns:**
```regex
catch.*\{\s*\}
except:\s*pass
catch\s*\([^)]+\)\s*\{\s*\}
```

**Example:**
```typescript
try {
  riskyOperation();
} catch (e) {} // ❌ Error swallowed
```

### 3. No Input Validation
**Rule ID:** `no-validation`

Detects API routes without input validation.

**Patterns:**
```regex
app\.(get|post|put|delete)\([^)]+\)
@app\.route
router\.(get|post|put|delete)\(
```

**Example:**
```typescript
app.post('/user', (req, res) => {
  db.insert(req.body); // ❌ No validation
});
```

### 4. Unhandled Promises
**Rule ID:** `unhandled-promise`

Detects promises without .catch() handlers.

**Pattern:**
```regex
\.then\([^)]+\)(?!\s*\.catch)
```

**Example:**
```typescript
fetchData().then(process); // ❌ No .catch()
```

## Maintainability Detectors

### 1. God Files
**Rule ID:** `god-file`

Detects large files (> 500 lines, likely).

**Strategy:** Count functions/classes per file. 15+ = likely > 500 LOC.

### 2. Long Functions
**Rule ID:** `long-function`

Detects functions > 75 lines (estimated).

**Strategy:** Check snippet length from search results.

### 3. Magic Numbers
**Rule ID:** `magic-numbers`

Detects hardcoded numbers without const declarations.

**Pattern:**
```regex
(?<!const\s+)\b([2-9]|[1-9][0-9]{1,})\b
```

**Example:**
```typescript
if (users.length > 50) { // ❌ Magic number
  // Should be: const MAX_USERS = 50;
}
```

### 4. TODO Clusters
**Rule ID:** `todo-clusters`

Detects files with 3+ TODOs/FIXMEs in close proximity.

**Pattern:**
```regex
TODO|FIXME|HACK|XXX
```

## Usage

### Run All Detectors
```typescript
import { runAllDetectors } from '@/lib/detectors';

const findings = await runAllDetectors(repoId);
console.log(`Found ${findings.length} issues`);
```

### Run By Category
```typescript
import { runDetectorsByCategory } from '@/lib/detectors';

const securityIssues = await runDetectorsByCategory(repoId, 'security');
const reliabilityIssues = await runDetectorsByCategory(repoId, 'reliability');
const maintainabilityIssues = await runDetectorsByCategory(repoId, 'maintainability');
```

### Run Individual Detector
```typescript
import { detectHardcodedSecrets } from '@/lib/detectors/security';

const secrets = await detectHardcodedSecrets(repoId);
```

## Testing

Run the test suite:
```bash
npm run test:detectors
```

Expected output:
```
🔬 Testing Detector System
============================================================

📊 Detector Statistics:
   Total Detectors: 13
   - Security: 5
   - Reliability: 4
   - Maintainability: 4

🔗 Indexing test repository...
   ✓ Repository ID: github:main:vercel/next.js

🧪 Testing Individual Detectors
...

✅ All Detector Tests Completed Successfully!
```

## Result Format

Each detector returns an array of `DetectorResult`:
```typescript
interface DetectorResult {
  ruleId: string;      // e.g., 'hardcoded-secrets'
  category: Category;  // 'security' | 'reliability' | 'maintainability'
  file: string;        // File path
  line: number;        // Line number (0 if unknown)
  snippet: string;     // Code snippet or summary
}
```

## Error Handling

- Each detector catches errors independently
- Returns empty array on failure (doesn't crash)
- Logs errors for debugging
- `runAllDetectors()` continues even if some detectors fail

## Performance

- **Rate limiting:** 500ms delay between searches (automatic)
- **Estimated scan time:** 6-15 seconds for all detectors
- **Caching:** Search results cached for 1 hour

| Detector Category | Search Calls | Est. Time |
|-------------------|--------------|-----------|
| Security (5) | 8-12 | 4-6s |
| Reliability (4) | 6-10 | 3-5s |
| Maintainability (4) | 8-15 | 4-8s |
| **Total** | **22-37** | **11-19s** |

## Limitations

1. **False Positives:** Grep patterns may match benign code
2. **Heuristic Detection:** Some detectors use approximations (god files, long functions)
3. **Limited Context:** Snippet from Greptile may not show full context
4. **Language Specific:** Some patterns work better for certain languages

These limitations are acceptable - the explain phase (GPT-4) will filter and validate findings.

## Extending

To add a new detector:

1. Create detector function in appropriate file:
```typescript
export async function detectNewIssue(repoId: string): Promise<DetectorResult[]> {
  try {
    const results = await searchCode(repoId, 'your_pattern');
    return results.map(r => ({
      ruleId: 'new-issue',
      category: 'security',
      file: r.filepath,
      line: r.linestart || 0,
      snippet: r.summary || '',
    }));
  } catch (error) {
    console.error('[Category] Error in detectNewIssue:', error);
    return [];
  }
}
```

2. Add to registry in `index.ts`:
```typescript
export const SECURITY_DETECTORS = {
  // ... existing detectors
  'new-issue': detectNewIssue,
};
```

3. Update tests in `test-detectors.ts`

## Future Improvements

- [ ] Add detector for insecure random number generation
- [ ] Add detector for missing HTTPS
- [ ] Add detector for console.log in production code
- [ ] Add detector for missing error boundaries (React)
- [ ] Add detector for missing database indexes
- [ ] Improve god file detection with actual LOC count
- [ ] Add configurable thresholds (e.g., magic number exceptions)
- [ ] Add detector confidence scores

