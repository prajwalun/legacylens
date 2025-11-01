"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Copy, Download } from "lucide-react"
import { useState } from "react"

interface LogEntry {
  timestamp: number
  phase: string
  message: string
}

interface ConsoleOverlayProps {
  logs: LogEntry[]
  onClose: () => void
}

export default function ConsoleOverlay({ logs, onClose }: ConsoleOverlayProps) {
  const [copied, setCopied] = useState(false)

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    const minutes = Math.floor(seconds / 60)

    if (minutes === 0) {
      return `[00:${seconds.toString().padStart(2, "0")}]`
    }
    return `[${minutes.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}]`
  }

  const handleCopyLog = async () => {
    const logText = logs.map((log) => `${formatTimestamp(log.timestamp)} ${log.message}`).join("\n")
    await navigator.clipboard.writeText(logText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadJSON = () => {
    const json = JSON.stringify(logs, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "scan-log.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Console Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-1/2 z-50 animate-in slide-in-from-right duration-400">
        <Card className="h-full bg-[#0a0e1a] border-l border-[#1e2739] rounded-none flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1e2739]">
            <h2 className="text-lg font-semibold text-foreground">Scan Log</h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-[#1e2739]">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Log Content */}
          <div className="flex-1 overflow-auto p-4 font-mono text-sm text-[#00ff41] space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-[#00ff41]/60 shrink-0">{formatTimestamp(log.timestamp)}</span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#1e2739] flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLog} className="flex-1 gap-2 bg-transparent">
              <Copy className="w-4 h-4" />
              {copied ? "Copied!" : "Copy Log"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadJSON} className="flex-1 gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Download JSON
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
