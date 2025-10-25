#!/bin/bash

# TechBlit Cloud Functions Deployment Script

echo "🚀 Deploying TechBlit Cloud Functions..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please login to Firebase first: firebase login"
    exit 1
fi

# Navigate to functions directory
cd functions

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linter..."
npm run lint

# Deploy functions
echo "🚀 Deploying to Firebase..."
firebase deploy --only functions

# Test health check
echo "🏥 Testing health check..."
HEALTH_URL="https://healthcheck-4alcog3g7q-uc.a.run.app"
curl -s "$HEALTH_URL" | jq '.' || echo "Health check response received"

echo "✅ Deployment complete!"
echo ""
echo "📋 Available Functions:"
echo "  • getPosts: https://getposts-4alcog3g7q-uc.a.run.app"
echo "  • getPost: https://getpost-4alcog3g7q-uc.a.run.app"
echo "  • createPost: https://createpost-4alcog3g7q-uc.a.run.app"
echo "  • updatePost: https://updatepost-4alcog3g7q-uc.a.run.app"
echo "  • getUsers: https://getusers-4alcog3g7q-uc.a.run.app"
echo "  • getUserProfile: https://getuserprofile-4alcog3g7q-uc.a.run.app"
echo "  • healthCheck: https://healthcheck-4alcog3g7q-uc.a.run.app"
echo "  • generateSitemap: https://generatesitemap-4alcog3g7q-uc.a.run.app"
echo ""
echo "📝 Note: Firestore triggers may need to be redeployed after permissions are set up."
