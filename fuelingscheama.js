// models/fuelingDetail.js
const mongoose = require('mongoose');

const fuelingDetailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  wehical: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wehical',
  },
  stationName: String,
  pricePerLiter: Number,
  totalLiters: Number,
  totalPrice: Number,
  location: String,
  date: {
    type: Date,
    default: Date.now,
  },
  image: String,
});

const FuelingDetail = mongoose.model('FuelingDetail', fuelingDetailSchema);

module.exports = FuelingDetail;
