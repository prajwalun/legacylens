"use client"

import { useEffect, useState } from "react"

interface TerminalLine {
  text: string
  timestamp?: string
  delay: number
}

interface TerminalViewProps {
  repoUrl: string
}

export default function TerminalView({ repoUrl }: TerminalViewProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [charIndex, setCharIndex] = useState(0)

  const terminalSequence: TerminalLine[] = [
    { text: `$ legacylens scan ${repoUrl}`, delay: 500 },
    { text: "", delay: 300 },
    { text: "> Initializing agent...", timestamp: "[00:01]", delay: 2000 },
    { text: "> Connecting to repository...", timestamp: "[00:03]", delay: 2000 },
    { text: "> Cloning codebase... ████████████████████ 100%", timestamp: "[00:08]", delay: 5000 },
    { text: "", delay: 500 },
    { text: "> Agent: Planning scan strategy...", timestamp: "[00:09]", delay: 1000 },
    { text: "  ├─ Detected: Node.js v18, Express, PostgreSQL", delay: 800 },
    { text: "  ├─ Files: 234 | Lines: 15,847", delay: 800 },
    { text: "  └─ Strategy: Security → Reliability → Maintainability", delay: 1500 },
    { text: "", delay: 500 },
    { text: "> Agent: Hunting for issues...", timestamp: "[00:15]", delay: 1000 },
    { text: "  ├─ [SECURITY] Scanning for hardcoded secrets...    ✓ 2", delay: 3000 },
    { text: "  ├─ [SECURITY] Checking SQL injection vectors...    ✓ 1", delay: 3000 },
    { text: "  ├─ [SECURITY] Analyzing eval/exec usage...         ✓ 0", delay: 3000 },
    { text: "  ├─ [RELIABILITY] HTTP timeouts...                  ✓ 1", delay: 3000 },
    { text: "  ├─ [RELIABILITY] Error handling...                 ✓ 2", delay: 3000 },
    { text: "  └─ [MAINTAINABILITY] God functions...              ✓ 1", delay: 3000 },
    { text: "", delay: 500 },
    { text: "> Agent: Generating timeline predictions...", timestamp: "[00:42]", delay: 3000 },
    { text: "  └─ Analyzing 6 findings across 6 files...", delay: 2000 },
    { text: "", delay: 500 },
    { text: "> Agent: Calculating future pain impact...", timestamp: "[00:48]", delay: 3000 },
    { text: "  └─ Projecting technical debt growth...", delay: 2000 },
    { text: "", delay: 500 },
    { text: "> Agent: Compiling refactor roadmap...", timestamp: "[00:55]", delay: 3000 },
    { text: "  └─ Prioritizing by severity × effort...", delay: 2000 },
    { text: "", delay: 500 },
    { text: "✓ Scan complete in 58s", timestamp: "[00:58]", delay: 2000 },
    { text: "", delay: 500 },
    { text: "> Preparing visualization...", delay: 1000 },
  ]

  useEffect(() => {
    if (currentLineIndex >= terminalSequence.length) return

    const currentLine = terminalSequence[currentLineIndex]

    if (charIndex < currentLine.text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + currentLine.text[charIndex])
        setCharIndex(charIndex + 1)
      }, 30) // 30ms per character for typing effect

      return () => clearTimeout(timer)
    } else {
      // Line complete, move to next after delay
      const timer = setTimeout(() => {
        setLines((prev) => [
          ...prev,
          {
            text: displayedText,
            timestamp: currentLine.timestamp,
          },
        ])
        setDisplayedText("")
        setCharIndex(0)
        setCurrentLineIndex(currentLineIndex + 1)
      }, currentLine.delay)

      return () => clearTimeout(timer)
    }
  }, [currentLineIndex, charIndex, displayedText]) // Removed terminalSequence from dependencies

  return (
    <div className="h-screen w-screen bg-black p-8 overflow-auto font-mono text-[#00ff41] crt-scanlines relative">
      <div className="space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="whitespace-pre">{line.text}</span>
            {line.timestamp && <span className="text-[#00ff41]/60 ml-4">{line.timestamp}</span>}
          </div>
        ))}
        {displayedText && (
          <div className="flex justify-between items-center">
            <span className="whitespace-pre">
              {displayedText}
              <span className="animate-pulse">█</span>
            </span>
            {terminalSequence[currentLineIndex]?.timestamp && (
              <span className="text-[#00ff41]/60 ml-4">{terminalSequence[currentLineIndex].timestamp}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
