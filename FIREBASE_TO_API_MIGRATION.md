# Firebase SDK to API Migration Guide

## Overview

This guide documents the migration from direct Firebase SDK usage to API service calls. All Firebase operations should now go through the `apiService` class.

## Migration Status

✅ **Completed:**
- Created all missing API endpoints in backend
- Created `apiService` class in frontend
- Added routes for all resources

⏳ **In Progress:**
- Replacing Firebase calls in components
- Updating hooks
- Removing Firebase SDK dependencies

## API Service Usage

### Import the Service

```typescript
import apiService from '@/lib/apiService';
// or
import { apiService } from '@/lib/apiService';
```

### Setting Auth Token

The service automatically gets the auth token from Firebase Auth, but you can also set it manually:

```typescript
// Get token from Firebase Auth
const token = await firebaseUser.getIdToken();
apiService.setAuthToken(token);
```

## Migration Examples

### 1. Posts

**Before (Firebase SDK):**
```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const postsRef = collection(db, 'posts');
const q = query(postsRef, where('status', '==', 'published'));
const snapshot = await getDocs(q);
const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After (API Service):**
```typescript
import apiService from '@/lib/apiService';

const posts = await apiService.getPosts({ 
  limit: 10,
  category: 'tech' 
});
```

### 2. Get Single Post

**Before:**
```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const postDoc = await getDoc(doc(db, 'posts', postId));
const post = { id: postDoc.id, ...postDoc.data() };
```

**After:**
```typescript
import apiService from '@/lib/apiService';

const post = await apiService.getPostBySlug(slug);
```

### 3. Create Post

**Before:**
```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const docRef = await addDoc(collection(db, 'posts'), {
  title,
  content,
  createdAt: serverTimestamp()
});
```

**After:**
```typescript
import apiService from '@/lib/apiService';

const post = await apiService.createPost({
  title,
  content,
  excerpt,
  tags: [],
  categories: []
});
```

### 4. Update Post

**Before:**
```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

await updateDoc(doc(db, 'posts', postId), {
  title: newTitle,
  updatedAt: serverTimestamp()
});
```

**After:**
```typescript
import apiService from '@/lib/apiService';

await apiService.updatePost(postId, {
  title: newTitle
});
```

### 5. Delete Post

**Before:**
```typescript
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

await deleteDoc(doc(db, 'posts', postId));
```

**After:**
```typescript
import apiService from '@/lib/apiService';

await apiService.deletePost(postId);
```

### 6. Users

**Before:**
```typescript
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const usersSnapshot = await getDocs(collection(db, 'users'));
const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After:**
```typescript
import apiService from '@/lib/apiService';

const users = await apiService.getUsers({ limit: 50 });
```

### 7. Settings

**Before:**
```typescript
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const settingsDoc = await getDoc(doc(db, 'settings', 'site'));
const settings = settingsDoc.data();
```

**After:**
```typescript
import apiService from '@/lib/apiService';

const settings = await apiService.getSettings();
```

### 8. Media

**Before:**
```typescript
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const mediaSnapshot = await getDocs(collection(db, 'media'));
const media = mediaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

**After:**
```typescript
import apiService from '@/lib/apiService';

const media = await apiService.getMedia();
```

### 9. Categories

**Before:**
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const postsRef = collection(db, 'posts');
const q = query(postsRef, where('categories', 'array-contains', categoryName));
const snapshot = await getDocs(q);
```

**After:**
```typescript
import apiService from '@/lib/apiService';

const { category, posts } = await apiService.getPostsByCategory(categorySlug);
```

### 10. Newsletter

**Before:**
```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

await addDoc(collection(db, 'newsletter_subscriptions'), {
  email,
  status: 'subscribed'
});
```

**After:**
```typescript
import apiService from '@/lib/apiService';

await apiService.subscribeToNewsletter({ email, name });
```

## Files to Update

### High Priority (Core Functionality)
1. `src/contexts/AuthContext.tsx` - User authentication
2. `src/app/admin/posts/*` - Post management
3. `src/app/admin/users/page.tsx` - User management
4. `src/app/admin/grok-trends/page.tsx` - Grok trends
5. `src/hooks/usePosts.ts` - Posts hook

### Medium Priority (Public Pages)
6. `src/app/[slug]/page.tsx` - Post detail page
7. `src/app/blog/page.tsx` - Blog listing
8. `src/app/category/[slug]/page.tsx` - Category pages
9. `src/components/ui/*` - UI components

### Low Priority (Utilities)
10. `src/lib/imageUpload.ts` - Image uploads
11. `src/lib/newsletter.ts` - Newsletter
12. `src/hooks/useAutoSave.ts` - Auto-save
13. `src/app/admin/settings/page.tsx` - Settings
14. `src/app/admin/redirects/page.tsx` - Redirects
15. `src/app/admin/media/page.tsx` - Media library
16. `src/app/admin/analytics/page.tsx` - Analytics

## Step-by-Step Migration Process

### Step 1: Update AuthContext
Replace Firebase Firestore calls with API calls for user data.

### Step 2: Update Admin Pages
Replace all Firestore operations in admin pages with API calls.

### Step 3: Update Public Pages
Replace Firestore queries in public pages with API calls.

### Step 4: Update Hooks
Replace Firebase calls in custom hooks with API service.

### Step 5: Update Components
Replace Firebase calls in components with API service.

### Step 6: Remove Firebase SDK
Once all migrations are complete, remove Firebase SDK from package.json.

## Authentication

**Note:** Firebase Auth is still used for authentication. Only Firestore and Storage operations are moved to API.

The `apiService` automatically gets the auth token from Firebase Auth for authenticated requests.

## Error Handling

The API service throws errors that should be caught:

```typescript
try {
  const posts = await apiService.getPosts();
} catch (error) {
  console.error('Failed to fetch posts:', error);
  // Handle error
}
```

## Testing Checklist

- [ ] All admin pages work correctly
- [ ] Public pages load data correctly
- [ ] Authentication still works
- [ ] Image uploads work
- [ ] Post creation/editing works
- [ ] User management works
- [ ] Settings can be updated
- [ ] Newsletter subscription works
- [ ] No console errors
- [ ] All API endpoints return correct data

## Rollback Plan

If issues occur:
1. Keep Firebase SDK in package.json temporarily
2. Revert specific files that have issues
3. Test each migration incrementally
4. Monitor API logs for errors

