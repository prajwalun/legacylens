"use client"

import { useEffect, useState } from "react"

interface TerminalLine {
  text: string
  timestamp?: string
  delay: number
}

interface TerminalViewProps {
  repoUrl: string
  logs?: Array<{ timestamp: number; phase: string; message: string }>
  allLogsReceived?: boolean
  onAllLogsDisplayed?: () => void
}

export default function TerminalView({ 
  repoUrl, 
  logs = [], 
  allLogsReceived = false,
  onAllLogsDisplayed 
}: TerminalViewProps) {
  const [lines, setLines] = useState<TerminalLine[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [charIndex, setCharIndex] = useState(0)
  const [useRealLogs, setUseRealLogs] = useState(false)
  const [currentTypingLog, setCurrentTypingLog] = useState<string>("")
  const [typingCharIndex, setTypingCharIndex] = useState(0)
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false)

  // Initialize with command line when logs arrive
  useEffect(() => {
    if (logs.length > 0 && !useRealLogs) {
      setUseRealLogs(true)
      setLines([{ text: `$ legacylens scan ${repoUrl}`, delay: 0 }])
    }
  }, [logs.length, useRealLogs, repoUrl])

  // Check if all logs have been displayed and notify parent
  useEffect(() => {
    if (!useRealLogs || !allLogsReceived || hasNotifiedCompletion) return
    
    // Check if all logs have been typed out
    // lines.length - 1 because first line is the command
    const numDisplayedLogs = lines.length - 1
    const allDisplayed = numDisplayedLogs === logs.length && currentTypingLog === ""
    
    if (allDisplayed && onAllLogsDisplayed) {
      setHasNotifiedCompletion(true)
      onAllLogsDisplayed()
    }
  }, [useRealLogs, allLogsReceived, lines.length, logs.length, currentTypingLog, onAllLogsDisplayed, hasNotifiedCompletion])

  // Type out each log character by character (ChatGPT-style)
  useEffect(() => {
    if (!useRealLogs) return
    
    const numCompletedLines = lines.length - 1 // Subtract command line
    
    // Check if we need to start typing a new log
    if (logs.length > numCompletedLines && currentTypingLog === "") {
      const nextLog = logs[numCompletedLines]
      const formattedLog = `> [${nextLog.phase.toUpperCase()}] ${nextLog.message}`
      
      // Add realistic delay based on log content (simulate processing time)
      const getDelayForLog = (message: string, phase: string) => {
        // Longer delays for operations that should take time
        if (message.includes('Cloning') || message.includes('Indexing')) return 1500
        if (message.includes('Analyzing') || message.includes('structure')) return 1200
        if (message.includes('Detected:') || message.includes('Files:')) return 800
        if (message.includes('Hunting') || message.includes('Generating')) return 1000
        if (message.includes('✓') && phase === 'hunt') return 600 // Each detector
        if (message.includes('✓') && phase === 'write') return 500
        if (message.includes('Calculating')) return 900
        // Default short delay
        return 400
      }
      
      const delay = getDelayForLog(nextLog.message, nextLog.phase)
      
      setTimeout(() => {
        setCurrentTypingLog(formattedLog)
        setTypingCharIndex(0)
      }, delay)
      
      return
    }
    
    // Type out the current log character by character
    if (currentTypingLog && typingCharIndex < currentTypingLog.length) {
      const timer = setTimeout(() => {
        setTypingCharIndex(prev => prev + 1)
      }, 30) // 30ms per character = ~33 chars/sec (more realistic)
      
      return () => clearTimeout(timer)
    }
    
    // When finished typing, add to completed lines
    if (currentTypingLog && typingCharIndex >= currentTypingLog.length) {
      setLines(prev => [...prev, {
        text: currentTypingLog,
        // No timestamp - logs arrive too quickly to show meaningful elapsed time
      }])
      setCurrentTypingLog("")
      setTypingCharIndex(0)
    }
  }, [logs, useRealLogs, lines.length, currentTypingLog, typingCharIndex])

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
    // Don't run mock animation if we have real logs
    if (useRealLogs) return
    
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
  }, [currentLineIndex, charIndex, displayedText, terminalSequence, useRealLogs])

  return (
    <div className="h-screen w-screen bg-black p-8 overflow-auto font-mono text-[#00ff41] crt-scanlines relative">
      <div className="space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start">
            <span className="whitespace-pre">{line.text}</span>
            {line.timestamp && <span className="text-[#00ff41]/60 ml-4 flex-shrink-0">{line.timestamp}</span>}
          </div>
        ))}
        {/* Show currently typing log (ChatGPT/Claude style streaming) */}
        {useRealLogs && currentTypingLog && typingCharIndex > 0 && (
          <div className="flex items-start">
            <span className="whitespace-pre">
              {currentTypingLog.slice(0, typingCharIndex)}
              <span className="animate-pulse">█</span>
            </span>
          </div>
        )}
        {/* Show mock animation typing */}
        {!useRealLogs && displayedText && (
          <div className="flex items-start">
            <span className="whitespace-pre">
              {displayedText}
              <span className="animate-pulse">█</span>
            </span>
            {terminalSequence[currentLineIndex]?.timestamp && (
              <span className="text-[#00ff41]/60 ml-4 flex-shrink-0">{terminalSequence[currentLineIndex].timestamp}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
