# 🔮 LegacyLens

**See your code's future - before it becomes technical debt.**

LegacyLens is an AI-powered code scanner that identifies technical debt in GitHub repositories and shows you exactly how each issue will impact your codebase over time. Perfect for AI-generated code, legacy projects, and preventing future headaches.

---

## 🎯 The Problem

- **AI generates code fast** - but often copies bad patterns
- **Technical debt compounds** - small issues become major problems
- **Manual code review is slow** - takes hours to find what matters
- **Future impact is unclear** - "We'll fix it later" never happens

## ✨ The Solution

LegacyLens scans your repository and:
- 🔍 **Detects 13+ types of issues** (security, reliability, maintainability)
- 🤖 **AI explains each problem** in plain English
- ⏰ **Shows the future timeline** - what happens in 3mo, 6mo, 1yr, 2yr
- 📋 **Generates fix suggestions** with code examples
- 📊 **Creates a prioritized roadmap** sorted by severity × effort

**All in under 60 seconds.**

---

## 🚀 Features

### Real-Time Scanning
- **Direct GitHub API integration** - no external dependencies
- **Live terminal streaming** - see progress as it happens
- **60-second scans** for typical repos

### AI-Powered Analysis
- **GPT-4o explanations** - human-readable issue descriptions
- **Timeline predictions** - see how issues worsen over time
- **Smart fix suggestions** - actionable code examples
- **Severity scoring** - know what to fix first

### Beautiful Dashboard
- **Interactive timeline view** - explore each finding
- **Markdown roadmap** - export and share with your team
- **GitHub integration** - click to view exact file/line
- **Time saved metrics** - quantify the value

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Browser)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS 14 FRONTEND                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Landing Page │  │  Terminal    │  │  Dashboard   │      │
│  │   (Input)    │→ │  Streaming   │→ │   Results    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API + SSE
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS 14 API ROUTES                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/scan           → Start new scan           │   │
│  │  GET  /api/scan/[id]      → Get scan results         │   │
│  │  GET  /api/scan/[id]/stream → SSE log streaming      │   │
│  │  GET  /api/roadmap/[id]   → Download roadmap         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               LANGGRAPH AGENT WORKFLOW                       │
│                                                              │
│    ┌──────┐    ┌──────┐    ┌─────────┐    ┌───────┐       │
│    │ PLAN │ → │ HUNT │ → │ EXPLAIN │ → │ WRITE │        │
│    └──────┘    └──────┘    └─────────┘    └───────┘       │
│        ↓           ↓            ↓             ↓             │
│    Metadata   Detectors    AI Analysis   Roadmap Gen       │
└──────────────────────────┬─────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ GITHUB API   │  │  OPENAI API  │  │  FILE STORE  │
│              │  │  (GPT-4o)    │  │              │
│ • File Tree  │  │ • Timeline   │  │ data/        │
│ • Content    │  │ • Explain    │  │ scans.json   │
│ • Metadata   │  │ • Fix        │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Agent Workflow

**1. PLAN Phase**
- Parse GitHub repository URL
- Fetch file tree via GitHub API
- Detect languages and frameworks
- Log: "Detected: JavaScript, Node.js..."

**2. HUNT Phase**
- Scan up to 100 code files
- Apply 13 regex-based detection patterns
- Filter out comments (no false positives)
- Log: "✓ Security: 9 issues, ✓ Reliability: 12 issues..."

**3. EXPLAIN Phase**
- For each finding, call GPT-4o-mini:
  - Generate human-readable explanation
  - Create 4-point timeline (3mo, 6mo, 1yr, 2yr)
  - Suggest specific fix with code
- Calculate severity (critical/high/medium/low)
- Calculate effort (easy/medium/large)
- Log: "Analyzing 68 findings..."

**4. WRITE Phase**
- Calculate aggregate statistics
- Generate markdown roadmap
- Save scan results to JSON
- Log: "✓ Scan complete - 8.1 hours saved"

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Shadcn UI
- Server-Sent Events (SSE)

**Backend:**
- Next.js API Routes
- LangGraph (agent orchestration)
- OpenAI GPT-4o-mini
- GitHub REST API

**Storage:**
- File-based JSON (no database needed!)

**Deployment:**
- Vercel (or any Node.js host)

---

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub account (optional: personal access token for higher rate limits)
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/legacylens.git
cd legacylens

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` with:

```env
# Required
OPENAI_API_KEY=sk-proj-...

# Optional - Greptile API for AI-powered detection
GREPTILE_API_KEY=greptile-...

# Optional (for higher GitHub API rate limits)
GITHUB_TOKEN=ghp_...

