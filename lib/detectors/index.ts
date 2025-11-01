// GitHub API + Regex-based detector system (no Greptile dependency)
import { Category } from '@/types';

export interface DetectorResult {
  ruleId: string;
  category: Category;
  file: string;
  line: number;
  snippet: string;
}

// GitHub API helpers
async function fetchFromGitHub(url: string): Promise<any> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  return response.json();
}

async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw',
    };
    
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) return '';
    return await response.text();
  } catch {
    return '';
  }
}

async function getRepoTree(owner: string, repo: string): Promise<string[]> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;
    const data = await fetchFromGitHub(url);
    
    const files = data.tree
      ?.filter((item: any) => item.type === 'blob')
      ?.map((item: any) => item.path) || [];
    
    return files;
  } catch (error) {
    console.error('[GitHub] Error fetching tree from main branch:', error);
    // Try 'master' branch as fallback
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
      const data = await fetchFromGitHub(url);
      return data.tree?.filter((item: any) => item.type === 'blob')?.map((item: any) => item.path) || [];
    } catch {
      return [];
    }
  }
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

// Pattern-based detection
interface DetectionPattern {
  ruleId: string;
  category: Category;
  regex: RegExp;
}

const DETECTION_PATTERNS: DetectionPattern[] = [
  // Security - Critical
  {
    ruleId: 'hardcoded-secrets',
    category: 'security',
    regex: /(API_KEY|SECRET_KEY|PRIVATE_KEY|ACCESS_KEY|AUTH_TOKEN|PASSWORD)\s*=\s*["'][^"'\s]{15,}["']/i,
  },
  {
    ruleId: 'hardcoded-credentials',
    category: 'security',
    regex: /(postgresql|mysql|mongodb):\/\/[^:]+:[^@]+@/i,
  },
  {
    ruleId: 'sql-injection',
    category: 'security',
    regex: /(query|execute)\s*\(\s*["'].*?\+.*?["']\s*\)/i,
  },
  {
    ruleId: 'eval-usage',
    category: 'security',
    regex: /\beval\s*\(|new\s+Function\s*\(/,
  },
  
  // Reliability - Medium
  {
    ruleId: 'no-http-timeout',
    category: 'reliability',
    regex: /fetch\s*\([^)]+\)(?![^{]*timeout)/i,
  },
  {
    ruleId: 'empty-catch',
    category: 'reliability',
    regex: /catch\s*\([^)]*\)\s*\{\s*\}/,
  },
  {
    ruleId: 'unhandled-promise',
    category: 'reliability',
    regex: /\.then\s*\([^)]+\)(?!\s*\.catch)/,
  },
  
  // Maintainability - Low
  {
    ruleId: 'todo-clusters',
    category: 'maintainability',
    regex: /TODO|FIXME|HACK|XXX/i,
  },
  {
    ruleId: 'magic-numbers',
    category: 'maintainability',
    regex: /(?<!const\s+\w+\s*=\s*)\b([2-9]|[1-9]\d{2,})\b/,
  },
];

async function scanFile(owner: string, repo: string, filePath: string): Promise<DetectorResult[]> {
  const content = await fetchFileContent(owner, repo, filePath);
  if (!content) return [];
  
  const findings: DetectorResult[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Skip lines that are pure comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
      return;
    }
    
    // Remove inline comments before checking patterns
    // This handles cases like: const x = eval(y); // this is dangerous
    let codeOnly = line;
    
    // Remove // style comments
    const slashCommentIndex = codeOnly.indexOf('//');
    if (slashCommentIndex !== -1) {
      codeOnly = codeOnly.substring(0, slashCommentIndex);
    }
    
    // Remove # style comments (Python, Ruby, etc.)
    const hashCommentIndex = codeOnly.indexOf('#');
    if (hashCommentIndex !== -1) {
      codeOnly = codeOnly.substring(0, hashCommentIndex);
    }
    
    // Skip if nothing left after removing comments
    if (codeOnly.trim() === '') {
      return;
    }
    
    // Now check patterns on code-only portion
    DETECTION_PATTERNS.forEach(pattern => {
      if (pattern.regex.test(codeOnly)) {
        findings.push({
          ruleId: pattern.ruleId,
          category: pattern.category,
          file: filePath,
          line: index + 1,
          snippet: line.trim().substring(0, 200), // Show full line including comment for context
        });
      }
    });
  });
  
  return findings;
}

