# 📋 TechBlit Admin Dashboard - Complete Workflow Documentation

## 🎯 **High-Level Goals**

### Core Objectives
- **Content Management**: Create, edit, schedule, review, and publish articles reliably
- **SEO Preservation**: Maintain metadata, backlinks, and canonical URL integrity
- **Media Management**: Upload, crop, replace, and organize images/media
- **Site Operations**: Manage redirects, sitemaps, canonical URLs
- **Audit & Security**: Provide logs, roles/permissions, preview/rollback capabilities
- **Automation**: Integrate with Firebase services for ISR revalidation and sitemap updates

## 👥 **Roles & Permissions System**

### Role Hierarchy
```
Super Admin (Level 4)
├── Full system access
├── User management
├── Site settings
├── Redirect management
└── Can delete published content

Editor (Level 3)
├── Create/edit/publish articles
├── Manage media library
├── Review author submissions
└── Schedule content

Author (Level 2)
├── Create/edit own drafts
├── Submit for review
├── View own analytics
└── Limited media access

Reviewer (Level 1)
├── Approve/reject content
├── Add review comments
└── View submission queue

Viewer (Level 0)
└── Read-only access
```

### Permission Matrix
| Action | Viewer | Reviewer | Author | Editor | Super Admin |
|--------|--------|----------|--------|--------|-------------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Draft | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit Own Posts | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit Any Posts | ❌ | ❌ | ❌ | ✅ | ✅ |
| Publish Content | ❌ | ✅ | ❌ | ✅ | ✅ |
| Manage Media | ❌ | ❌ | Limited | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Site Settings | ❌ | ❌ | ❌ | ❌ | ✅ |
| Redirects | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🗄️ **Firestore Data Model**

### Core Collections Structure

#### 1. Users Collection (`users/{uid}`)
```typescript
interface User {
  uid: string;
  name: string;
  email: string;
  role: 'super_admin' | 'editor' | 'author' | 'reviewer' | 'viewer';
  avatar?: string;
  createdAt: Timestamp;
  lastSeen: Timestamp;
  permissions: string[];
  isActive: boolean;
}
```

#### 2. Posts Collection (`posts/{slug}`)
```typescript
interface Post {
  // Basic Content
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  contentMarkdown?: string;
  
  // SEO & Meta
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  tags: string[];
  categories: string[];
  
  // Author & Status
  author: {
    uid: string;
    name: string;
  };
  status: 'draft' | 'in_review' | 'scheduled' | 'published' | 'archived';
  
  // Scheduling
  scheduledAt?: Timestamp;
  publishedAt?: Timestamp;
  updatedAt: Timestamp;
  
  // Media
  featuredImage?: {
    storagePath: string;
    url: string;
    width: number;
    height: number;
    alt: string;
  };
  
  // Migration & Redirects
  oldUrl?: string;
  externalRedirectTo?: string;
  
  // SEO Controls
  seo: {
    noindex?: boolean;
    nofollow?: boolean;
  };
  
  // Social Media
  social: {
    ogTitle?: string;
    ogDescription?: string;
    twitterCard?: 'summary' | 'summary_large_image';
  };
  
  // Visibility
  visibility: 'public' | 'private' | 'members-only';
  
  // Audit Trail
  history: Array<{
    action: string;
    by: string;
    at: Timestamp;
    note?: string;
  }>;
  
  // Content Tracking
  canonicalSource?: string;
}
```

#### 3. Media Collection (`media/{id}`)
```typescript
interface Media {
  id: string;
  fileName: string;
  storagePath: string;
  url: string;
  uploadedBy: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  sizes: {
    thumbnail?: string;
    medium?: string;
    large?: string;
  };
  createdAt: Timestamp;
  fileSize: number;
  mimeType: string;
}
```

#### 4. Redirects Collection (`redirects/{id}`)
```typescript
interface Redirect {
  id: string;
  from: string;
  to: string;
  type: 301 | 302;
  active: boolean;
  createdBy: string;
  createdAt: Timestamp;
  notes?: string;
}
```

