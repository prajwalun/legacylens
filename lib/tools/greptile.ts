// Greptile API client for code analysis
import type { GreptileSearchResult, GreptileRepositoryStatus } from '@/types';
import { getCached, setCache, clearCache } from './cache';
import fs from 'fs/promises';
import path from 'path';

const GREPTILE_API = 'https://api.greptile.com/v2';
const GREPTILE_API_KEY = process.env.GREPTILE_API_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Rate limiting
let lastSearchTime = 0;
const MIN_SEARCH_INTERVAL = 500; // 500ms between searches

// Re-index handling
const REINDEX_DELAY_MS = 30000; // 30 seconds - wait for Greptile to process new index
const MAX_REINDEX_ATTEMPTS = 2; // Maximum number of re-index attempts before giving up

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Hash a string to a short alphanumeric code for cache keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parse repoId back to owner/repo
 * repoId format: github:main:owner/repo
 */
function parseRepoIdToOwnerRepo(repoId: string): [string, string] {
  const parts = repoId.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid repoId format: ${repoId}`);
  }
  
  const [owner, repo] = parts[2].split('/');
  return [owner, repo];
}

/**
 * Clear all cache entries for a specific repository
 */
async function clearCacheForRepo(repoId: string): Promise<void> {
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  
  try {
    const files = await fs.readdir(cacheDir);
    
    // Extract owner/repo from repoId
    const [owner, repo] = parseRepoIdToOwnerRepo(repoId);
    const fullName = `${owner}/${repo}`;
    
    // Delete all cache files for this repo (search, index, etc.)
    // Match patterns: index-owner-repo, search-repoId-*, etc.
    const sanitizedRepoId = repoId.replace(/:/g, '-').replace(/\//g, '-');
    const sanitizedFullName = fullName.replace(/\//g, '-');
    
    const deletePromises = files
      .filter(f => 
        f.includes(sanitizedRepoId) || 
        f.includes(sanitizedFullName) ||
        f.includes(`index-${owner}-${repo}`)
      )
      .map(f => {
        console.log(`[Cache] Deleting: ${f}`);
        return fs.unlink(path.join(cacheDir, f)).catch(() => {});
      });
    
    await Promise.all(deletePromises);
    
    console.log(`[Cache] Cleared ${deletePromises.length} cache entries for ${repoId}`);
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}

/**
 * Clear cache older than 24 hours
 */
async function clearOldCache() {
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    const files = await fs.readdir(cacheDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(cacheDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        console.log(`[Cache] Deleted old cache file: ${file}`);
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

// Run cache cleanup on module load
clearOldCache().catch(() => {});

/**
 * Get common headers for Greptile API requests
 */
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${GREPTILE_API_KEY}`,
    'Content-Type': 'application/json',
    'X-GitHub-Token': GITHUB_TOKEN || '',  // Always include, even if empty
  };
  
  return headers;
}

/**
 * Handle API errors with helpful messages
 */
function handleApiError(status: number, statusText: string): never {
  switch (status) {
    case 401:
      throw new Error('Invalid Greptile API key.');
    case 404:
      throw new Error('Repository not found. Make sure it\'s public or you have access.');
    case 429:
      throw new Error('Rate limited. Please try again in a minute.');
    default:
      throw new Error(`Greptile API error: ${status} ${statusText}`);
  }
}

/**
 * Parse GitHub URL to extract owner and repo
 * Handles formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseRepoUrl(url: string): { owner: string; repo: string; fullName: string } {
  // Trim whitespace and remove .git suffix if present
  let cleaned = url.trim().replace(/\.git$/, '');
  
  // Remove protocol and domain if present
  cleaned = cleaned.replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
  
  // Remove any trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  
  // Split by /
  const parts = cleaned.split('/');
  
  if (parts.length < 2) {
    throw new Error('Invalid GitHub URL format. Expected: owner/repo');
  }
  
  const owner = parts[0].trim();
  const repo = parts[1].trim();
  
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
  };
}

/**
 * Format repository ID for Greptile API
 * Format: github:branch:owner/repo
 */
export function formatRepoId(owner: string, repo: string, branch = 'main'): string {
  return `github:${branch}:${owner}/${repo}`;
}

/**
 * Index a repository with Greptile
 * Returns the repository ID (format: github:main:owner/repo)
 * @param forceFresh - If true, skip cache and force fresh indexing (used after 410 errors)
 */
