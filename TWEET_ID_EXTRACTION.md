# How Tweet IDs Are Obtained and Validated

## Overview
Tweet IDs come from two sources in the Grok API response:
1. **`x_post_ids`** - Array of tweet IDs (e.g., `["1876543210987654321"]`)
2. **`primary_link`** - Twitter/X URL that contains the tweet ID (e.g., `https://x.com/username/status/1876543210987654321`)

## Step-by-Step Flow

### 1. Grok API Response Structure
```json
{
  "category": "Trending Stories",
  "stories": [
    {
      "title": "Story Title",
      "summary": "Story summary...",
      "x_post_ids": ["1876543210987654321", "1876543210987654322"],
      "primary_link": "https://x.com/username/status/1876543210987654321",
      "engagement_score": 5000,
      "first_seen_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### 2. Extraction Methods

#### Method A: Direct from `x_post_ids` Array
```javascript
// From Grok API response
story.x_post_ids = ["1876543210987654321", "1876543210987654322"];

// Use directly (already numeric strings)
const firstTweetId = story.x_post_ids[0]; // "1876543210987654321"
```

#### Method B: Extract from `primary_link` URL
```javascript
// From Grok API response
story.primary_link = "https://x.com/username/status/1876543210987654321";

// Extract using extractTweetIdFromUrl()
const tweetId = extractTweetIdFromUrl(story.primary_link);
// Returns: "1876543210987654321"
```

### 3. URL Pattern Matching

The `extractTweetIdFromUrl()` function supports these URL formats:

```javascript
// Pattern 1: Standard format
"https://x.com/username/status/1876543210987654321"
"https://twitter.com/username/status/1876543210987654321"

// Pattern 2: Web status format
"https://x.com/i/web/status/1876543210987654321"
"https://twitter.com/i/web/status/1876543210987654321"

// Pattern 3: Relative path (less common)
"/status/1876543210987654321"
```

**Regex Patterns Used:**
```javascript
/(?:twitter\.com|x\.com)\/(?:\w+\/)?status\/(\d+)/i
/(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/i
/\/status\/(\d+)/i
```

### 4. Validation Process

When a story is received, the system validates tweet IDs:

```javascript
// Step 1: Check primary_link
if (story.primary_link) {
  const tweetId = extractTweetIdFromUrl(story.primary_link);
  if (isValidTweetId(tweetId)) {
    // Use this link
    return story.primary_link;
  }
}

// Step 2: Check x_post_ids array
if (story.x_post_ids && story.x_post_ids.length > 0) {
  for (const postId of story.x_post_ids) {
    if (isValidTweetId(postId)) {
      // Construct URL from this ID
      return constructTwitterUrl(postId);
    }
  }
}
```

### 5. Validation Checks

Each tweet ID goes through these checks:

1. **Format Check**: Must be 15-20 numeric digits
   ```javascript
   /^\d{15,20}$/.test(tweetId)
   ```

2. **Placeholder Detection**: Rejects common fake patterns
   - Sequential numbers: `1234567890123456791` ❌
   - Repeated digits: `1111111111111111` ❌
   - Common placeholders: `123456789012345` ❌

3. **URL Validation**: Checks if URL is valid Twitter/X URL
   - Must start with `http://` or `https://`
   - Must contain `twitter.com` or `x.com`
   - Must not contain `example.com`, `test.com`, `placeholder`, `dummy`

### 6. Example: Complete Flow

```javascript
// Input from Grok API
const story = {
  title: "Tech News Story",
  x_post_ids: ["1876543210987654321"],
  primary_link: "https://x.com/edtechLagos/status/1876543210987654321"
};

// Step 1: Extract ID from primary_link
const idFromUrl = extractTweetIdFromUrl(story.primary_link);
// Result: "1876543210987654321"

// Step 2: Validate the ID
const isValid = isValidTweetId(idFromUrl);
// Result: true (if valid) or false (if placeholder)

// Step 3: If primary_link is invalid, try x_post_ids
if (!isValid) {
  const firstId = story.x_post_ids[0];
  if (isValidTweetId(firstId)) {
    const url = constructTwitterUrl(firstId);
    // Result: "https://x.com/i/web/status/1876543210987654321"
  }
}
```

### 7. Storage in Firestore

Validated tweet IDs are stored in two places:

```javascript
const storyData = {
  x_post_ids: ["1876543210987654321"],  // Array of IDs
  primary_link: "https://x.com/i/web/status/1876543210987654321"  // Validated URL
};
```

### 8. Usage in Frontend

The frontend uses the same validation functions:

```typescript
// Extract ID from URL
const tweetId = extractTweetIdFromUrl(story.primary_link);

// Validate ID
const isValid = isValidTweetId(tweetId);

// Get primary link (with fallback)
const link = getPrimaryLink(story);
```

## Common Issues and Solutions

### Issue 1: Placeholder IDs
**Problem**: Grok API returns fake IDs like `1234567890123456791`
**Solution**: `isPlaceholderTweetId()` detects and rejects these

### Issue 2: Invalid URLs
**Problem**: `primary_link` contains `example.com` or invalid format
**Solution**: `isValidTwitterUrl()` checks URL format and rejects placeholders

### Issue 3: Missing IDs
**Problem**: Both `primary_link` and `x_post_ids` are invalid/missing
**Solution**: System logs warning and stores empty string, allows manual correction later

## Testing Tweet ID Extraction

You can test the extraction function:

```javascript
// Valid examples
extractTweetIdFromUrl("https://x.com/user/status/1876543210987654321")
// Returns: "1876543210987654321"

extractTweetIdFromUrl("https://twitter.com/user/status/1876543210987654321")
// Returns: "1876543210987654321"

// Invalid examples
extractTweetIdFromUrl("https://x.com/user/status/1234567890123456791")
// Returns: "1234567890123456791" (but will be rejected by isValidTweetId)

extractTweetIdFromUrl("https://example.com/status/123")
// Returns: null (no match)
```

