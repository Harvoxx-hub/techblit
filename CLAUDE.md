# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TechBlit is a modern tech blog focused on African tech news, built as a Next.js 15 application with a full-featured admin dashboard. The application uses Firebase for backend services (Firestore, Auth, Storage) with serverless Cloud Functions deployed separately for API endpoints.

**Tech Stack:**
- Next.js 15 (App Router)
- TypeScript
- TailwindCSS v4
- Firebase (Firestore, Auth, Storage)
- TipTap for rich text editing
- Algolia for search
- Vercel for hosting

## Development Commands

### Core Commands
```bash
npm run dev          # Start development server at http://localhost:3000
npm run build        # Production build (runs next-sitemap postbuild)
npm start            # Start production server
npm run lint         # Run ESLint
```

### Deployment
```bash
npm run deploy         # Deploy to Vercel production
npm run deploy:preview # Deploy to Vercel preview
```

### Environment Setup
- Node.js >=20.9.0 required (see `.nvmrc`)
- Copy `.env.local` template and configure Firebase settings
- Firebase config is hardcoded in `src/lib/firebase.ts` for client-side

## Architecture

### Application Structure

The codebase follows Next.js App Router conventions with a clear separation between public-facing pages and admin functionality:

**Frontend Routes:**
- `/` - Homepage with featured posts and category highlights
- `/blog` - Blog archive page
- `/[slug]` - Individual blog post pages (dynamic route)
- `/category/[slug]` - Category archive pages
- `/writers` - Writers/authors page
- `/about` - About page
- `/preview/[postId]` - Preview unpublished posts (requires token)

**Admin Routes (Protected):**
- `/admin` - Admin dashboard
- `/admin/login` - Authentication page (unprotected)
- `/admin/posts` - Post management
- `/admin/posts/new` - Create new post
- `/admin/posts/[slug]/edit` - Edit existing post
- `/admin/media` - Media library
- `/admin/users` - User management
- `/admin/analytics` - Analytics dashboard
- `/admin/settings` - Site settings
- `/admin/redirects` - URL redirect management
- `/admin/audit` - Audit logs
- `/admin/grok-trends` - AI-powered trending stories

**API Routes:**
- `/api/algolia/sync` - Sync posts to Algolia search
- `/api/invitations/*` - User invitation management
- `/sitemap.xml` - Dynamic sitemap generation
- `/robots.txt` - Dynamic robots.txt

### Firebase Cloud Functions

The application relies on Cloud Functions for backend operations. Functions are deployed separately to `https://us-central1-techblit.cloudfunctions.net`. Key endpoints are defined in `src/lib/api.ts`:

- Post CRUD operations (`getPosts`, `getPost`, `createPost`, `updatePost`)
- User management (`getUsers`, `updateUserRole`, `getUserProfile`)
- Invitations system
- Preview tokens for draft sharing
- Audit logging
- Grok Trends (AI-powered trend detection)
- Redirects lookup

**Note:** Vercel rewrites `/api/:path*` to Cloud Functions (see `vercel.json`).

### Key Data Models

**Posts** (`src/types/admin.ts`):
- Content: title, slug, excerpt, contentHtml, contentMarkdown
- SEO: metaTitle, metaDescription, canonical, tags, category
- Status workflow: draft → in_review → scheduled → published → archived
- Visibility: public, private, members-only
- Featured images with multiple sizes (original, thumbnail, ogImage)
- Author tracking and audit history

**Users** (Role-Based Access Control):
- Roles: `super_admin`, `editor`, `author`, `reviewer`, `viewer`
- Permissions defined in `PERMISSIONS` and `ROLE_PERMISSIONS` constants
- Helper functions: `hasPermission`, `canEditPost`, `canPublishPost`

**Categories** (`src/lib/categories.ts`):
Predefined categories with slugs and gradients:
- Startup, Tech News, Funding, Insights, Events
- Fintech, AI & Innovation, Developer Tools, Opinions, Brand Press

### Authentication & Authorization

**Context:** `src/contexts/AuthContext.tsx`
- Wraps entire app to provide auth state
- Combines Firebase User with custom User profile from API
- Provides `hasPermission` helpers and role checks

**Middleware:** `src/middleware.ts`
- Handles legacy WordPress URL redirects (date-based URLs, category URLs, etc.)
- Custom redirect lookup from database (with 5-minute cache)
- Protected `/admin` routes (except `/admin/login`)

