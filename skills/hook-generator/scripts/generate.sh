#!/bin/bash
# Unified Hook Generator - Shell Wrapper
# Usage: ./generate.sh --content "Your content" --platform twitter --audience "audience" --count 3

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JS_SCRIPT="$SCRIPT_DIR/generate-hooks-unified.js"

# Parse args
CONTENT=""
PLATFORM=""
BRAND=""
COUNT=3

while [[ $# -gt 0 ]]; do
  case $1 in
    --content) CONTENT="$2"; shift 2;;
    --platform) PLATFORM="$2"; shift 2;;
    --audience) BRAND="$2"; shift 2;;
    --count) COUNT="$2"; shift 2;;
    --brand) BRAND="$2"; shift 2;;
    *) shift;;
  esac
done

if [[ -z "$CONTENT" || -z "$PLATFORM" ]]; then
  echo "Usage: $0 --content \"content\" --platform twitter --brand \"brand\" [--count 3]"
  echo "Example: $0 --content \"Building AI agents\" --platform twitter --brand myapp --count 3"
  exit 1
fi

# Default brand if not provided
BRAND="${BRAND:-default}"

node "$JS_SCRIPT" --content "$CONTENT" --platform "$PLATFORM" --brand "$BRAND" --count "$COUNT"
