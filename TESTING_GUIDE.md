# Cloudinary Integration Testing Guide

**Date:** [Today's Date]

---

## Migration Test Results

### ✅ Dry-Run Test
- **Status:** Passed
- **Records Found:** 1
- **Would Migrate:** 1

### ✅ Limited Migration Test
- **Status:** Passed
- **Records Processed:** 1
- **Successfully Migrated:** 1
- **Public ID:** `techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno`

---

## Verification Steps

### 1. Verify in Cloudinary Dashboard

1. Go to: https://cloudinary.com/console
2. Navigate to Media Library
3. Search for: `techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno`
4. Verify image appears
5. Check folder structure: `techblit/media/`
6. Test image URL in browser

**Expected URL:**
```
https://res.cloudinary.com/dzzpqr69w/image/upload/v1765802380/techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno.png
```

---

### 2. Verify Firestore Record

**Document ID:** `41NYyeSOUrQ0gYhOLKzk`

**Check for:**
- ✅ `public_id` field exists
- ✅ `image_id` field exists (same as public_id)
- ✅ `migratedAt` timestamp set
- ✅ `migratedFrom` = "firebase_storage"
- ✅ `updatedAt` updated

**Query:**
```javascript
// In Firebase Console or script
db.collection('media').doc('41NYyeSOUrQ0gYhOLKzk').get()
```

---

### 3. Test Frontend URL Construction

#### Option A: Browser Console

Open browser console on your site and run:

```javascript
// Import test utilities (if available)
import { testCloudinaryUrls, verifyMigratedImage } from '@/lib/test-cloudinary';

// Or test directly
import { getCloudinaryUrl } from '@/lib/cloudinaryUtils';

const publicId = 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno';

// Test different presets
console.log('Cover:', getCloudinaryUrl(publicId, 'cover'));
console.log('Thumbnail:', getCloudinaryUrl(publicId, 'thumbnail'));
console.log('Social:', getCloudinaryUrl(publicId, 'social'));
```

#### Option B: Test Component

Create a test page or component:

```typescript
import { getCloudinaryUrl } from '@/lib/cloudinaryUtils';

const TestImage = () => {
  const publicId = 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno';
  
  return (
    <div>
      <h2>Cloudinary URL Test</h2>
      <p>Public ID: {publicId}</p>
      
      <div>
        <h3>Cover (1200px)</h3>
        <img src={getCloudinaryUrl(publicId, 'cover')} alt="Cover" />
        <p>{getCloudinaryUrl(publicId, 'cover')}</p>
      </div>
      
      <div>
        <h3>Thumbnail (400px)</h3>
        <img src={getCloudinaryUrl(publicId, 'thumbnail')} alt="Thumbnail" />
        <p>{getCloudinaryUrl(publicId, 'thumbnail')}</p>
      </div>
      
      <div>
        <h3>Social (1200x630)</h3>
        <img src={getCloudinaryUrl(publicId, 'social')} alt="Social" />
        <p>{getCloudinaryUrl(publicId, 'social')}</p>
      </div>
    </div>
  );
};
```

---

### 4. Test Image Helpers

```typescript
import { getImageUrlFromData, getCoverUrl } from '@/lib/imageHelpers';

// Test with migrated image data
const imageData = {
  public_id: 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno',
  image_id: 'techblit/media/migrated-41nyyesourq0gyholkzk-1765802369087-alzsno',
};

const coverUrl = getCoverUrl(imageData);
const thumbnailUrl = getImageUrlFromData(imageData, { preset: 'thumbnail' });

console.log('Cover URL:', coverUrl);
console.log('Thumbnail URL:', thumbnailUrl);
```

---

### 5. Test API Endpoint

Test the upload endpoint:

```bash
curl -X POST http://localhost:5001/techblit/us-central1/api/v1/media/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-image.jpg" \
  -F "folder=posts"
```

Or test via frontend:

```typescript
import apiService from '@/lib/apiService';

const file = // File object
const result = await apiService.uploadMedia(file, { folder: 'posts' });
console.log('Uploaded:', result.public_id);
```

---

## Expected Results

### Cloudinary URLs

All URLs should follow this pattern:
```
https://res.cloudinary.com/dzzpqr69w/image/upload/{transformations}/{public_id}
```

**Examples:**
- Cover: `.../f_auto,q_auto,w_1200/techblit/media/...`
- Thumbnail: `.../f_auto,q_auto,w_400/techblit/media/...`
- Social: `.../f_auto,q_auto,w_1200,h_630,c_fill/techblit/media/...`

### Image Display

- ✅ Images load correctly
- ✅ Transformations work
- ✅ Responsive sizing works
- ✅ Format optimization (WebP/AVIF) works
- ✅ No broken images

---

## Troubleshooting

### Issue: Images don't load

**Check:**
1. Cloudinary cloud name is correct (`dzzpqr69w`)
2. Public ID is correct
3. Image exists in Cloudinary dashboard
4. URL is properly formatted

### Issue: Transformations don't work

**Check:**
1. Transformation syntax is correct
2. Preset names are correct
3. Cloudinary service is configured

### Issue: Frontend shows old URLs

**Solution:**
- Clear browser cache
- Check if component is using new helpers
- Verify database has `public_id` field

---

## Next Steps

1. ✅ Migration test passed
2. ⏳ Verify in Cloudinary dashboard
3. ⏳ Test frontend URL construction
4. ⏳ Test image displays
5. ⏳ Run full migration when ready

---

**Test Status:** ✅ Migration Successful  
**Ready for Full Migration:** Yes

