export interface Finding {
  id: string
  severity: "critical" | "high" | "medium" | "low"
  title: string
  file: string
  line: number
  snippet: string
  explanation: string
  fix: string
  timeline: {
    t3m: string
    t6m: string
    t1y: string
    t2y: string
  }
  category: string
  eta: "easy" | "medium" | "large"
  minutesSaved: number
}

export interface ScanData {
  id: string
  repoUrl: string
  status: string
  findings: Finding[]
  stats: {
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    totalMinutes: number
  }
  logs: Array<{
    timestamp: number
    phase: string
    message: string
  }>
}
