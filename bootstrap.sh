#!/bin/bash
# Huckleberry Bootstrap — One-line install for a fresh Mac
# Usage: curl -fsSL https://huckleberry.ai/install.sh | bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "  ${GREEN}[..]${NC} $1"; }
ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
fail() { echo -e "  ${RED}[!!]${NC} $1"; }

echo ""
echo -e "  ${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "  ${CYAN}║           HUCKLEBERRY AI SYSTEM BOOTSTRAP              ║${NC}"
echo -e "  ${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Detect platform ──────────────────────────────────────────────────
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)   PLATFORM="macOS" ;;
  Linux)    PLATFORM="Linux" ;;
  MINGW*|MSYS*) PLATFORM="Windows" ;;
  *)        fail "Unsupported OS: $OS"; exit 1 ;;
esac
log "Platform: $PLATFORM ($ARCH)"

# ── Check/install Node.js ────────────────────────────────────────────
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  log "Node.js $NODE_VER already installed"
else
  log "Node.js not found — installing..."
  case "$PLATFORM" in
    macOS)
      if ! command -v brew &>/dev/null; then
        log "Installing Homebrew..."
        NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" 2>/dev/null
        # Add brew to PATH for this session
        if [[ "$ARCH" == "arm64" ]]; then
          eval "$(/opt/homebrew/bin/brew shellenv)"
        else
          eval "$(/usr/local/bin/brew shellenv)"
        fi
      fi
      brew install node@20 2>/dev/null
      brew link --overwrite node@20 2>/dev/null
      ;;
    Linux)
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
      apt-get install -y nodejs 2>/dev/null
      ;;
  esac

  if command -v node &>/dev/null; then
    ok "Node.js $(node --version) installed"
  else
    fail "Node.js install failed. Install manually from https://nodejs.org"
    exit 1
  fi
fi

# ── Install Huckleberry CLI ──────────────────────────────────────────
log "Installing Huckleberry CLI..."
npm install -g @jairodri/huckleberry-cli 2>/dev/null

if command -v huckleberry &>/dev/null; then
  ok "Huckleberry CLI $(huckleberry --version 2>&1) installed"
else
  fail "Huckleberry install failed. Try: npm install -g @jairodri/huckleberry-cli"
  exit 1
fi

# ── Run Huckleberry install ──────────────────────────────────────────
echo ""
log "Running system setup..."
huckleberry install 2>&1

# ── Run interview ────────────────────────────────────────────────────
echo ""
echo -e "  ${CYAN}System installed. Now let's set up your profile.${NC}"
echo ""
huckleberry interview 2>&1

# ── Done ─────────────────────────────────────────────────────────────
echo ""
ok "Huckleberry is ready!"
echo ""
echo "  Next steps:"
echo "    1. npm install -g opencode"
echo "    2. npm install -g kimaki"
echo "    3. Start: opencode"
echo ""
