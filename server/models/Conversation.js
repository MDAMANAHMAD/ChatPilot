/**
 * CONVERSATION MODEL
 * 
 * Represents the abstraction of a chat thread between two users.
 * This is used for:
 * - Tracking the shared 'status' (pending/accepted/blocked).
 * - Storing the latest message for the sidebar/list view.
 * - Managing relationship permissions between users.
 */

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // References to the User model for both participants
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Chat link status: helps prevent spam from strangers
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending' 
  },
  
  // Tracks who initiated the conversation first
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Denormalized snapshot of the last message sent in this thread
  lastMessage: { type: Object },
  
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);
