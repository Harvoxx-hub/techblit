const { google } = require('googleapis');
const logger = require('firebase-functions/logger');

/**
 * Get authenticated Google Indexing API client
 * Uses service account credentials for OAuth2 JWT authentication
 */
function getIndexingClient() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_PROJECT_ID;

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
      scopes: ['https://www.googleapis.com/auth/indexing'], // Required scope for Indexing API
      projectId: projectId
    });

    return jwtClient;
  } catch (error) {
    logger.error('Error creating Google Indexing client:', error);
    throw error;
  }
}

/**
 * Submit URL to Google Indexing API for indexing
 * @param {string} url - The URL to index
 * @param {string} type - Notification type: 'URL_UPDATED' or 'URL_DELETED'
 * @returns {Promise<Object>} - API response
 */
async function submitUrlToIndexing(url, type = 'URL_UPDATED') {
  try {
    const jwtClient = getIndexingClient();
    
    // Authorize the client
    await jwtClient.authorize();

    // Create the indexing API client
    const indexing = google.indexing({
      version: 'v3',
      auth: jwtClient
    });

    // Submit the URL notification
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: type
      }
    });

    logger.info(`Successfully submitted URL to Google Indexing API: ${url} (${type})`);
    
    return {
      success: true,
      url: url,
      type: type,
      response: response.data
    };

  } catch (error) {
    logger.error(`Error submitting URL to Google Indexing API: ${url}`, error);
    
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 403) {
        logger.error('Permission denied. Ensure service account has Indexing API access and Search Console ownership.');
      } else if (status === 400) {
        logger.error('Invalid request. Check URL format and notification type.');
      } else if (status === 429) {
        logger.error('Rate limit exceeded. Too many requests.');
      }
      
      return {
        success: false,
        url: url,
        error: errorData?.error?.message || error.message,
        status: status
      };
    }
    
    return {
      success: false,
      url: url,
      error: error.message
    };
  }
}

/**
 * Submit multiple URLs to Google Indexing API
 * @param {string[]} urls - Array of URLs to index
 * @param {string} type - Notification type: 'URL_UPDATED' or 'URL_DELETED'
 * @param {number} delayMs - Delay between requests in milliseconds (default: 1000ms)
 * @returns {Promise<Object>} - Results summary
 */
async function submitUrlsToIndexing(urls, type = 'URL_UPDATED', delayMs = 1000) {
  const results = {
    total: urls.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const url of urls) {
    try {
      const result = await submitUrlToIndexing(url, type);
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          url: url,
          error: result.error
        });
      }

      // Add delay between requests to avoid rate limiting
      if (delayMs > 0 && urls.indexOf(url) < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        url: url,
        error: error.message
      });
    }
  }

  logger.info(`Google Indexing API batch submission completed: ${results.successful}/${results.total} successful`);
  
  return results;
}

/**
 * Get indexing status for a URL
 * @param {string} url - The URL to check
 * @returns {Promise<Object>} - Indexing status
 */
async function getIndexingStatus(url) {
  try {
    const jwtClient = getIndexingClient();
    await jwtClient.authorize();

    const indexing = google.indexing({
      version: 'v3',
      auth: jwtClient
    });

    const response = await indexing.urlNotifications.getMetadata({
      url: url
    });

    return {
      success: true,
      url: url,
      status: response.data
    };

  } catch (error) {
    logger.error(`Error getting indexing status for ${url}:`, error);
    return {
      success: false,
      url: url,
      error: error.message
    };
  }
}

module.exports = {
  submitUrlToIndexing,
  submitUrlsToIndexing,
  getIndexingStatus,
  getIndexingClient
};