export async function indexRepository(repoUrl: string, forceFresh = false): Promise<string> {
  const { owner, repo, fullName } = parseRepoUrl(repoUrl);
  const cacheKey = `index-${fullName}`;
  
  // Skip cache if forceFresh is true (e.g., after 410 error)
  if (!forceFresh) {
    const cached = await getCached<string>(cacheKey);
    if (cached) {
      console.log(`[Greptile] Using cached repository ID: ${cached}`);
      return cached;
    }
  } else {
    console.log(`[Greptile] 🔥 Forcing fresh index (ignoring cache)`);
  }
  
  console.log(`[Greptile] Indexing repository: ${fullName}`);
  
  const response = await fetch(`${GREPTILE_API}/repositories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      remote: 'github',
      repository: fullName,
      branch: 'main',
    }),
  });
  
  if (!response.ok) {
    handleApiError(response.status, response.statusText);
  }
  
  const data = await response.json();
  const repoId = formatRepoId(owner, repo, 'main');
  
  console.log(`[Greptile] Repository submitted for indexing: ${repoId}`);
  console.log(`[Greptile] Status endpoint: ${data.statusEndpoint || 'N/A'}`);
  
  // Only cache if NOT forced fresh (fresh indexes might be temporary)
  if (!forceFresh) {
    await setCache(cacheKey, repoId);
  }
  
  return repoId;
}

/**
 * Get repository indexing status
 */
export async function getRepositoryStatus(repoId: string): Promise<GreptileRepositoryStatus> {
  const encodedRepoId = encodeURIComponent(repoId);
  
  const response = await fetch(`${GREPTILE_API}/repositories/${encodedRepoId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    handleApiError(response.status, response.statusText);
  }
  
  const data = await response.json();
  return data as GreptileRepositoryStatus;
}

/**
 * Wait for repository to finish indexing
 * Polls every 5 seconds until completed or timeout
 */
export async function waitForIndexing(
  repoId: string,
  maxWaitTime = 300000 // 5 minutes default
): Promise<boolean> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds
  
  console.log(`[Greptile] Waiting for indexing to complete: ${repoId}`);
  
  while (Date.now() - startTime < maxWaitTime) {
    const status = await getRepositoryStatus(repoId);
    
    console.log(
      `[Greptile] Indexing progress: ${status.filesProcessed}/${status.numFiles} files (${status.status})`
    );
    
    if (status.status === 'completed' || status.status === 'COMPLETED') {
      console.log(`[Greptile] ✓ Indexing completed!`);
      return true;
    }
    
    if (status.status === 'failed' || status.status === 'FAILED') {
      throw new Error('Repository indexing failed');
    }
    
    // Wait before next poll
    await sleep(pollInterval);
  }
  
  console.log(`[Greptile] ✗ Indexing timed out after ${maxWaitTime / 1000}s`);
  return false;
}

/**
 * Search code using grep pattern
 * Uses rate limiting to avoid hitting API limits
 * Automatically handles 410 errors by re-indexing the repository with loop detection
 * @param reindexAttempt - Internal counter to prevent infinite re-index loops
 */
export async function searchCode(
  repoId: string,
  grepPattern: string,
  retryOnExpired = true,
  reindexAttempt = 0
): Promise<GreptileSearchResult[]> {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastSearch = now - lastSearchTime;
  if (timeSinceLastSearch < MIN_SEARCH_INTERVAL) {
    await sleep(MIN_SEARCH_INTERVAL - timeSinceLastSearch);
  }
  lastSearchTime = Date.now();
  
  // Extract owner/repo from repoId (format: github:main:owner/repo)
  const parts = repoId.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid repository ID format: ${repoId}`);
  }
  
  const [remote, branch, repository] = parts;
  
  // Check cache (but skip cache if this is a retry after 410)
  const cacheKey = `search-${repoId.replace(/:/g, '-')}-${hashString(grepPattern)}`;
  
  if (reindexAttempt === 0) { // Only use cache on first attempt
    const cached = await getCached<GreptileSearchResult[]>(cacheKey);
    if (cached) {
      console.log(`[Greptile] Using cached search results for pattern: ${grepPattern.substring(0, 50)}...`);
      return cached;
    }
  }
  
  console.log(`[Greptile] Searching for pattern: ${grepPattern.substring(0, 50)}...`);
  
  try {
    const response = await fetch(`${GREPTILE_API}/search`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        grep: grepPattern,
        repositories: [
          {
            remote,
            branch,
            repository,
          },
        ],
      }),
    });
    
    // Handle 410 Gone - repository cache expired
    if (response.status === 410) {
      console.log(`[Greptile] ⚠️  Repository cache expired (410 Gone) - Attempt ${reindexAttempt + 1}/${MAX_REINDEX_ATTEMPTS + 1}`);
      
      if (retryOnExpired && reindexAttempt < MAX_REINDEX_ATTEMPTS) {
        console.log(`[Greptile] 🔄 Starting re-index process...`);
        
        // Clear ALL cache for this repo
        await clearCacheForRepo(repoId);
        
        // Re-index with FORCE FRESH (don't use cached repoId)
        const [owner, repo] = parseRepoIdToOwnerRepo(repoId);
        const repoUrl = `https://github.com/${owner}/${repo}`;
        
        console.log(`[Greptile] Re-indexing ${repoUrl} (forced fresh, no cache)...`);
        const newRepoId = await indexRepository(repoUrl, true); // ← FORCE FRESH!
        
        // Wait for indexing
        console.log(`[Greptile] Waiting for indexing to complete...`);
        const indexed = await waitForIndexing(newRepoId, 300000); // 5 min timeout
        
        if (!indexed) {
          throw new Error('Re-indexing timed out after 5 minutes');
        }
        
        console.log(`[Greptile] ✅ Indexing complete`);
        
        // CRITICAL: Wait for Greptile to process the newly indexed data
        console.log(`[Greptile] ⏳ Waiting ${REINDEX_DELAY_MS / 1000}s for Greptile to propagate changes...`);
        await sleep(REINDEX_DELAY_MS);
        
        console.log(`[Greptile] 🔄 Retrying search (attempt ${reindexAttempt + 2})...`);
        
        // Retry with incremented attempt counter
        return searchCode(newRepoId, grepPattern, true, reindexAttempt + 1);
      }
      
      throw new Error(`Greptile repository permanently expired after ${reindexAttempt + 1} attempts. The repository may have indexing issues.`);
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Greptile API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    const results = data.sources || [];
    
    console.log(`[Greptile] ✅ Found ${results.length} matches`);
    
    // Cache results
    await setCache(cacheKey, results);
    
    return results;
    
  } catch (error: any) {
    console.error(`[Greptile] Search error:`, error.message);
    throw error;
  }
}

