# LegacyLens 🔮

AI-powered code analysis tool that scans GitHub repositories and generates a "Future Pain Timeline" showing how code issues will worsen over time.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Agent Framework:** LangGraph (multi-step agent workflow)
- **APIs:**
  - Greptile API (codebase analysis)
  - OpenAI GPT-4 (generating explanations)
  - GitHub API (repository metadata)
- **Streaming:** Server-Sent Events (SSE) for real-time updates

## Project Structure

```
/app
  /api
    /scan
      route.ts              # POST endpoint to start scan
    /scan/[id]
      route.ts              # GET endpoint for scan status/results
    /scan/[id]/stream
      route.ts              # SSE endpoint for live updates
    /roadmap/[id]
      route.ts              # GET endpoint to download roadmap.md
/lib
  /agent
    graph.ts                # LangGraph agent definition
    nodes.ts                # Agent nodes (plan, hunt, explain, write)
    state.ts                # Agent state type definitions
  /detectors
    security.ts             # Security issue detectors
    reliability.ts          # Reliability issue detectors
    maintainability.ts      # Maintainability issue detectors
    index.ts                # Detector registry
  /tools
    greptile.ts             # Greptile API client
    github.ts               # GitHub API client
    llm.ts                  # OpenAI client wrapper
  /utils
    timeline.ts             # Timeline prediction generator
    scoring.ts              # Severity and ETA calculation
    roadmap.ts              # Markdown roadmap generator
/types
  index.ts                  # TypeScript interfaces
/data
  scans.json                # Temporary storage (file-based)
  /cache                    # Greptile response cache
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local` and add your API keys:
   - `GREPTILE_API_KEY` - Get from https://app.greptile.com
   - `OPENAI_API_KEY` - Get from https://platform.openai.com
   - `GITHUB_TOKEN` - Optional, for private repos

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000**

## Development Progress

- [x] Phase 1: Project Setup & Core Types
- [ ] Phase 2: Greptile Client
- [ ] Phase 3: Detectors
- [ ] Phase 4: LLM & Utilities
- [ ] Phase 5: LangGraph Agent
- [ ] Phase 6: API Routes
- [ ] Phase 7: Testing & Demo Data

## How It Works

1. User submits a GitHub repository URL
2. LangGraph agent orchestrates a multi-step analysis:
   - **Plan:** Index repo with Greptile, detect languages/frameworks
   - **Hunt:** Run security, reliability, and maintainability detectors
   - **Explain:** Use GPT-4 to generate timeline predictions for each issue
   - **Write:** Generate downloadable refactor roadmap
3. Results stream in real-time via SSE
4. Frontend displays "Future Pain Timeline" visualization

## Test Repositories

- https://github.com/vercel/next.js (large, well-maintained)
- https://github.com/facebook/react (very large)

## License

MIT
