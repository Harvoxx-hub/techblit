# TechBlit Cloud Functions

This directory contains Cloud Functions for the TechBlit blog platform, built with Express.js and organized using RESTful API principles.

## 📁 Project Structure

```
functions/
├── src/
│   ├── app.js              # Express app configuration
│   ├── config/             # Configuration files
│   │   ├── firebase.js     # Firebase Admin SDK setup
│   │   └── index.js        # General configuration
│   ├── handlers/           # Request handlers (business logic)
│   │   ├── posts.js
│   │   ├── users.js
│   │   ├── media.js
│   │   ├── settings.js
│   │   ├── redirects.js
│   │   ├── categories.js
│   │   ├── newsletter.js
│   │   ├── analytics.js
│   │   ├── invitations.js
│   │   ├── auditLogs.js
│   │   ├── grokTrends.js
│   │   ├── notifications.js
│   │   └── previewTokens.js
│   ├── routes/             # Express route modules
│   │   ├── posts.js
│   │   ├── users.js
│   │   ├── media.js
│   │   ├── settings.js
│   │   ├── redirects.js
│   │   ├── categories.js
│   │   ├── newsletter.js
│   │   ├── analytics.js
│   │   ├── invitations.js
│   │   ├── auditLogs.js
│   │   ├── grokTrends.js
│   │   ├── notifications.js
│   │   ├── previewTokens.js
│   │   └── sitemap.js
│   ├── middleware/          # Express middleware
│   │   └── index.js        # CORS, auth, rate limiting, logging
│   ├── types/              # Type definitions and constants
│   │   ├── constants.js    # Enums and constants
│   │   └── admin.ts        # Admin types
│   ├── utils/              # Utility functions
│   │   ├── helpers.js
│   │   ├── email.js
│   │   ├── password.js
│   │   ├── sitemapGenerator.js
│   │   ├── googleIndexing.js
│   │   └── searchConsole.js
│   └── scripts/            # Utility scripts
├── index.js                 # Main entry point (Firebase Functions wrapper)
├── index.new.js            # New Express-based entry point
└── package.json            # Dependencies
```

## 🚀 API Structure

All API endpoints are organized under `/api/v1/` following RESTful conventions:

### Base URL
```
https://us-central1-techblit.cloudfunctions.net/api/v1
```

### Available Endpoints

#### Posts (`/api/v1/posts`)
- `GET /posts` - Get published posts
- `GET /posts/:slug` - Get post by slug
- `POST /posts` - Create post (admin)
- `PUT /posts/:id` - Update post (admin)
- `DELETE /posts/:id` - Delete post (admin)
- `PATCH /posts/:slug/view` - Increment view count

#### Users (`/api/v1/users`)
- `GET /users` - Get all users (admin)
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update current user profile
- `PUT /users/:id/role` - Update user role (admin)
- `DELETE /users/:id` - Delete user (admin)

#### Media (`/api/v1/media`)
- `GET /media` - Get all media (admin)
- `POST /media` - Upload media (admin)
- `DELETE /media/:id` - Delete media (admin)

#### Settings (`/api/v1/settings`)
- `GET /settings` - Get site settings (public)
- `PUT /settings` - Update settings (admin)

#### Redirects (`/api/v1/redirects`)
- `GET /redirects` - Get all redirects (admin)
- `POST /redirects` - Create redirect (admin)
- `PUT /redirects/:id` - Update redirect (admin)
- `DELETE /redirects/:id` - Delete redirect (admin)

#### Categories (`/api/v1/categories`)
- `GET /categories` - Get all categories (public)
- `GET /categories/:slug/posts` - Get posts by category (public)

#### Newsletter (`/api/v1/newsletter`)
- `POST /newsletter/subscribe` - Subscribe (public)
- `POST /newsletter/unsubscribe` - Unsubscribe (public)
- `GET /newsletter/stats` - Get statistics (admin)

#### Analytics (`/api/v1/analytics`)
- `GET /analytics` - Get dashboard data (admin)

#### Invitations (`/api/v1/invitations`)
- `POST /invitations` - Invite user (admin)
- `POST /invitations/:uid/resend` - Resend invitation (admin)
- `GET /invitations/stats` - Get statistics (admin)

