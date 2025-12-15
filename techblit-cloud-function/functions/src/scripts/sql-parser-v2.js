/**
 * SQL Database Parser V2
 * Simpler approach using node-sql-parser-like approach
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../migration-data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Simple CSV-style parsing for SQL VALUES
 * This is more reliable than trying to handle all edge cases
 */
function parseSQLValues(sqlText) {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;
  let quoteChar = null;
  let parenDepth = 0;
  let escaped = false;

  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    const nextChar = i < sqlText.length - 1 ? sqlText[i + 1] : '';

    if (escaped) {
      currentValue += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      currentValue += char;
      continue;
    }

    if ((char === "'" || char === '"' || char === '`') && !escaped) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
        continue;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = null;
        continue;
      }
    }

    if (!inQuotes) {
      if (char === '(') {
        parenDepth++;
        if (parenDepth === 2 && currentValue.trim()) {
          currentRow.push(currentValue.trim());
          currentValue = '';
        }
        continue;
      }

      if (char === ')') {
        if (parenDepth === 2 && currentValue.trim()) {
          currentRow.push(currentValue.trim());
        }
        if (parenDepth === 1 && currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        parenDepth--;
        currentValue = '';
        continue;
      }

      if (char === ',' && parenDepth === 2) {
        currentRow.push(currentValue.trim());
        currentValue = '';
        continue;
      }
    }

    if (parenDepth > 0) {
      currentValue += char;
    }
  }

  return rows;
}

/**
 * Extract column names from INSERT statement
 */
