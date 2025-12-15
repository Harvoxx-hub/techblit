/**
 * SQL Database Parser
 * Parses WordPress SQL dump to extract posts, categories, tags, users, and media
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../migration-data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse SQL INSERT statements
 * @param {string} sqlFile - Path to SQL file
 * @param {string} tableName - Name of the table to extract
 * @returns {Promise<Array>} - Array of parsed rows
 */
async function parseSQLFile(sqlFile, tableName) {
  console.log(`📖 Reading ${sqlFile}...`);
  
  const content = fs.readFileSync(sqlFile, 'utf8');
  
  // Find INSERT INTO statements for the table
  // Match: INSERT INTO `table_name` (...) VALUES (...);
  const insertPattern = new RegExp(
    `INSERT INTO\\s+\`${tableName}\`[\\s\\S]*?VALUES([\\s\\S]*?);`,
    'gi'
  );

  const matches = [];
  let match;
  while ((match = insertPattern.exec(content)) !== null) {
    matches.push(match[1]);
  }

  console.log(`   Found ${matches.length} INSERT statements`);

  if (matches.length === 0) {
    console.warn(`⚠️  No data found for table ${tableName}`);
    return [];
  }

  // Parse the values from the first INSERT statement
  // SQL INSERT syntax: (value1, value2, 'string with commas', ...)
  const rows = [];
  const valuesText = matches[0];

  // Split by rows (handle multi-line values)
  let currentRow = '';
  let parenDepth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < valuesText.length; i++) {
    const char = valuesText[i];
    const prevChar = i > 0 ? valuesText[i - 1] : '';

    if (escapeNext) {
      currentRow += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      currentRow += char;
      continue;
    }

    if (char === "'" || char === '"') {
      inString = !inString;
      currentRow += char;
      continue;
    }

    if (!inString) {
      if (char === '(') {
        parenDepth++;
        if (parenDepth > 1) {
          currentRow += char;
        }
        continue;
      }

      if (char === ')') {
        parenDepth--;
        if (parenDepth === 0 && currentRow.trim()) {
          // End of row
          const row = currentRow.trim();
          if (row) {
            try {
              rows.push(parseRowValues(row));
            } catch (error) {
              console.error(`⚠️  Error parsing row: ${error.message}`);
            }
          }
          currentRow = '';
          continue;
        }
        currentRow += char;
        continue;
      }

      if (char === ',' && parenDepth === 1) {
        // Skip top-level commas
        continue;
      }
    }

    currentRow += char;
  }

  // Handle last row if exists
  if (currentRow.trim()) {
    try {
      rows.push(parseRowValues(currentRow.trim()));
    } catch (error) {
      console.error(`⚠️  Error parsing last row: ${error.message}`);
    }
  }

  console.log(`✅ Parsed ${rows.length} rows from ${tableName}`);
  return rows;
}

/**
 * Parse a row's values
 * @param {string} rowText - Row text in format (val1, val2, 'string', ...)
 * @returns {Array} - Array of parsed values
 */
function parseRowValues(rowText) {
  const values = [];
  let currentValue = '';
  let inQuotes = false;
  let quoteChar = null;
  let escapeNext = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];

    if (escapeNext) {
      currentValue += char === 'n' ? '\n' : char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      currentValue += char;
      continue;
    }

    if ((char === "'" || char === '"') && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      continue;
    }

    if (inQuotes && char === quoteChar) {
      inQuotes = false;
      quoteChar = null;
      values.push(currentValue);
      currentValue = '';
      continue;
    }

    if (!inQuotes && char === ',') {
      if (currentValue.trim()) {
        const val = currentValue.trim();
        values.push(val === 'NULL' || val === '' ? null : val);
      }
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  // Add last value
  if (currentValue.trim()) {
    const val = currentValue.trim();
    values.push(val === 'NULL' || val === '' ? null : val);
  }

  return values;
}

