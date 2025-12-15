/**
 * Diagnostic script to check why a URL might not be indexed
 * Usage: node src/scripts/diagnose-indexing.js https://techblit.com/your-post-slug
 */

require('dotenv').config();
const https = require('https');
const http = require('http');
const { URL } = require('url');

async function checkUrl(url, followRedirects = true, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      timeout: 10000,
      maxRedirects: followRedirects ? maxRedirects : 0
    };

    const req = client.request(options, (res) => {
      // Handle redirects
      if (followRedirects && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308)) {
        const location = res.headers.location;
        if (location && maxRedirects > 0) {
          // Handle relative redirects
          const redirectUrl = location.startsWith('http') ? location : `${urlObj.protocol}//${urlObj.hostname}${location}`;
          return checkUrl(redirectUrl, true, maxRedirects - 1).then(resolve).catch(reject);
        }
      }

      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          size: data.length,
          finalUrl: url,
          redirectChain: res.statusCode >= 300 && res.statusCode < 400 ? [url] : []
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function checkForNoindex(html) {
  const noindexPatterns = [
    /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex[^"']*["']/i,
    /<meta\s+content=["'][^"']*noindex[^"']*["']\s+name=["']robots["']/i,
    /<META\s+HTTP-EQUIV=["']ROBOTS["']\s+CONTENT=["'][^"']*NOINDEX[^"']*["']/i
  ];
  
  return noindexPatterns.some(pattern => pattern.test(html));
}

function checkForCanonical(html) {
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return canonicalMatch ? canonicalMatch[1] : null;
}

function checkForStructuredData(html) {
  const jsonLdMatches = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
  return jsonLdMatches ? jsonLdMatches.length : 0;
}

async function diagnoseUrl(testUrl) {
  console.log('🔍 Diagnosing URL for indexing issues...\n');
  console.log(`📝 URL: ${testUrl}\n`);

  try {
    // Check 1: Page accessibility
    console.log('1️⃣ Checking page accessibility...');
    const response = await checkUrl(testUrl);
    
    if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
      console.warn(`⚠️  Page redirects (HTTP ${response.statusCode})`);
      console.warn(`   Redirect to: ${response.headers.location || 'Unknown'}`);
      console.warn('   Tip: Redirects can delay indexing. Use canonical tags.');
    } else if (response.statusCode !== 200) {
      console.error(`❌ Page returns HTTP ${response.statusCode}`);
      if (response.statusCode === 404) {
        console.error('   Fix: Page does not exist. Check URL and routing.');
      } else if (response.statusCode === 403) {
        console.error('   Fix: Page is blocked. Check authentication/authorization.');
      } else if (response.statusCode === 429) {
        console.error('   Fix: Rate limiting detected. Allow Googlebot in rate limits.');
      } else if (response.statusCode >= 500) {
        console.error('   Fix: Server error. Check server logs.');
      } else {
        console.error('   Fix: Ensure the page exists and returns 200 status');
      }
      return;
    } else {
      console.log(`✅ Page is accessible (HTTP ${response.statusCode})`);
      if (response.finalUrl !== testUrl) {
        console.log(`   Final URL after redirects: ${response.finalUrl}`);
      }
    }

    // Check 2: Content size
    console.log('\n2️⃣ Checking content...');
    if (response.size < 1000) {
      console.warn(`⚠️  Page content is small (${response.size} bytes)`);
      console.warn('   Tip: Add more content (recommended: 300+ words)');
    } else {
      console.log(`✅ Page has substantial content (${response.size} bytes)`);
    }

    // Check 3: Noindex tag
    console.log('\n3️⃣ Checking for noindex tag...');
    const hasNoindex = checkForNoindex(response.body);
    if (hasNoindex) {
      console.error('❌ Page has noindex meta tag!');
      console.error('   Fix: Remove noindex tag or set seo.noindex: false in Firestore');
    } else {
      console.log('✅ No noindex tag found');
    }

    // Check 4: Canonical tag
    console.log('\n4️⃣ Checking canonical tag...');
    const canonical = checkForCanonical(response.body);
    if (canonical) {
      console.log(`✅ Canonical tag found: ${canonical}`);
      if (canonical !== testUrl) {
        console.warn(`⚠️  Canonical URL differs from page URL`);
        console.warn(`   Page URL: ${testUrl}`);
        console.warn(`   Canonical: ${canonical}`);
      }
    } else {
      console.warn('⚠️  No canonical tag found');
      console.warn('   Tip: Add canonical tag pointing to this URL');
    }

    // Check 5: Structured data
    console.log('\n5️⃣ Checking structured data...');
    const structuredDataCount = checkForStructuredData(response.body);
    if (structuredDataCount > 0) {
      console.log(`✅ Found ${structuredDataCount} structured data block(s)`);
    } else {
      console.warn('⚠️  No structured data found');
      console.warn('   Tip: Add JSON-LD structured data for better indexing');
    }

    // Check 6: Title tag
    console.log('\n6️⃣ Checking title tag...');
    const titleMatch = response.body.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      console.log(`✅ Title found: ${titleMatch[1]}`);
    } else {
      console.warn('⚠️  No title tag found');
    }

    // Check 7: Meta description
    console.log('\n7️⃣ Checking meta description...');
    const descMatch = response.body.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      console.log(`✅ Meta description found: ${descMatch[1].substring(0, 60)}...`);
    } else {
      console.warn('⚠️  No meta description found');
    }

    // Summary
    console.log('\n📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const issues = [];
    if (response.statusCode !== 200) issues.push('Page returns error');
    if (hasNoindex) issues.push('Has noindex tag');
    if (!canonical) issues.push('Missing canonical tag');
    if (structuredDataCount === 0) issues.push('Missing structured data');
    if (response.size < 1000) issues.push('Low content');

    if (issues.length === 0) {
      console.log('✅ Page looks good for indexing!');
      console.log('\n💡 If still not indexed:');
      console.log('   - Wait 24-48 hours after submission');
      console.log('   - Check Google Search Console for specific errors');
      console.log('   - Ensure page is in sitemap.xml');
      console.log('   - Use "Request Indexing" in Search Console');
    } else {
      console.log('⚠️  Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
      console.log('\n💡 Fix these issues and resubmit the URL');
    }

  } catch (error) {
    console.error('\n❌ Error checking URL:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   - URL is not accessible');
    console.error('   - Server is down');
    console.error('   - Network error');
  }
}

// Get URL from command line
const testUrl = process.argv[2];

if (!testUrl) {
  console.error('Usage: node src/scripts/diagnose-indexing.js <URL>');
  console.error('Example: node src/scripts/diagnose-indexing.js https://techblit.com/my-post');
  process.exit(1);
}

diagnoseUrl(testUrl).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

