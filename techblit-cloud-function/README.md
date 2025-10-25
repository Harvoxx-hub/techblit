# TechBlit Cloud Functions

This directory contains Cloud Functions for the TechBlit blog platform.

## 📁 Project Structure

```
functions/
├── src/
│   ├── config/          # Configuration files
│   │   ├── firebase.js  # Firebase Admin SDK setup
│   │   └── index.js     # General configuration
│   ├── handlers/        # Request handlers
│   │   ├── posts.js     # Blog post operations
│   │   └── users.js     # User management
│   ├── middleware/      # Middleware functions
│   │   └── index.js     # CORS, auth, rate limiting
│   ├── types/           # Type definitions and constants
│   │   └── constants.js # Enums and constants
│   └── utils/           # Utility functions
│       └── helpers.js   # Helper functions
├── tests/               # Test files
├── index.js             # Main entry point
└── package.json         # Dependencies
```

## 🚀 Available Functions

### HTTP Functions (API Endpoints)

#### Public APIs
- `getPosts` - Get published posts with filtering
- `getPost` - Get single post by slug
- `incrementViewCount` - Increment post view count
- `healthCheck` - Health check endpoint
- `generateSitemap` - Generate XML sitemap

#### Admin APIs (Require Authentication)
- `createPost` - Create new blog post
- `updatePost` - Update existing post
- `getUsers` - Get all users
- `updateUserRole` - Update user role
- `deleteUser` - Delete user account

#### User APIs (Require Authentication)
- `getUserProfile` - Get user profile
- `updateUserProfile` - Update user profile

### Firestore Triggers (Background Functions)

- `onPostCreated` - Triggered when new post is created
- `onPostUpdated` - Triggered when post is updated
- `onUserCreated` - Triggered when new user is created

## 🛠 Development

### Local Development
```bash
# Install dependencies
npm install

# Start Firebase emulators
npm run serve

# Run tests
npm test

# Lint code
npm run lint
```

### Deployment
```bash
# Deploy to Firebase
npm run deploy

# Deploy to production
npm run deploy:prod
```

## 📝 API Usage

### Authentication
All admin and user APIs require authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Example API Calls

#### Get Published Posts
```bash
curl https://us-central1-techblit.cloudfunctions.net/getPosts
```

#### Get Single Post
```bash
curl https://us-central1-techblit.cloudfunctions.net/getPost?slug=my-post-slug
```

#### Create Post (Admin)
```bash
curl -X POST https://us-central1-techblit.cloudfunctions.net/createPost \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Post",
    "content": "Post content here...",
    "excerpt": "Post excerpt",
    "tags": ["tech", "blog"],
    "categories": ["programming"],
    "status": "draft"
  }'
```

## 🔧 Configuration

### Environment Variables
Set these in Firebase Console > Functions > Configuration:

- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGINS` - Allowed CORS origins
- `RATE_LIMIT_MAX` - Rate limit per window

### Firebase Rules
Ensure your Firestore rules allow the functions to access the required collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow Cloud Functions to access all documents
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📊 Monitoring

### View Logs
```bash
# View recent logs
npm run logs

# Follow logs in real-time
npm run logs:follow
```

### Firebase Console
Monitor function performance and errors in the Firebase Console:
- Functions tab for performance metrics
- Logs tab for detailed logs
- Alerts tab for error notifications

## 🔒 Security

- All admin functions require authentication
- CORS is configured for allowed origins
- Rate limiting is implemented
- Input validation and sanitization
- Audit logging for all operations

## 📈 Performance

- Functions are deployed to `us-central1` region
- Cold start optimization
- Connection pooling for Firestore
- Efficient query patterns
- Proper error handling and logging
