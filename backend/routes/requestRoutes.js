const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyRequests);

router
  .route('/')
  .get(protect, authorize('admin'), getAllRequests)
  .post(protect, createRequest);

router.put('/:id', protect, authorize('admin'), updateRequestStatus);

module.exports = router;
