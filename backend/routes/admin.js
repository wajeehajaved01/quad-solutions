const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Request = require('../models/Request');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require login + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats — dashboard numbers
router.get('/stats', async (req, res) => {
  try {
    const totalClients  = await User.countDocuments({ role: 'client' });
    const totalRequests = await Request.countDocuments();
    const pending       = await Request.countDocuments({ status: 'pending' });
    const approved      = await Request.countDocuments({ status: 'approved' });
    const rejected      = await Request.countDocuments({ status: 'rejected' });
    const inReview      = await Request.countDocuments({ status: 'in_review' });

    res.json({ totalClients, totalRequests, pending, approved, rejected, inReview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/clients — list all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password').sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/requests — list all requests with client info
router.get('/requests', async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('client', 'name email company phone')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/requests/:id — single request detail
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('client', 'name email company phone');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/requests/:id/status — update status + admin notes
router.patch('/requests/:id/status', async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'in_review', 'approved', 'rejected'];

    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status value' });

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    ).populate('client', 'name email');

    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/requests/:id
router.delete('/requests/:id', async (req, res) => {
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
