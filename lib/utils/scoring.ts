// Severity and ETA scoring system
import type { Severity, ETA, Category } from '@/types';

/**
 * Severity mapping by rule ID
 * Defines the criticality of each issue type
 */
const SEVERITY_MAP: Record<string, Severity> = {
  // Critical - immediate security or data integrity risks
  'hardcoded-secrets': 'critical',
  'hardcoded-credentials': 'critical',
  'sql-injection': 'critical',
  
  // High - significant security or reliability concerns
  'eval-usage': 'high',
  'exposed-env': 'high',
  'no-validation': 'high',
  
  // Medium - reliability and robustness issues
  'no-http-timeout': 'medium',
  'empty-catch': 'medium',
  'unhandled-promise': 'medium',
  
  // Low - code quality and maintainability
  'god-file': 'low',
  'long-function': 'low',
  'magic-numbers': 'low',
  'todo-clusters': 'low',
};

/**
 * Calculate severity level for a finding
 */
export function calculateSeverity(ruleId: string): Severity {
  return SEVERITY_MAP[ruleId] || 'medium';
}

/**
 * Calculate ETA (Estimated Time to Address) for a finding
 * Based on rule complexity and snippet analysis
 */
export function calculateETA(ruleId: string, snippet: string): ETA {
  // Rules that typically require simple, single-line fixes
  const easyRules = [
    'hardcoded-secrets',
    'exposed-env',
    'magic-numbers',
    'empty-catch',
    'no-http-timeout',
  ];
  
  // Rules that may require significant refactoring
  const largeRules = [
    'god-file',
    'long-function',
    'sql-injection', // May need query refactor
    'no-validation', // May need schema design
  ];
  
  // Check rule type first
  if (easyRules.includes(ruleId)) {
    return 'easy'; // ≤15 min
  }
  
  if (largeRules.includes(ruleId)) {
    return 'large'; // >60 min
  }
  
  // Analyze snippet length as secondary factor
  if (snippet.length > 300) {
    return 'large';
  } else if (snippet.length > 150) {
    return 'medium';
  }
  
  return 'medium'; // 30-60 min (default)
}

/**
 * Calculate time saved by having this issue documented in the roadmap
 * Includes triage time + documentation time
 */
export function calculateMinutesSaved(severity: Severity, eta: ETA): number {
  // Base time for discovering and triaging the issue
  const triageTime: Record<Severity, number> = {
    critical: 15, // Critical issues take longer to triage
    high: 12,
    medium: 7,
    low: 3,
  };
  
  // Additional time saved by having fix documented
  const documentationTime = 2;
  
  return triageTime[severity] + documentationTime;
}

/**
 * Get human-readable label for ETA
 */
export function getETALabel(eta: ETA): string {
  const labels: Record<ETA, string> = {
    easy: '≤15 min',
    medium: '30-60 min',
    large: '>60 min',
  };
  return labels[eta];
}

/**
 * Get emoji representation for severity
 */
export function getSeverityEmoji(severity: Severity): string {
  const emojis: Record<Severity, string> = {
    critical: '🔴',
    high: '⚠️',
    medium: '🟡',
    low: '🔵',
  };
  return emojis[severity];
}

/**
 * Get emoji representation for category
 */
export function getCategoryEmoji(category: Category): string {
  const emojis: Record<Category, string> = {
    security: '🔒',
    reliability: '⚡',
    maintainability: '🔧',
    dependencies: '📦',
  };
  return emojis[category];
}

/**
 * Get color hex code for severity (for UI)
 */
export function getSeverityColor(severity: Severity): string {
  const colors: Record<Severity, string> = {
    critical: '#ef4444',
    high: '#f59e0b',
    medium: '#eab308',
    low: '#3b82f6',
  };
  return colors[severity];
}

/**
 * Get priority score for sorting (higher = more urgent)
 */
export function getPriorityScore(severity: Severity, eta: ETA): number {
  const severityScores: Record<Severity, number> = {
    critical: 1000,
    high: 100,
    medium: 10,
    low: 1,
  };
  
  const etaScores: Record<ETA, number> = {
    easy: 3,    // Easy fixes are higher priority
    medium: 2,
    large: 1,   // Large fixes are lower priority
  };
  
  return severityScores[severity] + etaScores[eta];
}

/**
 * Get category from rule ID
 */
export function getCategoryFromRuleId(ruleId: string): Category {
  const securityRules = [
    'hardcoded-secrets',
    'hardcoded-credentials',
    'sql-injection',
    'eval-usage',
    'exposed-env',
  ];
  
  const reliabilityRules = [
    'no-http-timeout',
    'empty-catch',
    'no-validation',
    'unhandled-promise',
  ];
  
  const maintainabilityRules = [
    'god-file',
    'long-function',
    'magic-numbers',
    'todo-clusters',
  ];
  
  if (securityRules.includes(ruleId)) return 'security';
  if (reliabilityRules.includes(ruleId)) return 'reliability';
  if (maintainabilityRules.includes(ruleId)) return 'maintainability';
  
  return 'maintainability'; // Default
}

/**
 * Calculate aggregate statistics for a set of findings
 */
export interface FindingStats {
  total: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalMinutes: number;
  totalHours: number;
  byCategory: {
    security: number;
    reliability: number;
    maintainability: number;
    dependencies: number;
  };
}

export function calculateStats(
  findings: Array<{ severity: Severity; category: Category; minutesSaved: number }>
): FindingStats {
  const stats: FindingStats = {
    total: findings.length,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    totalMinutes: 0,
    totalHours: 0,
    byCategory: {
      security: 0,
      reliability: 0,
      maintainability: 0,
      dependencies: 0,
    },
  };
  
  findings.forEach(f => {
    // Count by severity
    switch (f.severity) {
      case 'critical':
        stats.criticalCount++;
        break;
      case 'high':
        stats.highCount++;
        break;
      case 'medium':
        stats.mediumCount++;
        break;
      case 'low':
        stats.lowCount++;
        break;
    }
    
    // Count by category
    stats.byCategory[f.category]++;
    
    // Sum time saved
    stats.totalMinutes += f.minutesSaved;
  });
  
  stats.totalHours = Math.round(stats.totalMinutes / 60 * 10) / 10;
  
  return stats;
}

/**
 * Sort findings by priority (critical + easy first)
 */
export function sortByPriority<T extends { severity: Severity; eta: ETA }>(
  findings: T[]
): T[] {
  return [...findings].sort((a, b) => {
    const scoreA = getPriorityScore(a.severity, a.eta);
    const scoreB = getPriorityScore(b.severity, b.eta);
    return scoreB - scoreA; // Descending (higher priority first)
  });
}

/**
 * Group findings by severity
 */
export function groupBySeverity<T extends { severity: Severity }>(
  findings: T[]
): Record<Severity, T[]> {
  return {
    critical: findings.filter(f => f.severity === 'critical'),
    high: findings.filter(f => f.severity === 'high'),
    medium: findings.filter(f => f.severity === 'medium'),
    low: findings.filter(f => f.severity === 'low'),
  };
}

/**
 * Group findings by category
 */
export function groupByCategory<T extends { category: Category }>(
  findings: T[]
): Record<Category, T[]> {
  return {
    security: findings.filter(f => f.category === 'security'),
    reliability: findings.filter(f => f.category === 'reliability'),
    maintainability: findings.filter(f => f.category === 'maintainability'),
    dependencies: findings.filter(f => f.category === 'dependencies'),
  };
}

