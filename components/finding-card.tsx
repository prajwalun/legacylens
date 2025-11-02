"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TimelineVisualization from "@/components/timeline-viz"
import CodeBlock from "@/components/code-block"
import { Clock, Wrench, ExternalLink } from "lucide-react"
import type { Finding } from "@/types"

interface FindingCardProps {
  finding: Finding
  repoUrl: string
}

const severityConfig = {
  critical: {
    color: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    border: "border-l-[#ef4444]",
    glow: "pulse-glow-critical",
    label: "🔴 CRITICAL",
  },
  high: {
    color: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    border: "border-l-[#f59e0b]",
    glow: "pulse-glow-high",
    label: "⚠️ HIGH",
  },
  medium: {
    color: "text-[#eab308]",
    bg: "bg-[#eab308]/10",
    border: "border-l-[#eab308]",
    glow: "",
    label: "⚡ MEDIUM",
  },
  low: {
    color: "text-[#3b82f6]",
    bg: "bg-[#3b82f6]/10",
    border: "border-l-[#3b82f6]",
    glow: "",
    label: "📋 LOW",
  },
}

const etaConfig = {
  easy: { color: "text-green-500", label: "≤15 min fix" },
  medium: { color: "text-yellow-500", label: "30-60 min fix" },
  large: { color: "text-red-500", label: ">60 min fix" },
}

export default function FindingCard({ finding, repoUrl }: FindingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const config = severityConfig[finding.severity]
  const etaConf = etaConfig[finding.eta]

  // Construct proper GitHub URL: https://github.com/owner/repo/blob/main/filepath#L123
  const getGitHubUrl = () => {
    // Parse repoUrl: https://github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/)
    if (!match) return '#'
    
    const owner = match[1]
    const repo = match[2]
    return `https://github.com/${owner}/${repo}/blob/main/${finding.file}#L${finding.line}`
  }

  return (
    <Card
      className={`bg-[#151b2e] border-[#1e2739] border-l-4 ${config.border} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${config.glow}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Badge className={`${config.bg} ${config.color} border-0 font-semibold`}>{config.label}</Badge>
        <span className="text-sm text-muted-foreground">
          {finding.file}:{finding.line}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-4">{finding.title}</h3>

      {/* Explanation */}
      <p className="text-sm text-muted-foreground mb-6">{finding.explanation}</p>

      {/* Problematic Code Snippet */}
      <div className="mb-6 space-y-2">
        <div className="text-sm font-semibold text-foreground">CURRENT CODE (Line {finding.line}):</div>
        <CodeBlock code={finding.snippet} language="javascript" />
      </div>

      {/* Timeline */}
      <TimelineVisualization timeline={finding.timeline} />

      {/* Fix Section */}
      <div className="mt-6 space-y-2">
        <div className="text-sm font-semibold text-foreground">FIX NOW:</div>
        <CodeBlock code={finding.fix} language="javascript" />
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{finding.minutesSaved} min</span>
          </div>
          <div className={`flex items-center gap-1 font-semibold ${etaConf.color}`}>
            <Wrench className="w-4 h-4" />
            <span>{etaConf.label}</span>
          </div>
        </div>
        <a
          href={getGitHubUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          View in GitHub
        </a>
      </div>
    </Card>
  )
}
