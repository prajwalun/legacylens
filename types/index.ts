// Core type definitions for LegacyLens

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ETA = 'easy' | 'medium' | 'large';
export type Category = 'security' | 'reliability' | 'maintainability' | 'dependencies';
export type Phase = 'plan' | 'hunt' | 'explain' | 'write';
export type ScanStatus = 'scanning' | 'completed' | 'failed';

export interface Finding {
  id: string;
  ruleId: string;
  category: Category;
  severity: Severity;
  eta: ETA;
  file: string;
  line: number;
  snippet: string;
  title: string;
  explanation: string;
  fix: string;
  timeline: {
    t3m: string;   // 3 months prediction
    t6m: string;   // 6 months prediction
    t1y: string;   // 1 year prediction
    t2y: string;   // 2 years prediction
  };
  minutesSaved: number;
}

export interface ScanResult {
  id: string;
  repoUrl: string;
  status: ScanStatus;
  findings: Finding[];
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: string[];
    frameworks: string[];
    highCount: number;
    mediumCount: number;
    lowCount: number;
    criticalCount: number;
    totalMinutes: number;
  };
  logs: Array<{
    timestamp: number;
    phase: Phase;
    message: string;
  }>;
  createdAt: number;
}

export interface AgentState {
  scanId: string;
  repoUrl: string;
  repoId?: string;
  repoMetadata?: {
    languages: string[];
    frameworks: string[];
    totalFiles: number;
    totalLines: number;
  };
  findings: Array<{
    ruleId: string;
    category: Category;
    file: string;
    line: number;
    snippet: string;
  }>;
  enrichedFindings: Finding[];
  logs: ScanResult['logs'];
  error?: string;
}

// Greptile API types
export interface GreptileSearchResult {
  repository: string;
  remote: string;
  branch: string;
  filepath: string;
  linestart: number | null;
  lineend: number | null;
  summary: string;
  distance: number | null;
}

export interface GreptileRepositoryStatus {
  repository: string;
  remote: string;
  branch: string;
  private: boolean;
  status: string;
  filesProcessed: number;
  numFiles: number;
  sha: string;
}

export interface GreptileSearchRequest {
  query?: string;
  grep?: string;
  repositories: Array<{
    remote: string;
    branch: string;
    repository: string;
  }>;
  sessionId?: string;
  stream?: boolean;
}