export async function runAllDetectors(repoUrl: string): Promise<DetectorResult[]> {
  console.log(`[Detectors] Starting GitHub-based scan: ${repoUrl}`);
  
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub URL');
  }
  
  const { owner, repo } = parsed;
  console.log(`[Detectors] Scanning ${owner}/${repo}`);
  
  // Get file tree
  const allFiles = await getRepoTree(owner, repo);
  console.log(`[Detectors] Found ${allFiles.length} total files`);
  
  // Filter to code files only (limit to 100 for performance)
  const codeFiles = allFiles
    .filter(f => /\.(js|jsx|ts|tsx|py|java|rb|php|go|cs|cpp|c)$/i.test(f))
    .filter(f => !f.includes('node_modules/'))
    .filter(f => !f.includes('vendor/'))
    .filter(f => !f.includes('.min.'))
    .slice(0, 100);
  
  console.log(`[Detectors] Scanning ${codeFiles.length} code files`);
  
  // Scan files in batches of 10 (avoid rate limits)
  const allFindings: DetectorResult[] = [];
  const batchSize = 10;
  
  for (let i = 0; i < codeFiles.length; i += batchSize) {
    const batch = codeFiles.slice(i, i + batchSize);
    console.log(`[Detectors] Scanning batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(codeFiles.length/batchSize)}`);
    
    const batchResults = await Promise.all(
      batch.map(file => scanFile(owner, repo, file))
    );
    
    batchResults.forEach(results => allFindings.push(...results));
    
    // Small delay between batches (avoid rate limits)
    if (i + batchSize < codeFiles.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`[Detectors] ✅ Scan complete - Found ${allFindings.length} issues`);
  
  // Log breakdown
  const security = allFindings.filter(f => f.category === 'security').length;
  const reliability = allFindings.filter(f => f.category === 'reliability').length;
  const maintainability = allFindings.filter(f => f.category === 'maintainability').length;
  
  console.log(`[Detectors] Security: ${security}, Reliability: ${reliability}, Maintainability: ${maintainability}`);
  
  return allFindings;
}

export async function getRepoMetadata(repoUrl: string) {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return { languages: [], frameworks: [], totalFiles: 0, totalLines: 0 };
  }
  
  const { owner, repo } = parsed;
  
  try {
    const files = await getRepoTree(owner, repo);
    
    // Detect languages
    const languages = new Set<string>();
    if (files.some(f => /\.(js|jsx)$/i.test(f))) languages.add('JavaScript');
    if (files.some(f => /\.(ts|tsx)$/i.test(f))) languages.add('TypeScript');
    if (files.some(f => /\.py$/i.test(f))) languages.add('Python');
    if (files.some(f => /\.java$/i.test(f))) languages.add('Java');
    if (files.some(f => /\.rb$/i.test(f))) languages.add('Ruby');
    if (files.some(f => /\.go$/i.test(f))) languages.add('Go');
    if (files.some(f => /\.php$/i.test(f))) languages.add('PHP');
    
    // Detect frameworks
    const frameworks = new Set<string>();
    if (files.includes('package.json')) frameworks.add('Node.js');
    if (files.includes('requirements.txt')) frameworks.add('Python');
    if (files.includes('Gemfile')) frameworks.add('Ruby');
    if (files.includes('go.mod')) frameworks.add('Go');
    if (files.includes('pom.xml')) frameworks.add('Maven');
    
    return {
      languages: Array.from(languages),
      frameworks: Array.from(frameworks),
      totalFiles: files.length,
      totalLines: 0, // We don't calculate this for performance
    };
  } catch (error) {
    console.error('[Detectors] Error getting metadata:', error);
    return { languages: [], frameworks: [], totalFiles: 0, totalLines: 0 };
  }
}
