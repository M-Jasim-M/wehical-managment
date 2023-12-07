const mongoose = require('mongoose');
const wehicalSchema = require('./wehicalscheam');
const fuelHistorySchema = require('./fuelingscheama'); // Import the fuel history schema

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phoneNumber: String,
  image: String,
  isAdmin: { type: String, default: 'client' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  wehical: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wehical',
  },
  fuelHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelingDetail',
  }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
