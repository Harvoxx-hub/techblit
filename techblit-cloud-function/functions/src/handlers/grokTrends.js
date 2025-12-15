// Grok Trends handlers
const { db } = require('../config/firebase');
const { CollectionNames, GrokStoryStatus, GrokCategory, PostStatus } = require('../types/constants');
const { createAuditLog, formatErrorResponse, formatSuccessResponse, generateUniqueSlug } = require('../utils/helpers');
const logger = require('firebase-functions/logger');

/**
 * Helper: Extract tweet ID from Twitter/X URL
 * Supports multiple URL formats:
 * - https://x.com/username/status/1234567890
 * - https://twitter.com/username/status/1234567890
 * - https://x.com/i/web/status/1234567890
 * - https://twitter.com/i/web/status/1234567890
 * @param {string} url - Twitter/X URL
 * @returns {string|null} - Tweet ID or null if invalid
 */
function extractTweetIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Remove query parameters and fragments
  const cleanUrl = url.split('?')[0].split('#')[0].trim();
  
  // Match Twitter/X URL patterns
  const patterns = [
    /(?:twitter\.com|x\.com)\/(?:\w+\/)?status\/(\d+)/i,
    /(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/i,
    /\/status\/(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Helper: Detect placeholder/fake tweet IDs
 * Common patterns: sequential numbers, repeated digits, obvious placeholders
 * @param {string} tweetId - The tweet ID to check
 * @returns {boolean} - True if appears to be a placeholder
 */
function isPlaceholderTweetId(tweetId) {
  if (!tweetId || typeof tweetId !== 'string') return true;
  
  const cleanId = tweetId.trim();
  
  // Check for common placeholder patterns
  const placeholderPatterns = [
    /^1234567890+/,           // Starts with 1234567890...
    /^12345+$/,                // All 12345...
    /^(\d)\1{14,19}$/,         // All same digit (e.g., 1111111111111111)
    /^123456789012345/,        // Common placeholder sequence
    /^(\d)\1{10,}$/,           // Repeated single digit
    /^123\d{12,17}$/,          // Starts with 123 followed by digits
    /^(\d{2})\1{7,9}$/,        // Repeated 2-digit pattern
    /^(\d{3})\1{4,6}$/,        // Repeated 3-digit pattern
    /^(\d{4})\1{3,4}$/,        // Repeated 4-digit pattern
    /^(\d{5})\1{2,3}$/         // Repeated 5-digit pattern
  ];
  
  for (const pattern of placeholderPatterns) {
    if (pattern.test(cleanId)) {
      return true;
    }
  }
  
  // Check for sequential ascending pattern (like 1234567890123456791)
  if (cleanId.length >= 15) {
    let sequentialCount = 0;
    let maxSequential = 0;
    for (let i = 1; i < cleanId.length; i++) {
      const prev = parseInt(cleanId[i - 1]);
      const curr = parseInt(cleanId[i]);
      if (curr === (prev + 1) % 10 || (prev === 9 && curr === 0)) {
        sequentialCount++;
        maxSequential = Math.max(maxSequential, sequentialCount);
      } else {
        sequentialCount = 0;
      }
    }
    // If more than 10 sequential digits, likely a placeholder
    if (maxSequential >= 10) {
      return true;
    }
  }
  
  return false;
}

/**
 * Helper: Validate if a string is a valid Twitter tweet ID
 * Tweet IDs are numeric strings, typically 15-20 digits
 * Also checks for placeholder patterns
 * @param {string} tweetId - The tweet ID to validate
 * @returns {boolean} - True if valid
 */
function isValidTweetId(tweetId) {
  if (!tweetId || typeof tweetId !== 'string') return false;
  
  // Remove whitespace
  const cleanId = tweetId.trim();
  
  // Must be numeric and between 15-20 digits (typical Twitter ID length)
  if (!/^\d{15,20}$/.test(cleanId)) {
    return false;
  }
  
  // Check for placeholder patterns
  if (isPlaceholderTweetId(cleanId)) {
    logger.warn('Detected placeholder tweet ID:', cleanId);
    return false;
  }
  
  return true;
}

/**
 * Helper: Validate Twitter/X URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid Twitter/X URL
 */
function isValidTwitterUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const cleanUrl = url.trim().toLowerCase();
  
  // Must start with http/https
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return false;
  }
  
  // Must contain twitter.com or x.com
  if (!cleanUrl.includes('twitter.com') && !cleanUrl.includes('x.com')) {
    return false;
  }
  
  // Must not be example.com or placeholder
  if (cleanUrl.includes('example.com') || 
      cleanUrl.includes('placeholder') ||
      cleanUrl.includes('test.com') ||
      cleanUrl.includes('dummy')) {
    return false;
  }
  
  // Try to extract tweet ID to validate
  const tweetId = extractTweetIdFromUrl(url);
  if (tweetId === null) {
    return false;
  }
  
  // Validate tweet ID format and check for placeholders
  if (!isValidTweetId(tweetId)) {
    logger.warn('Invalid or placeholder tweet ID in URL:', { url, tweetId });
    return false;
  }
  
  return true;
}

/**
 * Helper: Construct Twitter/X URL from tweet ID
 * @param {string} tweetId - The tweet ID
 * @returns {string} - The Twitter/X URL (validated)
 */
function constructTwitterUrl(tweetId) {
  if (!tweetId) return '';
  
  // Remove any whitespace and ensure it's a valid tweet ID
  const cleanId = String(tweetId).trim();
  
  // Validate tweet ID format
  if (!isValidTweetId(cleanId)) {
    logger.warn('Invalid tweet ID format:', cleanId);
    return '';
  }
  
  // Construct URL using x.com (works without username)
  return `https://x.com/i/web/status/${cleanId}`;
}

/**
 * Helper: Validate and correct primary link
 * Step-by-step validation process:
 * 1. Check if primary_link is a valid Twitter URL
 * 2. Extract tweet ID from primary_link if valid
 * 3. Validate tweet ID from x_post_ids
 * 4. Construct URL from first valid x_post_id
 * 5. Return the best available link
 * @param {Object} story - The story object
 * @returns {string} - Validated primary link URL
 */
function getPrimaryLink(story) {
  // Step 1: Validate primary_link if it exists
  if (story.primary_link) {
    const primaryLink = String(story.primary_link).trim();
    
    // Check if it's a valid Twitter URL
    if (isValidTwitterUrl(primaryLink)) {
      // Extract and validate tweet ID
      const tweetId = extractTweetIdFromUrl(primaryLink);
      if (tweetId && isValidTweetId(tweetId)) {
        return primaryLink;
      }
    }
    
    // If primary_link exists but is invalid, log warning
    if (primaryLink && !primaryLink.includes('example.com')) {
      logger.warn('Invalid primary_link, will try x_post_ids:', {
        primary_link: primaryLink,
        story_id: story.id || 'new'
      });
    }
  }
  
  // Step 2: Try to construct from x_post_ids
  if (story.x_post_ids && Array.isArray(story.x_post_ids) && story.x_post_ids.length > 0) {
    // Try each x_post_id until we find a valid one
    for (const postId of story.x_post_ids) {
      if (isValidTweetId(postId)) {
        const constructedUrl = constructTwitterUrl(postId);
        if (constructedUrl) {
          return constructedUrl;
        }
      }
    }
    
    // If we have x_post_ids but none are valid, log warning
    logger.warn('x_post_ids provided but none are valid tweet IDs:', {
      x_post_ids: story.x_post_ids,
      story_id: story.id || 'new'
    });
  }
  
  // Step 3: No valid link found
  logger.warn('No valid source link found for story:', {
    story_id: story.id || 'new',
    title: story.title || 'Unknown',
    primary_link: story.primary_link,
    x_post_ids: story.x_post_ids
  });
  
  return '';
}

/**
 * Get all Grok stories with optional filtering
 */
async function getGrokStories(req, res) {
  try {
    const { status, category, limit = 100, offset = 0 } = req.query;
    
    // Log request for debugging
    logger.info('getGrokStories called', {
      status,
      category,
      limit,
      offset,
      queryParams: req.query
    });
    
    let query = db.collection(CollectionNames.GROK_STORIES);
    const hasFilters = (status && status !== 'all') || (category && category !== 'all');
    
    // Apply filters with validation
    if (status && status !== 'all' && status.trim() !== '') {
      query = query.where('status', '==', status.trim());
    }
    
    if (category && category !== 'all' && category.trim() !== '') {
      query = query.where('category', '==', category.trim());
    }
    
    // When using filters with orderBy, Firestore requires a composite index
    // To avoid index errors, we'll fetch all matching docs and sort in memory
    // For better performance, increase limit when filtering (we'll limit after sorting)
    const fetchLimit = hasFilters ? 1000 : parseInt(limit);
    const finalLimit = parseInt(limit) || 100;
    
    let snapshot;
    try {
      // Try to order in query if no filters (more efficient)
      if (!hasFilters) {
        query = query.orderBy('first_seen_at', 'desc').limit(fetchLimit);
      } else {
        // With filters, don't use orderBy (requires composite index)
        // We'll sort in memory instead
        query = query.limit(fetchLimit);
      }
      snapshot = await query.get();
    } catch (queryError) {
      logger.error('Query error:', {
        code: queryError.code,
        message: queryError.message,
        hasFilters,
        status,
        category,
        stack: queryError.stack
      });
      
      // If query fails (e.g., missing index), try without orderBy
      if (queryError.code === 9 || queryError.message?.includes('index') || queryError.message?.includes('requires an index')) {
        logger.warn('Query requires composite index. Fetching without orderBy and sorting in memory:', queryError.message);
        // Rebuild query without orderBy
        query = db.collection(CollectionNames.GROK_STORIES);
        if (status && status !== 'all' && status.trim() !== '') {
          query = query.where('status', '==', status.trim());
        }
        if (category && category !== 'all' && category.trim() !== '') {
          query = query.where('category', '==', category.trim());
        }
        query = query.limit(fetchLimit);
        snapshot = await query.get();
      } else {
        // Re-throw the error so it's caught by outer try-catch
        throw queryError;
      }
    }
    
    let stories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    });
    
    // Always sort by first_seen_at in memory (handles both filtered and unfiltered cases)
    stories = stories.sort((a, b) => {
      try {
        const aDate = a.first_seen_at?.toDate ? a.first_seen_at.toDate() : 
                      (a.first_seen_at ? new Date(a.first_seen_at) : new Date(0));
        const bDate = b.first_seen_at?.toDate ? b.first_seen_at.toDate() : 
                      (b.first_seen_at ? new Date(b.first_seen_at) : new Date(0));
        return bDate.getTime() - aDate.getTime(); // Descending order (newest first)
      } catch (sortError) {
        logger.warn('Error sorting story:', { id: a.id, error: sortError.message });
        return 0; // Keep original order if sort fails
      }
    });
    
    // Apply limit after sorting
    stories = stories.slice(0, finalLimit);
    
    res.json(formatSuccessResponse(stories, 'Stories retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving Grok stories:', error);
    logger.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      queryParams: req.query
    });
    
    // Provide helpful error message for index errors
    let errorMessage = error.message || 'Error retrieving stories';
    if (error.code === 9 || error.message?.includes('index')) {
      errorMessage = 'Firestore index required. Please create a composite index for grok_stories collection with fields: status, category, and first_seen_at. Check Firebase Console for the index creation link.';
    }
    
    // Ensure we always return valid JSON
    try {
      res.status(500).json(formatErrorResponse(errorMessage, 500, { 
        error: error.message,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }));
    } catch (jsonError) {
      // Fallback if JSON serialization fails
      logger.error('Failed to send error response:', jsonError);
      res.status(500).json({
        success: false,
        error: {
          message: errorMessage,
          code: 500
        }
      });
    }
  }
}

