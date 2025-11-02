"use client"

import FindingCard from "@/components/finding-card"
import type { Finding } from "@/types"

interface TimelineTabProps {
  findings: Finding[]
  repoUrl: string
}

export default function TimelineTab({ findings, repoUrl }: TimelineTabProps) {
  // Helper function to get severity priority for sorting
  const getSeverityPriority = (severity: string): number => {
    switch (severity) {
      case "critical": return 0
      case "high": return 1
      case "medium": return 2
      case "low": return 3
      default: return 4
    }
  }
  
  // Sort findings by severity (critical → high → medium → low)
  const sortedFindings = [...findings].sort((a, b) => 
    getSeverityPriority(a.severity) - getSeverityPriority(b.severity)
  )
  
  return (
    <div className="space-y-6">
      {sortedFindings.map((finding, index) => (
        <div
          key={finding.id}
          className="animate-in slide-in-from-bottom-4 fade-in"
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
        >
          <FindingCard finding={finding} repoUrl={repoUrl} />
        </div>
      ))}
    </div>
  )
}
