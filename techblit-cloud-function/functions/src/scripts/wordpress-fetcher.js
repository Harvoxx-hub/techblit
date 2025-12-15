/**
 * WordPress Data Fetcher
 * Fetches all data from WordPress REST API and saves to JSON files
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.WORDPRESS_URL || 'https://techblit.com/wp-json/wp/v2';
const PER_PAGE = 100;
const OUTPUT_DIR = path.join(__dirname, '../../migration-data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Fetch all items from a WordPress endpoint with pagination
 * @param {string} endpoint - The endpoint path (e.g., 'posts', 'categories')
 * @param {boolean} embed - Whether to include embedded data
 * @returns {Promise<Array>} - Array of all fetched items
 */
async function fetchAll(endpoint, embed = true) {
  let results = [];
  let page = 1;
  let hasMore = true;

  console.log(`⏳ Fetching ${endpoint}...`);

  while (hasMore) {
    try {
      const params = { 
        per_page: PER_PAGE, 
        page,
        _embed: embed
      };

      const { data, headers } = await axios.get(`${BASE_URL}/${endpoint}`, { 
        params,
        timeout: 60000 // 60 second timeout (increased for media)
      });

      results = results.concat(data);
      console.log(`✅ Fetched ${data.length} items from page ${page} (total: ${results.length})`);

      // Check if there are more pages
      const totalPages = headers['x-wp-totalpages'];
      hasMore = totalPages && page < parseInt(totalPages);
      page++;

    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Page beyond available pages
        hasMore = false;
      } else if (error.response && error.response.status === 404) {
        // Endpoint doesn't exist or no more pages
        console.log(`⚠️  No data found for ${endpoint} (404)`);
        hasMore = false;
      } else if (error.response && error.response.status === 500) {
        // Server error - log but continue with what we have
        console.error(`❌ WordPress server error for ${endpoint} page ${page}`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Continuing with ${results.length} items fetched so far...`);
        hasMore = false;
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Timeout error - log but continue with what we have
        console.warn(`⏱️  Timeout fetching ${endpoint} page ${page}: ${error.message}`);
        console.warn(`   Continuing with ${results.length} items fetched so far...`);
        hasMore = false;
      } else {
        console.error(`❌ Error fetching ${endpoint} page ${page}:`, error.message);
        throw error;
      }
    }
  }

  console.log(`📦 Total ${results.length} ${endpoint} fetched`);
  return results;
}

/**
 * Transform WordPress categories to Firebase format
 * @param {Array} categories - WordPress categories
 * @returns {Array} - Transformed categories
 */
function transformCategories(categories) {
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    count: cat.count || 0,
    parent: cat.parent || 0,
    meta: {
      importedFrom: 'wordpress',
      importedAt: new Date().toISOString()
    }
  }));
}

/**
 * Transform WordPress tags to Firebase format
 * @param {Array} tags - WordPress tags
 * @returns {Array} - Transformed tags
 */
function transformTags(tags) {
  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description || '',
    count: tag.count || 0,
    meta: {
      importedFrom: 'wordpress',
      importedAt: new Date().toISOString()
    }
  }));
}

/**
 * Transform WordPress users to Firebase format
 * @param {Array} users - WordPress users
 * @returns {Array} - Transformed users
 */
function transformUsers(users) {
  return users.map(user => ({
    id: user.id,
    name: user.name,
    slug: user.slug,
    email: user.email || '',
    description: user.description || '',
    url: user.url || '',
    avatar: user.avatar_urls?.['96'] || '',
    link: user.link || '',
    meta: {
      importedFrom: 'wordpress',
      importedAt: new Date().toISOString()
    }
  }));
}

/**
 * Transform WordPress posts to Firebase format
 * @param {Array} posts - WordPress posts
 * @returns {Array} - Transformed posts
 */
function transformPosts(posts) {
  return posts.map(post => {
    const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
    const author = post._embedded?.author?.[0];
    const categories = post._embedded?.['wp:term']?.[0] || [];
    const tags = post._embedded?.['wp:term']?.[1] || [];

    return {
      id: post.id,
      title: post.title?.rendered || '',
      slug: post.slug || '',
      content: post.content?.rendered || '',
      excerpt: post.excerpt?.rendered || '',
      status: post.status === 'publish' ? 'published' : post.status,
      author: author ? {
        uid: `${author.id}`,
        name: author.name,
        slug: author.slug,
        avatar: author.avatar_urls?.['96'] || ''
      } : null,
      featuredImage: featuredMedia ? {
        url: featuredMedia.source_url,
        alt: featuredMedia.alt_text || post.title?.rendered || '',
        width: featuredMedia.media_details?.width || 0,
        height: featuredMedia.media_details?.height || 0
      } : null,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      })),
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug
      })),
      publishedAt: post.date ? new Date(post.date).toISOString() : null,
      updatedAt: post.modified ? new Date(post.modified).toISOString() : null,
      createdAt: post.date ? new Date(post.date).toISOString() : null,
      metaTitle: post.title?.rendered || '',
      metaDescription: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 160) || '',
      canonical: post.link || '',
      viewCount: 0,
      likeCount: 0,
      visibility: 'public',
      meta: {
        importedFrom: 'wordpress',
        importedAt: new Date().toISOString(),
        wordpressId: post.id
      }
    };
  });
}

/**
 * Transform WordPress media to Firebase format
 * @param {Array} media - WordPress media
 * @returns {Array} - Transformed media
 */
function transformMedia(media) {
  return media.map(item => ({
    id: item.id,
    url: item.source_url,
    title: item.title?.rendered || '',
    alt: item.alt_text || item.title?.rendered || '',
    caption: item.caption?.rendered || '',
    description: item.description?.rendered || '',
    mimeType: item.mime_type,
    width: item.media_details?.width || 0,
    height: item.media_details?.height || 0,
    file: item.source_url,
    sizes: item.media_details?.sizes || {},
    date: item.date,
    modified: item.modified,
    author: item.author,
    link: item.link,
    meta: {
      importedFrom: 'wordpress',
      importedAt: new Date().toISOString()
    }
  }));
}

/**
 * Main function to fetch and save all WordPress data
 */
async function main() {
  try {
    console.log('🚀 Starting WordPress data export...\n');
    console.log(`Using WordPress URL: ${BASE_URL}\n`);

    // Fetch all data with individual error handling
    const [posts, categories, tags, users, media, pages] = await Promise.allSettled([
      fetchAll('posts', true),
      fetchAll('categories'),
      fetchAll('tags'),
      fetchAll('users'),
      fetchAll('media'),
      fetchAll('pages', true)
    ]).then(results => results.map((result, index) => {
      if (result.status === 'rejected') {
        const names = ['posts', 'categories', 'tags', 'users', 'media', 'pages'];
        console.error(`⚠️  Failed to fetch ${names[index]}: ${result.reason?.message || 'Unknown error'}`);
        // Even if pages fail, continue with migration
        if (index < 5) { // posts, categories, tags, users, media
          console.error(`   Attempting to continue with partial data...`);
        }
        return [];
      }
      return result.value;
    }));

    // Transform data
    console.log('\n🔄 Transforming data...\n');
    
    const transformedPosts = transformPosts(posts);
    const transformedCategories = transformCategories(categories);
    const transformedTags = transformTags(tags);
    const transformedUsers = transformUsers(users);
    const transformedMedia = transformMedia(media);
    const transformedPages = transformPosts(pages);

    // Save as JSON files
    console.log('\n💾 Saving data to files...\n');
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'posts.json'),
      JSON.stringify(transformedPosts, null, 2)
    );
    console.log('✅ Saved posts.json');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'categories.json'),
      JSON.stringify(transformedCategories, null, 2)
    );
    console.log('✅ Saved categories.json');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'tags.json'),
      JSON.stringify(transformedTags, null, 2)
    );
    console.log('✅ Saved tags.json');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'users.json'),
      JSON.stringify(transformedUsers, null, 2)
    );
    console.log('✅ Saved users.json');

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'media.json'),
      JSON.stringify(transformedMedia, null, 2)
    );
    console.log('✅ Saved media.json');

    if (transformedPages.length > 0) {
      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'pages.json'),
        JSON.stringify(transformedPages, null, 2)
      );
      console.log('✅ Saved pages.json');
    }

    // Create summary
    const summary = {
      exportedAt: new Date().toISOString(),
      wordpressUrl: BASE_URL,
      summary: {
        posts: transformedPosts.length,
        categories: transformedCategories.length,
        tags: transformedTags.length,
        users: transformedUsers.length,
        media: transformedMedia.length,
        pages: transformedPages.length
      }
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('✅ Saved summary.json');

    console.log('\n🎉 Export complete!');
    console.log('\nSummary:');
    console.log(`  Posts: ${transformedPosts.length}`);
    console.log(`  Categories: ${transformedCategories.length}`);
    console.log(`  Tags: ${transformedTags.length}`);
    console.log(`  Users: ${transformedUsers.length}`);
    console.log(`  Media: ${transformedMedia.length}`);
    console.log(`  Pages: ${transformedPages.length}`);
    console.log(`\nFiles saved in: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  fetchAll,
  transformPosts,
  transformCategories,
  transformTags,
  transformUsers,
  transformMedia
};