/**
 * Update story status (archive/restore)
 */
async function updateStoryStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!Object.values(GrokStoryStatus).includes(status)) {
      return res.status(400).json(formatErrorResponse('Invalid status', 400));
    }
    
    const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(id);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return res.status(404).json(formatErrorResponse('Story not found', 404));
    }
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (status === GrokStoryStatus.ARCHIVED) {
      updateData.archivedAt = new Date();
      updateData.archivedBy = req.user.uid;
    } else if (status === GrokStoryStatus.NEW && storyDoc.data().status === GrokStoryStatus.ARCHIVED) {
      // Restoring from archived
      updateData.restoredAt = new Date();
      updateData.restoredBy = req.user.uid;
    }
    
    await storyRef.update(updateData);
    
    // Create audit log
    const auditLog = createAuditLog('grok_story_status_updated', req.user.uid, id, {
      oldStatus: storyDoc.data().status,
      newStatus: status
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(null, 'Story status updated'));
  } catch (error) {
    logger.error('Error updating story status:', error);
    res.status(500).json(formatErrorResponse('Error updating story', 500, { error: error.message }));
  }
}

/**
 * Get Grok trends statistics
 */
async function getGrokStats(req, res) {
  try {
    const snapshot = await db.collection(CollectionNames.GROK_STORIES).get();
    
    const stats = {
      total: 0,
      new: 0,
      draft_created: 0,
      published: 0,
      archived: 0,
      byCategory: {}
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      if (data.status in stats) {
        stats[data.status]++;
      }
      
      if (!stats.byCategory[data.category]) {
        stats.byCategory[data.category] = 0;
      }
      stats.byCategory[data.category]++;
    });
    
    res.json(formatSuccessResponse(stats, 'Stats retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving stats:', error);
    res.status(500).json(formatErrorResponse('Error retrieving stats', 500, { error: error.message }));
  }
}

/**
 * Manual trigger to fetch stories from Grok API
 */
