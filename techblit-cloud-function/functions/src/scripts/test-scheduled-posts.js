#!/usr/bin/env node

/**
 * Test script for scheduled posts processing
 * Usage: node src/scripts/test-scheduled-posts.js
 * 
 * This script tests the processScheduledPosts function locally
 */

require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK for local testing
if (!admin.apps.length) {
  // Try to use service account file if available
  const serviceAccountPath = path.join(__dirname, '../../../techblit-firebase-adminsdk-fbsvc-1395c2bee0.json');
  const fs = require('fs');
  
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.GCLOUD_PROJECT || 'techblit'
    });
    console.log('✅ Using service account file for authentication');
  } else {
    // Fall back to default initialization (will use GOOGLE_APPLICATION_CREDENTIALS or default credentials)
    admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || 'techblit'
    });
    console.log('✅ Using default Firebase credentials');
  }
}

const { processScheduledPosts } = require('../handlers/scheduledPosts');

async function main() {
  console.log('🧪 Testing Scheduled Posts Processing\n');
  console.log('='.repeat(50));
  console.log('');
  
  console.log('📋 Configuration:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('  GCLOUD_PROJECT:', process.env.GCLOUD_PROJECT || 'techblit');
  console.log('');
  
  try {
    console.log('🚀 Starting scheduled posts processing...\n');
    
    const result = await processScheduledPosts();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Processing completed successfully!');
    console.log('');
    console.log('Results:');
    console.log('  Processed:', result.processed || 0, 'post(s)');
    console.log('');
    
    if (result.processed === 0) {
      console.log('ℹ️  No scheduled posts were ready for publishing.');
      console.log('   This is normal if there are no posts with:');
      console.log('   - status: "scheduled"');
      console.log('   - scheduledAt <= current time');
    } else {
      console.log(`✅ Successfully published ${result.processed} scheduled post(s)!`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ Error processing scheduled posts:');
    console.error('');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('');
    
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('  1. Make sure Firebase Admin SDK is properly initialized');
    console.error('  2. Check that you have a .env file with GCLOUD_PROJECT set');
    console.error('  3. Verify Firestore connection and permissions');
    console.error('  4. Check that posts collection exists and has scheduled posts');
    console.error('  5. Ensure scheduledAt field is a valid Firestore Timestamp');
    
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

