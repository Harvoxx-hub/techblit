# API Documentation - Cloudinary Integration

**Date:** [Today's Date]  
**Version:** 1.0.0

---

## Overview

This document describes the Cloudinary image management API endpoints integrated into the TechBlit backend.

---

## Base URL

```
https://us-central1-techblit.cloudfunctions.net/api/v1
```

---

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <firebase-id-token>
```

Admin endpoints require admin role.

---

## Media Endpoints

### Upload Image

Upload an image file to Cloudinary.

**Endpoint:** `POST /media/upload`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (required) - Image file (jpg, png, webp, max 5MB)
- `folder` (optional) - Folder type: `posts`, `authors`, `categories`, `ui`, `media`
- `alt` (optional) - Alt text for accessibility

**Example:**
```bash
curl -X POST https://us-central1-techblit.cloudfunctions.net/api/v1/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@image.jpg" \
  -F "folder=posts" \
  -F "alt=Featured image"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-id",
    "public_id": "techblit/posts/image-1234567890-xyz",
    "image_id": "techblit/posts/image-1234567890-xyz",
    "url": "https://res.cloudinary.com/dzzpqr69w/image/upload/v1234567890/techblit/posts/image-1234567890-xyz.jpg",
    "width": 1200,
    "height": 630,
    "format": "jpg",
    "filename": "image.jpg",
    "size": 245678,
    "type": "image",
    "alt": "Featured image",
    "uploadedBy": {
      "uid": "user123",
      "name": "John Doe"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Media uploaded successfully"
}
```

**Error Responses:**
- `400` - Invalid file type or size
- `401` - Unauthorized
- `403` - Insufficient permissions
- `500` - Server error

---

### Register Media Metadata

Register existing media metadata (for legacy URLs or manual registration).

**Endpoint:** `POST /media`

**Authentication:** Required (Admin)

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "url": "https://example.com/image.jpg",
  "filename": "image.jpg",
  "size": 123456,
  "type": "image",
  "alt": "Image description",
  "public_id": "techblit/posts/image-123" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "doc-id",
    "url": "https://example.com/image.jpg",
    "filename": "image.jpg",
    "size": 123456,
    "type": "image",
    "alt": "Image description",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Media registered successfully"
}
```

---

### Get All Media

Retrieve all media records.

**Endpoint:** `GET /media`

**Authentication:** Required (Admin)

**Query Parameters:**
- `limit` (optional) - Number of records (default: 50)
- `offset` (optional) - Offset for pagination (default: 0)

**Example:**
```bash
curl -X GET "https://us-central1-techblit.cloudfunctions.net/api/v1/media?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-id",
      "public_id": "techblit/posts/image-123",
      "image_id": "techblit/posts/image-123",
      "url": "https://res.cloudinary.com/...",
      "filename": "image.jpg",
      "size": 123456,
      "type": "image",
      "alt": "Image description",
      "width": 1200,
      "height": 630,
      "format": "jpg",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Media retrieved successfully"
}
```

---

### Delete Media

Delete a media record and associated Cloudinary image.

**Endpoint:** `DELETE /media/:id`

**Authentication:** Required (Admin)

**Example:**
```bash
curl -X DELETE https://us-central1-techblit.cloudfunctions.net/api/v1/media/doc-id \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Media deleted successfully"
}
```

**Notes:**
- Deletes from Cloudinary if `public_id` exists
- Deletes from Firebase Storage if legacy URL exists
- Deletes from Firestore
- Creates audit log entry

---

## Analytics Endpoints

### Get Cloudinary Analytics

Get Cloudinary-specific usage statistics and optimization recommendations.

**Endpoint:** `GET /analytics/cloudinary`

**Authentication:** Required (Admin)

**Example:**
```bash
curl -X GET https://us-central1-techblit.cloudfunctions.net/api/v1/analytics/cloudinary \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": {
        "images": 150,
        "cloudinary": 120,
        "migrated": 100,
        "legacy": 30
      },
      "byFolder": {
        "posts": 80,
        "media": 30,
        "authors": 10
      },
      "storage": {
        "totalBytes": 52428800,
        "totalMB": 50,
        "totalGB": 0.05
      },
      "recent": {
        "uploads7Days": 15,
        "migrated7Days": 10
      },
      "migration": {
        "progress": 80,
        "remaining": 30
      }
    },
    "transformations": {
      "patterns": {
        "cover": 50,
        "inline": 30,
        "thumbnail": 40,
        "social": 20,
        "custom": 10
      },
      "totalTransformations": 150
    },
    "quota": {
      "limits": {
        "storage": 26843545600,
        "bandwidth": 26843545600,
        "transformations": 25000
      },
      "usage": {
        "storage": {
          "used": 52428800,
          "limit": 26843545600,
          "percentage": 0,
          "unit": "bytes"
        },
        "transformations": {
          "estimated": 600,
          "limit": 25000,
          "percentage": 2,
          "unit": "count"
        }
      },
      "warnings": []
    },
    "recommendations": [
      {
        "type": "migration",
        "priority": "high",
        "message": "30 images still need migration to Cloudinary",
        "action": "Run migration script to complete migration"
      }
    ]
  },
  "message": "Cloudinary analytics retrieved successfully"
}
```

---

## Frontend Integration

### Upload Image

```typescript
import apiService from '@/lib/apiService';

const file = // File object
const result = await apiService.uploadMedia(file, {
  folder: 'posts',
  alt: 'Featured image'
});

// result.public_id = 'techblit/posts/image-1234567890-xyz'
```

### Get Cloudinary URL

```typescript
import { getCloudinaryUrl, CloudinaryPresets } from '@/lib/cloudinaryUtils';

const publicId = 'techblit/posts/image-123';

// Using preset
const coverUrl = getCloudinaryUrl(publicId, 'cover');
// https://res.cloudinary.com/dzzpqr69w/image/upload/f_auto,q_auto,w_1200/techblit/posts/image-123

// Using custom options
const customUrl = getCloudinaryUrl(publicId, { width: 800, height: 600, crop: 'fill' });
```

### Get Image from Data

```typescript
import { getImageUrlFromData } from '@/lib/imageHelpers';

const imageData = // From API or database
const url = getImageUrlFromData(imageData, { preset: 'cover' });
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

Common error codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

- No explicit rate limiting implemented
- Cloudinary has its own rate limits
- 500ms delay between migration script operations

---

## File Size Limits

- **Maximum file size:** 5MB
- **Allowed formats:** jpg, jpeg, png, webp
- **Validation:** Performed on upload

---

## Folder Structure

Cloudinary public_ids follow this structure:

```
techblit/
  posts/          - Blog post images
  authors/        - Author profile images
  categories/     - Category images
  ui/             - UI elements
  media/          - General media library
```

---

## Transformation Presets

| Preset | Width | Height | Crop | Use Case |
|--------|-------|--------|------|----------|
| `cover` | 1200 | - | - | Featured images |
| `inline` | 800 | - | - | Inline content images |
| `thumbnail` | 400 | - | - | Thumbnails |
| `social` | 1200 | 630 | fill | Open Graph/Twitter |
| `avatar` | 200 | 200 | fill | Profile images |

---

## Migration

See `MIGRATION_GUIDE.md` for migration instructions.

---

## Support

For issues or questions:
1. Check error logs
2. Review Cloudinary dashboard
3. Verify credentials
4. Check API documentation

---

**Last Updated:** [Today's Date]

