const mongoose = require('mongoose');

const wehicalSchema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true,
  },
  plateNumber: {
    type: String,
    required: true,
  },
  // ... other wehical fields
});

const Wehical = mongoose.model('Wehical', wehicalSchema);

module.exports = Wehical;
