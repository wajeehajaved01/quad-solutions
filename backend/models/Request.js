const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  providerName:   { type: String, required: true },
  providerNPI:    { type: String, required: true },
  specialty:      { type: String, required: true },
  insurancePlan:  { type: String, required: true },
  licenseNumber:  { type: String, required: true },
  licenseState:   { type: String, required: true },
  notes:          { type: String },

  // Simplified — no file upload needed
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