#### Audit Logs (`/api/v1/audit-logs`)
- `GET /audit-logs` - Get audit logs (admin)
- `GET /audit-logs/stats` - Get statistics (admin)
- `GET /audit-logs/filters` - Get available filters (admin)
- `GET /audit-logs/:id` - Get audit log by ID (admin)

#### Grok Trends (`/api/v1/grok-trends`)
- `GET /grok-trends/stories` - Get Grok stories (admin)
- `PATCH /grok-trends/stories/:id/status` - Update story status (admin)
- `GET /grok-trends/stats` - Get statistics (admin)
- `POST /grok-trends/fetch` - Manually fetch stories (admin)

#### Notifications (`/api/v1/notifications`)
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark notification as read

#### Preview Tokens (`/api/v1/preview-tokens`)
- `POST /preview-tokens` - Generate preview token (admin)
- `GET /preview-tokens/validate` - Validate preview token (public)
- `GET /preview-tokens/stats` - Get statistics (admin)

#### Sitemap (`/api/v1/sitemap`)
- `GET /sitemap` - Generate sitemap XML (public)

## 🔧 Development

### Prerequisites
- Node.js 20+
- Firebase CLI
- Firebase project configured

### Setup

```bash
# Install dependencies
cd functions
npm install

# Set up environment variables
cp env.example.txt .env
# Edit .env with your configuration
```

### Local Development

```bash
# Start Firebase emulators
npm run serve

# Or use Firebase CLI
firebase emulators:start --only functions
```

### Deployment

```bash
# Deploy all functions
npm run deploy

# Or use Firebase CLI
firebase deploy --only functions
```

## 📚 Documentation

- **[API_REDESIGN.md](./API_REDESIGN.md)** - Complete API documentation
- **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - Quick reference guide
- **[API_STRUCTURE_SUMMARY.md](./API_STRUCTURE_SUMMARY.md)** - API structure overview
- **[API_MIGRATION_SUMMARY.md](./API_MIGRATION_SUMMARY.md)** - Migration summary
- **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** - Migration checklist

## 🔐 Authentication

All admin endpoints require:
1. **Authentication**: Bearer token in `Authorization` header
   ```
   Authorization: Bearer <firebase-id-token>
   ```
2. **Admin Role**: User must have `SUPER_ADMIN` or `EDITOR` role

## 📦 Dependencies

- `express` - Web framework
- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Firebase Cloud Functions
- `nodemailer` - Email sending
- `googleapis` - Google APIs integration

## 🏗️ Architecture

### Express App
The main Express application is defined in `src/app.js` and exported as a single Firebase Function (`api`). All routes are organized by resource and mounted under `/api/v1/`.

### Handlers
Business logic is separated into handler files in `src/handlers/`. Each handler contains functions that process requests and interact with Firestore.

### Routes
Route files in `src/routes/` define the Express routes and apply middleware (authentication, authorization) before calling handlers.

### Middleware
- **CORS** - Cross-origin resource sharing
- **Authentication** - Firebase Auth token verification
- **Authorization** - Role-based access control
- **Logging** - Request logging
- **Rate Limiting** - Basic rate limiting (can be enhanced)

## 🔄 Background Functions

### Firestore Triggers
- `onPostCreated` - Triggered when post is created
- `onPostUpdated` - Triggered when post is updated
- `onUserCreated` - Triggered when user is created

### Scheduled Functions
- `processScheduledPosts` - Process scheduled posts (hourly)
- `cleanupExpiredPreviewTokens` - Clean up expired tokens (daily)
- `scheduledGrokFetchTrending` - Fetch trending stories (hourly)
- `scheduledGrokFetchBreaking` - Fetch breaking news (every 30 min)
- `scheduledGrokFetchCompany` - Fetch company news (every 2 hours)
- `scheduledGrokFetchFunding` - Fetch funding news (every 4 hours)

## 🧪 Testing

```bash
# Run tests (if available)
npm test

# Test specific function
firebase functions:shell
```

## 📝 Scripts

- `npm run serve` - Start emulators
- `npm run deploy` - Deploy functions
- `npm run logs` - View function logs

## 🔍 Monitoring

```bash
# View logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --follow

# View specific function logs
firebase functions:log --only api
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS configuration in `src/config/index.js`
2. **Authentication Errors**: Verify Firebase Auth token is valid
3. **Permission Errors**: Check user role in Firestore
4. **Deployment Errors**: Check Firebase project configuration

## 📄 License

Private project - TechBlit
