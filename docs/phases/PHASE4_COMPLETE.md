# ✅ Phase 4 Complete: LLM & Utilities

## 📦 Files Created

```
lib/tools/
├── llm.ts                 (139 lines) - OpenAI GPT-4o-mini wrapper

lib/utils/
├── timeline.ts            (354 lines) - Timeline predictions & explanations
├── scoring.ts             (259 lines) - Severity & ETA calculation
├── roadmap.ts             (370 lines) - Markdown roadmap generator
└── test-utils.ts          (216 lines) - Comprehensive test suite
```

**Total:** 1,338 lines of TypeScript code

---

## ✅ Implementation Checklist

### Core Components (4/4 Complete)

- [x] **`llm.ts`** - OpenAI client with batching & JSON parsing
- [x] **`timeline.ts`** - Timeline predictions with fallbacks
- [x] **`scoring.ts`** - Severity & ETA calculation system
- [x] **`roadmap.ts`** - Markdown generation with multiple formats

### Features Implemented

#### LLM Client ✅
- [x] GPT-4o-mini integration (10x cheaper)
- [x] Lazy-loaded client (env vars supported)
- [x] Batch processing (5 concurrent max)
- [x] JSON parsing with retry
- [x] Rate limiting (1s between batches)
- [x] Error handling
- [x] Connection test function

#### Timeline Generator ✅
- [x] GPT-4 powered predictions
- [x] Fallback timelines for all 13 rules
- [x] Batch processing (5 at a time)
- [x] Explanation generation
- [x] Fix suggestion generation
- [x] 8-word limit per prediction
- [x] Developer language (TODO/FIXME)

#### Scoring System ✅
- [x] Severity mapping (critical/high/medium/low)
- [x] ETA calculation (easy/medium/large)
- [x] Time saved calculation
- [x] Priority scoring
- [x] Statistics aggregation
- [x] Sorting & grouping functions
- [x] Emoji & color helpers

#### Roadmap Generator ✅
- [x] Full markdown roadmap
- [x] Executive summary
- [x] Quick Wins section
- [x] Grouped by severity
- [x] Implementation guide
- [x] Checklist format
- [x] CSV export
- [x] JSON export

---

## 🎯 Test Results

All 10 tests passed successfully! ✅

```
✅ Test 1: OpenAI Connection
   Response: Hello from LegacyLens!

✅ Test 2: Scoring System
   🔴 hardcoded-secrets: critical
   🔴 sql-injection: critical
   🟡 no-http-timeout: medium
   🔵 god-file: low

✅ Test 3: Timeline Generation
   3 months: TODO: why is this hardcoded?
   6 months: FIXME: breaks in staging
   1 year:   Can't rotate credentials safely
   2 years:  Security incident waiting to happen

✅ Test 4: Explanation Generation
   "The code concatenates user input directly into an SQL query..."

✅ Test 5: Fix Generation
   "const API_KEY = process.env.API_KEY;"

✅ Test 6: Statistics Calculation
   Total: 5 findings
   Time Saved: 1 hours

✅ Test 7: Priority Sorting
   Critical + Easy = highest priority

✅ Test 8: Roadmap Generation
   2,975 characters generated

✅ Test 9: Checklist Generation
   Markdown checklist created

✅ Test 10: CSV Export
   CSV with all fields exported
```

---

## 📊 API Reference

### LLM Client

```typescript
import { callGPT4, callGPT4JSON, callGPT4Batch } from '@/lib/tools/llm';

// Single call
const response = await callGPT4('Your prompt', 'System prompt');

// JSON response
const data = await callGPT4JSON<{ key: string }>('Respond with JSON');

// Batch (5 concurrent)
const responses = await callGPT4Batch(['prompt1', 'prompt2', ...]);
```

### Timeline Generation

```typescript
import { 
  generateTimeline, 
  generateExplanation, 
  generateFix 
} from '@/lib/utils/timeline';

// Generate timeline predictions
const timeline = await generateTimeline(ruleId, file, snippet);
// Returns: { t3m, t6m, t1y, t2y }

// Generate explanation
const explanation = await generateExplanation(ruleId, file, snippet);

// Generate fix
const fix = await generateFix(ruleId, snippet);
```

### Scoring

