const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phoneNumber: String,
  image: String,
  isAdmin: { type: String, default: 'client' },
  resetPasswordToken: String, // Add this line for reset password token
  resetPasswordExpires: Date,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
