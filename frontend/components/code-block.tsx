"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language = "javascript" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const highlightCode = (code: string) => {
    const lines = code.split("\n")
    return lines.map((line, lineIndex) => {
      let highlightedLine = line

      // Comments first (gray/green) - like VS Code
      highlightedLine = highlightedLine.replace(/(\/\/.*$)/g, '<span class="text-[#6A9955] italic">$1</span>')
      highlightedLine = highlightedLine.replace(/(\/\*.*?\*\/)/g, '<span class="text-[#6A9955] italic">$1</span>')

      // Strings (orange/salmon) - VS Code style
      highlightedLine = highlightedLine.replace(/(['"`])(.*?)\1/g, '<span class="text-[#CE9178]">$1$2$1</span>')

      // Keywords (blue/purple) - control flow and declarations
      const keywords = [
        "const",
        "let",
        "var",
        "function",
        "return",
        "if",
        "else",
        "for",
        "while",
        "class",
        "import",
        "export",
        "from",
        "async",
        "await",
        "try",
        "catch",
        "throw",
        "new",
        "this",
        "super",
        "extends",
        "implements",
        "interface",
        "type",
        "enum",
        "public",
        "private",
        "protected",
        "static",
        "readonly",
      ]
      keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b(${keyword})\\b`, "g")
        highlightedLine = highlightedLine.replace(regex, `<span class="text-[#569CD6]">$1</span>`)
      })

      // Types and classes (teal/cyan)
      highlightedLine = highlightedLine.replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, '<span class="text-[#4EC9B0]">$1</span>')

      // Numbers (light green)
      highlightedLine = highlightedLine.replace(/\b(\d+\.?\d*)\b/g, '<span class="text-[#B5CEA8]">$1</span>')

      // Functions (yellow)
      highlightedLine = highlightedLine.replace(
        /\b([a-z_$][a-zA-Z0-9_$]*)\s*\(/g,
        '<span class="text-[#DCDCAA]">$1</span>(',
      )

      // Properties and methods after dot (light blue)
      highlightedLine = highlightedLine.replace(
        /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        '.<span class="text-[#9CDCFE]">$1</span>',
      )

      // Operators (white)
      highlightedLine = highlightedLine.replace(/([+\-*/%=<>!&|?:]+)/g, '<span class="text-[#D4D4D4]">$1</span>')

      return (
        <div key={lineIndex} className="table-row hover:bg-[#2a2d2e] transition-colors">
          <span className="table-cell text-right pr-4 pl-2 select-none text-[#858585] w-12 font-mono text-xs">
            {lineIndex + 1}
          </span>
          <span
            className="table-cell text-[#D4D4D4] font-mono text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightedLine || " " }}
          />
        </div>
      )
    })
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