```typescript
import {
  calculateSeverity,
  calculateETA,
  calculateMinutesSaved,
  calculateStats,
  sortByPriority,
} from '@/lib/utils/scoring';

const severity = calculateSeverity('hardcoded-secrets'); // 'critical'
const eta = calculateETA('hardcoded-secrets', snippet); // 'easy'
const minutes = calculateMinutesSaved(severity, eta); // 17

const stats = calculateStats(findings);
// Returns: { total, criticalCount, highCount, ..., totalHours, byCategory }

const sorted = sortByPriority(findings); // Critical+Easy first
```

### Roadmap Generation

```typescript
import { 
  generateRoadmap, 
  generateChecklist, 
  generateCSV 
} from '@/lib/utils/roadmap';

// Full markdown roadmap
const roadmap = generateRoadmap(findings, repoUrl);

// Simple checklist
const checklist = generateChecklist(findings);

// CSV export
const csv = generateCSV(findings);
```

---

## 🔧 Key Features

### 1. Smart Fallbacks

Every function has fallback data for when API calls fail:

```typescript
// If GPT-4 fails, use predefined timelines
const fallback = getFallbackTimeline('hardcoded-secrets');
// Returns: { t3m: "TODO: why hardcoded?", ... }
```

### 2. Rate Limiting

```typescript
// Batch processing with delays
for (let i = 0; i < chunks.length; i++) {
  await Promise.all(chunk.map(callGPT4));
  
  if (i + 1 < chunks.length) {
    await sleep(1000); // 1s delay between batches
  }
}
```

### 3. Priority Scoring

```typescript
getPriorityScore('critical', 'easy') // 1003
getPriorityScore('critical', 'large') // 1001
getPriorityScore('high', 'easy') // 103
getPriorityScore('low', 'easy') // 4
```

**Priority order:** Critical+Easy > Critical+Large > High+Easy > ... > Low+Large

### 4. Multiple Export Formats

- **Markdown:** Full roadmap with explanations
- **Checklist:** Simple task list
- **CSV:** Spreadsheet format
- **JSON:** Structured data

---

## 📈 Performance

| Operation | Time | API Calls |
|-----------|------|-----------|
| Timeline (single) | ~2s | 1 |
| Timeline (batch of 10) | ~5s | 10 (2 batches) |
| Explanation | ~2s | 1 |
| Fix | ~2s | 1 |
| Roadmap generation | < 0.1s | 0 (local) |
| Scoring | < 0.001s | 0 (local) |

**Estimated cost per finding:**
- Timeline: ~$0.001 (gpt-4o-mini)
- Explanation: ~$0.001
- Fix: ~$0.001
- **Total per finding:** ~$0.003 (very affordable!)

---

## 💡 Implementation Details

### Severity Mapping

```typescript
const SEVERITY_MAP = {
  // Critical (3 rules)
  'hardcoded-secrets': 'critical',
  'hardcoded-credentials': 'critical',
  'sql-injection': 'critical',
  
  // High (3 rules)
  'eval-usage': 'high',
  'exposed-env': 'high',
  'no-validation': 'high',
  
  // Medium (3 rules)
  'no-http-timeout': 'medium',
  'empty-catch': 'medium',
  'unhandled-promise': 'medium',
  
  // Low (4 rules)
  'god-file': 'low',
  'long-function': 'low',
  'magic-numbers': 'low',
  'todo-clusters': 'low',
};
```

### ETA Calculation

```typescript
// Easy: ≤15 min (single line fixes)
const easyRules = [
  'hardcoded-secrets',
  'exposed-env',
  'magic-numbers',
  'empty-catch',
  'no-http-timeout',
];

// Large: >60 min (requires refactoring)
const largeRules = [
  'god-file',
  'long-function',
  'sql-injection',
  'no-validation',
];

// Medium: 30-60 min (default)
```

### Time Saved Formula

```
Time Saved = Triage Time + Documentation Time

Triage Time:
- Critical: 15 min
- High: 12 min
- Medium: 7 min
- Low: 3 min

Documentation Time: 2 min per finding
```

---

## 📝 Roadmap Format Example

