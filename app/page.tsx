"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // Only render particles on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim()) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start scan')
      }

      const { scanId } = await response.json()
      router.push(`/scan/${scanId}`)
    } catch (err) {
      console.error('Scan failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to start scan')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDemo = () => {
    router.push('/scan/demo-messy-nodejs')
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-6 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-foreground tracking-tight">
            🔮{" "}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              LEGACYLENS
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">See your code&apos;s future. Fix it now.</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="github.com/facebook/react"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isLoading}
              className="flex-1 h-14 text-lg bg-card border-border focus:border-primary transition-colors"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !repoUrl.trim()}
              className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-500 text-left px-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            type="button"
            onClick={loadDemo}
            variant="outline"
            className="w-full h-12"
            disabled={isLoading}
          >
            Try Demo (Instant Results)
          </Button>
        </form>

        <p className="text-sm text-muted-foreground italic">&quot;Time-travel through tech debt&quot;</p>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}