#### 5. Settings Collection (`settings/site`)
```typescript
interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  defaultOG: {
    title: string;
    description: string;
    image: string;
  };
  analyticsId?: string;
  searchConsoleVerification?: string;
  timezone: string;
  maintenanceMode: boolean;
}
```

## 🏗️ **Admin Dashboard Architecture**

### Page Structure
```
/admin
├── /dashboard          # Overview & stats
├── /posts             # Posts management
│   ├── /new           # Create new post
│   └── /[slug]/edit   # Edit existing post
├── /media             # Media library
├── /redirects         # Redirect management
├── /users             # User management
├── /settings          # Site settings
├── /analytics         # Analytics dashboard
└── /audit             # Audit logs
```

### Component Hierarchy
```
AdminLayout
├── AdminSidebar
├── AdminHeader
├── AdminContent
│   ├── Dashboard
│   ├── PostsManager
│   ├── PostEditor
│   ├── MediaLibrary
│   ├── RedirectManager
│   ├── UserManager
│   ├── SettingsPanel
│   └── AuditLogs
└── AdminFooter
```

## 🔄 **Content Publishing Workflow**

### 1. Content Creation Flow
```
Author Creates Draft
    ↓
Auto-save Every 30s
    ↓
Submit for Review
    ↓
Reviewer Reviews
    ↓
[Approve] → Schedule/Publish
[Reject] → Return with Comments
    ↓
Published Content
    ↓
Auto-generate Sitemap
    ↓
ISR Revalidation
```

### 2. Review Process
```
Draft Submission
    ↓
Review Queue Notification
    ↓
Reviewer Assignment
    ↓
Review Comments
    ↓
Approval/Rejection
    ↓
Publishing/Scheduling
```

### 3. Publishing States
- **Draft**: Work in progress, not visible to public
- **In Review**: Submitted for approval
- **Scheduled**: Approved, waiting for publish time
- **Published**: Live on site
- **Archived**: Removed from public view

## 🛠️ **Technical Implementation Plan**

### Phase 1: Foundation (Week 1)
- [ ] Authentication system with Firebase Auth
- [ ] Role-based access control
- [ ] Admin layout and navigation
- [ ] Basic dashboard with stats

### Phase 2: Content Management (Week 2)
- [ ] Posts CRUD operations
- [ ] Rich text editor integration
- [ ] Media upload system
- [ ] Draft/Review/Publish workflow

### Phase 3: Advanced Features (Week 3)
- [ ] Redirect management
- [ ] User management
- [ ] Settings panel
- [ ] Audit logging

### Phase 4: Optimization (Week 4)
- [ ] Analytics integration
- [ ] Performance optimization
- [ ] SEO tools
- [ ] Backup/restore

## 🔐 **Security Considerations**

### Authentication
- Firebase Authentication with email/password
- Role-based access control
- Session management
- Two-factor authentication (future)

### Authorization
- Route-level protection
- Component-level permissions
- API endpoint security
- Firestore security rules

### Data Protection
- Input validation
- XSS prevention
- CSRF protection
- Rate limiting

## 📊 **Analytics & Monitoring**

### Dashboard Metrics
- Total posts (published/draft)
- Recent activity
- Top-performing content
- User engagement
- System health

### Audit Trail
- User actions
- Content changes
- System events
- Error logging
- Performance metrics

## 🚀 **Deployment & Maintenance**

### Environment Setup
- Development environment
- Staging environment
- Production environment
- Environment-specific configurations

### Backup Strategy
- Automated Firestore backups
- Media file backups
- Configuration backups
- Disaster recovery plan

### Monitoring
- Error tracking
- Performance monitoring
- Uptime monitoring
- Security monitoring

---

## 📝 **Next Steps**

1. **Delete current admin workflow** ✅
2. **Implement authentication system**
3. **Create admin layout and navigation**
4. **Build posts management system**
5. **Add media library functionality**
6. **Implement user management**
7. **Add redirect management**
8. **Create settings panel**
9. **Implement audit logging**
10. **Add analytics integration**

This comprehensive workflow provides a solid foundation for a professional admin dashboard that can scale with your needs.
