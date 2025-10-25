const crypto = require('crypto');

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 12)
 * @param {object} options - Password generation options
 * @returns {string} - Generated password
 */
function generatePassword(length = 12, options = {}) {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true
  } = options;

  let charset = '';
  
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Remove similar characters if requested
  if (excludeSimilar) {
    charset = charset.replace(/[0O1lI]/g, '');
  }
  
  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Generate a temporary password for new users
 * @returns {string} - Temporary password
 */
function generateTemporaryPassword() {
  return generatePassword(10, {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false, // No symbols for easier typing
    excludeSimilar: true
  });
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex encoded token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using bcrypt (if available) or simple hash
 * @param {string} password - Password to hash
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  // For Cloud Functions, we'll use a simple hash
  // In production, consider using bcrypt or similar
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

/**
 * Verify a password against its hash
 * @param {string} password - Password to verify
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>} - Whether password matches
 */
async function verifyPassword(password, hash) {
  const hashedPassword = await hashPassword(password);
  return hashedPassword === hash;
}

module.exports = {
  generatePassword,
  generateTemporaryPassword,
  generateToken,
  hashPassword,
  verifyPassword
};
