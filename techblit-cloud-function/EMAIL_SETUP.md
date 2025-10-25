# Environment Variables for TechBlit Cloud Functions

## Email Configuration
Set these in Firebase Console > Functions > Configuration:

```bash
# Email Service Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Alternative: Use SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Alternative: Use Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
```

## Instructions for Gmail Setup:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
   - Use this password as `EMAIL_PASS`

3. **Set Environment Variables**:
   ```bash
   firebase functions:config:set email.user="your-email@gmail.com"
   firebase functions:config:set email.pass="your-app-password"
   ```

## Alternative Email Services:

### SendGrid (Recommended for Production)
```bash
npm install @sendgrid/mail
```

### Mailgun
```bash
npm install mailgun-js
```

### AWS SES
```bash
npm install aws-sdk
```

## Testing Email Locally:

1. Set environment variables in `.env` file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

2. Test the invitation function:
   ```bash
   curl -X POST http://localhost:5001/techblit/us-central1/inviteUser \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "name": "Test User",
       "role": "author"
     }'
   ```
