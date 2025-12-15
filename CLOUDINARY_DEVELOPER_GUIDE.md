# Cloudinary Integration - Developer Guide

**Last Updated:** [Today's Date]  
**Version:** 1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Uploading Images](#uploading-images)
4. [Displaying Images](#displaying-images)
5. [Image Presets](#image-presets)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

TechBlit uses Cloudinary for image management and delivery. This guide covers how to upload, display, and optimize images in the application.

### Key Concepts

- **public_id**: Cloudinary's unique identifier for each image (e.g., `techblit/posts/image-123`)
- **Transformations**: On-the-fly image processing (resize, format conversion, quality optimization)
- **Presets**: Pre-configured transformation sets for common use cases

---

## Quick Start

### Upload an Image

```typescript
import { uploadImageToCloudinary } from '@/lib/imageUpload';

const file = // ... File object from input
const result = await uploadImageToCloudinary(file, 'posts');
// Returns: { public_id: 'techblit/posts/image-123', width, height, ... }
```

### Display an Image

```typescript
import { getCloudinaryUrl } from '@/lib/cloudinaryUtils';

const imageUrl = getCloudinaryUrl(result.public_id, 'cover');
// Returns: https://res.cloudinary.com/.../f_auto,q_auto,w_1200/techblit/posts/image-123

<img src={imageUrl} alt="Post image" />
```

---

## Uploading Images

### Basic Upload

```typescript
import { uploadImageToCloudinary } from '@/lib/imageUpload';

try {
  const result = await uploadImageToCloudinary(file, 'posts');
  console.log('Uploaded:', result.public_id);
} catch (error) {
  console.error('Upload failed:', error);
}
```

### Upload with Options

```typescript
import apiService from '@/lib/apiService';

// Upload with folder and alt text
const result = await apiService.uploadMedia(file, {
  folder: 'posts',
  alt: 'Featured image for blog post'
});
```

### Folder Structure

| Folder | Use Case | Example |
|--------|----------|---------|
| `posts` | Blog post featured images | `techblit/posts/image-123` |
| `authors` | Author profile images | `techblit/authors/author-123` |
| `categories` | Category images | `techblit/categories/category-123` |
| `ui` | UI elements and graphics | `techblit/ui/logo-123` |
| `media` | General media library | `techblit/media/image-123` |

---

## Displaying Images

### Using Presets

```typescript
import { getCloudinaryUrl } from '@/lib/cloudinaryUtils';

// Cover image (1200px)
const coverUrl = getCloudinaryUrl(publicId, 'cover');

// Thumbnail (400px)
const thumbUrl = getCloudinaryUrl(publicId, 'thumbnail');

// Social preview (1200x630)
const socialUrl = getCloudinaryUrl(publicId, 'social');
```

### Custom Transformations

```typescript
import { getCloudinaryUrl } from '@/lib/cloudinaryUtils';

// Custom width and height
const customUrl = getCloudinaryUrl(publicId, {
  width: 800,
  height: 600,
  crop: 'fill'
});
```

### Using Image Helper

```typescript
import { getImageUrlFromData } from '@/lib/imageHelpers';

// Works with various data formats
const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'cover' });
```

---

## Image Presets

### Available Presets

| Preset | Size | Use Case | Example |
|--------|------|----------|---------|
| `cover` | 1200px width | Featured images, hero images | Blog post covers |
| `inline` | 800px width | Inline content images | Article body images |
| `thumbnail` | 400px width | Thumbnails, cards | Post cards, lists |
| `social` | 1200x630 | Open Graph, Twitter cards | Social sharing |
| `avatar` | 200x200 | Profile pictures | Author avatars |

### Preset Details

```typescript
// Cover preset
{
  width: 1200,
  format: 'auto',  // WebP/AVIF when supported
  quality: 'auto'  // Optimized quality
}

// Social preset
{
  width: 1200,
  height: 630,
  crop: 'fill',    // Fill dimensions exactly
  format: 'auto',
  quality: 'auto'
}
```

---

## Best Practices

### 1. Use Appropriate Presets

✅ **Good:**
```typescript
// Thumbnail for list view
const thumbUrl = getCloudinaryUrl(publicId, 'thumbnail');

// Cover for featured display
const coverUrl = getCloudinaryUrl(publicId, 'cover');
```

❌ **Bad:**
```typescript
// Don't use cover preset for thumbnails
const thumbUrl = getCloudinaryUrl(publicId, 'cover'); // Too large!
```

### 2. Store public_id, Not Full URLs

✅ **Good:**
```typescript
// Store public_id in database
const post = {
  featuredImage: {
    public_id: 'techblit/posts/image-123',
    alt: 'Post image'
  }
};

// Construct URL when displaying
const url = getCloudinaryUrl(post.featuredImage.public_id, 'cover');
```

❌ **Bad:**
```typescript
// Don't store full URLs
const post = {
  featuredImage: {
    url: 'https://res.cloudinary.com/.../image-123' // Hard to change transformations
  }
};
```

### 3. Use Image Helper for Compatibility

✅ **Good:**
```typescript
import { getImageUrlFromData } from '@/lib/imageHelpers';

// Works with both Cloudinary and legacy formats
const url = getImageUrlFromData(imageData, { preset: 'cover' });
```

### 4. Optimize for Performance

- Use `thumbnail` preset for list views
- Use `cover` preset for featured displays
- Use `social` preset for Open Graph images
- Let Cloudinary handle format optimization (f_auto, q_auto)

### 5. Error Handling

```typescript
try {
  const result = await uploadImageToCloudinary(file, 'posts');
  // Handle success
} catch (error) {
  if (error.message.includes('File size exceeds')) {
    // Handle file too large
  } else if (error.message.includes('Invalid file type')) {
    // Handle invalid format
  } else {
    // Handle other errors
  }
}
```

---

## Troubleshooting

### Image Not Displaying

1. **Check public_id format:**
   ```typescript
   // Should start with 'techblit/'
   const publicId = 'techblit/posts/image-123';
   ```

2. **Verify Cloudinary configuration:**
   ```typescript
   // Check cloud name
   console.log(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
   ```

3. **Test URL construction:**
   ```typescript
   const url = getCloudinaryUrl(publicId, 'cover');
   console.log('Generated URL:', url);
   ```

### Upload Fails

1. **Check file size:** Max 5MB
2. **Check file type:** Only jpg, png, webp allowed
3. **Check authentication:** Must be logged in as admin
4. **Check network:** Verify API endpoint is accessible

### Performance Issues

1. **Use appropriate presets:** Don't use `cover` for thumbnails
2. **Enable lazy loading:** Use Next.js Image component
3. **Cache transformations:** Cloudinary caches automatically
4. **Monitor usage:** Check Cloudinary dashboard

---

## API Reference

### uploadImageToCloudinary()

```typescript
uploadImageToCloudinary(
  file: File,
  folder: 'posts' | 'authors' | 'categories' | 'ui' | 'media'
): Promise<{
  public_id: string;
  image_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}>
```

### getCloudinaryUrl()

```typescript
getCloudinaryUrl(
  publicId: string | null | undefined,
  options?: CloudinaryTransformOptions | keyof typeof CloudinaryPresets
): string | null
```

### getImageUrlFromData()

```typescript
getImageUrlFromData(
  imageData: any,
  options?: {
    preferThumbnail?: boolean;
    preset?: keyof typeof CloudinaryPresets;
    width?: number;
    height?: number;
  }
): string | null
```

---

## Examples

### Upload Featured Image

```typescript
import { uploadFeaturedImage } from '@/lib/imageUpload';

const handleImageUpload = async (file: File) => {
  try {
    const result = await uploadFeaturedImage(file);
    // result contains original, thumbnail, ogImage URLs
    setFeaturedImage(result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Display in Component

```typescript
import { getImageUrlFromData } from '@/lib/imageHelpers';

function PostCard({ post }) {
  const imageUrl = getImageUrlFromData(post.featuredImage, { preset: 'thumbnail' });
  
  return (
    <div>
      {imageUrl && (
        <img src={imageUrl} alt={post.title} />
      )}
    </div>
  );
}
```

### SEO Meta Images

```typescript
import { getSocialImageUrl } from '@/lib/imageHelpers';

const ogImage = getSocialImageUrl(post.featuredImage);
// Returns: Cloudinary URL with 1200x630 transformation
```

---

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Transformation Reference](https://cloudinary.com/documentation/transformation_reference)
- [Backend API Documentation](../techblit-cloud-function/functions/DATABASE_SCHEMA_UPDATES.md)

---

**Questions?** Contact the development team or check the [troubleshooting section](#troubleshooting).

