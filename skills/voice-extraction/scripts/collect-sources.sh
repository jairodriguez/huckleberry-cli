#!/usr/bin/env bash
set -euo pipefail

# collect-sources.sh — Gather writing samples from multiple source types
# Usage: ./collect-sources.sh [OPTIONS]
# Outputs combined corpus to stdout

NLM_BIN="${NLM_BIN:-$HOME/.local/bin/nlm}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/voice-corpus}"
mkdir -p "$OUTPUT_DIR"

usage() {
  cat <<EOF
Usage: collect-sources.sh [OPTIONS]

Gathers writing samples into a corpus for voice DNA extraction.

Source options (can combine multiple):
  --files <glob>         Recursively collect .md/.txt files matching glob
  --nlm <notebook-id>    Query NLM notebook for representative passages
  --nlm-source <id>      Get raw content from a specific NLM source
  --url <url>            Fetch web page content
  --text <"raw text">    Include raw text directly
  --birdclaw <handle>    Pull original tweets from birdclaw DB
  --stdin                Read from stdin

Output options:
  --output <path>        Write corpus to file (default: stdout)
  --max-words <n>        Cap total corpus at N words (default: 50000)

Examples:
  # From local journal files
  collect-sources.sh --files "~/journals/*.md"

  # From NLM notebook
  collect-sources.sh --nlm "ab4bc5fe-50c7-4dfc-9763-5d4a674c264b"

  # Mixed sources
  collect-sources.sh --files "~/writing/*.md" --url "https://example.com/article" --text "Additional sample"

EOF
}

# Parse args
declare -a SOURCES
MAX_WORDS=50000
OUTPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --files)
      shift
      GLOB="$1"
      while IFS= read -r -d '' file; do
        echo "[source: file:$file]" >> "$OUTPUT_DIR/raw_input.txt"
        cat "$file" >> "$OUTPUT_DIR/raw_input.txt"
        echo -e "\n\n" >> "$OUTPUT_DIR/raw_input.txt"
      done < <(find ~ -maxdepth 5 -name "$GLOB" -not -path "*/node_modules/*" -not -path "*/.git/*" -print0 2>/dev/null || true)
      shift
      ;;
    --nlm)
      shift
      NOTEBOOK_ID="$1"
      export PATH="$HOME/.local/bin:$PATH"
      # Query NLM for representative journal entries
      "$NLM_BIN" query notebook "$NOTEBOOK_ID" "Give me the 20 most representative passages from the sources that show the author's unique writing voice. Include full paragraphs, not summaries. Focus on passages where the author expresses opinions, tells stories, or uses distinctive language." --timeout 120 > "$OUTPUT_DIR/nlm_output.txt" 2>&1 || true
      echo "[source: nlm-notebook:$NOTEBOOK_ID]" >> "$OUTPUT_DIR/raw_input.txt"
      cat "$OUTPUT_DIR/nlm_output.txt" >> "$OUTPUT_DIR/raw_input.txt"
      echo -e "\n\n" >> "$OUTPUT_DIR/raw_input.txt"
      shift
      ;;
    --nlm-source)
      shift
      SOURCE_ID="$1"
      export PATH="$HOME/.local/bin:$PATH"
      "$NLM_BIN" content "$SOURCE_ID" > "$OUTPUT_DIR/nlm_source_$SOURCE_ID.txt" 2>&1 || true
      echo "[source: nlm-source:$SOURCE_ID]" >> "$OUTPUT_DIR/raw_input.txt"
      cat "$OUTPUT_DIR/nlm_source_$SOURCE_ID.txt" >> "$OUTPUT_DIR/raw_input.txt"
      echo -e "\n\n" >> "$OUTPUT_DIR/raw_input.txt"
      shift
      ;;
    --url)
      shift
      URL="$1"
      # Use curl to fetch, strip HTML tags
      curl -sL "$URL" | sed 's/<[^>]*>//g' | sed '/^$/d' > "$OUTPUT_DIR/url_$(echo "$URL" | md5sum | cut -c1-8).txt" 2>/dev/null || true
      echo "[source: url:$URL]" >> "$OUTPUT_DIR/raw_input.txt"
      cat "$OUTPUT_DIR/url_"*.txt >> "$OUTPUT_DIR/raw_input.txt" 2>/dev/null || true
      echo -e "\n\n" >> "$OUTPUT_DIR/raw_input.txt"
      shift
      ;;
    --text)
      shift
      echo "[source: raw-text]" >> "$OUTPUT_DIR/raw_input.txt"
      echo "$1" >> "$OUTPUT_DIR/raw_input.txt"
      echo -e "\n\n" >> "$OUTPUT_DIR/raw_input.txt"
      shift
      ;;
    --birdclaw)
      shift
      HANDLE="$1"
      DB_PATH="${BIRDCLAW_DB:-$HOME/clawd/workspace/birdclaw/data/birdclaw.db}"
      python3 -c "
import sqlite3, sys
try:
    db = sqlite3.connect('$DB_PATH')
    rows = db.execute('''
        SELECT text FROM tweets
        WHERE text NOT LIKE 'RT @%'
        AND text NOT LIKE '@%'
        AND length(text) > 50
        ORDER BY random()
        LIMIT 100
    ''').fetchall()
    for r in rows:
        print(r[0])
        print('---')
except Exception as e:
    print(f'birdclaw error: {e}', file=sys.stderr)
" >> "$OUTPUT_DIR/raw_input.txt" 2>&1 || echo "[birdclaw: unavailable]" >> "$OUTPUT_DIR/raw_input.txt"
      echo -e "\n\n" >> "$OUTPUT_DIR/raw_input.txt"
      shift
      ;;
    --stdin)
      echo "[source: stdin]" >> "$OUTPUT_DIR/raw_input.txt"
      cat >> "$OUTPUT_DIR/raw_input.txt"
      echo -e "\n\n" >> "$OUTPUT_DIR/raw_input.txt"
      ;;
    --max-words)
      shift
      MAX_WORDS="$1"
      shift
      ;;
    --output)
      shift
      OUTPUT="$1"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

# If no raw_input collected, show usage
if [[ ! -f "$OUTPUT_DIR/raw_input.txt" ]]; then
  echo "No sources provided." >&2
  usage
  exit 1
fi

# Output
if [[ -n "$OUTPUT" ]]; then
  cp "$OUTPUT_DIR/raw_input.txt" "$OUTPUT"
  WC=$(wc -w < "$OUTPUT")
  echo "Corpus: $WC words → $OUTPUT" >&2
else
  cat "$OUTPUT_DIR/raw_input.txt"
fi

# Cleanup
rm -f "$OUTPUT_DIR/raw_input.txt" "$OUTPUT_DIR/nlm_output.txt" "$OUTPUT_DIR/nlm_source_"*.txt "$OUTPUT_DIR/url_"*.txt 2>/dev/null || true
