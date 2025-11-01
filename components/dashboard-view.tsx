"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import StatsBar from "@/components/stats-bar"
import TimelineTab from "@/components/timeline-tab"
import RoadmapTab from "@/components/roadmap-tab"
import SummaryTab from "@/components/summary-tab"
import ConsoleOverlay from "@/components/console-overlay"
import { Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ScanResult } from "@/types"

interface DashboardViewProps {
  scanData: ScanResult
}

export default function DashboardView({ scanData }: DashboardViewProps) {
  const [showConsole, setShowConsole] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0e1a] animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="border-b border-[#1e2739] bg-[#151b2e]/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">LEGACYLENS</h1>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground truncate max-w-md">{scanData.repoUrl}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowConsole(true)} className="gap-2">
            <Terminal className="w-4 h-4" />
            Console
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="container mx-auto px-6 py-8">
        <StatsBar stats={scanData.stats} />
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-6 pb-12">
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-[#1e2739] rounded-none h-auto p-0">
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
            >
              ⚡ Timeline
            </TabsTrigger>
            <TabsTrigger
              value="roadmap"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
            >
              📋 Roadmap
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
            >
              📊 Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-8">
            <TimelineTab findings={scanData.findings} repoUrl={scanData.repoUrl} />
          </TabsContent>

          <TabsContent value="roadmap" className="mt-8">
            <RoadmapTab findings={scanData.findings} />
          </TabsContent>

          <TabsContent value="summary" className="mt-8">
            <SummaryTab scanData={scanData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Console Overlay */}
      {showConsole && <ConsoleOverlay logs={scanData.logs} onClose={() => setShowConsole(false)} />}
    </div>
  )
}
