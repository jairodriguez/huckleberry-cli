#!/bin/bash
# youtube-summarize.sh - Summarize YouTube videos using Gemini API
# Usage: youtube-summarize.sh <youtube_url> [options]

set -e

# Configuration
API_KEY="${GEMINI_API_KEY:-${GOOGLE_API_KEY:-}}"
MODEL="gemini-3-flash-preview"
API_BASE="https://generativelanguage.googleapis.com/v1beta/models"

# Default settings
MODE="summary"
JSON_OUTPUT=false
CUSTOM_PROMPT=""

# Parse arguments
URL=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)
      MODE="$2"
      shift 2
      ;;
    --prompt)
      CUSTOM_PROMPT="$2"
      shift 2
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    -*|--*)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 <youtube_url> [--mode summary|ideas|transcript|key_points] [--prompt 'custom text'] [--json]" >&2
      exit 1
      ;;
    *)
      URL="$1"
      shift
      ;;
  esac
done

# Validate
if [[ -z "$URL" ]]; then
  echo "Error: YouTube URL is required" >&2
  echo "Usage: $0 <youtube_url> [options]" >&2
  exit 1
fi

if [[ -z "$API_KEY" ]]; then
  echo "Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required" >&2
  exit 1
fi

# Normalize URL to full YouTube URL
if [[ "$URL" == "https://youtu.be/"* ]]; then
  VIDEO_ID="${URL#https://youtu.be/}"
  FULL_URL="https://www.youtube.com/watch?v=${VIDEO_ID%%\?*}"
elif [[ "$URL" == "https://www.youtube.com/shorts/"* ]]; then
  VIDEO_ID="${URL#https://www.youtube.com/shorts/}"
  FULL_URL="https://www.youtube.com/watch?v=${VIDEO_ID%%\?*}"
else
  FULL_URL="$URL"
fi

# Build prompt based on mode
case "$MODE" in
  summary)
    PROMPT="${CUSTOM_PROMPT:-Provide a concise summary of this YouTube video in 3-5 sentences. Include the main topic, key insights, and any actionable takeaways.}"
    ;;
  ideas)
    PROMPT="${CUSTOM_PROMPT:-Extract 5-10 content ideas from this video that could be turned into blog posts, social media threads, or newsletter content. For each idea, include a title and a brief description.}"
    ;;
  transcript)
    PROMPT="${CUSTOM_PROMPT:-Provide a full transcript of this video with timestamps. Format as: [MM:SS] text}"
    ;;
  key_points)
    PROMPT="${CUSTOM_PROMPT:-Extract the 5-7 most important key points from this video as a numbered list. Each point should be 1-2 sentences.}"
    ;;
  custom)
    PROMPT="${CUSTOM_PROMPT:-Analyze this video}"
    ;;
  *)
    PROMPT="${CUSTOM_PROMPT:-Summarize this video}"
    ;;
esac

# Build request JSON
REQUEST_BODY=$(cat <<EOF
{
  "contents": [{
    "parts": [
      {"text": "${PROMPT}"},
      {"fileData": {"fileUri": "${FULL_URL}"}}
    ]
  }],
  "generationConfig": {
    "maxOutputTokens": 8192,
    "temperature": 0.4
  }
}
EOF
)

# Make API call
URL_ENCODED=$(echo "$FULL_URL" | sed 's/&/\&/g')
RESPONSE=$(curl -s -X POST "${API_BASE}/${MODEL}:generateContent" \
  -H "x-goog-api-key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY" 2>&1) || {
  echo "Error: Failed to connect to Gemini API" >&2
  exit 1
}

# Check for API errors
if echo "$RESPONSE" | grep -q '"error":'; then
  ERROR=$(echo "$RESPONSE" | grep -o '"message": "[^"]*"' | head -1 | cut -d'"' -f4)
  echo "API Error: ${ERROR:-$RESPONSE}" >&2
  exit 1
fi

# Extract content from response
SUMMARY=$(echo "$RESPONSE" | sed -n 's/.*"text": "\([^"]*\)".*/\1/p; s/\\n/\n/g' | head -1)

# If extraction failed, try jq or alternative parsing
if [[ -z "$SUMMARY" ]] && command -v jq >/dev/null 2>&1; then
  SUMMARY=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text' 2>/dev/null)
fi

# Output
if [[ "$JSON_OUTPUT" == true ]]; then
  echo "$RESPONSE"
else
  if [[ -n "$SUMMARY" ]]; then
    printf '%b\n' "$SUMMARY"
  else
    # Fallback: output raw response if parsing failed
    echo "Note: Summary extraction failed, showing raw response:"
    echo "$RESPONSE"
  fi
fi
