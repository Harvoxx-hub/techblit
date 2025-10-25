import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  publishedAt: any;
  updatedAt?: any;
  status: string;
}

/**
 * Generate sitemap data with lastmod and priority for all published posts
 */
export async function generateSitemap(): Promise<SitemapUrl[]> {
  const siteUrl = process.env.SITE_URL || 'https://techblit.com';
  const urls: SitemapUrl[] = [];

  try {
    // Add static pages
    urls.push({
      loc: siteUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 1.0,
    });

    urls.push({
      loc: `${siteUrl}/about`,
      lastmod: new Date().toISOString(),
      changefreq: 'monthly',
      priority: 0.8,
    });

    // Fetch published blog posts
    let posts: BlogPost[] = [];

    try {
      // Try to fetch from publicPosts collection first (optimized)
      const publicPostsRef = collection(db, 'publicPosts');
      const publicPostsQuery = query(
        publicPostsRef,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc')
      );
      
      const publicPostsSnapshot = await getDocs(publicPostsQuery);
      if (!publicPostsSnapshot.empty) {
        posts = publicPostsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BlogPost[];
      }
    } catch (publicPostsError) {
      console.warn('Failed to fetch from publicPosts, falling back to posts collection:', publicPostsError);
      
      // Fallback to posts collection
      const postsRef = collection(db, 'posts');
      const fallbackQuery = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc')
      );
      
      const postsSnapshot = await getDocs(fallbackQuery);
      posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
    }

    // Add blog post URLs with appropriate priority and lastmod
    posts.forEach((post) => {
      const lastmod = post.updatedAt 
        ? new Date(post.updatedAt.seconds * 1000).toISOString()
        : new Date(post.publishedAt.seconds * 1000).toISOString();
      
      // Calculate priority based on post age and recency
      const postAge = Date.now() - (post.publishedAt.seconds * 1000);
      const daysSincePublished = postAge / (1000 * 60 * 60 * 24);
      
      let priority = 0.7; // Default priority for blog posts
      
      // Higher priority for recent posts
      if (daysSincePublished < 7) {
        priority = 0.9;
      } else if (daysSincePublished < 30) {
        priority = 0.8;
      } else if (daysSincePublished < 90) {
        priority = 0.7;
      } else {
        priority = 0.6;
      }

      urls.push({
        loc: `${siteUrl}/${post.slug}`,
        lastmod,
        changefreq: 'weekly',
        priority,
      });
    });

    return urls;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return basic sitemap with static pages if there's an error
    return [
      {
        loc: siteUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${siteUrl}/about`,
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.8,
      },
    ];
  }
}

/**
 * Generate XML sitemap string
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';
  
  const urlEntries = urls.map(url => {
    return `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
  }).join('\n');

  return `${xmlHeader}\n${urlsetOpen}\n${urlEntries}\n${urlsetClose}`;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(siteUrl: string, customRules?: string): string {
  const defaultRules = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /preview/

Host: ${siteUrl}

Sitemap: ${siteUrl}/sitemap.xml`;

  return customRules || defaultRules;
}

