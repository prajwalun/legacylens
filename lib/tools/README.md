# Greptile API Client

This directory contains the Greptile API client implementation for LegacyLens.

## Files

- **`greptile.ts`** - Main Greptile API client with all functionality
- **`cache.ts`** - Caching layer for API responses (1-hour TTL)
- **`test-greptile.ts`** - Test suite for the Greptile client

## Features

### 1. Repository Indexing
```typescript
const repoId = await indexRepository('https://github.com/vercel/next.js');
// Returns: github:main:vercel/next.js
```

### 2. Status Checking
```typescript
const status = await getRepositoryStatus(repoId);
// Returns: { status, filesProcessed, numFiles, ... }
```

### 3. Waiting for Indexing
```typescript
const completed = await waitForIndexing(repoId, 300000); // 5 min timeout
// Polls every 5 seconds until completed
```

### 4. Code Search (with grep patterns)
```typescript
const results = await searchCode(repoId, 'process\\.env\\.');
// Returns: [{ filepath, linestart, lineend, summary, ... }]
```

### 5. Repository Metadata
```typescript
const metadata = await getRepoMetadata(repoId);
// Returns: { languages: ['TypeScript', 'JavaScript'], frameworks: ['React', 'Next.js'], totalFiles: 1234 }
```

## Utilities

### URL Parsing
```typescript
parseRepoUrl('https://github.com/owner/repo')
// Returns: { owner: 'owner', repo: 'repo', fullName: 'owner/repo' }
```

### Repository ID Formatting
```typescript
formatRepoId('owner', 'repo', 'main')
// Returns: github:main:owner/repo
```

## Caching

All API responses are cached for 1 hour in `data/cache/`:
- Reduces API calls during development
- Speeds up repeated requests
- Automatically expires after 1 hour

Cache keys are based on:
- Repository indexing: `index-{owner/repo}`
- Search results: `search-{owner/repo}-{patternHash}`

## Rate Limiting

- **Minimum interval between searches:** 500ms
- Automatically sleeps if requests are too frequent
- Prevents hitting Greptile API rate limits

## Error Handling

Friendly error messages for common issues:
- **401:** Invalid Greptile API key
- **404:** Repository not found or no access
- **429:** Rate limited, try again later

## Testing

Run the test suite:
```bash
npm run test:greptile
```

The test will:
1. Parse various URL formats
2. Index a repository
3. Wait for indexing to complete
4. Search for code patterns
5. Extract repository metadata

**Note:** You need to create `.env.local` with your API key:
```
GREPTILE_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here (optional)
```

## Environment Variables

- `GREPTILE_API_KEY` - Required for all API calls
- `GITHUB_TOKEN` - Optional, needed for private repositories

## Implementation Details

### Repository ID Format
Greptile uses the format: `remote:branch:owner/repo`
- Example: `github:main:facebook/react`
- Always URL-encode when using in API paths

### Search Mode: grep vs query
- **grep mode:** Fast, exact pattern matching (used in this implementation)
- **query mode:** Semantic search (slower, not used here)

For code detectors, grep mode is preferred for speed and accuracy.

### Metadata Detection
Languages and frameworks are detected by:
1. **Languages:** File extension patterns (`.ts`, `.js`, `.py`)
2. **Frameworks:** Import statement patterns (`from 'react'`, `from 'express'`)

Limited to 3 searches per category to avoid rate limits.

## Performance Notes

- **Indexing time:** 2-5 minutes for large repos (10k+ files)
- **Search time:** 2-5 seconds per pattern
- **Cache hits:** Instant response (< 10ms)

Large repos (> 10k files) may fail to index. Handle gracefully in production.

