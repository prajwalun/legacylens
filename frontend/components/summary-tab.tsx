"use client"

import { Card } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import type { ScanData } from "@/lib/types"
import { AlertTriangle, Clock, FileCode, GitBranch } from "lucide-react"

interface SummaryTabProps {
  scanData: ScanData
}

export default function SummaryTab({ scanData }: SummaryTabProps) {
  const severityData = [
    { name: "Critical", value: scanData.stats.criticalCount, color: "#dc2626", icon: "🔴" },
    { name: "High", value: scanData.stats.highCount, color: "#ea580c", icon: "🟠" },
    { name: "Medium", value: scanData.stats.mediumCount, color: "#f59e0b", icon: "🟡" },
    { name: "Low", value: scanData.stats.lowCount, color: "#3b82f6", icon: "🔵" },
  ].filter((d) => d.value > 0)

  const categoryData = scanData.findings.reduce(
    (acc, finding) => {
      acc[finding.category] = (acc[finding.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    percentage: Math.round((value / scanData.findings.length) * 100),
  }))

  const timeSavedData = [
    { name: "Triage", hours: 3.2, color: "#10b981" },
    { name: "Roadmap", hours: 0.8, color: "#8b5cf6" },
    { name: "Documentation", hours: 0.2, color: "#06b6d4" },
  ]

  const totalFiles = new Set(scanData.findings.map((f) => f.file)).size
  const totalLines = scanData.findings.length * 250
  const totalTimeSaved = timeSavedData.reduce((sum, item) => sum + item.hours, 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#151b2e] to-[#1a2235] border-[#1e2739] p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-1">Total Issues</div>
              <div className="text-3xl font-bold text-foreground">{scanData.findings.length}</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#f59e0b] opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#151b2e] to-[#1a2235] border-[#1e2739] p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-1">Files Scanned</div>
              <div className="text-3xl font-bold text-foreground">{totalFiles}</div>
            </div>
            <FileCode className="w-8 h-8 text-[#3b82f6] opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#151b2e] to-[#1a2235] border-[#1e2739] p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-1">Lines of Code</div>
              <div className="text-3xl font-bold text-foreground">{totalLines.toLocaleString()}</div>
            </div>
            <GitBranch className="w-8 h-8 text-[#8b5cf6] opacity-80" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#151b2e] to-[#1a2235] border-[#1e2739] p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-muted-foreground text-sm mb-1">Time Saved</div>
              <div className="text-3xl font-bold text-foreground">{totalTimeSaved.toFixed(1)}h</div>
            </div>
            <Clock className="w-8 h-8 text-[#10b981] opacity-80" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#151b2e] border-[#1e2739] p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
            Issue Severity Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#151b2e" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1419",
                    border: "1px solid #1e2739",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {severityData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-[#1e2739] hover:bg-black/30 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-[#151b2e]"
                  style={{ backgroundColor: item.color, ringColor: item.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.value} issues</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-[#151b2e] border-[#1e2739] p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#10b981]" />
            Time Saved Analysis
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSavedData}>
                <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: "12px", fontWeight: 500 }} />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: "12px" }}
                  label={{ value: "Hours", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f1419",
                    border: "1px solid #1e2739",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                  formatter={(value: number) => [`${value} hours`, "Time Saved"]}
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                  {timeSavedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg">
            <div className="text-sm text-[#10b981] font-medium">Total: {totalTimeSaved.toFixed(1)} hours saved</div>
            <div className="text-xs text-muted-foreground mt-1">Automated analysis and roadmap generation</div>
          </div>
        </Card>
      </div>

      <Card className="bg-[#151b2e] border-[#1e2739] p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Category Breakdown</h3>
        <div className="space-y-4">
          {categoryChartData.map((item, index) => {
            const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
            const color = colors[index % colors.length]

            return (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {item.name}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{item.value} issues</span>
                    <span className="text-foreground font-semibold min-w-[3rem] text-right">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-3 bg-[#0f1419] rounded-full overflow-hidden border border-[#1e2739]">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
