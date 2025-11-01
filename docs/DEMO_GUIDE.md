# 🔮 LegacyLens Demo Guide

Complete guide for running demos and presentations at hackathons.

---

## 🚀 Quick Start (30 seconds)

```bash
# 1. Start server
npm run dev

# 2. Open test UI
open http://localhost:3000/test-ui

# 3. Click "Messy Codebase" for instant results
# ✅ Done! No API calls needed.
```

---

## 🎯 Demo Scenarios

### Scenario 1: Instant Demo (Recommended)

**Use when:** Time is limited, APIs might be slow, or you want guaranteed results.

**Steps:**
1. Open http://localhost:3000/test-ui
2. Click **"🔴 Messy Codebase (6 issues)"**
3. Results appear instantly (no waiting!)
4. Click **"Download Refactor Roadmap"**
5. Show the generated markdown file

**What to highlight:**
- ✅ 6 issues found (2 critical, 1 high, 1 medium, 2 low)
- ✅ Future Pain Timeline for each issue
- ✅ 1.2 hours saved by using this tool
- ✅ Beautiful markdown roadmap with fixes

**Time:** < 1 minute

---

### Scenario 2: Live Scan (Small Repo)

**Use when:** You want to show the real-time scanning experience.

**Recommended repos:**
- ✅ `https://github.com/chalk/chalk` (20-40s scan)
- ✅ `https://github.com/tj/commander.js` (30-60s scan)

**Steps:**
1. Open http://localhost:3000/test-ui
2. Enter repo URL: `https://github.com/chalk/chalk`
3. Click **"Start Scan"**
4. Watch live logs stream in real-time:
   - 📋 PLAN: Connecting to repository...
   - 🔍 HUNT: Hunting for issues...
   - 🤖 EXPLAIN: Generating timeline predictions...
   - ✍️ WRITE: Compiling refactor roadmap...
5. View results when complete
6. Download roadmap

**What to highlight:**
- ✅ Real-time streaming logs (SSE)
- ✅ Multi-step agent workflow
- ✅ AI-powered explanations
- ✅ Future timeline predictions

**Time:** 1-2 minutes (including scan)

---

### Scenario 3: Full Walkthrough

**Use when:** You have 3-5 minutes and want to show everything.

**Steps:**
1. **Start with problem statement:**
   - "Every codebase accumulates technical debt"
   - "Most devs discover issues too late"
   - "LegacyLens predicts future pain BEFORE it happens"

2. **Show instant demo:**
   - Click "Messy Codebase"
   - Scroll through findings
   - Show timeline: "3 months → 2 years"
   - Highlight severity × effort scoring

3. **Live scan (if time):**
   - Paste small repo URL
   - Start scan
   - Explain while it runs:
     * Uses Greptile to analyze code
     * 13 custom detectors (security, reliability, maintainability)
     * GPT-4 generates explanations & timelines
     * LangGraph orchestrates workflow

4. **Show roadmap:**
   - Download markdown file
   - Open in editor
   - Show structure:
     * Executive summary
     * Issues grouped by severity
     * Each issue has: explanation, fix, timeline
     * Ready to share with team

5. **Value proposition:**
   - "Saves 1+ hours per scan"
   - "Proactive instead of reactive"
   - "See your code's future. Fix it now."

**Time:** 3-5 minutes

---

## 📋 Testing Checklist

Before any demo, verify these work:

### Pre-Demo Checklist
- [ ] Server is running: `npm run dev`
- [ ] Test UI loads: http://localhost:3000/test-ui
- [ ] API health check: http://localhost:3000/api/test
- [ ] "Messy Codebase" demo loads instantly
- [ ] "Clean Codebase" demo loads instantly
- [ ] Roadmap downloads correctly
- [ ] .env.local has API keys (if doing live scans)

### During Demo
- [ ] Have http://localhost:3000/test-ui open in browser
- [ ] Have a text editor open (to show roadmap.md)
- [ ] Close unnecessary tabs/windows
- [ ] Zoom browser to 150% for visibility
- [ ] Test internet connection (if doing live scans)

---

## 🎭 Demo Tips

### Do's ✅
- **Start with instant demo** (guaranteed to work)
- **Use small repos** for live scans (<100 files)
- **Emphasize the timeline** (this is the unique feature!)
- **Show the roadmap file** (tangible deliverable)
- **Highlight AI-powered** explanations
- **Mention the tech stack** (Greptile, GPT-4, LangGraph, Next.js)

### Don'ts ❌
- **Don't use large repos** in live demos (vercel/next.js takes 3-5 min)
- **Don't rely only on live scans** (APIs can be slow/fail)
- **Don't skip the instant demo** (your safety net!)
- **Don't forget to zoom browser** (text might be small)
- **Don't wing the explanation** (practice the pitch)

---

## 🔧 API Endpoints (For Manual Testing)

### Start a scan
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/chalk/chalk"}'

