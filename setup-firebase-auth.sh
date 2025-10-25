#!/bin/bash

echo "🔧 TechBlit Firebase Setup Script"
echo "================================="
echo ""

echo "📋 Step 1: Enable Firebase Authentication"
echo "1. Go to https://console.firebase.google.com/"
echo "2. Select your 'techblit' project"
echo "3. Go to Authentication → Sign-in method"
echo "4. Enable 'Email/Password' provider"
echo "5. Click 'Save'"
echo ""

echo "📋 Step 2: Create Demo Users"
echo "You need to create these users manually in Firebase Console:"
echo ""
echo "Super Admin:"
echo "  Email: admin@techblit.com"
echo "  Password: admin123"
echo ""
echo "Editor:"
echo "  Email: editor@techblit.com"
echo "  Password: editor123"
echo ""
echo "Author:"
echo "  Email: author@techblit.com"
echo "  Password: author123"
echo ""

echo "📋 Step 3: Create Users in Firebase Console"
echo "1. Go to Authentication → Users"
echo "2. Click 'Add user'"
echo "3. Enter email and password for each user above"
echo "4. Click 'Add user'"
echo ""

echo "📋 Step 4: Update Firestore Security Rules"
echo "1. Go to Firestore Database → Rules"
echo "2. Replace the rules with:"
echo ""
cat << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Posts collection - authenticated users can read, authors can write
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.author.uid == request.auth.uid);
    }
    
    // Media collection - authenticated users can read/write
    match /media/{mediaId} {
      allow read, write: if request.auth != null;
    }
    
    // Redirects collection - only super admins
    match /redirects/{redirectId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    // Settings collection - only super admins
    match /settings/{settingId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    // Audit logs - only super admins can write, editors can read
    match /audit_logs/{logId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['super_admin', 'editor'];
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
  }
}
EOF
echo ""
echo "3. Click 'Publish'"
echo ""

echo "📋 Step 5: Create User Documents in Firestore"
echo "After creating users in Authentication, you need to create their user documents:"
echo ""
echo "1. Go to Firestore Database → Data"
echo "2. Create a collection called 'users'"
echo "3. For each user, create a document with their UID as the document ID"
echo "4. Add these fields to each user document:"
echo ""

echo "For admin@techblit.com:"
cat << 'EOF'
{
  "name": "Super Admin",
  "email": "admin@techblit.com",
  "role": "super_admin",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastSeen": "2024-01-01T00:00:00Z",
  "permissions": [],
  "isActive": true
}
EOF
echo ""

echo "For editor@techblit.com:"
cat << 'EOF'
{
  "name": "Editor User",
  "email": "editor@techblit.com",
  "role": "editor",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastSeen": "2024-01-01T00:00:00Z",
  "permissions": [],
  "isActive": true
}
EOF
echo ""

echo "For author@techblit.com:"
cat << 'EOF'
{
  "name": "Author User",
  "email": "author@techblit.com",
  "role": "author",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastSeen": "2024-01-01T00:00:00Z",
  "permissions": [],
  "isActive": true
}
EOF
echo ""

echo "✅ Setup Complete!"
echo "After completing these steps, restart your development server:"
echo "npm run dev"
echo ""
echo "Then try logging in with the demo credentials."
