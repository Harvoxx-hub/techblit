import { NextRequest, NextResponse } from 'next/server';
import apiService from '@/lib/apiService';
import { generateRobotsTxt } from '@/lib/sitemap';

export async function GET(request: NextRequest) {
  try {
    const siteUrl = process.env.SITE_URL || 'https://techblit.com';
    
    // Try to get custom robots.txt from settings via API
    let robotsContent = generateRobotsTxt(siteUrl);
    
    try {
      const settings = await apiService.getSettings();
      if (settings?.customRobotsTxt) {
        robotsContent = settings.customRobotsTxt as string;
      }
    } catch (settingsError) {
      // Use default if settings fetch fails
      console.warn('Failed to fetch settings for robots.txt:', settingsError);
    }
    
    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    
    // Return default robots.txt if there's an error
    const siteUrl = process.env.SITE_URL || 'https://techblit.com';
    const defaultRobots = generateRobotsTxt(siteUrl);
    
    return new NextResponse(defaultRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes on error
      },
    });
  }
}
