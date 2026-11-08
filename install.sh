#!/usr/bin/env bash
# Huckleberry one-line installer
# Usage: curl -fsSL https://raw.githubusercontent.com/jairodriguez/huckleberry-cli/main/install.sh | bash
set -euo pipefail

echo ""
echo "  🫐  Huckleberry — your own AI operations department"
echo "  ────────────────────────────────────────────────────"
echo ""

# Check node
if ! command -v node >/dev/null 2>&1; then
  echo "  ✗ Node.js is required (v18+)."
  echo "    Install it first: https://nodejs.org  (or: brew install node)"
  exit 1
fi
NODE_MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  ✗ Node.js v18+ required. You have $(node --version)."
  echo "    Update: https://nodejs.org"
  exit 1
fi
echo "  ✓ Node $(node --version)"

# Install the CLI
echo "  → Installing @jairodri/huckleberry-cli..."
npm install -g @jairodri/huckleberry-cli

# Run full setup
echo ""
huckleberry install

# Install the runtime
echo ""
echo "  → Installing runtime (opencode + kimaki)..."
npm install -g opencode kimaki 2>/dev/null || {
  echo "  ⚠ Runtime install had warnings — run manually: npm install -g opencode kimaki"
}

echo ""
echo "  ╔════════════════════════════════════════════════════════════╗"
echo "  ║                  HUCKLEBERRY IS INSTALLED                  ║"
echo "  ╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  Finish setup (3 steps):"
echo ""
echo "    1. huckleberry interview     — your name, business, tone, keys"
echo "    2. Edit ~/.huckleberry/.env  — add DISCORD_BOT_TOKEN + TYPESAFE_API_KEY"
echo "       (Discord bot walkthrough: ~/.huckleberry/wiki/discord.md)"
echo "    3. huckleberry doctor        — verify everything"
echo ""
echo "  Then start your Chief of Staff:"
echo ""
echo "    opencode"
echo ""
echo "  Docs: https://huckleberry.ai  ·  https://github.com/jairodriguez/huckleberry-cli"
echo ""
