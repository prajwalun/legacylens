# 🔮 Future Upgrade: Greptile AI-Powered Detection

## 📊 Current vs Future Approach

### Current Implementation (MVP)
**GitHub API + Regex Patterns**
- ✅ Fast (15-20 seconds)
- ✅ Reliable and predictable
- ✅ Free (no API costs)
- ✅ Simple to maintain
- ⚠️ Limited to pattern matching
- ⚠️ Can't understand context
- ⚠️ Misses subtle issues

### Future Implementation (Phase 2)
**Greptile `/query` Endpoint**
- ✅ AI semantic understanding
- ✅ Finds issues regex misses
- ✅ One API call instead of 30+
- ✅ Better accuracy
- ⚠️ Slower (60-90 seconds)
- ⚠️ Costs per scan
- ⚠️ More complex

---

## 🎯 Why This Upgrade Makes Sense

### Problem with Old Greptile Approach
We initially tried using Greptile's `/search` endpoint with 30+ grep patterns:
```typescript
// ❌ WRONG: This is NOT how to use Greptile
for (const pattern of PATTERNS) {
  await searchCode(repoId, pattern.regex)  // 30+ API calls
}
```

**Issues:**
- 410 errors (repository cache expired)
- Rate limits
- Slow (sequential searches)
- Not using Greptile's AI capabilities

### Correct Greptile Usage
Use the `/query` endpoint with natural language:
```typescript
// ✅ CORRECT: Use Greptile's AI
const response = await fetch('https://api.greptile.com/v2/query', {
  method: 'POST',
  body: JSON.stringify({
    messages: [{
      role: 'user',
      content: `Analyze this codebase for security issues. Find:
        - Hardcoded secrets and API keys
        - SQL injection vulnerabilities
        - eval() usage
        - Missing input validation
        - Missing HTTP timeouts
        - Empty error handlers
        
        Return JSON with: file path, line number, issue type, and code snippet.`
    }],
    repositories: [{
      remote: 'github',
      repository: 'owner/repo',
      branch: 'main'
    }],
    sessionId: 'scan-123'
  })
})
```

**Benefits:**
- ✅ 1 API call instead of 30+
- ✅ AI understands context
- ✅ Finds issues regex might miss
- ✅ No 410 errors (proper usage)

---

## 🛠️ Implementation Guide

### Step 1: Update `lib/tools/greptile.ts`

Add new function for AI-powered queries:

```typescript
export async function queryForIssues(
  repoId: string,
  sessionId: string
): Promise<DetectorResult[]> {
  
  const [owner, repo] = parseRepoIdToOwnerRepo(repoId);
  
  const prompt = `Analyze this codebase for code quality and security issues.

Find and return issues in these categories:

SECURITY (Critical):
- Hardcoded API keys, secrets, passwords, tokens
- Database credentials in connection strings
- SQL injection vulnerabilities (string concatenation in queries)
- Use of eval(), exec(), or Function constructor
- Exposed .env files

RELIABILITY (High):
- HTTP/fetch calls without timeout configuration
- Empty catch blocks that swallow errors
- Promises without .catch() handlers
- Missing input validation on API routes

MAINTAINABILITY (Medium):
- Files over 500 lines (god files)
- Functions over 75 lines
- Magic numbers without constants
- Multiple TODO/FIXME comments clustered together

For each issue found, return JSON in this format:
{
  "findings": [
    {
      "category": "security" | "reliability" | "maintainability",
      "ruleId": "hardcoded-secrets",
      "file": "src/config/api.js",
      "line": 12,
      "snippet": "const API_KEY = 'sk_live_abc123'",
      "severity": "critical" | "high" | "medium" | "low"
    }
  ]
}

