# API Documentation: Author Endpoints

**For:** Backend/Cloud Functions Team
**Feature:** Author Profiles
**Date:** December 23, 2025
**Priority:** Medium (Current workaround exists, but optimization recommended)

---

## Overview

The author profiles feature requires an API endpoint to fetch articles filtered by author name. Currently, we're fetching all posts and filtering client-side, which is inefficient.

---

## Required Endpoint

### `GET /api/v1/posts/by-author/:authorName`

**Purpose:** Fetch all published articles by a specific author

**URL Pattern:**
```
GET https://us-central1-techblit.cloudfunctions.net/api/v1/posts/by-author/{authorName}
```

---

## Request Details

### URL Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `authorName` | string | Yes | Author's full name (URL encoded) | `John%20Doe` or `john-doe` |

### Query Parameters (Optional)

| Parameter | Type | Default | Description | Example |
|-----------|------|---------|-------------|---------|
| `limit` | number | 100 | Maximum articles to return | `?limit=50` |
| `offset` | number | 0 | Pagination offset | `?offset=20` |
| `sortBy` | string | `publishedAt` | Sort field | `?sortBy=createdAt` |
| `order` | string | `desc` | Sort order (asc/desc) | `?order=asc` |

### Headers

```
Content-Type: application/json
```

**Note:** No authentication required (public data)

---

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "post123",
      "title": "The Future of African Fintech",
      "slug": "future-of-african-fintech",
      "excerpt": "Exploring the rapid growth of fintech...",
      "contentHtml": "<p>Full HTML content...</p>",
      "author": {
        "uid": "user456",
        "name": "John Doe"
      },
      "category": "Fintech",
      "tags": ["fintech", "africa", "innovation"],
      "publishedAt": {
        "_seconds": 1703347200,
        "_nanoseconds": 0
      },
      "createdAt": {
        "_seconds": 1703347200,
        "_nanoseconds": 0
      },
      "updatedAt": {
        "_seconds": 1703347200,
        "_nanoseconds": 0
      },
      "featuredImage": {
        "url": "https://firebasestorage.googleapis.com/...",
        "alt": "Fintech in Africa",
        "original": {
          "url": "https://...",
          "width": 1200,
          "height": 630
        }
      },
      "status": "published"
    }
  ],
  "meta": {
    "total": 15,
    "count": 15,
    "authorName": "John Doe",
    "limit": 100,
    "offset": 0
  }
}
```

### No Articles Found (200 OK)

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "count": 0,
    "authorName": "Nonexistent Author",
    "limit": 100,
    "offset": 0
  }
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch posts by author"
  }
}
```

---

## Implementation Notes (Backend)

### Firestore Query

```typescript
// Cloud Functions implementation example
export const getPostsByAuthor = functions.https.onRequest(async (req, res) => {
  const authorName = req.params.authorName;
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    // Decode URL-encoded author name
    const decodedAuthorName = decodeURIComponent(authorName)
      .replace(/-/g, ' ')
      .toLowerCase();

    // Query Firestore
    const postsRef = admin.firestore().collection('posts');

    let query = postsRef
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();

    // Filter by author name (case-insensitive)
    // Note: Firestore doesn't support case-insensitive queries,
    // so we filter in-memory after fetching
    const posts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(post =>
        post.author?.name?.toLowerCase() === decodedAuthorName
      );

    res.json({
      success: true,
      data: posts,
      meta: {
        total: posts.length,
        count: posts.length,
        authorName: authorName,
        limit,
        offset
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});
```

### Alternative: Composite Index

For better performance, create a Firestore composite index:

```
Collection: posts
Fields:
  - status (Ascending)
  - author.name (Ascending)
  - publishedAt (Descending)
```

Then query directly:

```typescript
const snapshot = await postsRef
  .where('status', '==', 'published')
  .where('author.name', '==', authorNameVariations[0]) // Try different case variations
  .orderBy('publishedAt', 'desc')
  .limit(limit)
  .get();
```

---

## Alternative Endpoint (Query Parameter)

If you prefer a query parameter approach:

### `GET /api/v1/posts?author={authorName}`

**URL Pattern:**
```
GET https://us-central1-techblit.cloudfunctions.net/api/v1/posts?author=John%20Doe
```

**Benefits:**
- Reuses existing `/posts` endpoint
- Simpler to implement
- Consistent with other filters

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `author` | string | Filter by author name | `?author=John+Doe` |
| `limit` | number | Max results | `?limit=50` |
| `offset` | number | Pagination | `?offset=20` |

**Response:** Same as above

---

## Request Examples

### cURL

```bash
# Fetch posts by John Doe
curl "https://us-central1-techblit.cloudfunctions.net/api/v1/posts/by-author/john-doe"

# With pagination
curl "https://us-central1-techblit.cloudfunctions.net/api/v1/posts/by-author/john-doe?limit=10&offset=0"

# Alternative query param approach
curl "https://us-central1-techblit.cloudfunctions.net/api/v1/posts?author=John+Doe&limit=10"
```

### JavaScript (Frontend)