async function fetchGrokStories(req, res) {
  try {
    const { category, autoGenerateDrafts = false, engagementThreshold = 5000 } = req.body;
    
    // Get the appropriate prompt based on category
    const prompts = getGrokPrompts();
    const prompt = category ? prompts[category] : prompts[GrokCategory.TRENDING];
    
    if (!prompt) {
      return res.status(400).json(formatErrorResponse('Invalid category', 400));
    }
    
    // Call Grok API
    const response = await callGrokAPI(prompt);
    const data = JSON.parse(response);
    
    // Deduplicate and store stories
    const stored = [];
    const skipped = [];
    let draftsGenerated = 0;
    
    for (const story of data.stories || []) {
      try {
        // Parse first_seen_at date
        let firstSeenAt = new Date();
        if (story.first_seen_at) {
          firstSeenAt = new Date(story.first_seen_at);
          if (isNaN(firstSeenAt.getTime())) {
            firstSeenAt = new Date();
          }
        }
        
        // Validate recency based on category
        const now = new Date();
        let maxAgeHours = 24; // Default for trending
        if (category === GrokCategory.BREAKING_NEWS) maxAgeHours = 2; // 90 minutes = ~1.5 hours, use 2 for safety
        else if (category === GrokCategory.COMPANY_NEWS || category === GrokCategory.REGULATORY || category === GrokCategory.SECURITY) maxAgeHours = 48;
        else if (category === GrokCategory.PRODUCT_LAUNCHES) maxAgeHours = 72;
        else if (category === GrokCategory.FUNDING) maxAgeHours = 168; // 7 days
        else if (category === GrokCategory.EMERGING_TECH) maxAgeHours = 96;
        
        const storyAgeHours = (now.getTime() - firstSeenAt.getTime()) / (1000 * 60 * 60);
        if (storyAgeHours > maxAgeHours) {
          skipped.push({ 
            title: story.title, 
            reason: `too old (${Math.round(storyAgeHours)}h old, max ${maxAgeHours}h)` 
          });
          logger.warn(`Skipping old story: ${story.title} - ${Math.round(storyAgeHours)}h old`);
          continue;
        }
        
        // Validate tweet IDs are not placeholders
        if (story.x_post_ids && story.x_post_ids.length > 0) {
          const invalidIds = story.x_post_ids.filter(id => isPlaceholderTweetId(id));
          if (invalidIds.length > 0) {
            skipped.push({ 
              title: story.title, 
              reason: `invalid tweet IDs: ${invalidIds.join(', ')}` 
            });
            logger.warn(`Skipping story with invalid tweet IDs: ${story.title} - IDs: ${invalidIds.join(', ')}`);
            continue;
          }
        }
        
        // Check for duplicates by x_post_ids (check first post ID)
        if (story.x_post_ids && story.x_post_ids.length > 0) {
          const firstPostId = story.x_post_ids[0];
          const existingQuery = await db.collection(CollectionNames.GROK_STORIES)
            .where('x_post_ids', 'array-contains', firstPostId)
            .limit(1)
            .get();
          
          if (!existingQuery.empty) {
            skipped.push({ title: story.title, reason: 'duplicate' });
            continue;
          }
        }
        
        // Validate and construct primary_link using step-by-step validation
        const tempStoryForValidation = {
          primary_link: story.primary_link,
          x_post_ids: story.x_post_ids || [],
          id: 'new',
          title: story.title
        };
        const primaryLink = getPrimaryLink(tempStoryForValidation);
        
        // Log if we had to correct the link
        if (story.primary_link && story.primary_link !== primaryLink) {
          logger.info('Corrected primary_link in fetchGrokStories (manual):', {
            original: story.primary_link,
            corrected: primaryLink,
            title: story.title
          });
        }
        
        const storyData = {
          title: story.title || 'Untitled Story',
          summary: story.summary || '',
          category: data.category || category || GrokCategory.TRENDING,
          x_post_ids: story.x_post_ids || [],
          primary_link: primaryLink,
          engagement_score: story.engagement_score || 0,
          author_handles: story.author_handles || [],
          media_urls: story.media_urls || [],
          first_seen_at: firstSeenAt,
          fetched_at: new Date(),
          status: GrokStoryStatus.NEW,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const docRef = await db.collection(CollectionNames.GROK_STORIES).add(storyData);
        stored.push({ id: docRef.id, title: story.title });
        
        // Auto-generate draft if enabled and engagement threshold met
        if (autoGenerateDrafts && storyData.engagement_score >= engagementThreshold) {
          try {
            const draftResult = await autoGenerateDraft(docRef.id, storyData);
            if (draftResult.success) {
              draftsGenerated++;
            }
          } catch (draftError) {
            logger.warn(`Failed to auto-generate draft for story ${docRef.id}:`, draftError);
            // Don't fail the whole fetch if draft generation fails
          }
        }
      } catch (storyError) {
        logger.error(`Error storing story "${story.title}":`, storyError);
        skipped.push({ title: story.title, reason: 'error', error: storyError.message });
      }
    }
    
    // Create audit log
    const auditLog = createAuditLog('grok_stories_fetched', req.user?.uid || 'system', 'grok_stories', {
      category: category || 'all',
      fetched: data.stories?.length || 0,
      stored: stored.length,
      skipped: skipped.length,
      draftsGenerated
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse({
      fetched: data.stories?.length || 0,
      stored: stored.length,
      skipped: skipped.length,
      draftsGenerated,
      stories: stored,
      skipped_stories: skipped
    }, 'Stories fetched successfully'));
  } catch (error) {
    logger.error('Error fetching stories:', error);
    res.status(500).json(formatErrorResponse('Error fetching stories', 500, { error: error.message }));
  }
}

/**
 * Auto-generate draft for a story (internal helper function)
 * Used by scheduled fetch to automatically generate drafts for high-engagement stories
 */
async function autoGenerateDraft(storyId, storyData) {
  try {
    // Check if draft already exists
    if (storyData.draft_body && storyData.draft_title) {
      logger.info(`Draft already exists for story ${storyId}, skipping auto-generation`);
      return { success: false, reason: 'draft_exists' };
    }
    
    // Map Grok category to post category
    const categoryMap = {
      'Breaking News': 'Tech News',
      'Trending Stories': 'Tech News',
      'Company News': 'Tech News',
      'Product Launches & Reviews': 'Tech News',
      'Funding & Investments': 'Funding',
      'Regulatory & Policy Changes': 'Tech News',
      'Security & Hacking': 'Tech News',
      'Emerging Technologies': 'AI & Innovation'
    };
    
    const postCategory = categoryMap[storyData.category] || 'Tech News';
    
    // Generate tags from story
    const generateTags = (story) => {
      const tags = [];
      const categoryLower = story.category.toLowerCase();
      
      if (categoryLower.includes('funding')) tags.push('funding', 'startup', 'investment');
      if (categoryLower.includes('breaking') || categoryLower.includes('security')) tags.push('breaking', 'news');
      if (categoryLower.includes('company')) tags.push('company', 'business');
      if (categoryLower.includes('product')) tags.push('product', 'launch');
      if (categoryLower.includes('regulatory')) tags.push('regulation', 'policy');
      if (categoryLower.includes('emerging') || categoryLower.includes('ai')) tags.push('AI', 'innovation', 'technology');
      
      tags.push('Nigeria', 'Africa', 'tech');
      
      if (story.author_handles && story.author_handles.length > 0) {
        story.author_handles.slice(0, 3).forEach(handle => {
          if (handle.startsWith('@')) {
            tags.push(handle.substring(1));
          }
        });
      }
      
      return [...new Set(tags)];
    };
    
    // Create prompt for draft generation
    const draftPrompt = `You are a professional tech journalist writing for TechBlit, a leading African tech news platform focused on Nigeria's tech ecosystem.

Generate a comprehensive, well-structured blog post based on this tech news story:

**Story Title:** ${storyData.title}
**Summary:** ${storyData.summary}
**Category:** ${storyData.category}
**Engagement Score:** ${storyData.engagement_score || 0}
${getPrimaryLink(storyData) ? `**Source Link:** ${getPrimaryLink(storyData)}` : ''}
${storyData.author_handles && storyData.author_handles.length > 0 ? `**Author(s):** ${storyData.author_handles.join(', ')}` : ''}
${storyData.media_urls && storyData.media_urls.length > 0 ? `**Available Media URLs:** ${JSON.stringify(storyData.media_urls)}` : ''}

**Requirements:**
1. Write a professional, engaging blog post (400-800 words)
2. Use a neutral, journalistic tone suitable for tech news
3. Include context relevant to Nigeria's tech ecosystem
4. Structure with clear paragraphs and subheadings
5. Include relevant background information
6. Add a call-to-action or conclusion paragraph
7. Ensure SEO-friendly content

**Output Format (JSON only, no markdown):**
{
  "title": "Engaging, SEO-optimized title (60-70 characters)",
  "content": "Full HTML content with <p> tags, <h2> subheadings, and proper formatting. Include source attribution at the end.",
  "excerpt": "Compelling excerpt/summary (150-160 characters) for meta description",
  "metaTitle": "SEO meta title (50-60 characters, can be same as title)",
  "metaDescription": "SEO meta description (150-160 characters, can be same as excerpt)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedCategory": "${postCategory}",
  "recommendedImages": [
    {
      "url": "https://example.com/image1.jpg",
      "description": "Brief description of why this image is relevant",
      "source": "Source of the image (e.g., 'Tweet media', 'Company website')"
    }
  ]
}

**Image Recommendations:**
- Analyze the story content and suggest 3-5 relevant images
- Images should be related to the story topic, companies mentioned, or tech concepts
- Include images from tweet media if available (check story.media_urls)
- Provide direct image URLs (must be publicly accessible)
- Each image should have a brief description explaining its relevance
- Prioritize high-quality, professional images suitable for blog headers

**Important:** 
- Output ONLY valid JSON
- No markdown formatting in content field, use HTML tags
- Content should be ready for publication with proper HTML structure
- Include source link in content if available
- Make it engaging and informative for Nigerian tech audience`;

    // Call Grok API
    const grokResponse = await callGrokAPI(draftPrompt);
    let draft;
    
    try {
      draft = JSON.parse(grokResponse);
    } catch (parseError) {
      const jsonMatch = grokResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        draft = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse Grok response as JSON');
      }
    }
    
    if (!draft.title || !draft.content) {
      throw new Error('Generated draft missing required fields');
    }
    
    const tags = draft.tags && draft.tags.length > 0 ? draft.tags : generateTags(storyData);
    const metaTitle = (draft.metaTitle || draft.title || storyData.title).substring(0, 60).trim();
    const metaDescription = (draft.metaDescription || draft.excerpt || storyData.summary).substring(0, 160).trim();
    
    // Add source attribution - use getPrimaryLink to ensure we have a valid link
    let contentHtml = draft.content;
    const primaryLink = getPrimaryLink(storyData);
    if (primaryLink && !contentHtml.includes('Source:') && !contentHtml.includes('source')) {
      contentHtml += `\n\n<div class="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">`;
      contentHtml += `<p class="text-sm text-gray-600 mb-2"><strong>Source:</strong></p>`;
      contentHtml += `<p class="text-sm"><a href="${primaryLink}" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-800 underline">View original post on X (Twitter)</a></p>`;
      if (storyData.author_handles && storyData.author_handles.length > 0) {
        contentHtml += `<p class="text-xs text-gray-500 mt-2">From: ${storyData.author_handles.join(', ')}</p>`;
      }
      contentHtml += `</div>`;
    }
    
    // Extract recommended images from draft response
    const recommendedImages = draft.recommendedImages || [];
    
    // Also include media URLs from the story if available
    if (storyData.media_urls && storyData.media_urls.length > 0) {
      storyData.media_urls.forEach(url => {
        // Avoid duplicates
        if (!recommendedImages.find(img => img.url === url)) {
          recommendedImages.push({
            url: url,
            description: 'Image from original tweet',
            source: 'Tweet media'
          });
        }
      });
    }
    
    // Update story with draft
    const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(storyId);
    await storyRef.update({
      draft_body: contentHtml,
      draft_title: draft.title,
      draft_excerpt: draft.excerpt || storyData.summary.substring(0, 160),
      draft_meta_title: metaTitle,
      draft_meta_description: metaDescription,
      suggested_tags: tags,
      recommended_images: recommendedImages.slice(0, 5), // Store recommended images
      draftGeneratedAt: new Date(),
      draftGeneratedBy: 'system_auto',
      status: GrokStoryStatus.DRAFT_CREATED
    });
    
    // Create audit log
    try {
      const auditLog = createAuditLog('grok_draft_auto_generated', 'system', storyId, {
        title: draft.title,
        category: draft.suggestedCategory || postCategory,
        engagement_score: storyData.engagement_score
      });
      await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    } catch (auditError) {
      logger.warn('Failed to create audit log for auto-draft:', auditError);
    }
    
    logger.info(`Auto-generated draft for story ${storyId} (engagement: ${storyData.engagement_score})`);
    return { success: true, title: draft.title };
  } catch (error) {
    logger.error(`Error auto-generating draft for story ${storyId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get auto-draft configuration (helper for scheduled functions)
 */
async function getAutoDraftConfigInternal() {
  try {
    const configDoc = await db.collection('grok_config').doc('auto_draft').get();
    if (configDoc.exists) {
      const config = configDoc.data();
      return {
        enabled: config.enabled || false,
        engagementThreshold: config.engagementThreshold || 5000,
        categories: config.categories || []
      };
    }
    return { enabled: false, engagementThreshold: 5000, categories: [] };
  } catch (error) {
    logger.warn('Error reading auto-draft config, using defaults:', error);
    return { enabled: false, engagementThreshold: 5000, categories: [] };
  }
}

/**
 * Scheduled fetch function (called by Cloud Scheduler)
 * Now includes optional auto-draft generation for high-engagement stories
 */
async function scheduledFetch(category = null, options = {}) {
  try {
    // Get auto-draft config from Firestore (if not provided in options)
    let autoGenerateDrafts = options.autoGenerateDrafts;
    let engagementThreshold = options.engagementThreshold;
    
    if (autoGenerateDrafts === undefined || engagementThreshold === undefined) {
      const config = await getAutoDraftConfigInternal();
      autoGenerateDrafts = autoGenerateDrafts !== undefined ? autoGenerateDrafts : config.enabled;
      engagementThreshold = engagementThreshold || config.engagementThreshold;
      
      // Check if this category is enabled for auto-draft
      if (autoGenerateDrafts && config.categories && config.categories.length > 0) {
        autoGenerateDrafts = config.categories.includes(category) || config.categories.length === 0;
      }
    }
    logger.info(`Starting scheduled Grok fetch for category: ${category || 'Trending Stories'}`, {
      autoGenerateDrafts,
      engagementThreshold
    });
    
    const prompts = getGrokPrompts();
    const prompt = category ? prompts[category] : prompts[GrokCategory.TRENDING];
    
    if (!prompt) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    // Call Grok API
    const response = await callGrokAPI(prompt);
    const data = JSON.parse(response);
    
    let stored = 0;
    let skipped = 0;
    let draftsGenerated = 0;
    
    for (const story of data.stories || []) {
      try {
        // Parse first_seen_at date
        let firstSeenAt = new Date();
        if (story.first_seen_at) {
          firstSeenAt = new Date(story.first_seen_at);
          if (isNaN(firstSeenAt.getTime())) {
            firstSeenAt = new Date();
          }
        }
        
        // Validate recency based on category
        const now = new Date();
        let maxAgeHours = 24; // Default for trending
        if (category === GrokCategory.BREAKING_NEWS) maxAgeHours = 2; // 90 minutes = ~1.5 hours, use 2 for safety
        else if (category === GrokCategory.COMPANY_NEWS || category === GrokCategory.REGULATORY || category === GrokCategory.SECURITY) maxAgeHours = 48;
        else if (category === GrokCategory.PRODUCT_LAUNCHES) maxAgeHours = 72;
        else if (category === GrokCategory.FUNDING) maxAgeHours = 168; // 7 days
        else if (category === GrokCategory.EMERGING_TECH) maxAgeHours = 96;
        
        const storyAgeHours = (now.getTime() - firstSeenAt.getTime()) / (1000 * 60 * 60);
        if (storyAgeHours > maxAgeHours) {
          skipped++;
          logger.warn(`Skipping old story in scheduled fetch: ${story.title} - ${Math.round(storyAgeHours)}h old (max ${maxAgeHours}h)`);
          continue;
        }
        
        // Validate tweet IDs are not placeholders
        if (story.x_post_ids && story.x_post_ids.length > 0) {
          const invalidIds = story.x_post_ids.filter(id => isPlaceholderTweetId(id));
          if (invalidIds.length > 0) {
            skipped++;
            logger.warn(`Skipping story with invalid tweet IDs in scheduled fetch: ${story.title} - IDs: ${invalidIds.join(', ')}`);
            continue;
          }
        }
        
        // Check for duplicates
        if (story.x_post_ids && story.x_post_ids.length > 0) {
          const firstPostId = story.x_post_ids[0];
          const existingQuery = await db.collection(CollectionNames.GROK_STORIES)
            .where('x_post_ids', 'array-contains', firstPostId)
            .limit(1)
            .get();
          
          if (!existingQuery.empty) {
            skipped++;
            continue;
          }
        }
        
        // Validate and construct primary_link using step-by-step validation
        const tempStoryForValidation = {
          primary_link: story.primary_link,
          x_post_ids: story.x_post_ids || [],
          id: 'new',
          title: story.title
        };
        const primaryLink = getPrimaryLink(tempStoryForValidation);
        
        // Log if we had to correct the link
        if (story.primary_link && story.primary_link !== primaryLink) {
          logger.info('Corrected primary_link in fetchGrokStories:', {
            original: story.primary_link,
            corrected: primaryLink,
            title: story.title
          });
        }
        
        const storyData = {
          title: story.title || 'Untitled Story',
          summary: story.summary || '',
          category: data.category || category || GrokCategory.TRENDING,
          x_post_ids: story.x_post_ids || [],
          primary_link: primaryLink,
          engagement_score: story.engagement_score || 0,
          author_handles: story.author_handles || [],
          media_urls: story.media_urls || [],
          first_seen_at: firstSeenAt,
          fetched_at: new Date(),
          status: GrokStoryStatus.NEW,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Store story
        const storyRef = await db.collection(CollectionNames.GROK_STORIES).add(storyData);
        stored++;
        
        // Auto-generate draft if enabled and engagement threshold met
        if (autoGenerateDrafts && storyData.engagement_score >= engagementThreshold) {
          try {
            const draftResult = await autoGenerateDraft(storyRef.id, storyData);
            if (draftResult.success) {
              draftsGenerated++;
              logger.info(`Auto-generated draft for high-engagement story: ${storyData.title} (score: ${storyData.engagement_score})`);
            }
          } catch (draftError) {
            logger.warn(`Failed to auto-generate draft for story ${storyRef.id}:`, draftError);
            // Don't fail the whole fetch if draft generation fails
          }
        }
      } catch (storyError) {
        logger.error(`Error storing story in scheduled fetch:`, storyError);
        skipped++;
      }
    }
    
    logger.info(`Scheduled fetch completed: ${stored} stored, ${skipped} skipped, ${draftsGenerated} drafts auto-generated`);
    
    return {
      success: true,
      fetched: data.stories?.length || 0,
      stored,
      skipped,
      draftsGenerated
    };
  } catch (error) {
    logger.error('Error in scheduled fetch:', error);
    throw error;
  }
}

/**
 * Helper: Call Grok API
 */
async function callGrokAPI(prompt) {
  // Firebase Functions v2 uses process.env directly
  // For v1 config, you'd use functions.config().grok.api_key
  const XAI_API_KEY = process.env.XAI_API_KEY || 
                      process.env.GROK_API_KEY || 
                      (process.env.FUNCTIONS_EMULATOR ? process.env.XAI_API_KEY : null);
  
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY not configured. Set it using: firebase functions:secrets:set XAI_API_KEY');
  }
  
  const GROK_MODEL ='grok-3';
  const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
  
  const systemPrompt = `You are a tech news analyst focused on Nigeria's tech ecosystem. 
Analyze X (Twitter) posts and extract relevant tech news stories. 
Output ONLY valid JSON. No explanations, no markdown, no extra text.`;
  
  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response format from Grok API');
  }
  
  return data.choices[0].message.content;
}

/**
 * Generate blog draft from Grok story using AI
 */
async function generateDraft(req, res) {
  try {
    const { id } = req.params;
    
    const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(id);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return res.status(404).json(formatErrorResponse('Story not found', 404));
    }
    
    const story = storyDoc.data();
    
    // If draft already exists, return it
    if (story.draft_body && story.draft_title) {
      return res.json(formatSuccessResponse({
        title: story.draft_title,
        content: story.draft_body,
        excerpt: story.draft_excerpt || story.summary,
        metaTitle: story.draft_meta_title || story.draft_title,
        metaDescription: story.draft_meta_description || story.draft_excerpt || story.summary,
        tags: story.suggested_tags || [],
        category: story.category,
        recommendedImages: story.recommended_images || []
      }, 'Draft retrieved successfully'));
    }
    
    // Map Grok category to post category
    const categoryMap = {
      'Breaking News': 'Tech News',
      'Trending Stories': 'Tech News',
      'Company News': 'Tech News',
      'Product Launches & Reviews': 'Tech News',
      'Funding & Investments': 'Funding',
      'Regulatory & Policy Changes': 'Tech News',
      'Security & Hacking': 'Tech News',
      'Emerging Technologies': 'AI & Innovation'
    };
    
    const postCategory = categoryMap[story.category] || 'Tech News';
    
    // Generate tags from story
    const generateTags = (storyData) => {
      const tags = [];
      const categoryLower = storyData.category.toLowerCase();
      
      if (categoryLower.includes('funding')) tags.push('funding', 'startup', 'investment');
      if (categoryLower.includes('breaking') || categoryLower.includes('security')) tags.push('breaking', 'news');
      if (categoryLower.includes('company')) tags.push('company', 'business');
      if (categoryLower.includes('product')) tags.push('product', 'launch');
      if (categoryLower.includes('regulatory')) tags.push('regulation', 'policy');
      if (categoryLower.includes('emerging') || categoryLower.includes('ai')) tags.push('AI', 'innovation', 'technology');
      
      // Add Nigeria/Africa tags
      tags.push('Nigeria', 'Africa', 'tech');
      
      // Add author handles as tags if available
      if (storyData.author_handles && storyData.author_handles.length > 0) {
        storyData.author_handles.slice(0, 3).forEach(handle => {
          if (handle.startsWith('@')) {
            tags.push(handle.substring(1));
          }
        });
      }
      
      return [...new Set(tags)]; // Remove duplicates
    };
    
    // Create comprehensive prompt for blog post generation
    const draftPrompt = `You are a professional tech journalist writing for TechBlit, a leading African tech news platform focused on Nigeria's tech ecosystem.

Generate a comprehensive, well-structured blog post based on this tech news story:

**Story Title:** ${story.title}
**Summary:** ${story.summary}
**Category:** ${story.category}
**Engagement Score:** ${story.engagement_score || 0}
${getPrimaryLink(story) ? `**Source Link:** ${getPrimaryLink(story)}` : ''}
${story.author_handles && story.author_handles.length > 0 ? `**Author(s):** ${story.author_handles.join(', ')}` : ''}
${story.media_urls && story.media_urls.length > 0 ? `**Available Media URLs:** ${JSON.stringify(story.media_urls)}` : ''}

**Requirements:**
1. Write a professional, engaging blog post (400-800 words)
2. Use a neutral, journalistic tone suitable for tech news
3. Include context relevant to Nigeria's tech ecosystem
4. Structure with clear paragraphs and subheadings
5. Include relevant background information
6. Add a call-to-action or conclusion paragraph
7. Ensure SEO-friendly content

**Output Format (JSON only, no markdown):**
{
  "title": "Engaging, SEO-optimized title (60-70 characters)",
  "content": "Full HTML content with <p> tags, <h2> subheadings, and proper formatting. Include source attribution at the end.",
  "excerpt": "Compelling excerpt/summary (150-160 characters) for meta description",
  "metaTitle": "SEO meta title (50-60 characters, can be same as title)",
  "metaDescription": "SEO meta description (150-160 characters, can be same as excerpt)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedCategory": "${postCategory}",
  "recommendedImages": [
    {
      "url": "https://example.com/image1.jpg",
      "description": "Brief description of why this image is relevant",
      "source": "Source of the image (e.g., 'Tweet media', 'Company website')"
    }
  ]
}

**Image Recommendations:**
- Analyze the story content and suggest 3-5 relevant images
- Images should be related to the story topic, companies mentioned, or tech concepts
- Include images from tweet media if available (check story.media_urls)
- Provide direct image URLs (must be publicly accessible)
- Each image should have a brief description explaining its relevance
- Prioritize high-quality, professional images suitable for blog headers

**Important:** 
- Output ONLY valid JSON
- No markdown formatting in content field, use HTML tags
- Content should be ready for publication with proper HTML structure
- Include source link in content if available
- Make it engaging and informative for Nigerian tech audience`;

    // Call Grok API to generate draft
    const grokResponse = await callGrokAPI(draftPrompt);
    let draft;
    
    try {
      // Try to parse as JSON
      draft = JSON.parse(grokResponse);
    } catch (parseError) {
      // If response is not JSON, try to extract JSON from markdown code blocks
      const jsonMatch = grokResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        draft = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse Grok response as JSON');
      }
    }
    
    // Validate required fields
    if (!draft.title || !draft.content) {
      throw new Error('Generated draft missing required fields (title, content)');
    }
    
    // Generate tags if not provided
    const tags = draft.tags && draft.tags.length > 0 
      ? draft.tags 
      : generateTags(story);
    
    // Ensure meta fields are within limits
    const metaTitle = (draft.metaTitle || draft.title || story.title)
      .substring(0, 60)
      .trim();
    const metaDescription = (draft.metaDescription || draft.excerpt || story.summary)
      .substring(0, 160)
      .trim();
    
    // Add source attribution to content if not already present - use getPrimaryLink to ensure valid link
    let contentHtml = draft.content;
    const primaryLink = getPrimaryLink(story);
    if (primaryLink && !contentHtml.includes('Source:') && !contentHtml.includes('source')) {
      contentHtml += `\n\n<div class="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">`;
      contentHtml += `<p class="text-sm text-gray-600 mb-2"><strong>Source:</strong></p>`;
      contentHtml += `<p class="text-sm"><a href="${primaryLink}" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-800 underline">View original post on X (Twitter)</a></p>`;
      if (story.author_handles && story.author_handles.length > 0) {
        contentHtml += `<p class="text-xs text-gray-500 mt-2">From: ${story.author_handles.join(', ')}</p>`;
      }
      contentHtml += `</div>`;
    }
    
    // Extract recommended images from draft response
    const recommendedImages = draft.recommendedImages || [];
    
    // Also include media URLs from the story if available
    if (story.media_urls && story.media_urls.length > 0) {
      story.media_urls.forEach(url => {
        // Avoid duplicates
        if (!recommendedImages.find(img => img.url === url)) {
          recommendedImages.push({
            url: url,
            description: 'Image from original tweet',
            source: 'Tweet media'
          });
        }
      });
    }
    
    // Prepare draft data
    const draftData = {
      title: draft.title,
      content: contentHtml,
      excerpt: draft.excerpt || story.summary.substring(0, 160),
      metaTitle,
      metaDescription,
      tags,
      category: draft.suggestedCategory || postCategory,
      recommendedImages: recommendedImages.slice(0, 5), // Limit to 5 images
      slug: draft.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    };
    
    // Update story with draft fields (optional - don't fail if this fails)
    try {
      await storyRef.update({
        draft_body: contentHtml,
        draft_title: draft.title,
        draft_excerpt: draft.excerpt || story.summary.substring(0, 160),
        draft_meta_title: metaTitle,
        draft_meta_description: metaDescription,
        suggested_tags: tags,
        draftGeneratedAt: new Date(),
        draftGeneratedBy: req.user?.uid || 'system'
      });
    } catch (updateError) {
      logger.warn('Failed to update story with draft data:', updateError);
      // Continue anyway - draft generation succeeded
    }
    
    // Create audit log
    try {
      const auditLog = createAuditLog('grok_draft_generated', req.user?.uid || 'system', id, {
        title: draft.title,
        category: draft.suggestedCategory || postCategory
      });
      await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    } catch (auditError) {
      logger.warn('Failed to create audit log:', auditError);
    }
    
    // Include recommended images in response
    const responseData = {
      ...draftData,
      recommendedImages: draftData.recommendedImages || []
    };
    
    res.json(formatSuccessResponse(responseData, 'Draft generated successfully'));
  } catch (error) {
    logger.error('Error generating draft:', error);
    res.status(500).json(formatErrorResponse('Error generating draft', 500, { error: error.message }));
  }
}

/**
 * Publish story as blog post (Publish Story = Publish Post)
 * Creates a published blog post from a Grok story
 */
async function publishStory(req, res) {
  try {
    const { id } = req.params;
    const { 
      title, 
      content, 
      contentHtml,
      excerpt, 
      tags, 
      category,
      metaTitle,
      metaDescription,
      canonical,
      featuredImage
    } = req.body;
    
    const storyRef = db.collection(CollectionNames.GROK_STORIES).doc(id);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      return res.status(404).json(formatErrorResponse('Story not found', 404));
    }
    
    const story = storyDoc.data();
    
    // Use provided data, fallback to draft data, then story data
    const finalTitle = title || story.draft_title || story.title;
    const finalContent = contentHtml || content || story.draft_body || story.summary;
    const finalExcerpt = excerpt || story.draft_excerpt || story.summary.substring(0, 160);
    
    // Validate required fields
    if (!finalTitle || !finalContent || !finalExcerpt) {
      return res.status(400).json(formatErrorResponse(
        'Title, content, and excerpt are required. Generate a draft first or provide them in the request.',
        400
      ));
    }
    
    // Map Grok category to post category
    const categoryMap = {
      'Breaking News': 'Tech News',
      'Trending Stories': 'Tech News',
      'Company News': 'Tech News',
      'Product Launches & Reviews': 'Tech News',
      'Funding & Investments': 'Funding',
      'Regulatory & Policy Changes': 'Tech News',
      'Security & Hacking': 'Tech News',
      'Emerging Technologies': 'AI & Innovation'
    };
    
    const postCategory = category || categoryMap[story.category] || 'Tech News';
    const finalTags = tags || story.suggested_tags || [];
    
    // Generate slug from title
    const slug = await generateUniqueSlug(finalTitle);
    
    // Prepare post data (matching createPost structure)
    const postData = {
      title: finalTitle,
      slug,
      content: finalContent, // For backward compatibility
      contentHtml: contentHtml || finalContent, // Preferred field
      excerpt: finalExcerpt,
      tags: finalTags,
      categories: [postCategory], // Array format
      category: postCategory, // Single category string (for compatibility)
      status: PostStatus.PUBLISHED,
      author: {
        uid: req.user.uid,
        name: req.userData.name || req.user.name || 'Unknown User'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
      viewCount: 0,
      likeCount: 0,
      visibility: 'public',
      // SEO fields
      metaTitle: metaTitle || story.draft_meta_title || finalTitle.substring(0, 60),
      metaDescription: metaDescription || story.draft_meta_description || finalExcerpt.substring(0, 160),
      canonical: canonical || '',
      // Social media fields
      social: {
        ogTitle: metaTitle || finalTitle,
        ogDescription: metaDescription || finalExcerpt,
        twitterCard: 'summary_large_image'
      },
      // SEO settings
      seo: {
        noindex: false,
        nofollow: false
      },
      // Link to Grok story - use getPrimaryLink to ensure valid link
      source: {
        type: 'grok_story',
        storyId: id,
        x_post_ids: story.x_post_ids || [],
        original_category: story.category,
        original_link: getPrimaryLink(story)
      },
      // History
      history: [{
        action: 'published_from_grok',
        by: req.user.uid,
        at: new Date(),
        note: `Published from Grok story: ${story.title}`
      }]
    };
    
    // Add featured image if provided
    if (featuredImage) {
      postData.featuredImage = featuredImage;
    }
    
    // Create blog post
    const postRef = await db.collection(CollectionNames.POSTS).add(postData);
    
    // Update story status to published
    await storyRef.update({
      status: GrokStoryStatus.PUBLISHED,
      published_post_id: postRef.id,
      publishedAt: new Date(),
      publishedBy: req.user.uid,
      updatedAt: new Date()
    });
    
    // Create audit log
    const auditLog = createAuditLog('grok_story_published', req.user.uid, id, {
      postId: postRef.id,
      title: finalTitle,
      slug
    });
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    logger.info(`Published Grok story ${id} as blog post ${postRef.id}`);
    
    res.json(formatSuccessResponse({
      postId: postRef.id,
      slug,
      title: finalTitle,
      url: `/${slug}`
    }, 'Story published as blog post successfully'));
  } catch (error) {
    logger.error('Error publishing story:', error);
    res.status(500).json(formatErrorResponse('Error publishing story', 500, { error: error.message }));
  }
}

/**
 * Helper: Get prompts for each category
 */
function getGrokPrompts() {
  const now = new Date();
  const nowMinus90min = new Date(now.getTime() - 90 * 60 * 1000);
  const nowMinus24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nowMinus48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const nowMinus72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const nowMinus96h = new Date(now.getTime() - 96 * 60 * 60 * 1000);
  const nowMinus7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  
  return {
    [GrokCategory.BREAKING_NEWS]: `Search X for breaking Nigeria tech news posted since ${formatDate(nowMinus90min)} (last 90 minutes). Keywords: (outage OR downtime OR breach OR hack OR "data leak" OR "zero-day" OR ransomware OR exploit OR "critical vulnerability") AND (Nigeria OR Nigerian OR Lagos OR Abuja OR fintech OR agritech OR edtech OR healthtech OR startup). Use filter:verified min_replies:50 OR min_faves:300 since:${formatDate(nowMinus90min)}. Return maximum 8 stories, ranked by recency then engagement.

**CRITICAL RECENCY REQUIREMENTS:**
- ONLY include stories from tweets posted in the last 90 minutes (since ${formatDate(nowMinus90min)})
- first_seen_at MUST be within the last 90 minutes - reject any older stories
- Prioritize the most recent stories - rank by recency first, then engagement
- If a story is breaking but the original tweet is older than 90 minutes, DO NOT include it

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists and is accessible on X/Twitter

Output ONLY valid JSON matching this schema:

{
  "category": "Breaking News",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID)"],
      "primary_link": "string (valid Twitter/X URL to source tweet)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}`,

    [GrokCategory.TRENDING]: `Using X semantic + keyword search, find the top 10 currently trending Nigeria tech topics posted since ${formatDate(nowMinus24h)}. Focus: Nigerian fintech, agritech, edtech, healthtech, AI, startups, Lagos ecosystem. Require min_faves:600 OR min_retweets:400. Exclude ads and promos. Diverse viewpoints required.

**CRITICAL RECENCY REQUIREMENTS:**
- ONLY include stories from tweets posted in the last 24 hours (since ${formatDate(nowMinus24h)})
- first_seen_at MUST be within the last 24 hours - reject any older stories
- Prioritize stories with recent timestamps - rank by recency first, then engagement
- If a story is trending but the original tweet is older than 24 hours, DO NOT include it

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets posted within the last 24 hours
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source and posted within 24 hours
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID posted within the last 24 hours - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists, is accessible on X/Twitter, and was posted within the last 24 hours

Output ONLY valid JSON:

{
  "category": "Trending Stories",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID from last 24h)"],
      "primary_link": "string (valid Twitter/X URL to source tweet from last 24h)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ (must be within last 24h)"
    }
  ]
}`,

    [GrokCategory.COMPANY_NEWS]: `Search X for major Nigerian tech company updates posted since ${formatDate(nowMinus48h)}: (Flutterwave OR Paystack OR Moniepoint OR Interswitch OR Jumia OR Andela OR Opay OR PiggyVest OR Jobberman OR MTN OR Airtel OR SystemSpecs) AND (earnings OR acquisition OR lawsuit OR partnership OR layoff OR "new feature" OR controversy OR funding). filter:news OR filter:verified min_faves:400 since:${formatDate(nowMinus48h)}. Max 10 stories. Rank by recency first, then engagement.

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists and is accessible on X/Twitter

Output ONLY valid JSON matching this schema:

{
  "category": "Company News",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID)"],
      "primary_link": "string (valid Twitter/X URL to source tweet)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}`,

    [GrokCategory.PRODUCT_LAUNCHES]: `Find new Nigerian tech product launches, reviews, or benchmarks posted since ${formatDate(nowMinus72h)}: ("just launched" OR unboxing OR review OR benchmark OR "hands-on") AND (Nigeria OR Nigerian OR Lagos OR fintech app OR agritech tool OR edtech platform OR healthtech OR mobile money OR e-commerce). Require media (images/videos) + min_faves:350 since:${formatDate(nowMinus72h)}. Max 12 stories. Rank by recency first.

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists and is accessible on X/Twitter

Output ONLY valid JSON matching this schema:

{
  "category": "Product Launches & Reviews",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID)"],
      "primary_link": "string (valid Twitter/X URL to source tweet)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}`,

    [GrokCategory.FUNDING]: `Search X for Nigerian startup funding or M&A news posted since ${formatDate(nowMinus7d)}: ("raised" OR "Series" OR seed OR "valuation" OR acquired OR IPO OR SPAC OR iDICE) AND (Nigeria OR Nigerian OR Lagos OR fintech OR agritech OR edtech OR healthtech OR startup). filter:verified OR filter:news min_faves:250 since:${formatDate(nowMinus7d)}. Include round size when mentioned. Max 10 stories. Rank by recency first.

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists and is accessible on X/Twitter

Output ONLY valid JSON matching this schema:

{
  "category": "Funding & Investments",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID)"],
      "primary_link": "string (valid Twitter/X URL to source tweet)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}`,

    [GrokCategory.REGULATORY]: `Find regulatory or policy news affecting Nigeria tech posted since ${formatDate(nowMinus48h)}: (antitrust OR CBN OR NITDA OR "data privacy" OR ban OR fine OR lawsuit OR bill OR regulation OR 3MTT OR iDICE) AND (Nigeria OR Nigerian OR Lagos OR fintech OR digital economy). filter:news min_faves:300 since:${formatDate(nowMinus48h)}. Max 8 stories. Rank by recency first.

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists and is accessible on X/Twitter

Output ONLY valid JSON matching this schema:

{
  "category": "Regulatory & Policy Changes",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID)"],
      "primary_link": "string (valid Twitter/X URL to source tweet)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}`,

    [GrokCategory.SECURITY]: `Search X for cybersecurity incidents or vulnerabilities in Nigeria tech posted since ${formatDate(nowMinus48h)}: (breach OR hack OR exploit OR CVE OR ransomware OR phishing OR "supply chain" OR patch) AND (Nigeria OR Nigerian OR Lagos OR fintech OR startup OR mobile money). Require min_faves:400 OR from known security accounts since:${formatDate(nowMinus48h)}. Max 10 stories. Rank by recency first.

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists and is accessible on X/Twitter

Output ONLY valid JSON matching this schema:

{
  "category": "Security & Hacking",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID)"],
      "primary_link": "string (valid Twitter/X URL to source tweet)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}`,

    [GrokCategory.EMERGING_TECH]: `Using semantic search, find cutting-edge Nigeria tech breakthroughs posted since ${formatDate(nowMinus96h)}: (AI OR blockchain OR 5G OR agritech OR healthtech OR edtech OR voice tech OR gamification OR cybersecurity) AND (Nigeria OR Nigerian OR Lagos OR startup OR ecosystem). Require min_faves:500 + media since:${formatDate(nowMinus96h)}. Diverse sources. Max 10 stories. Rank by recency first.

**CRITICAL: Source Link Requirements (MANDATORY VALIDATION):**
- primary_link MUST be a valid Twitter/X URL pointing to the EXACT ORIGINAL source tweet that created this trend/story
- Format: https://x.com/username/status/TWEET_ID or https://twitter.com/username/status/TWEET_ID
- x_post_ids MUST contain valid numeric tweet IDs (15-20 digits) from REAL, EXISTING tweets
- NEVER use placeholder URLs like example.com, test.com, dummy links, or sequential numbers (e.g., 1234567890123456791)
- NEVER invent or guess tweet IDs - only use IDs from tweets you can actually see and verify in X/Twitter search results
- The primary_link MUST reference the EXACT tweet that is the source of this story/trend, not a related or similar tweet
- x_post_ids MUST be the actual tweet IDs extracted directly from the tweet URLs, not approximations or patterns
- If multiple tweets exist, choose the one with highest engagement or from verified accounts, but ensure it's the REAL source
- Verify tweet IDs are real by confirming they appear in actual X/Twitter search results and the tweet content matches the story
- Tweet IDs must be extracted directly from the tweet URL visible in search results, not generated or estimated
- Reject any story if you cannot find a valid, verifiable source tweet ID - do not make up IDs
- The tweet ID must correspond to a tweet that actually exists and is accessible on X/Twitter

Output ONLY valid JSON matching this schema:

{
  "category": "Emerging Technologies",
  "stories": [
    {
      "title": "string",
      "summary": "string (2–4 sentences)",
      "x_post_ids": ["string (valid numeric tweet ID)"],
      "primary_link": "string (valid Twitter/X URL to source tweet)",
      "engagement_score": number,
      "first_seen_at": "YYYY-MM-DDTHH:MM:SSZ"
    }
  ]
}`
  };
}

/**
 * Get auto-draft configuration
 */
async function getAutoDraftConfig(req, res) {
  try {
    const configDoc = await db.collection('grok_config').doc('auto_draft').get();
    
    if (!configDoc.exists) {
      // Return default config
      return res.json(formatSuccessResponse({
        enabled: false,
        engagementThreshold: 5000,
        categories: []
      }, 'Auto-draft configuration retrieved'));
    }
    
    res.json(formatSuccessResponse(configDoc.data(), 'Auto-draft configuration retrieved'));
  } catch (error) {
    logger.error('Error getting auto-draft config:', error);
    res.status(500).json(formatErrorResponse('Error getting configuration', 500, { error: error.message }));
  }
}

/**
 * Update auto-draft configuration
 */
async function updateAutoDraftConfig(req, res) {
  try {
    const { enabled, engagementThreshold, categories } = req.body;
    
    const config = {
      enabled: enabled !== undefined ? enabled : false,
      engagementThreshold: engagementThreshold || 5000,
      categories: categories || [],
      updatedAt: new Date(),
      updatedBy: req.user?.uid || 'system'
    };
    
    await db.collection('grok_config').doc('auto_draft').set(config, { merge: true });
    
    // Create audit log
    const auditLog = createAuditLog('grok_auto_draft_config_updated', req.user?.uid || 'system', 'grok_config', config);
    await db.collection(CollectionNames.AUDIT_LOGS).add(auditLog);
    
    res.json(formatSuccessResponse(config, 'Auto-draft configuration updated'));
  } catch (error) {
    logger.error('Error updating auto-draft config:', error);
    res.status(500).json(formatErrorResponse('Error updating configuration', 500, { error: error.message }));
  }
}

module.exports = {
  getGrokStories,
  updateStoryStatus,
  getGrokStats,
  fetchGrokStories,
  scheduledFetch,
  generateDraft,
  publishStory,
  getAutoDraftConfig,
  updateAutoDraftConfig
};

