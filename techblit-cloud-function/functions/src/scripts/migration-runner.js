/**
 * Migration Runner
 * Orchestrates the complete migration process from WordPress to Firebase
 * 
 * Usage:
 *   node functions/src/scripts/migration-runner.js
 *   OR
 *   node functions/src/scripts/migration-runner.js --skip-fetch  (to skip fetching and only upload)
 *   OR
 *   node functions/src/scripts/migration-runner.js --fetch-only  (to only fetch without uploading)
 */

const path = require('path');
const fs = require('fs');

const fetcher = require('./wordpress-fetcher');
const uploader = require('./wordpress-uploader');

const OUTPUT_DIR = path.join(__dirname, '../../migration-data');

/**
 * Check if migration data already exists
 */
function checkExistingData() {
  const requiredFiles = ['posts.json', 'users.json', 'categories.json', 'tags.json', 'media.json'];
  const existingFiles = requiredFiles.filter(file => {
    return fs.existsSync(path.join(OUTPUT_DIR, file));
  });

  return {
    hasData: existingFiles.length > 0,
    existingFiles
  };
}

/**
 * Main migration process
 */
async function runMigration() {
  const args = process.argv.slice(2);
  const skipFetch = args.includes('--skip-fetch');
  const fetchOnly = args.includes('--fetch-only');

  console.log('🚀 WordPress to Firebase Migration Tool\n');
  console.log('=' .repeat(60) + '\n');

  // Step 1: Check for existing data
  const existingData = checkExistingData();
  
  if (existingData.hasData && !skipFetch) {
    console.log('⚠️  Existing migration data found:');
    existingData.existingFiles.forEach(file => console.log(`  - ${file}`));
    console.log('\n💡 To use existing data and skip fetching, run with --skip-fetch flag\n');
  }

  // Step 2: Fetch data from WordPress (unless skipped)
  if (!skipFetch) {
    console.log('Step 1: Fetching data from WordPress\n');
    console.log('=' .repeat(60) + '\n');
    
    await fetcher.main();
    
    console.log('\n' + '=' .repeat(60) + '\n');
    
    if (fetchOnly) {
      console.log('✅ Fetch complete. Data saved to migration-data directory.');
      console.log('Run again without --fetch-only to upload to Firebase.\n');
      return;
    }
  } else {
    console.log('⏩ Skipping fetch step (using existing data)\n');
  }

  // Step 3: Upload to Firebase (unless fetch-only)
  if (!fetchOnly) {
    console.log('Step 2: Uploading data to Firebase\n');
    console.log('=' .repeat(60) + '\n');
    
    await uploader.main();
    
    console.log('\n' + '=' .repeat(60) + '\n');
  }

  console.log('🎉 Migration complete!\n');
  
  // Display final instructions
  console.log('Next steps:');
  console.log('1. Review the imported data in Firebase Console');
  console.log('2. Run migration scripts again to sync any new changes');
  console.log('3. Test your application with the imported data\n');
}

// Run migration
runMigration().catch(error => {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
});