**Admin Auth Pattern:**
All admin pages should use client-side auth check:
```typescript
'use client';
const { user, isAdmin, loading } = useAuth();
if (!user && !loading) router.push('/admin/login');
```

### Rich Text Editor

Uses TipTap with extensive extensions:
- All standard formatting (bold, italic, headings, lists, etc.)
- Code blocks with syntax highlighting (lowlight)
- Tables, images, links
- Character count, mentions, text alignment
- Custom features in `src/components/editor/RichTextEditor.tsx`

Editor generates both HTML and Markdown for storage.

### Image Handling

**Upload Flow:**
1. Files uploaded to Firebase Storage (`gs://techblit.firebasestorage.app`)
2. Multiple sizes generated automatically (original, thumbnail, ogImage)
3. Metadata stored with dimensions and file size
4. Images served via `firebasestorage.googleapis.com`

**Utilities:**
- `src/lib/imageProcessing.ts` - Image optimization and resizing
- `src/lib/imageUpload.ts` - Upload to Firebase Storage
- `src/lib/imageHelpers.ts` - Helper functions
- `src/lib/imageUrlUtils.ts` - URL generation and extraction

**Next.js Image Configuration:**
Remote patterns configured in `next.config.ts` for Firebase Storage, techblit.com, and techblit.firebaseapp.com.

### SEO & Metadata

**Site-wide:**
- Metadata configured in `src/app/layout.tsx`
- Schema.org Organization markup
- Google Analytics (GA4: G-8MTJTQ7N85)
- Vercel Analytics and Speed Insights

**Per-page:**
- Dynamic metadata in page.tsx files
- `src/lib/seo.ts` for SEO utilities
- Sitemap auto-generated in `src/app/sitemap.xml/route.ts` and `src/lib/sitemap.ts`
- `next-sitemap.config.js` runs postbuild

### Styling & Theming

**Dark Mode:**
- `src/contexts/ThemeContext.tsx` provides theme switching
- Uses CSS variables and Tailwind dark mode classes
- Toggle component: `src/components/ui/ThemeToggle.tsx`

**Typography:**
- Custom TailwindCSS typography plugin config in `tailwind.config.ts`
- All text defaults to black (#000000) for readability
- Code blocks with syntax highlighting

### State Management

**React Context Providers:**
1. `ThemeProvider` - Dark/light mode
2. `AuthProvider` - Authentication and user state

**Custom Hooks** (`src/hooks/`):
- `useAuth()` - Access auth context
- `usePosts()` - Fetch and manage posts
- `useAnalytics()` - Analytics data
- `useInvitation()` - Invitation management
- `useAuditLogs()` - Audit log queries
- `useAutoSave()` - Auto-save for post editor
- `usePreviewToken()` - Preview token generation

### API Service

`src/lib/apiService.ts` centralizes all API calls:
- Automatic auth token injection via `setAuthToken()`
- Error handling and response parsing
- Used by all admin components and hooks

## Development Patterns

### Component Organization
```
src/components/
├── ui/          # Public-facing UI components
├── admin/       # Admin dashboard components
└── editor/      # Post editor components
```

### Path Alias
Use `@/` prefix for imports: `import { db } from '@/lib/firebase'`

### Type Safety
- All admin types in `src/types/admin.ts`
- API types in `src/lib/api/types.ts`
- Strict TypeScript enabled

### Error Handling
- Firebase Auth errors mapped to user-friendly messages in `src/lib/firebaseAuthErrors.ts`
- API errors should return structured JSON with error messages

## Important Notes

### WordPress Migration
The middleware includes comprehensive WordPress URL pattern handling for SEO preservation:
- Date-based permalinks redirect to slug-only
- Category/tag archives redirect appropriately
- `.html` extensions removed
- `wp-admin` redirects to `/admin`

### Cloud Functions Dependency
Most admin operations require Cloud Functions to be deployed and accessible. The functions handle:
- Authentication beyond Firebase Auth
- Database operations with security rules
- Image processing and optimization
- Audit logging
- Complex queries and aggregations

### Security
- RBAC enforced both client-side and in Cloud Functions
- Security headers configured in `vercel.json`
- Admin routes protected via middleware and client-side checks
- API tokens required for all authenticated endpoints

### Performance
- Image optimization via Next.js Image with AVIF/WebP
- Static generation where possible
- Client-side data fetching for admin dashboard
- Vercel Edge caching for static assets
