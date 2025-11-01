// Curated list of repositories for testing LegacyLens

/**
 * Test repositories organized by size/complexity
 * Use small/medium repos for live demos to ensure quick completion
 */

export const TEST_REPOS = {
  /**
   * Small repos (< 100 files, < 1 min scan time)
   * Perfect for live demos
   */
  small: [
    {
      url: 'https://github.com/tj/commander.js',
      description: 'Node.js CLI framework',
      files: '~40 files',
      scanTime: '30-60s',
    },
    {
      url: 'https://github.com/chalk/chalk',
      description: 'Terminal string styling',
      files: '~20 files',
      scanTime: '20-40s',
    },
    {
      url: 'https://github.com/sindresorhus/got',
      description: 'HTTP request library',
      files: '~50 files',
      scanTime: '40-60s',
    },
  ],

  /**
   * Medium repos (100-500 files, 1-3 min scan time)
   * Good for showing more realistic results
   */
  medium: [
    {
      url: 'https://github.com/expressjs/express',
      description: 'Web framework for Node.js',
      files: '~200 files',
      scanTime: '90-150s',
    },
    {
      url: 'https://github.com/fastify/fastify',
      description: 'Fast web framework',
      files: '~300 files',
      scanTime: '120-180s',
    },
  ],

  /**
   * Large repos (> 500 files, 3-5+ min scan time)
   * AVOID in live demos - use pre-scanned data instead
   */
  large_avoid: [
    {
      url: 'https://github.com/vercel/next.js',
      description: 'React framework',
      files: '~5000+ files',
      scanTime: '180-300s',
      note: 'TOO LARGE - Use demo data instead',
    },
    {
      url: 'https://github.com/facebook/react',
      description: 'React library',
      files: '~10000+ files',
      scanTime: '300-600s',
      note: 'TOO LARGE - Use demo data instead',
    },
  ],
};

/**
 * Recommended repos for different demo scenarios
 */
export const DEMO_SCENARIOS = {
  quickDemo: {
    repo: TEST_REPOS.small[1], // chalk
    reason: 'Fastest scan, clean results',
  },
  typicalProject: {
    repo: TEST_REPOS.medium[0], // express
    reason: 'Shows realistic issue count',
  },
  fallback: {
    demoId: 'demo-messy-nodejs',
    reason: 'Instant results if APIs fail',
  },
};

/**
 * Get a recommended test repo URL
 */
export function getTestRepoUrl(size: 'small' | 'medium' = 'small'): string {
  if (size === 'small') {
    return TEST_REPOS.small[0].url;
  }
  return TEST_REPOS.medium[0].url;
}

/**
 * Get estimated scan time for a repo
 */
export function getEstimatedScanTime(repoUrl: string): string {
  // Simple heuristic based on URL
  if (repoUrl.includes('next.js') || repoUrl.includes('react')) {
    return '3-5 minutes (large repo)';
  } else if (repoUrl.includes('express') || repoUrl.includes('fastify')) {
    return '1-3 minutes (medium repo)';
  }
  return '30-60 seconds (small repo)';
}

