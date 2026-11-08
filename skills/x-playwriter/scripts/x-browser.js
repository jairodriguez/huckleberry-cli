#!/usr/bin/env node

const path = require('path');

const USAGE = `
X Browser - Playwriter automation for X/Twitter

Usage:
  node x-browser.js <command> [options]

Commands:
  feed [limit]         Extract tweets from Home feed (default: 20)
  profile <handle>    Extract tweets from a profile
  hashtag <tag>       Extract tweets from a hashtag
  tweet <id>          Extract a single tweet and replies
  search <query>      Search X and extract results
  trends              Get trending topics from sidebar

Examples:
  node x-browser.js feed 50
  node x-browser.js profile elonmusk
  node x-browser.js hashtag ai
  node x-browser.js tweet 1234567890
  node x-browser.js search "opencode ai"
  node x-browser.js trends
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === '--help') {
    console.log(USAGE);
    process.exit(1);
  }

  const { exec } = require('child_process');
  
  let script = '';
  
  switch (command) {
    case 'feed': {
      const limit = args[1] || 20;
      script = `
await page.goto('https://x.com/home', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const tweets = await page.locator('[data-testid="tweet"]').all();
const results = await Promise.all(tweets.slice(0, ${limit}).map(async t => {
  const text = await t.locator('[data-testid="tweetText"]').textContent().catch(() => '');
  const author = await t.locator('[data-testid="User-Name"]').textContent().catch(() => '');
  const metrics = await t.locator('[role="group"]').textContent().catch(() => '');
  const link = await t.locator('a[href*="/status/"]').first().getAttribute('href').catch(() => '');
  return { text: text?.slice(0, 300), author: author?.slice(0, 100), metrics: metrics?.slice(0, 50), id: link?.match(/\\/status\\/(\\d+)/)?.[1] };
}));
console.log(JSON.stringify(results, null, 2));
`;
      break;
    }
    
    case 'profile': {
      const handle = args[1];
      if (!handle) {
        console.error('Error: Handle required. Usage: x-browser.js profile <handle>');
        process.exit(1);
      }
      script = `
await page.goto('https://x.com/${handle}', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const tweets = await page.locator('[data-testid="tweet"]').all();
const results = await Promise.all(tweets.slice(0, 20).map(async t => {
  const text = await t.locator('[data-testid="tweetText"]').textContent().catch(() => '');
  const metrics = await t.locator('[role="group"]').textContent().catch(() => '');
  const link = await t.locator('a[href*="/status/"]').first().getAttribute('href').catch(() => '');
  return { text: text?.slice(0, 300), metrics: metrics?.slice(0, 50), id: link?.match(/\\/status\\/(\\d+)/)?.[1] };
}));
console.log(JSON.stringify(results, null, 2));
`;
      break;
    }
    
    case 'hashtag': {
      const tag = args[1];
      if (!tag) {
        console.error('Error: Hashtag required. Usage: x-browser.js hashtag <tag>');
        process.exit(1);
      }
      script = `
await page.goto('https://x.com/hashtag/${tag}', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
for (let i = 0; i < 3; i++) { await page.evaluate(() => window.scrollBy(0, 800)); await page.waitForTimeout(1500); }
const tweets = await page.locator('[data-testid="tweet"]').all();
const results = await Promise.all(tweets.slice(0, 30).map(async t => {
  const text = await t.locator('[data-testid="tweetText"]').textContent().catch(() => '');
  const author = await t.locator('[data-testid="User-Name"]').textContent().catch(() => '');
  return { text: text?.slice(0, 300), author: author?.slice(0, 100) };
}));
console.log(JSON.stringify(results, null, 2));
`;
      break;
    }
    
    case 'tweet': {
      const id = args[1];
      if (!id) {
        console.error('Error: Tweet ID required. Usage: x-browser.js tweet <id>');
        process.exit(1);
      }
      script = `
const tweetUrl = 'https://x.com/i/status/${id}';
await page.goto(tweetUrl, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const mainTweet = await page.locator('[data-testid="tweet"]').first();
const text = await mainTweet.locator('[data-testid="tweetText"]').textContent().catch(() => '');
const author = await mainTweet.locator('[data-testid="User-Name"]').textContent().catch(() => '');
const metrics = await mainTweet.locator('[role="group"]').textContent().catch(() => '');
const replies = await page.locator('[data-testid="cell"]').all();
const replyTexts = await Promise.all(replies.slice(0, 10).map(r => r.locator('[data-testid="tweetText"]').textContent().catch(() => '')));
console.log(JSON.stringify({ main: { text, author, metrics }, replies: replyTexts }, null, 2));
`;
      break;
    }
    
    case 'search': {
      const query = args[1];
      if (!query) {
        console.error('Error: Query required. Usage: x-browser.js search <query>');
        process.exit(1);
      }
      script = `
await page.goto('https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const tweets = await page.locator('[data-testid="tweet"]').all();
const results = await Promise.all(tweets.slice(0, 20).map(async t => {
  const text = await t.locator('[data-testid="tweetText"]').textContent().catch(() => '');
  const author = await t.locator('[data-testid="User-Name"]').textContent().catch(() => '');
  return { text: text?.slice(0, 300), author: author?.slice(0, 100) };
}));
console.log(JSON.stringify(results, null, 2));
`;
      break;
    }
    
    case 'trends': {
      script = `
await page.goto('https://x.com/home', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
const trends = await page.locator('[data-testid="trend"]').allTextContents();
console.log(JSON.stringify(trends.slice(0, 10), null, 2));
`;
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.log(USAGE);
      process.exit(1);
  }

  // Get session or create new one
  const { execSync } = require('child_process');
  let sessionId = '1';
  
  try {
    const listOutput = execSync('npx playwriter@latest session list 2>&1', { encoding: 'utf8' });
    if (listOutput.includes('No active sessions')) {
      const newOutput = execSync('npx playwriter@latest session new 2>&1', { encoding: 'utf8' });
      sessionId = newOutput.trim();
    }
  } catch (e) {
    const newOutput = execSync('npx playwriter@latest session new 2>&1', { encoding: 'utf8' });
    sessionId = newOutput.trim();
  }

  const cmd = `npx playwriter@latest -s ${sessionId} -e "${script.replace(/"/g, '\\"')}" --timeout 60000`;
  exec(cmd, { shell: true }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
    if (stderr) console.error('Stderr:', stderr);
    console.log(stdout);
  });
}

main();