```typescript
// Using the new endpoint
const response = await fetch(
  `${FUNCTIONS_URL}/api/v1/posts/by-author/${encodeURIComponent(authorName)}?limit=100`
);
const result = await response.json();
const authorPosts = result.data;

// Alternative: Query parameter approach
const response = await fetch(
  `${FUNCTIONS_URL}/api/v1/posts?author=${encodeURIComponent(authorName)}&limit=100`
);
```

---

## Frontend Integration

### Current Code (Needs Update)

**File:** `src/app/authors/[name]/page.tsx`

**Current (Line 44-62):**
```typescript
async function getAuthorArticles(authorName: string): Promise<BlogPost[]> {
  try {
    // ❌ CURRENT: Fetches ALL posts, filters client-side
    const response = await apiService.getPosts({ limit: 1000 });
    const allPosts = response.data || [];

    const authorPosts = allPosts.filter((post: BlogPost) =>
      post.author?.name?.toLowerCase() === authorName.toLowerCase()
    );

    return authorPosts.sort(...);
  } catch (error) {
    console.error('Error fetching author articles:', error);
    return [];
  }
}
```

### Updated Code (After API Implementation)

```typescript
async function getAuthorArticles(authorName: string): Promise<BlogPost[]> {
  try {
    // ✅ NEW: Fetch only author's posts from backend
    const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ||
                          'https://us-central1-techblit.cloudfunctions.net';

    const response = await fetch(
      `${FUNCTIONS_URL}/api/v1/posts/by-author/${encodeURIComponent(authorName)}?limit=1000`,
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch author posts: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching author articles:', error);
    return [];
  }
}
```

---

## Performance Comparison

### Current Approach (Client-Side Filtering)

| Metric | Value |
|--------|-------|
| API Call | Fetch ALL posts (1000) |
| Data Transfer | ~2.5 MB |
| Processing | Client-side filter |
| Time | ~2-3 seconds |

### Optimized Approach (Backend Filtering)

| Metric | Value |
|--------|-------|
| API Call | Fetch author posts only (e.g., 15) |
| Data Transfer | ~40 KB |
| Processing | Server-side filter |
| Time | ~300-500ms |

**Improvement:** 60-80% faster, 98% less data transfer

---

## Testing Checklist

After implementing the endpoint, test:

- [ ] Fetch posts by author with exact name match
- [ ] Case-insensitive matching (John Doe = john doe)
- [ ] Author with spaces in name (John Doe)
- [ ] Author with hyphenated name (Mary-Jane Smith)
- [ ] Author with no posts (returns empty array)
- [ ] Pagination (limit & offset)
- [ ] Sorting (newest first by default)
- [ ] Special characters in names
- [ ] Very long author names
- [ ] Authors with 1 post
- [ ] Authors with 100+ posts

---

## Migration Plan

### Phase 1: Implement Endpoint (Backend)
1. Create Cloud Function endpoint
2. Test with Postman/cURL
3. Deploy to staging
4. Verify response format

### Phase 2: Update Frontend (This Codebase)
1. Update `src/app/authors/[name]/page.tsx`
2. Replace `apiService.getPosts()` with new endpoint
3. Test author pages
4. Deploy to production

### Phase 3: Monitor & Optimize
1. Monitor API performance
2. Add caching if needed
3. Create composite index if slow

---

## Additional Endpoints (Future)

### Get All Authors (Optional)

```
GET /api/v1/authors
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "uid": "user123",
      "articleCount": 15,
      "slug": "john-doe"
    },
    {
      "name": "Jane Smith",
      "uid": "user456",
      "articleCount": 8,
      "slug": "jane-smith"
    }
  ]
}
```

### Get Author Stats

```
GET /api/v1/authors/:authorName/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "John Doe",
    "totalArticles": 15,
    "totalViews": 12500,
    "categories": ["Fintech", "AI", "Startups"],
    "firstPublished": "2024-01-15T10:00:00Z",
    "lastPublished": "2024-12-20T15:30:00Z"
  }
}
```

---

## Priority & Timeline

**Priority:** Medium
**Current Status:** Working with workaround
**Recommended Timeline:**
- Week 1: Implement endpoint
- Week 2: Frontend integration
- Week 3: Testing & deployment

**Impact:**
- Performance: High improvement
- User Experience: Faster page loads
- Server Load: Reduced bandwidth

---

## Questions for Backend Team

1. **Preferred approach:** Path parameter (`/by-author/:name`) or query parameter (`?author=name`)?
2. **Caching:** Should we cache results? For how long?
3. **Composite index:** Can we create one for `author.name` + `publishedAt`?
4. **Rate limiting:** Any limits on this endpoint?
5. **Timeline:** When can this be implemented?

---

## Contact

**Frontend Implementation:** Complete ✅
**Backend Endpoint:** Pending 🔄
**Documentation:** This file

For questions, refer to:
- `src/app/authors/[name]/page.tsx` (frontend code)
- `AUTHOR_PROFILES_COMPLETE.md` (feature docs)

---

**Status:** Documented & Ready for Backend Implementation
**Next Step:** Backend team implements endpoint
**ETA:** TBD by backend team
