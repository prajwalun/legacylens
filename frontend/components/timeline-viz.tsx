"use client"

import { useState } from "react"

interface TimelineVisualizationProps {
  timeline: {
    t3m: string
    t6m: string
    t1y: string
    t2y: string
  }
}

export default function TimelineVisualization({ timeline }: TimelineVisualizationProps) {
  const [hoveredDot, setHoveredDot] = useState<string | null>(null)

  const timepoints = [
    { key: "t3m", label: "3mo", text: timeline.t3m },
    { key: "t6m", label: "6mo", text: timeline.t6m },
    { key: "t1y", label: "1yr", text: timeline.t1y },
    { key: "t2y", label: "2yr", text: timeline.t2y },
  ]

  return (
    <div className="bg-black/30 rounded-lg p-6 border border-[#1e2739]">
      <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Future Timeline</div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-[#1e2739]" />

        {/* Timepoints */}
        <div className="relative flex justify-between">
          {timepoints.map((point, index) => (
            <div key={point.key} className="flex flex-col items-center" style={{ animationDelay: `${index * 150}ms` }}>
              {/* Dot */}
              <div
                className="relative z-10 w-4 h-4 rounded-full bg-primary cursor-pointer transition-all duration-300 hover:scale-125 animate-in zoom-in"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animationFillMode: "backwards",
                  animation: `pulse 2s ease-in-out infinite ${index * 0.2}s`,
                }}
                onMouseEnter={() => setHoveredDot(point.key)}
                onMouseLeave={() => setHoveredDot(null)}
              />

              {/* Label */}
              <div className="mt-3 text-xs text-muted-foreground font-medium">{point.label}</div>

              {/* Prediction text */}
              <div
                className="mt-2 text-xs text-foreground/80 text-center max-w-[100px] animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 150 + 300}ms`, animationFillMode: "backwards" }}
              >
                &quot;{point.text}&quot;
              </div>

              {/* Tooltip on hover */}
              {hoveredDot === point.key && (
                <div className="absolute top-[-60px] bg-[#151b2e] border border-[#1e2739] rounded-lg px-3 py-2 text-xs text-foreground shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-20 whitespace-nowrap">
                  <div className="font-semibold mb-1">{point.label} from now:</div>
                  <div>&quot;{point.text}&quot;</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}
