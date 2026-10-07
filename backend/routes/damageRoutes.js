const express = require('express');
const router = express.Router();
const {
  reportDamage,
  getAllDamageReports,
  getMyDamageReports,
  updateDamageStatus,
} = require('../controllers/damageController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my', protect, getMyDamageReports);

router
  .route('/')
  .get(protect, authorize('admin'), getAllDamageReports)
  .post(protect, reportDamage);

router.put('/:id', protect, authorize('admin'), updateDamageStatus);

module.exports = router;