/**
 * Map column names to row values
 * @param {Array} columns - Array of column names
 * @param {Array} row - Array of row values
 * @returns {Object} - Object with column names as keys
 */
function mapRowToColumns(columns, row) {
  const obj = {};
  columns.forEach((col, index) => {
    if (index < row.length) {
      obj[col] = row[index];
    }
  });
  return obj;
}

/**
 * Extract posts from SQL
 */
async function extractPosts(sqlFile) {
  const columns = [
    'ID', 'post_author', 'post_date', 'post_date_gmt', 'post_content',
    'post_title', 'post_excerpt', 'post_status', 'comment_status', 'ping_status',
    'post_password', 'post_name', 'to_ping', 'pinged', 'post_modified',
    'post_modified_gmt', 'post_content_filtered', 'post_parent', 'guid',
    'menu_order', 'post_type', 'post_mime_type', 'comment_count'
  ];

  const rows = await parseSQLFile(sqlFile, 'wp_posts');
  
  const posts = rows.map(row => {
    const post = mapRowToColumns(columns, row);
    
    // Filter out revisions, attachments, and non-post types
    if (post.post_type !== 'post' && post.post_type !== 'page') {
      return null;
    }

    return {
      id: parseInt(post.ID),
      title: post.post_title || '',
      slug: post.post_name || '',
      content: post.post_content || '',
      excerpt: post.post_excerpt || '',
      status: post.post_status === 'publish' ? 'published' : 
              post.post_status === 'draft' ? 'draft' : 
              post.post_status === 'future' ? 'scheduled' : 'draft',
      author: {
        uid: post.post_author || '1',
        name: `Author ${post.post_author}` // We'll update this from users table
      },
      publishedAt: post.post_date ? new Date(post.post_date).toISOString() : null,
      updatedAt: post.post_modified ? new Date(post.post_modified).toISOString() : null,
      createdAt: post.post_date ? new Date(post.post_date).toISOString() : null,
      type: post.post_type,
      guid: post.guid,
      viewCount: 0,
      likeCount: 0,
      meta: {
        importedFrom: 'wordpress_sql',
        importedAt: new Date().toISOString(),
        wordpressId: post.ID
      }
    };
  }).filter(post => post !== null);

  console.log(`📦 Extracted ${posts.length} posts`);
  return posts;
}

/**
 * Extract users from SQL
 */
async function extractUsers(sqlFile) {
  const columns = [
    'ID', 'user_login', 'user_pass', 'user_nicename', 'user_email',
    'user_url', 'user_registered', 'user_activation_key', 'user_status',
    'display_name'
  ];

  const rows = await parseSQLFile(sqlFile, 'wp_users');
  
  const users = rows.map(row => {
    const user = mapRowToColumns(columns, row);
    
    return {
      id: parseInt(user.ID),
      name: user.display_name || user.user_nicename || user.user_login,
      email: user.user_email || '',
      username: user.user_login || '',
      website: user.user_url || '',
      registered: user.user_registered ? new Date(user.user_registered).toISOString() : null,
      meta: {
        importedFrom: 'wordpress_sql',
        importedAt: new Date().toISOString(),
        wordpressId: user.ID
      }
    };
  });

  console.log(`📦 Extracted ${users.length} users`);
  return users;
}

/**
 * Extract categories from SQL
 */
