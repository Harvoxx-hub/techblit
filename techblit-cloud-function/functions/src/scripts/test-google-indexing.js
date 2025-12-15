/**
 * Test script for Google Indexing API
 * Run with: node src/scripts/test-google-indexing.js [url]
 */

require('dotenv').config();
const { submitUrlToIndexing, getIndexingStatus } = require('../utils/googleIndexing');

async function testGoogleIndexing() {
  // Get URL from command line argument or use default test URL
  const testUrl = process.argv[2] || 'https://techblit.com';
  
  console.log('🧪 Testing Google Indexing API...\n');
  console.log(`📝 Test URL: ${testUrl}\n`);

  // Check if credentials are configured
  const hasCredentials = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY;
  
  if (!hasCredentials) {
    console.error('❌ Error: Google Indexing API credentials not configured!');
    console.error('\nPlease set the following environment variables:');
    console.error('  - GOOGLE_CLIENT_EMAIL');
    console.error('  - GOOGLE_PRIVATE_KEY');
    console.error('\nOr add them to your .env file in the functions/ directory.');
    process.exit(1);
  }

  console.log('✅ Credentials found');
  console.log(`   Service Account: ${process.env.GOOGLE_CLIENT_EMAIL}\n`);

  try {
    // Test 1: Submit URL for indexing
    console.log('📤 Submitting URL to Google Indexing API...');
    const submitResult = await submitUrlToIndexing(testUrl, 'URL_UPDATED');
    
    if (submitResult.success) {
      console.log('✅ Successfully submitted URL!');
      console.log(`   Response:`, JSON.stringify(submitResult.response, null, 2));
    } else {
      console.error('❌ Failed to submit URL');
      console.error(`   Error: ${submitResult.error}`);
      if (submitResult.status) {
        console.error(`   Status: ${submitResult.status}`);
      }
      
      // Provide helpful error messages
      if (submitResult.status === 403) {
        console.error('\n💡 Tip: Make sure:');
        console.error('   1. Service account is added to Google Search Console as Owner');
        console.error('   2. Indexing API is enabled in Google Cloud Console');
        console.error('   3. Service account has proper IAM permissions');
      } else if (submitResult.status === 400) {
        console.error('\n💡 Tip: Check that the URL is valid and accessible');
      } else if (submitResult.status === 401) {
        console.error('\n💡 Tip: Check your private key format (should include \\n characters)');
      }
      
      process.exit(1);
    }

    console.log('\n⏳ Waiting 2 seconds before checking status...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Get indexing status
    console.log('🔍 Checking indexing status...');
    const statusResult = await getIndexingStatus(testUrl);
    
    if (statusResult.success) {
      console.log('✅ Successfully retrieved status!');
      console.log(`   Status:`, JSON.stringify(statusResult.status, null, 2));
    } else {
      console.log('⚠️  Could not retrieve status (this is normal for new submissions)');
      console.log(`   Error: ${statusResult.error}`);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check Google Search Console > URL Inspection tool');
    console.log('   2. Verify the URL shows as "Submitted for indexing"');
    console.log('   3. Monitor Firebase logs when publishing posts');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testGoogleIndexing().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

