// Algolia configuration
export const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || 'YIZ3TZ073A';
// Search-Only API Key for client-side search (safe to expose)
export const ALGOLIA_API_KEY = process.env.ALGOLIA_SEARCH_API_KEY || '3416d2344394220af7857d4fa1aa6e3b';
export const ALGOLIA_INDEX_NAME = 'techblit_posts';

// Admin API Key for server-side indexing (keep secret!)
export const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_API_KEY || '';

// Import image helper for Cloudinary URL conversion
import { getImageUrlFromData } from './imageHelpers';

const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net`;

// Helper function to strip HTML tags
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Search function
export async function searchPosts(query: string, hitsPerPage: number = 10) {
  try {
    const response = await fetch(`${ALGOLIA_URL}/1/indexes/${ALGOLIA_INDEX_NAME}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
      },
      body: JSON.stringify({
        query,
        hitsPerPage,
        attributesToRetrieve: ['objectID', 'title', 'slug', 'excerpt', 'category', 'author', 'publishedAt', 'featuredImage'],
      }),
    });

    const data = await response.json();
    return data.hits || [];
  } catch (error) {
    console.error('Algolia search error:', error);
    return [];
  }
}

// Index a post to Algolia
export async function indexPost(post: {
  objectID: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category?: string;
  author?: string | { name: string };
  publishedAt?: any;
  featuredImage?: any;
  tags?: string[];
}) {
  try {
    const postData = {
      objectID: post.objectID,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content ? stripHtmlTags(post.content).substring(0, 5000) : '',
      category: post.category || '',
      author: typeof post.author === 'string' ? post.author : (typeof post.author === 'object' && post.author && 'name' in post.author ? post.author.name : '') || '',
      publishedAt: post.publishedAt?.toMillis?.() || post.publishedAt?.getTime?.() || Date.now(),
      featuredImage: getImageUrlFromData(post.featuredImage, { preset: 'cover' }) || '',
      tags: post.tags || [],
    };

    const response = await fetch(`${ALGOLIA_URL}/1/indexes/${ALGOLIA_INDEX_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
      },
      body: JSON.stringify(postData),
    });

    if (response.ok) {
      console.log(`Indexed post: ${post.title}`);
    }
  } catch (error) {
    console.error('Error indexing post:', error);
  }
}

// Delete a post from Algolia index
export async function deletePost(objectID: string) {
  try {
    const response = await fetch(`${ALGOLIA_URL}/1/indexes/${ALGOLIA_INDEX_NAME}/${objectID}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'X-Algolia-API-Key': ALGOLIA_API_KEY,
      },
    });

    if (response.ok) {
      console.log(`Deleted post from index: ${objectID}`);
    }
  } catch (error) {
    console.error('Error deleting post from index:', error);
  }
}

// Bulk index posts
export async function bulkIndexPosts(posts: Array<{
  objectID: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category?: string;
  author?: string | { name: string };
  publishedAt?: any;
  featuredImage?: any;
  tags?: string[];
}>) {
  try {
    const objects = posts.map(post => ({
      objectID: post.objectID,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content ? stripHtmlTags(post.content).substring(0, 5000) : '',
      category: post.category || '',
      author: typeof post.author === 'string' ? post.author : (typeof post.author === 'object' && post.author && 'name' in post.author ? post.author.name : '') || '',
      publishedAt: post.publishedAt?.toMillis?.() || post.publishedAt?.getTime?.() || Date.now(),
      featuredImage: getImageUrlFromData(post.featuredImage, { preset: 'cover' }) || '',
      tags: post.tags || [],
    }));

    // Use saveObjects for bulk indexing (simpler API)
    // Use admin key for write operations
    const apiKey = ALGOLIA_ADMIN_KEY || ALGOLIA_API_KEY;
    const response = await fetch(`${ALGOLIA_URL}/1/indexes/${ALGOLIA_INDEX_NAME}/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-Id': ALGOLIA_APP_ID,
        'X-Algolia-API-Key': apiKey,
      },
      body: JSON.stringify({
        requests: objects.map(obj => ({
          action: 'addObject',
          body: obj,
        })),
      }),
    });

    console.log('Algolia batch response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Successfully bulk indexed ${objects.length} posts`, data);
    } else {
      const errorText = await response.text();
      console.error('Failed to bulk index posts:', response.status, errorText);
      throw new Error(`Algolia API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error bulk indexing posts:', error);
    throw error;
  }
}
