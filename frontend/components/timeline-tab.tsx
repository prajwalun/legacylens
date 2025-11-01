"use client"

import FindingCard from "@/components/finding-card"
import type { Finding } from "@/lib/types"

interface TimelineTabProps {
  findings: Finding[]
}

export default function TimelineTab({ findings }: TimelineTabProps) {
  return (
    <div className="space-y-6">
      {findings.map((finding, index) => (
        <div
          key={finding.id}
          className="animate-in slide-in-from-bottom-4 fade-in"
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
        >
          <FindingCard finding={finding} />
        </div>
      ))}
    </div>
  )
}