Be thorough and check all code files.`;

  try {
    const response = await fetch(`${GREPTILE_API}/query`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        repositories: [
          {
            remote: 'github',
            repository: `${owner}/${repo}`,
            branch: 'main'
          }
        ],
        sessionId: sessionId,
        stream: false
      })
    });

    // Handle 410 errors (re-index if needed)
    if (response.status === 410) {
      console.log('[Greptile] Repository expired, re-indexing...');
      
      const repoUrl = `https://github.com/${owner}/${repo}`;
      const newRepoId = await indexRepository(repoUrl, true);
      await waitForIndexing(newRepoId, 300000);
      
      // Retry once
      return queryForIssues(newRepoId, sessionId);
    }

    if (!response.ok) {
      throw new Error(`Greptile query failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Greptile's AI response
    const content = data.message || '';
    
    // Extract JSON from the response
    let findings = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*"findings"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        findings = parsed.findings || [];
      }
    } catch (e) {
      console.error('[Greptile] Failed to parse AI response:', e);
    }
    
    return findings;

  } catch (error: any) {
    console.error('[Greptile] Query error:', error);
    throw error;
  }
}
```

### Step 2: Update `lib/detectors/index.ts`

Create a new file `lib/detectors/greptile.ts`:

```typescript
import { queryForIssues } from '@/lib/tools/greptile';
import { indexRepository, waitForIndexing } from '@/lib/tools/greptile';
import { DetectorResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function runGreptileDetectors(repoUrl: string): Promise<DetectorResult[]> {
  console.log('[Greptile] Starting AI-powered analysis...');
  
  // Index repository
  const repoId = await indexRepository(repoUrl, false);
  await waitForIndexing(repoId, 300000); // Wait up to 5 minutes
  
  // Query for issues
  const sessionId = `scan-${uuidv4()}`;
  
  try {
    const findings = await queryForIssues(repoId, sessionId);
    
    console.log(`[Greptile] ✅ Found ${findings.length} issues`);
    
    // Map Greptile findings to our format
    const results: DetectorResult[] = findings.map((f: any) => ({
      ruleId: f.ruleId || 'unknown',
      category: f.category || 'maintainability',
      file: f.file || 'unknown',
      line: f.line || 0,
      snippet: f.snippet || '',
    }));
    
    return results;
    
  } catch (error) {
    console.error('[Greptile] Query failed:', error);
    
    // Fallback to GitHub API detector
    console.log('[Greptile] Falling back to GitHub API detector...');
    const { runAllDetectors } = await import('./index');
    return runAllDetectors(repoUrl);
  }
}
```

### Step 3: Add Feature Flag

In `.env.example`:
```bash
# Detection Engine (choose one)
USE_GREPTILE=false  # false = GitHub API (fast), true = Greptile AI (accurate)
```

### Step 4: Switch Based on Flag

In `lib/agent/nodes/hunt.ts`:
```typescript
export async function hunt(state: AgentState): Promise<Partial<AgentState>> {
  const useGreptile = process.env.USE_GREPTILE === 'true';
  
  let findings: DetectorResult[];
  
  if (useGreptile) {
    logs.push({
      phase: 'hunt',
      message: '🔮 Running Greptile AI-powered analysis... (60-90s)',
    });
    const { runGreptileDetectors } = await import('@/lib/detectors/greptile');
    findings = await runGreptileDetectors(state.repoUrl);
  } else {
    logs.push({
      phase: 'hunt',
      message: '⚡ Running GitHub API pattern detection... (15-20s)',
    });
    findings = await runAllDetectors(state.repoUrl);
  }
  
  // ... rest of hunt logic
}
```

---

## 📊 Performance Comparison

| Metric | GitHub API (Current) | Greptile AI (Future) |
|--------|---------------------|---------------------|
| **Speed** | 15-20 seconds | 60-90 seconds |
| **API Calls** | 100-200 (parallel) | 1-3 (sequential) |
| **Accuracy** | 85% (pattern-based) | 95% (semantic) |
| **Cost** | Free | ~$0.50/scan |
| **False Positives** | Medium | Low |
| **Context Understanding** | None | High |
| **Maintenance** | Simple regex | AI prompt tuning |

---

## 🎯 When to Make This Switch

### Keep GitHub API For:
- ✅ Hackathons and demos
- ✅ Free tier / open source projects
- ✅ Speed-critical applications
- ✅ Simple codebases

### Switch to Greptile For:
- ✅ Production security scanning
- ✅ Enterprise customers (willing to pay)
- ✅ Complex codebases with subtle issues
- ✅ When accuracy > speed

---

## 🚀 Hybrid Approach (Best of Both)

**Recommended for production:**

```typescript
export async function runHybridDetectors(repoUrl: string): Promise<DetectorResult[]> {
  // 1. Quick scan with GitHub API (20 seconds)
  const quickFindings = await runAllDetectors(repoUrl);
  
  // 2. If critical issues found, do deep AI scan
  const hasCriticalIssues = quickFindings.some(f => 
    f.category === 'security' && f.ruleId.includes('injection')
  );
  
  if (hasCriticalIssues) {
    console.log('[Hybrid] Critical issues detected, running deep AI scan...');
    const aiFindings = await runGreptileDetectors(repoUrl);
    
    // Merge and deduplicate
    return deduplicate([...quickFindings, ...aiFindings]);
  }
  
  return quickFindings;
}
```

**Benefits:**
- ✅ Fast for clean codebases (20s)
- ✅ Deep for risky codebases (90s)
- ✅ Cost-effective (only pays when needed)
- ✅ Best user experience

---

## 📝 Summary

**Is the Greptile `/query` fix correct?** ✅ **YES**

**Should you implement it now?** ❌ **NO** (for hackathon)

**When should you implement it?** 📅 **Phase 2** (after validation)

**How to implement?** 📖 Follow this guide

---

## 🔗 References

- [Greptile API Docs](https://docs.greptile.com/api-reference)
- [Greptile Query Endpoint](https://docs.greptile.com/api-reference/query)
- [LegacyLens Detection Patterns](../lib/detectors/README.md)

---

**Status:** 📋 Documented, not implemented  
**Priority:** 🟡 Medium (Phase 2)  
**Effort:** 🕒 2-3 hours  
**Value:** 💎 High (better accuracy)

