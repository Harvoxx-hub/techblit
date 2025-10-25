# Deploy TechBlit to Vercel

## Architecture Overview

- **Frontend**: Next.js on Vercel
- **Backend**: Cloud Functions on Firebase
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage

## Prerequisites

1. Install Vercel CLI: `npm install -g vercel`
2. Have a Vercel account

## Deployment Steps

### 1. Initial Setup

```bash
cd /Users/victor/techblit/techblit
vercel login
```

### 2. Environment Variables

Set these in Vercel Dashboard (Settings → Environment Variables):

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBZMikgSM6h0_WXGrc296Iul8o2C6PlBZY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=techblit.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=techblit
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=techblit.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=164687436773
NEXT_PUBLIC_FIREBASE_APP_ID=1:164687436773:web:c6db864b0010f6ef0eed0c
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-HGMXCFDD9N

# Cloud Functions URL
NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=https://us-central1-techblit.cloudfunctions.net

# Site URL (update after first deployment)
NEXT_PUBLIC_SITE_URL=https://techblit.vercel.app
```

### 3. Deploy

```bash
# First deployment (will ask questions)
vercel

# Production deployment
vercel --prod
```

### 4. Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add techblit.com
```

Then update DNS records as instructed by Vercel.

## Post-Deployment

1. Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables with your actual URL
2. Update Firebase Authentication authorized domains:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add your Vercel domain (e.g., `techblit.vercel.app`)
3. Update CORS settings in Cloud Functions if needed

## Local Development

```bash
# Install dependencies
npm install

# Copy .env.local from .env.local.example
cp .env.local.example .env.local

# Run development server
npm run dev
```

## Continuous Deployment

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: For all other branches and pull requests

## Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Analytics**: Built-in Vercel Analytics
- **Functions**: Monitor Cloud Functions in Firebase Console

## Troubleshooting

### Build Failures

Check Vercel build logs in the deployment dashboard.

### Environment Variables Not Working

Ensure variables are set for all environments (Production, Preview, Development).

### Firebase Connection Issues

Verify:
1. Environment variables are correctly set
2. Firebase domain is authorized
3. Cloud Functions are deployed and accessible