/**
 * Get repository metadata (languages, frameworks, file count)
 * Uses config file detection for better reliability
 */
export async function getRepoMetadata(repoId: string): Promise<{
  languages: string[];
  frameworks: string[];
  totalFiles: number;
}> {
  console.log(`[Greptile] Detecting languages and frameworks...`);
  
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  
  // Detect by config files (more reliable than file extensions)
  const configDetectors = [
    // JavaScript/TypeScript ecosystem
    { file: 'package\\.json', lang: 'JavaScript', framework: 'Node.js' },
    { file: 'tsconfig\\.json', lang: 'TypeScript', framework: null },
    { file: 'next\\.config\\.(js|ts)', lang: null, framework: 'Next.js' },
    { file: 'express', lang: null, framework: 'Express' },
    
    // Python ecosystem
    { file: 'requirements\\.txt', lang: 'Python', framework: null },
    { file: 'setup\\.py', lang: 'Python', framework: null },
    { file: 'Pipfile', lang: 'Python', framework: null },
    { file: 'from flask', lang: null, framework: 'Flask' },
    { file: 'from django', lang: null, framework: 'Django' },
    
    // Other languages
    { file: 'Cargo\\.toml', lang: 'Rust', framework: null },
    { file: 'go\\.mod', lang: 'Go', framework: null },
    { file: 'pom\\.xml', lang: 'Java', framework: null },
    { file: 'Gemfile', lang: 'Ruby', framework: null },
  ];
  
  // Try to detect using config files
  for (const detector of configDetectors) {
    try {
      const results = await searchCode(repoId, detector.file);
      if (results.length > 0) {
        if (detector.lang) languages.add(detector.lang);
        if (detector.framework) frameworks.add(detector.framework);
      }
    } catch (error) {
      // Silent fail - not critical
    }
  }
  
  // Fallback: Try file extension detection if nothing found
  if (languages.size === 0) {
    const extensionPatterns = [
      { name: 'JavaScript', pattern: '\\.js$' },
      { name: 'TypeScript', pattern: '\\.ts$' },
      { name: 'Python', pattern: '\\.py$' },
    ];
    
    for (const { name, pattern } of extensionPatterns) {
      try {
        const results = await searchCode(repoId, pattern);
        if (results.length > 0) {
          languages.add(name);
          break; // Stop after first match to save API calls
        }
      } catch (error) {
        // Silent fail
      }
    }
  }
  
  // Get total file count
  let totalFiles = 0;
  try {
    const status = await getRepositoryStatus(repoId);
    totalFiles = status.numFiles;
  } catch (error) {
    console.error('Failed to get file count:', error);
  }
  
  console.log(`[Greptile] Detected: ${Array.from(languages).join(', ') || 'Unknown'}, Frameworks: ${Array.from(frameworks).join(', ') || 'None'}`);
  
  return {
    languages: Array.from(languages),
    frameworks: Array.from(frameworks),
    totalFiles,
  };
}


