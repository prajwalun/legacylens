"use client"

import { Card } from "@/components/ui/card"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import type { ScanResult } from "@/types"
import { AlertTriangle, FileCode } from "lucide-react"

interface SummaryTabProps {
  scanData: ScanResult
}

export default function SummaryTab({ scanData }: SummaryTabProps) {
  const severityData = [
    { name: "Critical", value: scanData.stats.criticalCount + scanData.stats.highCount, color: "#dc2626", icon: "🔴" },
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

  const totalFiles = new Set(scanData.findings.map((f) => f.file)).size

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    fontWeight: 500,
                    padding: "12px 16px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  }}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
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
                  style={{ backgroundColor: item.color }}
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
            📂 Category Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                    fontWeight: 500,
                    padding: "12px 16px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  }}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  formatter={(value: any) => [value, "Issues"]}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {categoryChartData.map((entry, index) => {
                    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]
                    const color = colors[index % colors.length]
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
