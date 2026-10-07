const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  assignAsset,
  unassignAsset,
  deleteAsset,
  exportAssets,
  importAssets,
  getMyAssets,
  getDashboardStats,
  returnAsset,
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure in-memory upload for CSV parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files (.csv) are allowed for bulk import'));
    }
  },
});

// Dashboard statistics
router.get('/stats/overview', protect, getDashboardStats);

// Bulk CSV export (Must precede /:id)
router.get('/export', protect, authorize('admin'), exportAssets);

// Bulk CSV import (Must precede /:id)
router.post('/import', protect, authorize('admin'), upload.single('file'), importAssets);

// Student's own assigned assets
router.get('/my-assets', protect, getMyAssets);

// General assets collection: list with pagination, search, filter, sort
router
  .route('/')
  .get(protect, getAssets)
  .post(protect, authorize('admin'), createAsset);

// Individual asset operations
router
  .route('/:id')
  .get(protect, getAssetById)
  .put(protect, authorize('admin'), updateAsset)
  .delete(protect, authorize('admin'), deleteAsset);

// Asset assignment & return routes
router.put('/:id/assign', protect, authorize('admin'), assignAsset);
router.put('/:id/unassign', protect, authorize('admin'), unassignAsset);
router.put('/:id/return', protect, returnAsset);

module.exports = router;