function extractColumns(insertStatement) {
  const match = insertStatement.match(/INSERT INTO\s+`\w+`\s+\(([^)]+)\)/i);
  if (!match) return [];
  
  return match[1]
    .split(',')
    .map(col => col.trim().replace(/[`"]/g, ''));
}

/**
 * Parse SQL file and extract data for a table
 */
function extractTableData(sqlFile, tableName) {
  console.log(`📖 Reading table ${tableName}...`);
  
  const content = fs.readFileSync(sqlFile, 'utf8');
  
  // Find all INSERT statements for this table
  const insertPattern = new RegExp(
    `INSERT INTO\\s+\`${tableName}\`\\s*\\([^)]+\\)\\s+VALUES[\\s\\S]*?;`,
    'gi'
  );

  let match;
  let columns = [];
  let rows = [];

  while ((match = insertPattern.exec(content)) !== null) {
    const insertStatement = match[0];
    
    // Extract column names from first match
    if (columns.length === 0) {
      columns = extractColumns(insertStatement);
      console.log(`   Columns: ${columns.length}`);
    }

    // Extract VALUES part
    const valuesMatch = insertStatement.match(/VALUES\s+([\s\S]*?);/i);
    if (!valuesMatch) continue;

    const valuesText = valuesMatch[1];
    const parsedRows = parseSQLValues(valuesText);
    rows.push(...parsedRows);
  }

  console.log(`   Found ${rows.length} rows`);
  return { columns, rows };
}

/**
 * Convert SQL value to JavaScript value
 */
function parseValue(value) {
  if (!value || value === 'NULL' || value === '') {
    return null;
  }
  
  // Remove quotes
  if ((value.startsWith("'") && value.endsWith("'")) || 
      (value.startsWith('"') && value.endsWith('"'))) {
    value = value.slice(1, -1);
  }

  // Unescape
  value = value.replace(/\\'/g, "'");
  value = value.replace(/\\n/g, '\n');
  value = value.replace(/\\r/g, '\r');
  value = value.replace(/\\t/g, '\t');

  return value;
}

/**
 * Map rows to objects
 */
function mapRows(columns, rows) {
  return rows.map(row => {
    const obj = {};
    columns.forEach((col, index) => {
      const val = row[index];
      obj[col] = parseValue(val);
    });
    return obj;
  });
}

/**
 * Extract posts
 */
function extractPosts(sqlFile) {
  const { columns, rows } = extractTableData(sqlFile, 'wp_posts');
  
  if (rows.length === 0) {
    console.log('⚠️  No post data found');
    return [];
  }

  const posts = mapRows(columns, rows)
    .filter(post => post.post_type === 'post' || post.post_type === 'page')
    .map(post => ({
      id: parseInt(post.ID),
      title: post.post_title || '',
      slug: post.post_name || '',
      content: post.post_content || '',
      excerpt: post.post_excerpt || '',
      status: post.post_status === 'publish' ? 'published' : 
              post.post_status === 'draft' ? 'draft' : 'draft',
      author: {
        uid: post.post_author || '1',
        name: `Author ${post.post_author}`
      },
      publishedAt: post.post_date ? parseDate(post.post_date) : null,
      updatedAt: post.post_modified ? parseDate(post.post_modified) : null,
      createdAt: post.post_date ? parseDate(post.post_date) : null,
      type: post.post_type,
      guid: post.guid,
      viewCount: 0,
      likeCount: 0,
      meta: {
        importedFrom: 'wordpress_sql',
        importedAt: new Date().toISOString(),
        wordpressId: post.ID
      }
    }));

  console.log(`📦 Extracted ${posts.length} posts`);
  return posts;
}

/**
 * Parse date string
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle various date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.warn(`⚠️  Invalid date: ${dateStr}`);
    return null;
  }
  
  return date.toISOString();
}

/**
 * Extract users
 */
function extractUsers(sqlFile) {
  const { columns, rows } = extractTableData(sqlFile, 'wp_users');
  
  if (rows.length === 0) {
    console.log('⚠️  No user data found');
    return [];
  }

  const users = mapRows(columns, rows).map(user => ({
    id: parseInt(user.ID),
    name: user.display_name || user.user_nicename || user.user_login || 'Unknown',
    email: user.user_email || '',
    username: user.user_login || '',
    website: user.user_url || '',
    registered: user.user_registered ? parseDate(user.user_registered) : null,
    meta: {
      importedFrom: 'wordpress_sql',
      importedAt: new Date().toISOString(),
      wordpressId: user.ID
    }
  }));

  console.log(`📦 Extracted ${users.length} users`);
  return users;
}

/**
 * Extract categories and tags
 */
function extractTerms(sqlFile) {
  const { columns: termColumns, rows: termRows } = extractTableData(sqlFile, 'wp_terms');
  const { columns: taxColumns, rows: taxRows } = extractTableData(sqlFile, 'wp_term_taxonomy');

  if (termRows.length === 0 || taxRows.length === 0) {
    console.log('⚠️  No term data found');
    return { categories: [], tags: [] };
  }

  // Map terms
  const terms = mapRows(termColumns, termRows);
  const termMap = {};
  terms.forEach(term => {
    termMap[term.term_id] = term;
  });

  // Map taxonomy
  const taxonomy = mapRows(taxColumns, taxRows);

  const categories = taxonomy
    .filter(item => item.taxonomy === 'category')
    .map(item => ({
      id: parseInt(item.term_id),
      name: termMap[item.term_id]?.name || '',
      slug: termMap[item.term_id]?.slug || '',
      description: item.description || '',
      count: parseInt(item.count) || 0,
      parent: parseInt(item.parent) || 0,
      meta: {
        importedFrom: 'wordpress_sql',
        importedAt: new Date().toISOString()
      }
    }));

  const tags = taxonomy
    .filter(item => item.taxonomy === 'post_tag')
    .map(item => ({
      id: parseInt(item.term_id),
      name: termMap[item.term_id]?.name || '',
      slug: termMap[item.term_id]?.slug || '',
      description: item.description || '',
      count: parseInt(item.count) || 0,
      meta: {
        importedFrom: 'wordpress_sql',
        importedAt: new Date().toISOString()
      }
    }));

  console.log(`📦 Extracted ${categories.length} categories, ${tags.length} tags`);
  return { categories, tags };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const sqlFile = args[0] || path.join(process.env.HOME, 'Downloads/techmmcu_x51_wordpressdb.sql');

  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ SQL file not found: ${sqlFile}`);
    process.exit(1);
  }

  console.log('🚀 Starting SQL data extraction...\n');
  console.log(`Using file: ${sqlFile}\n`);

  try {
    // Extract data
    const posts = extractPosts(sqlFile);
    const users = extractUsers(sqlFile);
    const { categories, tags } = extractTerms(sqlFile);

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

    // Save to JSON
    console.log('\n💾 Saving data to files...\n');

    fs.writeFileSync(path.join(OUTPUT_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
    console.log('✅ Saved posts.json');

    fs.writeFileSync(path.join(OUTPUT_DIR, 'users.json'), JSON.stringify(users, null, 2));
    console.log('✅ Saved users.json');

    fs.writeFileSync(path.join(OUTPUT_DIR, 'categories.json'), JSON.stringify(categories, null, 2));
    console.log('✅ Saved categories.json');

    fs.writeFileSync(path.join(OUTPUT_DIR, 'tags.json'), JSON.stringify(tags, null, 2));
    console.log('✅ Saved tags.json');

    // Create summary
    const summary = {
      exportedAt: new Date().toISOString(),
      source: 'wordpress_sql',
      sqlFile: sqlFile,
      summary: { posts: posts.length, users: users.length, categories: categories.length, tags: tags.length }
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log('✅ Saved summary.json');

    console.log('\n🎉 Extraction complete!');
    console.log(`\nSummary:\n  Posts: ${posts.length}\n  Users: ${users.length}\n  Categories: ${categories.length}\n  Tags: ${tags.length}`);
    console.log(`\nFiles saved in: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractPosts, extractUsers, extractTerms };