# Detection Mode (default: false = GitHub API pattern matching)
# Options: false | true | hybrid
USE_GREPTILE=false
```

**Detection Modes:**
- `false` (default): GitHub API + Regex patterns - Fast (15-20s), Free ⚡
- `true`: Greptile AI-powered - Accurate (60-90s), Paid (~$0.50/scan) 🔮
- `hybrid`: Smart scan - Quick first, deep AI if critical issues found ⚖️

See [docs/ENV_CONFIG.md](docs/ENV_CONFIG.md) for detailed configuration.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage

### 1. Enter Repository URL
Paste any public GitHub repository URL:
```
https://github.com/owner/repo
```

### 2. Watch Real-Time Scan
Terminal view shows live progress:
- Initializing agent
- Analyzing codebase structure
- Detecting languages
- Hunting for issues
- Generating timeline predictions

### 3. Explore Results
Interactive dashboard with:
- **Timeline Tab**: Browse all findings with future predictions
- **Roadmap Tab**: Downloadable markdown report
- **Summary Tab**: Stats and metrics

### 4. View in GitHub
Click "View in GitHub" on any finding to see the exact file and line.

---

## 🔍 Detection Patterns

### Security (Critical/High)
- **Hardcoded secrets**: API keys, passwords in code
- **Hardcoded credentials**: Database connection strings
- **SQL injection**: String concatenation in queries
- **eval() usage**: Arbitrary code execution risks

### Reliability (Medium)
- **Missing HTTP timeouts**: fetch() calls without timeout
- **Empty catch blocks**: Silently swallowed errors
- **Unhandled promises**: .then() without .catch()

### Maintainability (Low)
- **God files**: Files > 500 lines
- **TODO clusters**: Multiple TODOs/FIXMEs
- **Magic numbers**: Hardcoded numeric constants

---

## 📊 Time Saved Calculation

**Formula:** `Triage Time + Documentation Time`

| Severity | Triage | Docs | Total |
|----------|--------|------|-------|
| Critical | 15 min | 2 min | **17 min** |
| High | 12 min | 2 min | **14 min** |
| Medium | 7 min | 2 min | **9 min** |
| Low | 3 min | 2 min | **5 min** |

**Example:** 68 issues = ~10 hours of manual code review saved!

---

## 🎯 API Reference

### Start Scan
```http
POST /api/scan
Content-Type: application/json

{
  "repoUrl": "https://github.com/owner/repo"
}
```

**Response:**
```json
{
  "scanId": "uuid",
  "status": "scanning"
}
```

### Get Scan Results
```http
GET /api/scan/:id
```

**Response:**
```json
{
  "id": "uuid",
  "repoUrl": "https://github.com/owner/repo",
  "status": "completed",
  "findings": [...],
  "stats": {
    "totalFiles": 234,
    "criticalCount": 4,
    "totalMinutes": 598
  },
  "logs": [...]
}
```

### Stream Real-Time Logs
```http
GET /api/scan/:id/stream
Accept: text/event-stream
```

**Events:**
```
data: {"type":"log","log":{"phase":"plan","message":"Initializing..."}}
data: {"type":"complete","status":"completed"}
```

### Download Roadmap
```http
GET /api/roadmap/:id
```

**Response:** Markdown file download

---

## 🎨 Project Structure

```
legacylens/
├── app/                      # Next.js 14 App Router
│   ├── page.tsx             # Landing page
│   ├── scan/[id]/page.tsx   # Scan results page
│   └── api/                 # API routes
│       ├── scan/route.ts    # POST /api/scan
│       └── scan/[id]/
│           ├── route.ts     # GET /api/scan/:id
│           └── stream/route.ts  # SSE streaming
├── components/              # React components
│   ├── terminal-view.tsx    # Streaming terminal
│   ├── dashboard-view.tsx   # Results dashboard
│   └── finding-card.tsx     # Individual finding display
├── lib/                     # Core logic
│   ├── agent/              # LangGraph workflow
│   │   ├── state.ts        # State definition
│   │   ├── nodes.ts        # PLAN, HUNT, EXPLAIN, WRITE
│   │   └── graph.ts        # Workflow orchestration
│   ├── detectors/          # Code scanning
│   │   └── index.ts        # Regex-based detectors
│   ├── utils/              # Utilities
│   │   ├── timeline.ts     # AI timeline generation
│   │   ├── scoring.ts      # Severity & ETA calculation
│   │   └── roadmap.ts      # Markdown generation
│   └── storage/            # Data persistence
│       └── scans.ts        # File-based storage
├── types/                   # TypeScript definitions
│   └── index.ts
├── data/                    # Runtime data
│   └── scans.json          # Scan results
└── docs/                    # Documentation
    ├── phases/             # Development phase docs
    └── DEMO_GUIDE.md       # Demo instructions
```

---

## 🎬 Demo

**Test Repository:** [prajwalun/bad-repo](https://github.com/prajwalun/bad-repo)

This intentionally messy Node.js API demonstrates LegacyLens capabilities:
- Hardcoded secrets and credentials
- SQL injection vulnerabilities
- eval() and exec() usage
- Missing error handling
- Poor code quality

Try scanning it to see LegacyLens in action!

---

## 🤝 Contributing

Contributions are welcome! See development docs in `docs/phases/` for build history.

### Development Phases
- ✅ Phase 1: Project setup
- ✅ Phase 2: GitHub API client
- ✅ Phase 3: Detection patterns
- ✅ Phase 4: AI utilities
- ✅ Phase 5: LangGraph agent
- ✅ Phase 6: API routes
- ✅ Phase 7: Frontend integration

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [LangGraph](https://github.com/langchain-ai/langgraph)
- [OpenAI GPT-4](https://openai.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [GitHub API](https://docs.github.com/en/rest)

---

## 📧 Contact

**Built for Fast Hack Hackathon 2025**

For questions or feedback, open an issue on GitHub.

---

<div align="center">

**🔮 See your code's future - before it's too late.**

[Try Demo](http://localhost:3000) • [View Code](https://github.com/prajwalun/legacylens) • [Report Bug](https://github.com/prajwalun/legacylens/issues)

</div>
