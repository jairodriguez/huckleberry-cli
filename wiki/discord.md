# Discord Bot Setup & Configuration

## Overview
The Huckleberry system uses a Discord bot (via kimaki) to interact with the user. The bot is created through Discord Developer Portal and added to servers via OAuth2 URL.

## Bot Setup (One-Time)
1. Go to https://discord.com/developers/applications
2. Create New Application → name it
3. Go to Bot section → Reset Token → copy token
4. Enable Privileged Gateway Intents:
   - Message Content Intent: ON
   - Server Members Intent: ON (for user lookups)
5. Go to OAuth2 → URL Generator:
   - Scopes: `bot` `applications.commands`
   - Bot Permissions: `Administrator` (or specific: Read/Send Messages, Manage Messages, Manage Threads, Attach Files, Read Message History, Mention Everyone)
6. Open generated URL → select server → Authorize

## Configuration
- Bot token goes in `~/.huckleberry/.env` as `DISCORD_BOT_TOKEN=...`
- Channel IDs are configured in `business-channels.json` or taskmaster

## Channel Structure
| Channel | Purpose |
|---------|---------|
| `#cos` or main channel | COS reports and user interaction |
| Spawned threads | Worker agent sessions (auto-created) |

## Adding to Existing Server
1. Bot must have 'Manage Server' permission to create channels
2. Bot must have 'Create Invite' to generate invite links
3. Bot joins via OAuth2 URL regeneration

## Common Issues

### Bot Not Online
- Token invalid: regenerate in Discord Developer Portal
- Token not set in .env: check `~/.huckleberry/.env`
- Restart kimaki after token change

### Bot Can't See Messages
- Missing Message Content Intent in Developer Portal
- Bot lacks Read Messages permission in channel
- Bot is rate-limited: wait 5 minutes

### Can't Create Threads
- Bot lacks Manage Threads permission
- Channel permissions override bot permissions
- Server boosts required for certain thread features

## Verification
After setup: `kimaki send --channel <channel-id> --prompt 'hello' --agent build`
Should respond in thread within a few seconds.
