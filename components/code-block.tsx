"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import Prism from "prismjs"

// Import Prism languages
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-go"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-markdown"

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language = "javascript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Detect language from code if not provided
  const detectLanguage = (code: string): string => {
    if (language && language !== "javascript") return language
    
    // Simple detection based on syntax patterns
    if (code.includes("def ") || code.includes("import ") && code.includes(" as ")) return "python"
    if (code.includes("SELECT") || code.includes("FROM") || code.includes("WHERE")) return "sql"
    if (code.includes("interface ") || code.includes(": string") || code.includes(": number")) return "typescript"
    if (code.includes("package ") || code.includes("public class")) return "java"
    if (code.includes("func ") || code.includes("package main")) return "go"
    if (code.includes("fn ") || code.includes("impl ")) return "rust"
    
    return "javascript"
  }

  const highlightCode = (code: string) => {
    if (!mounted) return code

    const lang = detectLanguage(code)
    const grammar = Prism.languages[lang] || Prism.languages.javascript

    try {
      const highlighted = Prism.highlight(code, grammar, lang)
      const lines = highlighted.split("\n")
      
      return lines.map((line, lineIndex) => (
        <div key={lineIndex} className="table-row hover:bg-[#2a2d2e]/50 transition-colors group/line">
          <span className="table-cell text-right pr-4 pl-3 select-none text-[#858585] w-12 font-mono text-xs border-r border-[#3E3E42] group-hover/line:bg-[#2a2d2e]/30">
            {lineIndex + 1}
          </span>
          <span
            className="table-cell text-[#D4D4D4] font-mono text-sm leading-relaxed pl-4"
            dangerouslySetInnerHTML={{ __html: line || " " }}
          />
        </div>
      ))
    } catch (error) {
      console.error("Syntax highlighting error:", error)
      return code.split("\n").map((line, i) => (
        <div key={i} className="table-row">
          <span className="table-cell text-right pr-4 pl-3 select-none text-[#858585]">{i + 1}</span>
          <span className="table-cell text-[#D4D4D4] font-mono text-sm pl-4">{line || " "}</span>
        </div>
      ))
    }
  }

  return (
    <div className="relative group">
      <pre className="bg-[#1E1E1E] rounded-lg p-4 overflow-x-auto border border-[#3E3E42] shadow-lg">
        <code className="table w-full">{highlightCode(code)}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2D2D30] hover:bg-[#3E3E42] text-[#CCCCCC] border border-[#3E3E42]"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </>
        )}
      </Button>
    </div>
  )
}
