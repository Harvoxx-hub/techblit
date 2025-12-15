#!/usr/bin/env node

/**
 * Test script for email functionality
 * Usage: node src/scripts/test-email.js [test-type]
 * 
 * Test types:
 *   - welcome: Test welcome email
 *   - reset: Test password reset email
 *   - verify: Test SMTP connection verification only
 */

require('dotenv').config();
const { sendWelcomeEmail, sendPasswordResetEmail, createTransporter } = require('../utils/email');

async function testConnection() {
  console.log('🔍 Testing SMTP connection...\n');
  
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\nError details:');
    console.error('  Code:', error.code);
    console.error('  Command:', error.command);
    if (error.response) {
      console.error('  Response:', error.response);
    }
    console.error('\n💡 Troubleshooting tips:');
    console.error('  1. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in .env');
    console.error('  2. For Zoho: Use port 465 with secure=true or port 587 with secure=false');
    console.error('  3. Verify your email credentials are correct');
    console.error('  4. Check if your IP is whitelisted (if required by your email provider)');
    return false;
  }
}

async function testWelcomeEmail() {
  console.log('📧 Testing welcome email...\n');
  
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  const testName = 'Test User';
  const testPassword = 'TempPass123!';
  const invitedBy = 'Admin User';
  
  console.log('Test parameters:');
  console.log('  To:', testEmail);
  console.log('  Name:', testName);
  console.log('  Password:', testPassword);
  console.log('  Invited by:', invitedBy);
  console.log('');
  
  try {
    const result = await sendWelcomeEmail(testEmail, testName, testPassword, invitedBy);
    
    if (result) {
      console.log('✅ Welcome email sent successfully!');
      console.log('   Check your inbox at:', testEmail);
      return true;
    } else {
      console.log('❌ Failed to send welcome email (returned false)');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    console.error('\nFull error:', error);
    return false;
  }
}

async function testPasswordResetEmail() {
  console.log('📧 Testing password reset email...\n');
  
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  const testName = 'Test User';
  const resetToken = 'test-reset-token-12345';
  
  console.log('Test parameters:');
  console.log('  To:', testEmail);
  console.log('  Name:', testName);
  console.log('  Reset token:', resetToken);
  console.log('');
  
  try {
    const result = await sendPasswordResetEmail(testEmail, testName, resetToken);
    
    if (result) {
      console.log('✅ Password reset email sent successfully!');
      console.log('   Check your inbox at:', testEmail);
      return true;
    } else {
      console.log('❌ Failed to send password reset email (returned false)');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    console.error('\nFull error:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 Email Functionality Test\n');
  console.log('='.repeat(50));
  console.log('');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.zoho.com (default)');
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || '465 (default)');
  console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE || 'auto-detect');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '***set***' : '❌ NOT SET');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***set***' : '❌ NOT SET');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM || 'noreply@techblit.com (default)');
  console.log('  TEST_EMAIL:', process.env.TEST_EMAIL || 'test@example.com (default)');
  console.log('');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ ERROR: EMAIL_USER and EMAIL_PASSWORD must be set in .env file');
    console.error('   Copy env.example.txt to .env and fill in your email credentials');
    process.exit(1);
  }
  
  const testType = process.argv[2] || 'verify';
  
  let success = false;
  
  switch (testType) {
    case 'verify':
      success = await testConnection();
      break;
      
    case 'welcome':
      success = await testConnection();
      if (success) {
        success = await testWelcomeEmail();
      }
      break;
      
    case 'reset':
      success = await testConnection();
      if (success) {
        success = await testPasswordResetEmail();
      }
      break;
      
    case 'all':
      success = await testConnection();
      if (success) {
        console.log('\n' + '='.repeat(50) + '\n');
        const welcomeSuccess = await testWelcomeEmail();
        console.log('\n' + '='.repeat(50) + '\n');
        const resetSuccess = await testPasswordResetEmail();
        success = welcomeSuccess && resetSuccess;
      }
      break;
      
    default:
      console.error('❌ Unknown test type:', testType);
      console.error('\nUsage: node src/scripts/test-email.js [test-type]');
      console.error('\nTest types:');
      console.error('  verify  - Test SMTP connection only (default)');
      console.error('  welcome - Test welcome email');
      console.error('  reset   - Test password reset email');
      console.error('  all     - Run all tests');
      process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

// Run the tests
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

