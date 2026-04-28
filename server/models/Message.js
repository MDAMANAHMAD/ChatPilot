/**
 * MESSAGE MODEL
 * 
 * Defines the structure for chat messages in MongoDB.
 * Key Features:
 * - Transparent encryption/decryption using Mongoose 'set' and 'get'.
 * - Tracking for AI-generated messages.
 * - Delivery status tracking (sent/delivered/read).
 */

const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true
  },
  receiverId: {
    type: String,
    required: true
  },
  /**
   * CONTENT FIELD
   * - set: encrypts text automatically before saving to DB.
   * - get: decrypts data automatically when fetching from DB.
   */
  content: {
    type: String,
    required: true,
    set: encrypt,
    get: decrypt
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Flag to identify if the message was sent by the AI Pilot Agent
  isAiGenerated: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, {
  // Ensure that 'getters' (decryption) are applied when converting to JSON or Object
  toJSON: { getters: true },
  toObject: { getters: true }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
