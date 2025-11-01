"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import TerminalView from "@/components/terminal-view"
import DashboardView from "@/components/dashboard-view"
import type { ScanResult } from "@/types"

export default function ScanPage() {
  const params = useParams()
  const scanId = params.id as string

  const [phase, setPhase] = useState<"terminal" | "transition" | "dashboard">("terminal")
  const [scanData, setScanData] = useState<ScanResult | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scanComplete, setScanComplete] = useState(false)
  const [allLogsReceived, setAllLogsReceived] = useState(false)

  useEffect(() => {
    // Check if it's a demo scan
    if (scanId.startsWith('demo-')) {
      loadDemoScan(scanId)
      return
    }

    // For real scans, connect to SSE stream for real-time logs
    const eventSource = new EventSource(`/api/scan/${scanId}/stream`)

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'log') {
        setLogs(prev => [...prev, data.log])
      } else if (data.type === 'complete') {
        eventSource.close()
        // Mark scan as complete and load data, but DON'T transition yet
        // Let the terminal finish typing all logs first
        setScanComplete(true)
        loadScanData()
      } else if (data.type === 'error') {
        setError(data.message)
        eventSource.close()
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
      setScanComplete(true)
      loadScanData()
    }

    return () => eventSource.close()
  }, [scanId])

  const loadDemoScan = async (id: string) => {
    // Load demo data immediately
    const response = await fetch(`/api/scan/${id}`)
    const data = await response.json()
    
    // Set data immediately so terminal can show repo URL
    setScanData(data)
    
    // Show terminal animation for full 60 seconds (like real scans)
    setTimeout(() => {
      setPhase("transition")
      setTimeout(() => {
        setPhase("dashboard")
      }, 1000)
    }, 60000) // 60 seconds to see full animation
  }

  const loadScanResults = async () => {
    try {
      const response = await fetch(`/api/scan/${scanId}`)
      const data = await response.json()
      setScanData(data)
      
      // Wait for terminal animation to finish (60s)
      setTimeout(() => {
        setPhase("transition")
        setTimeout(() => {
          setPhase("dashboard")
        }, 1000)
      }, 60000)
    } catch (err) {
      setError('Failed to load results')
    }
  }

  const loadScanData = async () => {
    try {
      const response = await fetch(`/api/scan/${scanId}`)
      const data = await response.json()
      setScanData(data)
      setAllLogsReceived(true)
    } catch (err) {
      setError('Failed to load results')
    }
  }

  // Transition to dashboard when all logs have finished typing
  const handleAllLogsDisplayed = () => {
    setTimeout(() => {
      setPhase("transition")
      setTimeout(() => {
        setPhase("dashboard")
      }, 1000)
    }, 1500) // Small buffer after last log completes
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (phase === "terminal") {
    return (
      <TerminalView 
        logs={logs} 
        repoUrl={scanData?.repoUrl || ''} 
        allLogsReceived={allLogsReceived}
        onAllLogsDisplayed={handleAllLogsDisplayed}
      />
    )
  }

  if (phase === "transition") {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center glitch">
        <div className="text-[#00ff41] font-mono text-xl animate-pulse">Preparing visualization...</div>
      </div>
    )
  }

  if (!scanData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading results...</p>
        </div>
      </div>
    )
  }

  return <DashboardView scanData={scanData} />
}
