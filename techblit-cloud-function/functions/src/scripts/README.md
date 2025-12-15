# WordPress to Firebase Migration

This directory contains scripts to migrate your WordPress blog data to Firebase Firestore.

## Overview

The migration process involves three main steps:

1. **Fetch**: Download all data from your WordPress site via REST API
2. **Transform**: Convert WordPress data format to Firebase format
3. **Upload**: Upload the transformed data to Firebase Firestore

## Prerequisites

- Node.js 20+ installed
- Firebase project configured
- WordPress REST API enabled on your site
- Proper Firebase credentials (service account key)

## Installation

First, install the dependencies:

```bash
cd functions
npm install
```

## Configuration

Set your WordPress URL as an environment variable:

```bash
export WORDPRESS_URL=https://techblit.com/wp-json/wp/v2
```

Or add it to your `.env` file in the functions directory.

## Usage

### Option 1: Run complete migration (fetch + upload)

```bash
node functions/src/scripts/migration-runner.js
```

### Option 2: Fetch only (no upload)

This is useful if you want to review the data before uploading:

```bash
node functions/src/scripts/migration-runner.js --fetch-only
```

The data will be saved to `functions/migration-data/` directory.

### Option 3: Upload only (skip fetching)

This uses existing data in `functions/migration-data/` directory:

```bash
node functions/src/scripts/migration-runner.js --skip-fetch
```

## What Gets Migrated

### ✅ Posts
- Title, content, excerpt
- Slug (auto-generated)
- Status (published/draft)
- Author information
- Featured images
- Categories and tags
- Publication and update dates
- SEO metadata

### ✅ Categories
- Name, slug, description
- Category hierarchy (parent categories)

### ✅ Tags
- Name, slug, description

### ✅ Users
- Name, email, bio
- Avatar URLs
- Website links

### ✅ Media
- Image URLs
- Titles, alt text, captions
- Dimensions
- File metadata

## Output Files

After running the fetch step, you'll have these JSON files in `functions/migration-data/`:

- `posts.json` - All blog posts
- `categories.json` - All categories
- `tags.json` - All tags
- `users.json` - All authors/users
- `media.json` - All media attachments
- `summary.json` - Migration summary and statistics

## Firebase Collections

The uploader creates/modifies these Firestore collections:

- `posts` - Blog posts
- `categories` - Post categories
- `tags` - Post tags
- `users` - Blog authors
- `media` - Media attachments

**Note**: Posts are stored with IDs prefixed with `wp_` to avoid conflicts (e.g., `wp_123`).

## Data Transformations

### Posts

**WordPress Format:**
```json
{
  "id": 123,
  "title": {"rendered": "My Post"},
  "content": {"rendered": "<p>Content</p>"}
}
```

**Firebase Format:**
```json
{
  "id": "wp_123",
  "title": "My Post",
  "content": "<p>Content</p>",
  "slug": "my-post",
  "status": "published"
}
```

### Status Mapping

- `publish` → `published`
- `draft` → `draft`
- `future` → `draft` (scheduled posts become drafts)
- `private` → `draft`
- `trash` → skipped

## Skipping Existing Data

The uploader automatically skips items that already exist in Firebase based on document IDs. This is safe to run multiple times.

## Troubleshooting

### Authentication Error

If you get Firebase authentication errors, make sure:

1. Service account key is properly configured
2. Firebase Admin SDK is initialized
3. Required permissions are granted

### Empty Data

If no data is fetched, check:

1. WordPress REST API is enabled
2. Correct WordPress URL is set
3. Posts/content exist in WordPress
4. Network connectivity

### Partial Upload

If only some data is uploaded:

1. Check Firebase quotas and limits
2. Review console logs for specific errors
3. Run with `--skip-fetch` to retry upload

## Running Individual Scripts

You can also run the scripts individually:

```bash
# Fetch data
node functions/src/scripts/wordpress-fetcher.js

# Upload data
node functions/src/scripts/wordpress-uploader.js
```

## Next Steps

After successful migration:

1. Review data in Firebase Console
2. Verify posts are in the `posts` collection with `status: 'published'`
3. Test your application
4. Update any hardcoded references or IDs
5. Configure slugs and SEO settings if needed

## Troubleshooting Common Issues

### Issue: "Module not found"

**Solution**: Make sure you're running from the correct directory and have installed dependencies:
```bash
cd functions
npm install
```

### Issue: "Firebase not initialized"

**Solution**: Ensure Firebase Admin is properly configured in `src/config/firebase.js`

### Issue: "Empty results from WordPress"

**Solution**: Check if your WordPress site allows REST API access. Try accessing:
```
https://your-site.com/wp-json/wp/v2/posts
```

If you get 404 or authentication errors, you may need to enable REST API or check permissions.

## Notes

- All imported items have a `meta.importedFrom: 'wordpress'` field
- Original WordPress IDs are preserved in `meta.wordpressId`
- Dates are converted to Firebase Timestamps
- HTML content is preserved as-is
- Media URLs point to original WordPress URLs (not Firebase Storage)

