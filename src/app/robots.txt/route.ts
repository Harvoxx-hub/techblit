import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateRobotsTxt } from '@/lib/sitemap';

export async function GET(request: NextRequest) {
  try {
    const siteUrl = process.env.SITE_URL || 'https://techblit.com';
    
    // Try to get custom robots.txt from settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
    let robotsContent = generateRobotsTxt(siteUrl);
    
    if (settingsDoc.exists()) {
      const settings = settingsDoc.data();
      if (settings.customRobotsTxt) {
        robotsContent = settings.customRobotsTxt;
      }
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