async function extractCategories(sqlFile) {
  // Categories are stored in wp_terms and wp_term_taxonomy
  const terms = await parseSQLFile(sqlFile, 'wp_terms');
  const termTaxonomy = await parseSQLFile(sqlFile, 'wp_term_taxonomy');

  // Skip if no data
  if (terms.length === 0 || termTaxonomy.length === 0) {
    console.log('⚠️  No category data found');
    return [];
  }

  // Create a map of term_id to term
  const termMap = {};
  terms.forEach(term => {
    if (term.length >= 3) {
      termMap[term[0]] = {
        term_id: term[0],
        name: term[1],
        slug: term[2]
      };
    }
  });

  // Extract only categories (taxonomy = 'category')
  const categories = termTaxonomy
    .filter(row => row.length >= 5 && row[2] === 'category')
    .map(row => ({
      id: parseInt(row[0]),
      name: termMap[row[0]]?.name || '',
      slug: termMap[row[0]]?.slug || '',
      description: row[3] || '',
      count: parseInt(row[6]) || 0,
      parent: parseInt(row[1]) || 0,
      meta: {
        importedFrom: 'wordpress_sql',
        importedAt: new Date().toISOString()
      }
    }));

  console.log(`📦 Extracted ${categories.length} categories`);
  return categories;
}

/**
 * Extract tags from SQL
 */
async function extractTags(sqlFile) {
  // Tags are also in wp_terms and wp_term_taxonomy
  const terms = await parseSQLFile(sqlFile, 'wp_terms');
  const termTaxonomy = await parseSQLFile(sqlFile, 'wp_term_taxonomy');

  if (terms.length === 0 || termTaxonomy.length === 0) {
    console.log('⚠️  No tag data found');
    return [];
  }

  const termMap = {};
  terms.forEach(term => {
    if (term.length >= 3) {
      termMap[term[0]] = {
        term_id: term[0],
        name: term[1],
        slug: term[2]
      };
    }
  });

  // Extract only tags (taxonomy = 'post_tag')
  const tags = termTaxonomy
    .filter(row => row.length >= 5 && row[2] === 'post_tag')
    .map(row => ({
      id: parseInt(row[0]),
      name: termMap[row[0]]?.name || '',
      slug: termMap[row[0]]?.slug || '',
      description: row[3] || '',
      count: parseInt(row[6]) || 0,
      meta: {
        importedFrom: 'wordpress_sql',
        importedAt: new Date().toISOString()
      }
    }));

  console.log(`📦 Extracted ${tags.length} tags`);
  return tags;
}

/**
 * Main extraction function
 */
async function main() {
  const args = process.argv.slice(2);
  const sqlFile = args[0] || path.join(__dirname, '../../../Downloads/techmmcu_x51_wordpressdb.sql');

  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ SQL file not found: ${sqlFile}`);
    console.error('Usage: node sql-parser.js <path-to-sql-file>');
    process.exit(1);
  }

  console.log('🚀 Starting SQL data extraction...\n');
  console.log(`Using file: ${sqlFile}\n`);

  try {
    // Extract all data
    const posts = await extractPosts(sqlFile);
    const users = await extractUsers(sqlFile);
    const categories = await extractCategories(sqlFile);
    const tags = await extractTags(sqlFile);

    // Update author names in posts
    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user.name;
    });

    posts.forEach(post => {
      if (userMap[post.author.uid]) {
        post.author.name = userMap[post.author.uid];
      }
    });

    // Save to JSON files
    console.log('\n💾 Saving data to files...\n');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'posts.json'),
      JSON.stringify(posts, null, 2)
    );
    console.log('✅ Saved posts.json');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log('✅ Saved users.json');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'categories.json'),
      JSON.stringify(categories, null, 2)
    );
    console.log('✅ Saved categories.json');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'tags.json'),
      JSON.stringify(tags, null, 2)
    );
    console.log('✅ Saved tags.json');

    // Create summary
    const summary = {
      exportedAt: new Date().toISOString(),
      source: 'wordpress_sql',
      sqlFile: sqlFile,
      summary: {
        posts: posts.length,
        users: users.length,
        categories: categories.length,
        tags: tags.length
      }
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('✅ Saved summary.json');

    console.log('\n🎉 Extraction complete!');
    console.log('\nSummary:');
    console.log(`  Posts: ${posts.length}`);
    console.log(`  Users: ${users.length}`);
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Tags: ${tags.length}`);
    console.log(`\nFiles saved in: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  extractPosts,
  extractUsers,
  extractCategories,
  extractTags
};