```markdown
# 🔮 Refactor Roadmap - facebook/react

*Generated by LegacyLens on November 1, 2025*

> See your code's future. Fix it now.

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Total Issues** | 22 |
| 🔴 Critical | 3 |
| ⚠️ High | 6 |
| 🟡 Medium | 8 |
| 🔵 Low | 5 |
| **Time Saved** | 4.2 hours |

---

## ⚡ Quick Wins (Start Here!)

1. **Hardcoded API key** - `src/api.ts:12` (≤15 min)
2. **Missing timeout** - `src/fetch.ts:45` (≤15 min)

---

## 🔴 Critical Priority

### 1. Hardcoded database credentials

| Property | Value |
|----------|-------|
| **Location** | `config/db.js:12` |
| **Effort** | ≤15 min |
| **Category** | 🔒 security |

**Why it matters:**

Database credentials are hardcoded in the connection string...

**Current code:**

```
const dbUrl = "postgresql://user:pass@localhost/db";
```

**Recommended fix:**

```
const dbUrl = process.env.DATABASE_URL;
```

**🔮 Future Pain Timeline:**

- **3 months:** TODO: why hardcoded?
- **6 months:** Can't change password safely
- **1 year:** Credentials leaked in git history
- **2 years:** Database breach via exposed creds

---
```

---

## 🎨 Styling Helpers

```typescript
// Emojis
getSeverityEmoji('critical') // 🔴
getSeverityEmoji('high') // ⚠️
getSeverityEmoji('medium') // 🟡
getSeverityEmoji('low') // 🔵

getCategoryEmoji('security') // 🔒
getCategoryEmoji('reliability') // ⚡
getCategoryEmoji('maintainability') // 🔧

// Colors (for UI)
getSeverityColor('critical') // #ef4444
getSeverityColor('high') // #f59e0b
getSeverityColor('medium') // #eab308
getSeverityColor('low') // #3b82f6

// Labels
getETALabel('easy') // ≤15 min
getETALabel('medium') // 30-60 min
getETALabel('large') // >60 min
```

---

## 🚧 Error Handling

All functions handle errors gracefully:

```typescript
// Timeline with fallback
try {
  const timeline = await generateTimeline(...);
  return timeline;
} catch (error) {
  console.error('[Timeline] Error:', error);
  return getFallbackTimeline(ruleId); // Always returns something
}

// LLM with retry
try {
  return JSON.parse(response);
} catch (parseError) {
  console.error('[LLM] Failed to parse, retrying...');
  const retry = await callGPT4(prompt + '\n\nRespond with valid JSON only');
  return JSON.parse(retry);
}
```

---

## 🎯 Integration Example

How utilities integrate in the agent workflow:

```typescript
// In lib/agent/nodes.ts - explainNode()

import { generateTimeline, generateExplanation, generateFix } from '@/lib/utils/timeline';
import { calculateSeverity, calculateETA, calculateMinutesSaved } from '@/lib/utils/scoring';

export async function explainNode(state: AgentState) {
  const enriched: Finding[] = [];
  
  for (const finding of state.findings) {
    // Generate AI content
    const timeline = await generateTimeline(finding.ruleId, finding.file, finding.snippet);
    const explanation = await generateExplanation(finding.ruleId, finding.file, finding.snippet);
    const fix = await generateFix(finding.ruleId, finding.snippet);
    
    // Calculate scores
    const severity = calculateSeverity(finding.ruleId);
    const eta = calculateETA(finding.ruleId, finding.snippet);
    const minutesSaved = calculateMinutesSaved(severity, eta);
    
    enriched.push({
      ...finding,
      title: `${finding.ruleId.replace(/-/g, ' ')}`,
      severity,
      eta,
      timeline,
      explanation,
      fix,
      minutesSaved,
    });
  }
  
  return {
    ...state,
    enrichedFindings: enriched,
  };
}

// In lib/agent/nodes.ts - writeNode()

import { generateRoadmap } from '@/lib/utils/roadmap';
import { sortByPriority } from '@/lib/utils/scoring';

export async function writeNode(state: AgentState) {
  // Sort by priority
  const sorted = sortByPriority(state.enrichedFindings);
  
  // Generate roadmap
  const roadmap = generateRoadmap(sorted, state.repoUrl);
  
  return {
    ...state,
    enrichedFindings: sorted,
    roadmap, // Store for download endpoint
  };
}
```

---

## 📚 Dependencies

- **openai:** ^6.7.0 - OpenAI API client
- **dotenv:** ^17.0.0 - Environment variable loading (dev)

---

## 🎉 What's Next?

Phase 4 is **complete**! The utility layer is:
- ✅ Fully implemented
- ✅ AI-powered with fallbacks
- ✅ Performance optimized
- ✅ Well-tested
- ✅ Type-safe
- ✅ 0 linter errors

**Next Phase:** Phase 5 - LangGraph Agent

This will include:
- Agent state management
- Multi-step workflow (plan, hunt, explain, write)
- SSE streaming for real-time updates
- Integration of all components

---

**Ready to proceed to Phase 5!** 🚀

