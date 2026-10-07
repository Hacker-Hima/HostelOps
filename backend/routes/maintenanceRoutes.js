const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  reportDamageWithEvidence,
  updateTaskStatus,
  inspectAsset,
  completeMaintenance,
  getMaintenanceHistory,
  getTechnicianStats,
  assignTechnician,
  approveMaintenanceCompletion,
} = require('../controllers/maintenanceController');
const { protect, authorize, technicianMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('technician', 'staff', 'admin'), getTechnicianStats);
router.get('/history', protect, getMaintenanceHistory);
router.post('/inspect', protect, authorize('technician', 'staff', 'admin'), inspectAsset);
router.post('/report-damage', protect, reportDamageWithEvidence);

router.get('/tasks', protect, authorize('technician', 'staff', 'admin'), getTasks);
router.get('/tasks/:id', protect, authorize('technician', 'staff', 'admin'), getTaskById);
router.put('/tasks/:id/status', protect, authorize('technician', 'staff', 'admin'), updateTaskStatus);
router.put('/tasks/:id/complete', protect, authorize('technician', 'staff', 'admin'), completeMaintenance);
router.put('/tasks/:id/assign', protect, authorize('admin'), assignTechnician);
router.put('/tasks/:id/approve-completion', protect, authorize('admin'), approveMaintenanceCompletion);

module.exports = router;
