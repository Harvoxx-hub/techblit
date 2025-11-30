# Firebase Admin SDK Setup Guide

## ✅ Current Status

### Local Development
- **Status**: ✅ Configured
- **Method**: `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- **File**: `.env.local` (already set up)

### Production (Vercel)
- **Status**: ⚠️ Needs Configuration
- **Method**: `FIREBASE_SERVICE_ACCOUNT` environment variable
- **Action Required**: Add to Vercel dashboard

## 🔧 Setup Instructions

### For Local Development (Already Done ✅)

The `.env.local` file has been configured with:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/Users/victor/techblit/techblit-cloud-function/techblit-firebase-adminsdk-fbsvc-1395c2bee0.json
```

**Restart your dev server** for the changes to take effect:
```bash
npm run dev
```

### For Production (Vercel) - Action Required

1. **Go to Vercel Dashboard**:
   - Navigate to: https://vercel.com/seguns-projects-a4602dd9/techblit/settings/environment-variables

2. **Add Environment Variable**:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Copy the entire JSON content from:
     `techblit-cloud-function/techblit-firebase-adminsdk-fbsvc-1395c2bee0.json`
   - **Environments**: Select "Production", "Preview", and "Development"
   - **Important**: Paste the entire JSON as a single-line string (or use JSON.stringify)

3. **Example Format**:
   ```json
   {"type":"service_account","project_id":"techblit","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@techblit.iam.gserviceaccount.com",...}
   ```

4. **Redeploy**:
   After adding the variable, redeploy your application:
   ```bash
   npx vercel --prod
   ```

## 🔍 How It Works

The code automatically detects which credentials are available:

1. **First Priority**: `FIREBASE_SERVICE_ACCOUNT` (JSON string) - Used in Vercel
2. **Second Priority**: `GOOGLE_APPLICATION_CREDENTIALS` (file path) - Used locally
3. **Fallback**: Client Firebase SDK - Used if Admin SDK isn't available

## ✅ Verification

### Check Local Setup
```bash
# Restart dev server and check console
npm run dev
# Look for: "Firebase Admin SDK initialized" (no errors)
```

### Check Production Setup
After deploying, check Vercel logs for:
- No "Could not load the default credentials" errors
- Articles should load with full content in HTML (for SEO)

## 📝 Notes

- **Local Development**: Uses client SDK fallback if Admin SDK fails (this is fine for dev)
- **Production**: Admin SDK is required for proper SEO (full content in HTML)
- **Security**: Never commit `.env.local` or service account files to git
- The service account file is already in `.gitignore`

## 🚨 Troubleshooting

### Error: "Could not load the default credentials"
- **Local**: Check that `GOOGLE_APPLICATION_CREDENTIALS` path is correct in `.env.local`
- **Production**: Verify `FIREBASE_SERVICE_ACCOUNT` is set in Vercel dashboard
- **Solution**: The app will fall back to client SDK (works but not optimal for SEO)

### Error: "Failed to parse FIREBASE_SERVICE_ACCOUNT"
- **Cause**: JSON is malformed or has line breaks
- **Solution**: Ensure the JSON is a single-line string in Vercel

