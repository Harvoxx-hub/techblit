const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Create email transporter
 * @returns {object} - Nodemailer transporter
 */
function createTransporter() {
  // For development, use Gmail SMTP
  // In production, use a proper email service like SendGrid, Mailgun, etc.
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "seguncodes@gmail.com",
      pass:  "vwtq xcuf nmmt ecuh"
    }
  });
  
  return transporter;
}

/**
 * Send welcome email to invited user
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} temporaryPassword - Generated password
 * @param {string} invitedBy - Name of person who invited them
 * @returns {Promise<boolean>} - Whether email was sent successfully
 */
async function sendWelcomeEmail(email, name, temporaryPassword, invitedBy) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: config.email.from,
      replyTo: config.email.replyTo,
      to: email,
      subject: 'Welcome to TechBlit Team! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TechBlit</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: #fff; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
            .password { font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to TechBlit!</h1>
              <p>You've been invited to join our amazing team</p>
            </div>
            
            <div class="content">
              <h2>Hello ${name}!</h2>
              
              <p>Great news! <strong>${invitedBy}</strong> has invited you to join the TechBlit team. We're excited to have you on board!</p>
              
              <p>TechBlit is our modern blog platform where you'll be able to:</p>
              <ul>
                <li>📝 Create and manage blog posts</li>
                <li>🎨 Work with our advanced editor</li>
                <li>📊 Track analytics and performance</li>
                <li>👥 Collaborate with the team</li>
                <li>⚙️ Manage content and settings</li>
              </ul>
              
              <h3>🔐 Your Login Credentials</h3>
              <p>We've created an account for you. Here are your temporary login credentials:</p>
              
              <div class="password-box">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong></p>
                <div class="password">${temporaryPassword}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Note:</strong><br>
                Please change your password immediately after your first login for security reasons.
              </div>
              
              <div style="text-align: center;">
                <a href="https://techblit.com/admin/login" class="button">🚀 Login to TechBlit</a>
              </div>
              
           
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to TechBlit Team! 🎉

        Hello ${name}!

        Great news! ${invitedBy} has invited you to join the TechBlit team. We're excited to have you on board!

        TechBlit is our modern blog platform where you'll be able to:
        - Create and manage blog posts
        - Work with our advanced editor
        - Track analytics and performance
        - Collaborate with the team
        - Manage content and settings

        Your Login Credentials:
        Email: ${email}
        Temporary Password: ${temporaryPassword}

        ⚠️ Important: Please change your password immediately after your first login.

        Login here: https://techblit.com/admin/login

        Getting Started:
        - Dashboard: Overview of your content and analytics
        - Posts: Create, edit, and manage blog posts
        - Media Library: Upload and organize images
        - Settings: Customize your profile and preferences

        If you have any questions, don't hesitate to reach out!

        Welcome aboard!
        The TechBlit Team

        ---
        This email was sent because you were invited to join TechBlit.
        If you didn't expect this invitation, please contact our support team.
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} resetToken - Password reset token
 * @returns {Promise<boolean>} - Whether email was sent successfully
 */
async function sendPasswordResetEmail(email, name, resetToken) {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `https://techblit.com/admin/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: config.email.from,
      replyTo: config.email.replyTo,
      to: email,
      subject: 'Reset Your TechBlit Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Password - TechBlit</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${name}!</h2>
              
              <p>We received a request to reset your password for your TechBlit account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              
              <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>Best regards,<br>
              <strong>The TechBlit Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2024 TechBlit. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return true;
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  createTransporter
};