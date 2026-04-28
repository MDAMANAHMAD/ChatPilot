/**
 * ENCRYPTION UTILITIES
 * 
 * This module provides functions to protect message content using AES-256-CBC encryption.
 * It uses Node's native 'crypto' library for cryptographic operations.
 */

const crypto = require('crypto');

/**
 * CONFIGURATION
 * - ENCRYPTION_KEY: A 32-byte secret used to encrypt/decrypt data.
 * - IV_LENGTH: For AES-256-CBC, the Initialization Vector (IV) must be 16 bytes.
 */
const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || 'v6yB$#@F1pL0t_S3cr3t_K3y_32_Chars!'; 
const IV_LENGTH = 16; 

/**
 * ENCRYPT FUNCTION
 * Takes plaintext string and returns a hex-encoded string containing IV and encrypted data.
 * Format: "iv_hex:encrypted_data_hex"
 */
function encrypt(text) {
    if (!text) return text;
    try {
        // Generate a unique IV for every encryption to ensure different result for same text
        let iv = crypto.randomBytes(IV_LENGTH);
        
        // Create cipher instance using algorithm, key, and IV
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        
        // Encrypt the text chunk by chunk
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // Return IV and ciphertext combined with a colon separator
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
}

/**
 * DECRYPT FUNCTION
 * Takes hex-encoded string (iv:ciphertext) and returns original plaintext.
 */
function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        // Split the combined string back into IV and ciphertext parts
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        
        // Create decipher instance using same algorithm and key as encryption
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        
        // Decrypt the ciphertext
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        return text;
    }
}

module.exports = { encrypt, decrypt };
