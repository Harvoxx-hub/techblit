// Server-side API calls for sitemap generation

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

    urls.push({
      loc: `${siteUrl}/blog`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: 0.9,
    });

    // Fetch published blog posts via API
    let posts: BlogPost[] = [];

    try {
      const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 
                            'https://us-central1-techblit.cloudfunctions.net';
      const API_BASE = `${FUNCTIONS_URL}/api/v1`;
      
      const response = await fetch(`${API_BASE}/posts?limit=1000`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const result = await response.json();
        posts = (result.data || result) as BlogPost[];
      }
    } catch (error) {
      console.error('Error fetching posts for sitemap:', error);
    }

    // Add blog post URLs with appropriate priority and lastmod
    posts.forEach((post) => {
      // Helper to convert Firestore timestamp to Date
      const toDate = (timestamp: any): Date => {
        if (!timestamp) return new Date();
        if (timestamp.toDate) return timestamp.toDate();
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        if (timestamp instanceof Date) return timestamp;
        return new Date();
      };

      const publishedDate = toDate(post.publishedAt);
      const updatedDate = toDate(post.updatedAt);
      
      // Use updatedAt if available, otherwise use publishedAt
      const lastmod = (post.updatedAt ? updatedDate : publishedDate).toISOString();
      
      // Calculate priority based on post age and recency
      const postAge = Date.now() - publishedDate.getTime();
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
      {
        loc: `${siteUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 0.9,
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

