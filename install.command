#!/bin/bash
cd "$(dirname "$0")"
clear

echo ""
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║      Huckleberry AI System — One-Click Install           ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo ""

if ! command -v node &>/dev/null; then
  echo "  Installing Node.js..."
  if ! command -v brew &>/dev/null; then
    echo "  Installing Homebrew first..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" 2>/dev/null
    if [[ "$(uname -m)" == "arm64" ]]; then eval "$(/opt/homebrew/bin/brew shellenv)"; else eval "$(/usr/local/bin/brew shellenv)"; fi
  fi
  brew install node 2>/dev/null
  echo "  Node.js installed"
else
  echo "  Node.js: $(node --version)"
fi

echo ""
echo "  Installing Huckleberry..."
npm install -g @jairodri/huckleberry-cli 2>/dev/null

if command -v huckleberry &>/dev/null; then
  huckleberry install
  echo ""
  huckleberry interview
  echo ""
  echo "  ✓ Huckleberry is ready!"
  echo ""
  echo "  Next: opencode"
  echo "  Next: npm install -g kimaki"
else
  echo "  Install failed."
fi

echo ""
echo "  Press Enter to close..."
read -r
