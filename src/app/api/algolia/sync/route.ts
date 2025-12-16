import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/apiService';
import { bulkIndexPosts } from '@/lib/algolia';
import { getImageUrlFromData } from '@/lib/imageHelpers';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  contentHtml?: string;
  category?: string;
  author?: string | { uid: string; name: string };
  publishedAt?: any;
  createdAt?: any;
  featuredImage?: {
    url: string;
    alt: string;
  };
  tags?: string[];
  status?: string;
}

// Helper function to strip HTML tags
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all published posts via API
    const posts = await apiService.getPosts({ limit: 1000 }) as BlogPost[];

    console.log(`Found ${posts.length} published posts to index`);

    // Transform posts for Algolia
    const algoliaObjects = posts.map((post) => {
      // Get text content from either content or contentHtml
      const textContent = post.contentHtml 
        ? stripHtmlTags(post.contentHtml)
        : (post.content || '');

      // Get author name
      const authorName = typeof post.author === 'string' 
        ? post.author 
        : post.author?.name || 'Unknown Author';

      // Get timestamp
      const timestamp = post.publishedAt?.toMillis?.() 
        || post.publishedAt?.toDate?.()?.getTime() 
        || post.createdAt?.toMillis?.()
        || post.createdAt?.toDate?.()?.getTime()
        || Date.now();

      return {
        objectID: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || '',
        content: textContent.substring(0, 5000),
        category: post.category || '',
        author: authorName,
        publishedAt: timestamp,
        featuredImage: getImageUrlFromData(post.featuredImage, { preset: 'cover' }) || '',
        tags: post.tags || [],
      };
    });

    // Upload to Algolia
    if (algoliaObjects.length > 0) {
      await bulkIndexPosts(algoliaObjects);
      console.log(`Successfully indexed ${algoliaObjects.length} posts to Algolia`);
    }

    return NextResponse.json({ 
      success: true, 
      indexed: algoliaObjects.length,
      message: `Successfully synced ${algoliaObjects.length} posts to Algolia`
    });

  } catch (error) {
    console.error('Error syncing to Algolia:', error);
    return NextResponse.json({ 
      error: 'Failed to sync to Algolia',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

