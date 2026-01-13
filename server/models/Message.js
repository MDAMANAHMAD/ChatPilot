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
  toJSON: { getters: true },
  toObject: { getters: true }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
