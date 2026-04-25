const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const { protect } = require('../middleware/auth');

// All routes below require login
router.use(protect);

// POST /api/requests — submit a new credentialing request
router.post('/', async (req, res) => {
  try {
    const {
      providerName, providerNPI, specialty,
      insurancePlan, licenseNumber, licenseState, notes
    } = req.body;

    if (!providerName || !providerNPI || !specialty || !insurancePlan || !licenseNumber || !licenseState)
      return res.status(400).json({ message: 'All required fields must be filled' });

    const newRequest = await Request.create({
      client: req.user._id,
      providerName, providerNPI, specialty,
      insurancePlan, licenseNumber, licenseState, notes
    });

    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests — get MY requests (client sees only their own)
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find({ client: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/:id — get single request
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findOne({ _id: req.params.id, client: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
