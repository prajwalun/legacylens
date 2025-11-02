"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface StatsBarProps {
  stats: {
    criticalCount: number
    highCount: number
    mediumCount: number
    lowCount: number
    totalMinutes: number
  }
}

function CountUpNumber({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      setCount(Math.floor(progress * target))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration])

  return <span>{count}</span>
}

export default function StatsBar({ stats }: StatsBarProps) {
  // Combine critical and high into critical since we're standardizing on 3 severities
  const criticalTotal = stats.criticalCount + stats.highCount
  const totalIssues = criticalTotal + stats.mediumCount + stats.lowCount

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-[#151b2e] border-[#1e2739] p-6 hover:-translate-y-1 transition-transform duration-300">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-[#ef4444]">
            <CountUpNumber target={criticalTotal} />
          </div>
          <div className="text-sm text-muted-foreground">CRITICAL</div>
          <div className="text-2xl">🔴</div>
        </div>
      </Card>

      <Card className="bg-[#151b2e] border-[#1e2739] p-6 hover:-translate-y-1 transition-transform duration-300">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-[#eab308]">
            <CountUpNumber target={stats.mediumCount} />
          </div>
          <div className="text-sm text-muted-foreground">MEDIUM</div>
          <div className="text-2xl">🟡</div>
        </div>
      </Card>

      <Card className="bg-[#151b2e] border-[#1e2739] p-6 hover:-translate-y-1 transition-transform duration-300">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-[#3b82f6]">
            <CountUpNumber target={stats.lowCount} />
          </div>
          <div className="text-sm text-muted-foreground">LOW</div>
          <div className="text-2xl">🔵</div>
        </div>
      </Card>

      <Card className="bg-[#151b2e] border-[#1e2739] p-6 hover:-translate-y-1 transition-transform duration-300">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold text-primary">
            <CountUpNumber target={totalIssues} />
          </div>
          <div className="text-sm text-muted-foreground">TOTAL ISSUES</div>
          <div className="text-2xl">📊</div>
        </div>
      </Card>
    </div>
  )
}
