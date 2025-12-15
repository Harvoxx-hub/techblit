const { google } = require('googleapis');
const logger = require('firebase-functions/logger');

/**
 * Get authenticated Google Search Console API client
 * Uses service account credentials for OAuth2 JWT authentication
 */
function getSearchConsoleClient() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const siteUrl = process.env.SITE_URL || process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY_URL || 'https://www.techblit.com';

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Google service account credentials not configured. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY');
    }

    // Handle private key format - remove quotes if present and replace \n with actual newlines
    privateKey = privateKey.trim();
    
    // Remove surrounding quotes if present
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Create JWT auth client
    const jwtClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/webmasters', // Search Console API scope
        'https://www.googleapis.com/auth/indexing' // Indexing API scope
      ]
    });

    return jwtClient;
  } catch (error) {
    logger.error('Error creating Google Search Console client:', error);
    throw error;
  }
}

/**
 * Submit sitemap to Google Search Console
 * @param {string} sitemapUrl - The URL of the sitemap to submit
 * @param {string} siteUrl - The site URL (property URL in Search Console)
 * @returns {Promise<Object>} - Submission result
 */
async function submitSitemapToSearchConsole(sitemapUrl, siteUrl) {
  try {
    const jwtClient = getSearchConsoleClient();
    
    // Authorize the client
    await jwtClient.authorize();

    // Create the Search Console API client
    const searchConsole = google.webmasters({
      version: 'v3',
      auth: jwtClient
    });

    // Normalize site URL (remove trailing slash, ensure www)
    const normalizedSiteUrl = siteUrl.replace(/\/$/, '').replace(/^https?:\/\/(?!www\.)/, 'https://www.');

    // Submit the sitemap
    const response = await searchConsole.sitemaps.submit({
      siteUrl: normalizedSiteUrl,
      feedpath: sitemapUrl
    });

    logger.info(`Successfully submitted sitemap to Google Search Console: ${sitemapUrl} for ${normalizedSiteUrl}`);
    
    return {
      success: true,
      sitemapUrl: sitemapUrl,
      siteUrl: normalizedSiteUrl,
      response: response.data
    };

  } catch (error) {
    logger.error(`Error submitting sitemap to Google Search Console: ${sitemapUrl}`, error);
    
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 403) {
        logger.error('Permission denied. Ensure service account has Search Console access.');
      } else if (status === 400) {
        logger.error('Invalid request. Check sitemap URL format.');
      } else if (status === 404) {
        logger.error('Property not found. Verify site URL matches Search Console property.');
      }
      
      return {
        success: false,
        sitemapUrl: sitemapUrl,
        error: errorData?.error?.message || error.message,
        status: status
      };
    }
    
    return {
      success: false,
      sitemapUrl: sitemapUrl,
      error: error.message
    };
  }
}

/**
 * Get sitemap status from Google Search Console
 * @param {string} sitemapUrl - The URL of the sitemap
 * @param {string} siteUrl - The site URL (property URL in Search Console)
 * @returns {Promise<Object>} - Sitemap status
 */
async function getSitemapStatus(sitemapUrl, siteUrl) {
  try {
    const jwtClient = getSearchConsoleClient();
    await jwtClient.authorize();

    const searchConsole = google.webmasters({
      version: 'v3',
      auth: jwtClient
    });

    const normalizedSiteUrl = siteUrl.replace(/\/$/, '').replace(/^https?:\/\/(?!www\.)/, 'https://www.');

    const response = await searchConsole.sitemaps.get({
      siteUrl: normalizedSiteUrl,
      feedpath: sitemapUrl
    });

    return {
      success: true,
      sitemapUrl: sitemapUrl,
      status: response.data
    };

  } catch (error) {
    logger.error(`Error getting sitemap status for ${sitemapUrl}:`, error);
    return {
      success: false,
      sitemapUrl: sitemapUrl,
      error: error.message
    };
  }
}

/**
 * List all submitted sitemaps for a site
 * @param {string} siteUrl - The site URL (property URL in Search Console)
 * @returns {Promise<Object>} - List of sitemaps
 */
async function listSitemaps(siteUrl) {
  try {
    const jwtClient = getSearchConsoleClient();
    await jwtClient.authorize();

    const searchConsole = google.webmasters({
      version: 'v3',
      auth: jwtClient
    });

    const normalizedSiteUrl = siteUrl.replace(/\/$/, '').replace(/^https?:\/\/(?!www\.)/, 'https://www.');

    const response = await searchConsole.sitemaps.list({
      siteUrl: normalizedSiteUrl
    });

    return {
      success: true,
      siteUrl: normalizedSiteUrl,
      sitemaps: response.data.sitemap || []
    };

  } catch (error) {
    logger.error(`Error listing sitemaps for ${siteUrl}:`, error);
    return {
      success: false,
      siteUrl: siteUrl,
      error: error.message
    };
  }
}

module.exports = {
  submitSitemapToSearchConsole,
  getSitemapStatus,
  listSitemaps,
  getSearchConsoleClient
};


