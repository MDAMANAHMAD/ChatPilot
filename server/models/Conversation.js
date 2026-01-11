const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending' // pending until receiver replies or accepts
  },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: Object },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Conversation', conversationSchema);
