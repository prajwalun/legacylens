"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import TerminalView from "@/components/terminal-view"
import DashboardView from "@/components/dashboard-view"
import type { ScanData } from "@/lib/types"

export default function ScanPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const scanId = params.id as string
  const repoUrl = searchParams.get("repo") || ""

  const [phase, setPhase] = useState<"terminal" | "transition" | "dashboard">("terminal")
  const [scanData, setScanData] = useState<ScanData | null>(null)

  useEffect(() => {
    // Simulate terminal phase completion after 60 seconds
    const terminalTimer = setTimeout(() => {
      setPhase("transition")

      // Generate mock scan data
      const mockData: ScanData = {
        id: scanId,
        repoUrl,
        status: "completed",
        findings: [
          {
            id: "finding_1",
            severity: "critical",
            title: "Hardcoded database credentials exposed",
            file: "src/config/database.js",
            line: 23,
            snippet: "const dbUrl = 'postgresql://user:pass@localhost/db';",
            explanation:
              "Database credentials are hardcoded in the source code, making them visible to anyone with repository access. This is a critical security vulnerability that could lead to unauthorized database access.",
            fix: "const dbUrl = process.env.DATABASE_URL;\n// Add to .env: DATABASE_URL=postgresql://...",
            timeline: {
              t3m: "TODO: why hardcoded?",
              t6m: "FIXME: breaks staging",
              t1y: "Can't rotate credentials",
              t2y: "Security incident",
            },
            category: "security",
            eta: "easy",
            minutesSaved: 10,
          },
          {
            id: "finding_2",
            severity: "high",
            title: "Missing timeout in payment API client",
            file: "src/api/payment.ts",
            line: 88,
            snippet: "const response = await axios.post('/api/charge', data);",
            explanation:
              "API calls without timeouts can hang indefinitely, causing poor user experience and potential resource exhaustion.",
            fix: "const client = axios.create({\n  timeout: 5000,\n  baseURL: process.env.API_URL\n});",
            timeline: {
              t3m: "Slow checkout reported",
              t6m: "Customer complaints increase",
              t1y: "Revenue impact measurable",
              t2y: "Competitors win on speed",
            },
            category: "reliability",
            eta: "easy",
            minutesSaved: 15,
          },
          {
            id: "finding_3",
            severity: "high",
            title: "SQL injection vulnerability in user search",
            file: "src/db/users.js",
            line: 45,
            snippet: "const query = `SELECT * FROM users WHERE name = '${searchTerm}'`;",
            explanation: "Direct string interpolation in SQL queries allows attackers to inject malicious SQL code.",
            fix: "const query = 'SELECT * FROM users WHERE name = $1';\nconst result = await db.query(query, [searchTerm]);",
            timeline: {
              t3m: "Pentester finds it",
              t6m: "Bug bounty filed",
              t1y: "Exploit published",
              t2y: "Data breach",
            },
            category: "security",
            eta: "easy",
            minutesSaved: 20,
          },
          {
            id: "finding_4",
            severity: "medium",
            title: "Missing error handling in checkout flow",
            file: "src/checkout.js",
            line: 156,
            snippet: "await processPayment(order);\nawait sendConfirmation(order);",
            explanation:
              "Unhandled promise rejections can crash the application or leave orders in inconsistent states.",
            fix: "try {\n  await processPayment(order);\n  await sendConfirmation(order);\n} catch (error) {\n  await rollbackOrder(order);\n  throw error;\n}",
            timeline: {
              t3m: "First crash reported",
              t6m: "Weekly incidents",
              t1y: "Customer trust eroding",
              t2y: "Reputation damaged",
            },
            category: "reliability",
            eta: "medium",
            minutesSaved: 30,
          },
          {
            id: "finding_5",
            severity: "medium",
            title: "God function with 450 lines",
            file: "src/services/order-processor.js",
            line: 12,
            snippet: "function processOrder(order) {\n  // 450 lines of mixed concerns...",
            explanation: "Large functions with multiple responsibilities are hard to test, maintain, and debug.",
            fix: "// Split into smaller functions:\nfunction validateOrder(order) { ... }\nfunction calculateTotal(order) { ... }\nfunction applyDiscounts(order) { ... }",
            timeline: {
              t3m: "New dev confused",
              t6m: "Bug fix takes 2 days",
              t1y: "Feature blocked",
              t2y: "Rewrite required",
            },
            category: "maintainability",
            eta: "large",
            minutesSaved: 120,
          },
          {
            id: "finding_6",
            severity: "low",
            title: "Console.log statements in production",
            file: "src/utils/logger.js",
            line: 8,
            snippet: "console.log('User data:', userData);",
            explanation: "Console logs in production can leak sensitive information and impact performance.",
            fix: "import logger from './logger';\nlogger.debug('User data:', userData);",
            timeline: {
              t3m: "Logs noticed in browser",
              t6m: "PII exposure concern",
              t1y: "Compliance audit flag",
              t2y: "Fine risk",
            },
            category: "security",
            eta: "easy",
            minutesSaved: 5,
          },
        ],
        stats: {
          criticalCount: 1,
          highCount: 2,
          mediumCount: 2,
          lowCount: 1,
          totalMinutes: 200,
        },
        logs: [
          { timestamp: Date.now() - 60000, phase: "init", message: "Initializing agent..." },
          { timestamp: Date.now() - 57000, phase: "connect", message: "Connecting to repository..." },
          { timestamp: Date.now() - 52000, phase: "clone", message: "Cloning codebase... 100%" },
          { timestamp: Date.now() - 51000, phase: "plan", message: "Detected: Node.js v18, Express, PostgreSQL" },
          { timestamp: Date.now() - 45000, phase: "hunt", message: "Scanning for hardcoded secrets... ✓ 2" },
          { timestamp: Date.now() - 37000, phase: "hunt", message: "Checking SQL injection vectors... ✓ 1" },
          { timestamp: Date.now() - 29000, phase: "hunt", message: "Analyzing eval/exec usage... ✓ 0" },
          { timestamp: Date.now() - 21000, phase: "hunt", message: "HTTP timeouts... ✓ 1" },
          { timestamp: Date.now() - 13000, phase: "hunt", message: "Error handling... ✓ 2" },
          { timestamp: Date.now() - 5000, phase: "explain", message: "Generating timeline predictions..." },
          { timestamp: Date.now() - 2000, phase: "write", message: "Compiling refactor roadmap..." },
          { timestamp: Date.now(), phase: "complete", message: "✓ Scan complete in 58s" },
        ],
      }

      setScanData(mockData)

      // Transition to dashboard after glitch effect
      setTimeout(() => {
        setPhase("dashboard")
      }, 1000)
    }, 60000) // 60 seconds

    return () => clearTimeout(terminalTimer)
  }, [scanId, repoUrl])

  if (phase === "terminal") {
    return <TerminalView repoUrl={repoUrl} />
  }

  if (phase === "transition") {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center glitch">
        <div className="text-[#00ff41] font-mono text-xl animate-pulse">Preparing visualization...</div>
      </div>
    )
  }

  return scanData ? <DashboardView scanData={scanData} /> : null
}
