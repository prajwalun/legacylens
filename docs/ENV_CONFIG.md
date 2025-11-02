# Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```bash
# ===== API Keys (Required) =====

# Greptile API Key (get from https://app.greptile.com)
GREPTILE_API_KEY=your_greptile_api_key_here

# OpenAI API Key (for GPT-4o-mini explanations)
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Personal Access Token (optional, increases rate limits)
# Generate at: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here


# ===== Detection Engine Configuration =====

# Choose detection method:
# - "false" = GitHub API + Regex (fast, free, 15-20 seconds)
# - "true" = Greptile AI-powered (accurate, paid, 60-90 seconds)
# - "hybrid" = Quick scan first, deep AI scan if critical issues found
USE_GREPTILE=false

# Alternative: Use hybrid mode for best of both worlds
# USE_GREPTILE=hybrid


# ===== Feature Flags =====

# Enable demo mode with mock data (for testing without API calls)
ENABLE_DEMO_MODE=true

# Enable debug logging
DEBUG=false


# ===== Performance Tuning =====

# Maximum files to scan with GitHub API (default: 100)
MAX_FILES_TO_SCAN=100

# Greptile indexing timeout in milliseconds (default: 300000 = 5 minutes)
GREPTILE_INDEX_TIMEOUT=300000
```

## Detection Method Comparison

| Feature | GitHub API (`false`) | Greptile AI (`true`) | Hybrid |
|---------|---------------------|---------------------|--------|
| **Speed** | 15-20 seconds ⚡ | 60-90 seconds 🐌 | 20-90 seconds ⚖️ |
| **Cost** | Free 💰 | ~$0.50/scan 💸 | Variable 💵 |
| **Accuracy** | 85% (patterns) | 95% (semantic) | 90% (best of both) |
| **Use Case** | Demos, free tier | Production, enterprise | Recommended |

## Quick Start

1. **For Hackathon/Demo:**
   ```bash
   GREPTILE_API_KEY=your_key
   OPENAI_API_KEY=your_key
   USE_GREPTILE=false
   ```

2. **For Production:**
   ```bash
   GREPTILE_API_KEY=your_key
   OPENAI_API_KEY=your_key
   GITHUB_TOKEN=your_token
   USE_GREPTILE=hybrid
   ```

3. **For Best Results:**
   ```bash
   GREPTILE_API_KEY=your_key
   OPENAI_API_KEY=your_key
   GITHUB_TOKEN=your_token
   USE_GREPTILE=true
   ```

## Notes

1. Never commit `.env.local` to version control (already in `.gitignore`)
2. `GITHUB_TOKEN` is optional but recommended to avoid rate limits
3. Hybrid mode is recommended for production (fast + accurate)
4. Greptile AI takes longer but finds issues regex patterns might miss

