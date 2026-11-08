#!/bin/bash
set -e

QUERY=""
TIME="24h"
ANALYZE=false
MAX_RESULTS=20

# Auth tokens from TOOLS.md
AUTH_TOKEN="16dfd5eaf636980f73c0dfd602df8fea26e63feb"
CT0="a3b15922b77da31a57fd003b3bc7e769c2617235113ea68327d336244473c5aad91e0519bba46817e37f1c8f4ab87ad8269d82859533da53da252b7fb7d3872f8fe0cb755b0f0507cb1f5ccca936189d"

usage() {
    echo "Usage: x-research --query <query> [--time 1h|24h|today|7d|30d] [--analyze]"
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --query)
            QUERY="$2"
            shift 2
            ;;
        --time)
            TIME="$2"
            shift 2
            ;;
        --analyze)
            ANALYZE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [[ -z "$QUERY" ]]; then
    echo "Error: --query is required"
    usage
fi

echo "🔍 Searching X for: $QUERY"
echo "⏱️  Time filter: $TIME"
echo ""

# Run bird search
bird search "$QUERY" -n $MAX_RESULTS --auth-token "$AUTH_TOKEN" --ct0 "$CT0" 2>&1 | awk '
BEGIN { topic=1; first=1 }
/^@[a-zA-Z0-9_]+ \(/ {
    if (!first) print ""
    first=0
    
    # Parse user and name
    user=$1
    name=$0
    sub(/^@[a-zA-Z0-9_]+ \(/, "", name)
    sub(/\):.*$/, "", name)
    
    # Get the tweet text (everything after the first closing paren and colon)
    tweet=""
    for (i=2; i<=NF; i++) {
        if ($i ~ /\):$/) {
            tweet_start=i+1
            break
        }
    }
    for (i=tweet_start; i<=NF; i++) {
        tweet=tweet " " $i
    }
    
    # Print formatted output
    print "• " user ":" tweet
    next
}
/^🔗/ {
    sub(/^🔗 /, "→ ", $0)
    print $0
    print ""
    next
}
/^📅/ { next }
/^[─═]/ { next }
{ next }'