# Response: { "scanId": "abc-123", ... }
```

### Get scan results
```bash
curl http://localhost:3000/api/scan/demo-messy-nodejs | jq
```

### Stream logs (SSE)
```bash
curl -N http://localhost:3000/api/scan/demo-messy-nodejs/stream
```

### Download roadmap
```bash
curl http://localhost:3000/api/roadmap/demo-messy-nodejs -o roadmap.md
```

### Health check
```bash
curl http://localhost:3000/api/test | jq
```

---

## 🐛 Troubleshooting

### Scan hangs or takes too long
- **Solution:** Use smaller repo or click "Load Demo"
- **Cause:** Large repos (>500 files) take 3-5+ minutes

### API key error
- **Solution:** Check `.env.local` has `GREPTILE_API_KEY` and `OPENAI_API_KEY`
- **Cause:** Missing or invalid API keys

### No results showing
- **Solution:** Wait 60-90s for small repos, use demo for instant results
- **Cause:** Scan still in progress

### SSE stream not working
- **Solution:** Check browser console for errors, reload page
- **Cause:** Browser compatibility or network issues

### Demo scans don't load
- **Solution:** Restart server, check `lib/demo/mock-data.ts` exists
- **Cause:** Code not compiled or import error

---

## 📊 Demo Data Details

### Demo: Messy Codebase
- **ID:** `demo-messy-nodejs`
- **Language:** JavaScript/TypeScript (Node.js/Express)
- **Issues:** 6 (2 critical, 1 high, 1 medium, 2 low)
- **Time saved:** 1.2 hours
- **Highlights:**
  - Hardcoded database credentials (critical)
  - SQL injection vulnerability (critical)
  - Missing HTTP timeouts (high)
  - Empty catch blocks (medium)
  - God file (847 lines)
  - TODO clusters

### Demo: Clean Codebase
- **ID:** `demo-clean-python`
- **Language:** Python (Flask)
- **Issues:** 2 (both low - magic numbers)
- **Time saved:** 0.2 hours
- **Highlights:**
  - Well-maintained codebase
  - Only minor maintainability issues
  - Good example of "healthy" code

### Demo: Failed Scan
- **ID:** `demo-failed-scan`
- **Status:** Failed
- **Use case:** Show error handling
- **Error:** "Repository not accessible (404)"

---

## 🎤 Elevator Pitch (30 seconds)

> "LegacyLens is like a crystal ball for your codebase. It scans your GitHub repo, finds security and reliability issues, and shows you exactly how each issue will cause pain in 3 months, 6 months, 1 year, and 2 years. Instead of discovering bugs when they break production, you see the future and fix them now. We use Greptile for code analysis, GPT-4 for timeline predictions, and LangGraph for orchestration. Takes 60 seconds to scan, saves hours of debugging later."

---

## 📝 Key Talking Points

1. **Problem:** Technical debt accumulates, devs discover issues too late
2. **Solution:** Proactive code analysis with future pain predictions
3. **How it works:** 
   - Greptile analyzes codebase structure
   - 13 detectors find issues (security, reliability, maintainability)
   - GPT-4 generates explanations & future timelines
   - LangGraph orchestrates multi-step workflow
4. **Output:** Markdown roadmap prioritized by severity × effort
5. **Value:** See code's future. Fix it now. Save hours later.

---

## 🌟 Unique Features to Emphasize

1. **Future Pain Timeline** (our secret sauce!)
   - Not just "here's a bug"
   - Shows "here's what happens in 3m, 6m, 1y, 2y"
   - Makes technical debt tangible

2. **AI-Powered Explanations**
   - Not generic linter messages
   - Context-aware explanations
   - Realistic future scenarios

3. **Effort × Severity Scoring**
   - Not all critical issues take long
   - Some low-priority issues are easy wins
   - Smart prioritization

4. **Beautiful Roadmap**
   - Markdown format (git-friendly)
   - Ready to share with team
   - Actionable recommendations

---

## 🎯 Success Metrics to Mention

- **Time saved:** 1-2 hours per scan (no manual triage)
- **Issues found:** 5-20+ per repo (varies by size)
- **Scan speed:** 30-90 seconds for small/medium repos
- **Cost efficient:** Uses GPT-4o-mini ($0.05-0.15 per scan)

---

## 🔗 Useful Links

- **Test UI:** http://localhost:3000/test-ui
- **API Health:** http://localhost:3000/api/test
- **GitHub:** https://github.com/prajwalun/legacylens
- **Demo Recording:** [Coming soon]

---

## ✅ Final Pre-Demo Checklist

30 minutes before demo:
- [ ] Pull latest code: `git pull`
- [ ] Install deps: `npm install`
- [ ] Start server: `npm run dev`
- [ ] Test instant demo (click "Messy Codebase")
- [ ] Test live scan with `chalk` repo (optional)
- [ ] Download roadmap to verify format
- [ ] Clear browser cache (if needed)
- [ ] Close distracting tabs/apps
- [ ] Zoom browser to 150%
- [ ] Have elevator pitch memorized
- [ ] Smile and be confident! 😊

---

**Good luck! You've got this! 🚀**

*Questions? Issues? Check the troubleshooting section or load the instant demo as fallback.*

