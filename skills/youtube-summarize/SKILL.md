---
slash_command: false
name: youtube-summarize
description: Summarize YouTube videos using Google Gemini API with direct URL input. Extract key insights, transcripts, and content ideas from YouTube videos. Use when needing to analyze YouTube content for content creation, research, or information extraction.
---

# YouTube Summarize Skill
Summarize YouTube videos using Google's Gemini API with direct YouTube URL input. This skill extracts video content insights without needing transcript downloads.

## How It Works
The Gemini API accepts YouTube URLs directly in the `fileData.fileUri` field. Gemini fetches and processes the video content, including visual understanding and audio transcription.

## Prerequisites
- `GEMINI_API_KEY` environment variable set with your Google AI Studio API key

## Usage
```bash

# Basic summary
./scripts/youtube-summarize.sh "https://youtu.be/VIDEO_ID"

# Extract content ideas
./scripts/youtube-summarize.sh "https://www.youtube.com/watch?v=VIDEO_ID" --mode ideas

# Full transcript with timestamps
./scripts/youtube-summarize.sh "https://youtu.be/VIDEO_ID" --mode transcript

# Custom prompt
./scripts/youtube-summarize.sh "https://youtu.be/VIDEO_ID" --prompt "What are the key points about X?"

# JSON output
./scripts/youtube-summarize.sh "https://youtu.be/VIDEO_ID" --json
```

## Output Modes
- `summary`: Concise overview (default)
- `ideas`: Content ideas and angles
- `transcript`: Full transcript with timestamps
- `key_points`: Numbered key takeaways
- `custom`: Use with --prompt for custom analysis

# Extract ideas for your content
./scripts/youtube-summarize.sh "https://youtu.be/..." --mode ideas --json > ideas.json

# Batch process multiple videos
for url in urls.txt; do
 ./scripts/youtube-summarize.sh "$url" --mode key_points
done

# Get transcript for analysis
./scripts/youtube-summarize.sh "https://youtu.be/..." --mode transcript > transcript.md

## Limitations
- Videos must be publicly accessible
- Some videos (music, restricted) may not work
- For blocked videos, use direct download + transcription instead

## Agent-Reach Alternative (Free Transcripts)

**Agent-Reach** (skill: `agent-reach`) provides free YouTube transcripts via yt-dlp:
```bash
agent-reach doctor --json  # Check if YouTube backend is available

# Download transcripts (no API key needed)
yt-dlp --write-sub --write-auto-sub --sub-lang "zh-Hans,zh,en" --skip-download -o "/tmp/%(id)s" "URL"
cat /tmp/VIDEO_ID.*.vtt

# Or use Agent-Reach transcribe for Whisper fallback
agent-reach configure groq-key YOUR_KEY  # Free at console.groq.com
agent-reach transcribe "https://www.youtube.com/watch?v=VIDEO_ID"
```

**Use Agent-Reach for**: Free transcripts without API key, batch processing, when Gemini API fails.
**Use youtube-summarize for**: Gemini-powered analysis, visual understanding, custom prompts.

## Technical Reference
API endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`

Request body includes:
```json
{
 "contents": [{
 "parts": [
 {"text": "Summarize this video"},
 {"fileData": {"fileUri": "https://www.youtube.com/watch?v=..."}}
 ]
 }]
}

See `/scripts/youtube-summarize.sh` for implementation details.
