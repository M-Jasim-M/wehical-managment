const mongoose = require('mongoose');
const wehicalSchema = require('./wehicalscheam');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phoneNumber: String,
  image: String,
  isAdmin: { type: String, default: 'client' },
  resetPasswordToken: String, // Add this line for reset password token
  resetPasswordExpires: Date,
  wehical: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wehical',
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
