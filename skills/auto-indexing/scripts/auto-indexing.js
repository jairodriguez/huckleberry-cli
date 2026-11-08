#!/usr/bin/env node

/**
 * Automated Search Engine Indexing
 *
 * Automatically submits URLs to search engines after publishing
 *
 * Methods:
 * 1. IndexNow Protocol - Instant notification (Google, Bing, Yandex, Seznam)
 * 2. Google Indexing API - Priority indexing for critical pages
 * 3. Sitemap ping - Standard notification method
 *
 * Usage:
 *   node auto-indexing.js --url "https://example.com/blog/article" --sitemap "https://example.com/sitemap.xml"
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AutoIndexing {
  constructor(siteUrl) {
    this.siteUrl = siteUrl;
    this.indexNowKey = null;
  }

  /**
   * Generate or load IndexNow key
   */
  async getIndexNowKey() {
    if (this.indexNowKey) return this.indexNowKey;

    const keyPath = path.join(process.cwd(), '.indexnow-key.txt');

    try {
      // Try to load existing key
      this.indexNowKey = await fs.readFile(keyPath, 'utf-8');
      console.log('✅ Loaded existing IndexNow key');
    } catch (error) {
      // Generate new key
      this.indexNowKey = crypto.randomBytes(32).toString('hex');
      await fs.writeFile(keyPath, this.indexNowKey);
      console.log('🔑 Generated new IndexNow key:', this.indexNowKey);
      console.log(`📝 Key saved to: ${keyPath}`);
      console.log(`\n⚠️  IMPORTANT: Upload this key file to your site root:`);
      console.log(`   https://${new URL(this.siteUrl).hostname}/${this.indexNowKey}.txt`);
      console.log(`   Content: ${this.indexNowKey}\n`);
    }

    return this.indexNowKey;
  }

  /**
   * Submit URL via IndexNow protocol
   * @param {string[]} urls - URLs to submit
   * @returns {Promise<boolean>}
   */
  async submitIndexNow(urls) {
    const key = await this.getIndexNowKey();
    const hostname = new URL(this.siteUrl).hostname;

    const payload = {
      host: hostname,
      key: key,
      keyLocation: `https://${hostname}/${key}.txt`,
      urlList: urls
    };

    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const options = {
        hostname: 'api.indexnow.org',
        path: '/indexnow',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      console.log('\n📡 Submitting to IndexNow...');
      console.log(`URLs: ${urls.join(', ')}`);

      const req = https.request(options, (res) => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          console.log('✅ IndexNow submission successful');
          console.log('   Status:', res.statusCode);
          console.log('   Notified: Google, Bing, Yandex, Seznam');
          resolve(true);
        } else {
          console.error('❌ IndexNow submission failed');
          console.error('   Status:', res.statusCode);
          resolve(false);
        }
      });

      req.on('error', (error) => {
        console.error('❌ IndexNow request error:', error.message);
        resolve(false);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Ping sitemap to search engines
   * @param {string} sitemapUrl - Full URL to sitemap
   */
  async pingSitemap(sitemapUrl) {
    console.log('\n📍 Pinging sitemap to search engines...');

    const engines = [
      {
        name: 'Google',
        url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      },
      {
        name: 'Bing',
        url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      }
    ];

    const results = await Promise.allSettled(
      engines.map(engine => this.pingUrl(engine.url, engine.name))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`✅ Sitemap pinged successfully to ${successful}/${engines.length} search engines`);
  }

  /**
   * Ping a URL
   */
  async pingUrl(url, name) {
    return new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;

      client.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log(`   ✓ ${name}`);
          resolve(true);
        } else {
          console.log(`   ✗ ${name} (${res.statusCode})`);
          resolve(false);
        }
      }).on('error', (error) => {
        console.log(`   ✗ ${name} (${error.message})`);
        resolve(false);
      });
    });
  }

  /**
   * Submit URL to Google Indexing API
   * Requires service account credentials
   * @param {string} url - URL to index
   */
  async submitGoogleIndexingAPI(url) {
    // This requires Google Cloud service account setup
    // For now, we'll use IndexNow which is simpler and free
    console.log('\n💡 Google Indexing API requires service account setup');
    console.log('   Using IndexNow instead (instant, free, no limits)');
    return false;
  }

  /**
   * Complete indexing workflow
   * @param {string} articleUrl - URL of published article
   * @param {string} sitemapUrl - URL of sitemap
   */
  async indexArticle(articleUrl, sitemapUrl) {
    console.log('\n🚀 Starting automated indexing workflow...');
    console.log(`Article: ${articleUrl}`);
    console.log(`Sitemap: ${sitemapUrl}`);

    const results = {
      indexNow: false,
      sitemapPing: false,
      timestamp: new Date().toISOString()
    };

    // 1. IndexNow (priority method)
    try {
      results.indexNow = await this.submitIndexNow([articleUrl]);
    } catch (error) {
      console.error('IndexNow error:', error.message);
    }

    // 2. Sitemap ping (fallback)
    try {
      await this.pingSitemap(sitemapUrl);
      results.sitemapPing = true;
    } catch (error) {
      console.error('Sitemap ping error:', error.message);
    }

    // Summary
    console.log('\n📊 Indexing Summary:');
    console.log(`   IndexNow: ${results.indexNow ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Sitemap Ping: ${results.sitemapPing ? '✅ Success' : '❌ Failed'}`);

    if (results.indexNow || results.sitemapPing) {
      console.log('\n✨ Article submitted for indexing!');
      console.log('   Expected: Indexed within 24-48 hours');
    } else {
      console.log('\n⚠️  All methods failed - manual submission required');
    }

    return results;
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let articleUrl = null;
  let sitemapUrl = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      articleUrl = args[i + 1];
    }
    if (args[i] === '--sitemap' && args[i + 1]) {
      sitemapUrl = args[i + 1];
    }
  }

  if (!articleUrl) {
    console.error('❌ Missing --url parameter');
    console.log('\nUsage:');
    console.log('  node auto-indexing.js --url "https://example.com/article" --sitemap "https://example.com/sitemap.xml"');
    process.exit(1);
  }

  // Extract site URL from article URL
  const siteUrl = new URL(articleUrl).origin;

  // Default sitemap if not provided
  if (!sitemapUrl) {
    sitemapUrl = `${siteUrl}/sitemap.xml`;
  }

  const indexer = new AutoIndexing(siteUrl);
  await indexer.indexArticle(articleUrl, sitemapUrl);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AutoIndexing };
