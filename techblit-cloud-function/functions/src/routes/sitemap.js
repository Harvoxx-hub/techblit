/**
 * Sitemap API Routes
 * 
 * Sitemap generation endpoint:
 * - GET /api/v1/sitemap - Generate and return sitemap XML (public)
 */

const express = require('express');
const router = express.Router();
const { generateSitemapXML } = require('../utils/sitemapGenerator');
const logger = require('firebase-functions/logger');

router.get('/', async (req, res) => {
  let siteUrl = process.env.SITE_URL || 'https://www.techblit.com';
  // Ensure www version for consistency
  siteUrl = siteUrl.replace(/^https?:\/\/(?!www\.)/, 'https://www.');
  
  try {
    // Generate the sitemap using the shared function
    const sitemapData = await generateSitemapXML(siteUrl);
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(sitemapData.xml);
    
    logger.info(`Sitemap served successfully with ${sitemapData.postCount} posts`);
    
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    
    // Return a basic sitemap on error (better than failing completely)
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.status(200).send(fallbackSitemap);
  }
});

module.exports = router;

