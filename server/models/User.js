/**
 * USER MODEL
 * 
 * Defines the user profile and authentication data.
 * Includes security hooks to hash passwords before storage.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

/**
 * PRE-SAVE HOOK
 * If the password has been modified, hash it using Bcrypt with 10 salt rounds.
 * This ensures we never store plaintext passwords in the database.
 */
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * MATCH PASSWORD UTILITY
 * Compares an entered plaintext password with the hashed password in the DB.
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
