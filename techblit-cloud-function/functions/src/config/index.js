// Environment configuration
const config = {
  // Firebase project configuration
  projectId: process.env.GCLOUD_PROJECT || 'techblit',
  
  // CORS configuration
  cors: {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://techblit.vercel.app',
      'https://techblit.com'
    ],
    credentials: true,
    // Allow Vercel preview deployments (pattern matching handled in middleware)
    allowVercelPreviews: true
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Email configuration
  email: {
    // Use EMAIL_USER as FROM if EMAIL_FROM is not set (required by most SMTP servers)
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@techblit.com',
    replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER || 'support@techblit.com'
  },
  
  // Image processing
  imageProcessing: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    thumbnailSizes: [150, 300, 600, 1200]
  }
};

module.exports = config;
