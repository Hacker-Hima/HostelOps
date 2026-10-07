const MaintenanceTask = require('../models/MaintenanceTask');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');
const DamageReport = require('../models/DamageReport');
const User = require('../models/User');

// @desc    Get all maintenance tasks with filters
// @route   GET /api/maintenance/tasks
// @access  Private (Technician, Admin)
const getTasks = async (req, res, next) => {
  try {
    const { status, category, priority, search, myTasks } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (myTasks === 'true' && req.user) {
      query.assignedTo = req.user._id;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { taskCode: new RegExp(term, 'i') },
        { title: new RegExp(term, 'i') },
        { issueDescription: new RegExp(term, 'i') },
        { roomNumber: new RegExp(term, 'i') },
        { hostelBlock: new RegExp(term, 'i') },
      ];
    }

    const tasks = await MaintenanceTask.find(query)
      .populate('asset', 'assetName assetCode category hostelBlock roomNumber condition status')
      .populate('assignedTo', 'name email phone role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single maintenance task
// @route   GET /api/maintenance/tasks/:id
// @access  Private (Technician, Admin)
const getTaskById = async (req, res, next) => {
  try {
    const task = await MaintenanceTask.findById(req.params.id)
      .populate('asset')
      .populate('assignedTo', 'name email phone role')
      .populate('damageReport');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Maintenance task not found' });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Report damaged asset with optional photo evidence & schedule task
// @route   POST /api/maintenance/report-damage
// @access  Private (Technician, Admin, Student)
const reportDamageWithEvidence = async (req, res, next) => {
  try {
    const {
      assetId,
      issueDescription,
      title,
      priority,
      category,
      assetCondition,
      evidencePhoto,
    } = req.body;

    if (!assetId || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assetId and issue description',
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Generate unique Task Code
    const count = await MaintenanceTask.countDocuments();
    const taskCode = `MT-${String(count + 101).padStart(4, '0')}`;

    // Update asset condition and status
    const prevStatus = asset.status;
    asset.status = 'Under Maintenance';
    asset.condition = assetCondition || 'Damaged';
    await asset.save();

    // Create DamageReport record for audit compatibility
    const damageReport = await DamageReport.create({
      asset: asset._id,
      reportedBy: req.user._id,
      reportType: 'Damaged',
      description: issueDescription,
      severity: priority === 'Emergency' || priority === 'High' ? 'Severe' : 'Moderate',
      status: 'Under Maintenance',
      adminRemarks: `Maintenance task ${taskCode} created`,
    });

    // Create Maintenance Task
    const task = await MaintenanceTask.create({
      taskCode,
      title: title || `Repair ${asset.assetName} in ${asset.hostelBlock} Rm ${asset.roomNumber}`,
      asset: asset._id,
      assignedTo: req.user.role === 'technician' || req.user.role === 'staff' ? req.user._id : null,
      assignedName: req.user.role === 'technician' ? req.user.name : 'Hostel Maintenance Staff',
      category: category || asset.category || 'Other',
      hostelBlock: asset.hostelBlock,
      roomNumber: asset.roomNumber,
      priority: priority || 'Medium',
      status: req.user.role === 'technician' ? 'In Progress' : 'Pending',
      assetCondition: asset.condition,
      issueDescription,
      evidencePhoto: evidencePhoto || '',
      damageReport: damageReport._id,
      reportedBy: req.user._id,
      reportedByName: req.user.name,
    });

    // Log in AssetHistory
    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Maintenance Scheduled',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: prevStatus,
      newStatus: asset.status,
      details: `Task [${taskCode}]: ${issueDescription} (Condition: ${asset.condition})`,
    });

    await task.populate('asset', 'assetName assetCode category hostelBlock roomNumber condition status');

    res.status(201).json({
      success: true,
      task,
      message: `Damage reported and Maintenance Task ${taskCode} scheduled successfully!`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update repair status (Pending -> In Progress -> Completed), condition, remarks
// @route   PUT /api/maintenance/tasks/:id/status
// @access  Private (Technician, Admin)
const updateTaskStatus = async (req, res, next) => {
  try {
    const {
      status,
      assetCondition,
      remarks,
      repairDetails,
      completionDate,
      evidencePhoto,
    } = req.body;

    const task = await MaintenanceTask.findById(req.params.id).populate('asset');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Maintenance task not found' });
    }

    const prevTaskStatus = task.status;
    if (status) task.status = status;
    if (assetCondition) task.assetCondition = assetCondition;
    if (remarks !== undefined) task.remarks = remarks;
    if (repairDetails !== undefined) task.repairDetails = repairDetails;
    if (evidencePhoto) task.evidencePhoto = evidencePhoto;

    // If technician claiming or working on the task
    if (!task.assignedTo && (req.user.role === 'technician' || req.user.role === 'staff')) {
      task.assignedTo = req.user._id;
      task.assignedName = req.user.name;
    }

    const asset = await Asset.findById(task.asset._id || task.asset);
    let historyAction = 'Maintenance Progress';

    if (status === 'In Progress') {
      if (asset) {
        asset.status = 'Under Maintenance';
        if (assetCondition) asset.condition = assetCondition;
        await asset.save();
      }
      historyAction = 'Work Started';
    } else if (status === 'Completed') {
      task.completedAt = new Date();
      task.completionDate = completionDate || new Date().toISOString().split('T')[0];
      if (assetCondition) {
        task.assetCondition = assetCondition;
      } else {
        task.assetCondition = 'Good';
      }

      if (asset) {
        asset.status = asset.assignedTo ? 'Assigned' : 'Available';
        asset.condition = task.assetCondition;
        await asset.save();
      }

      // Update linked damage report if any
      if (task.damageReport) {
        await DamageReport.findByIdAndUpdate(task.damageReport, {
          status: 'Resolved',
          adminRemarks: `Completed by technician: ${repairDetails || remarks || 'Repaired'}`,
        });
      }

      historyAction = 'Repaired';
    } else {
      if (asset && assetCondition) {
        asset.condition = assetCondition;
        await asset.save();
      }
    }

    await task.save();

    // Log history
    if (asset) {
      await AssetHistory.create({
        asset: asset._id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        action: historyAction,
        performedBy: req.user._id,
        performedByName: req.user.name,
        previousStatus: prevTaskStatus,
        newStatus: task.status,
        details: `Task [${task.taskCode}] status '${task.status}'. Notes: ${repairDetails || remarks || 'Status updated'} (Asset Condition: ${asset.condition})`,
      });
    }

    res.json({
      success: true,
      task,
      message: `Task ${task.taskCode} updated to '${task.status}' successfully!`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Physical asset inspection
// @route   POST /api/maintenance/inspect
// @access  Private (Technician, Admin)
const inspectAsset = async (req, res, next) => {
  try {
    const { assetId, condition, inspectionNotes, status } = req.body;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'Asset ID is required' });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const prevCondition = asset.condition;
    const prevStatus = asset.status;

    if (condition) asset.condition = condition;
    if (status) asset.status = status;
    await asset.save();

    // Log inspection in AssetHistory
    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Inspected',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: prevStatus,
      newStatus: asset.status,
      details: `Physical inspection by ${req.user.name}. Condition changed from ${prevCondition} to ${asset.condition}. Notes: ${inspectionNotes || 'Physical inspection verified.'}`,
    });

    res.json({
      success: true,
      asset,
      message: `Asset [${asset.assetCode}] inspected: condition marked as '${asset.condition}'`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete maintenance with full repair details
// @route   PUT /api/maintenance/tasks/:id/complete
// @access  Private (Technician, Admin)
const completeMaintenance = async (req, res, next) => {
  try {
    const { repairDetails, remarks, completionDate, condition = 'Good' } = req.body;

    const task = await MaintenanceTask.findById(req.params.id).populate('asset');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Maintenance task not found' });
    }

    task.status = 'Completed';
    task.repairDetails = repairDetails || 'Maintenance inspection and repair successfully finished.';
    task.remarks = remarks || 'Repaired and restored to operational state.';
    task.completionDate = completionDate || new Date().toISOString().split('T')[0];
    task.completedAt = new Date();
    task.assetCondition = condition;

    const asset = await Asset.findById(task.asset._id || task.asset);
    if (asset) {
      asset.status = asset.assignedTo ? 'Assigned' : 'Available';
      asset.condition = condition;
      await asset.save();
    }

    if (task.damageReport) {
      await DamageReport.findByIdAndUpdate(task.damageReport, {
        status: 'Resolved',
        adminRemarks: `Maintenance Completed: ${task.repairDetails} (Remarks: ${task.remarks})`,
      });
    }

    await task.save();

    if (asset) {
      await AssetHistory.create({
        asset: asset._id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        action: 'Repaired',
        performedBy: req.user._id,
        performedByName: req.user.name,
        previousStatus: 'Under Maintenance',
        newStatus: asset.status,
        details: `Work completed by ${req.user.name}. Details: "${task.repairDetails}". Remarks: "${task.remarks}". Date: ${task.completionDate}`,
      });
    }

    res.json({
      success: true,
      task,
      message: `Maintenance task ${task.taskCode} completed successfully!`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get maintenance & repair history across all assets
// @route   GET /api/maintenance/history
// @access  Private (Technician, Admin, Student)
const getMaintenanceHistory = async (req, res, next) => {
  try {
    const { assetId } = req.query;
    const filter = {
      action: {
        $in: [
          'Repaired',
          'Work Started',
          'Maintenance Scheduled',
          'Sent for Maintenance',
          'Damage Reported',
          'Inspected',
          'Asset Restored',
        ],
      },
    };

    if (assetId) {
      filter.asset = assetId;
    }

    const history = await AssetHistory.find(filter)
      .populate('asset', 'assetName assetCode category hostelBlock roomNumber condition status')
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);

    // Also fetch completed tasks
    const completedTasks = await MaintenanceTask.find({ status: 'Completed' })
      .populate('asset', 'assetName assetCode category hostelBlock roomNumber')
      .populate('assignedTo', 'name email')
      .sort({ completedAt: -1, updatedAt: -1 })
      .limit(50);

    res.json({
      success: true,
      history,
      completedTasks,
      totalCount: history.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get technician dashboard statistics
// @route   GET /api/maintenance/stats
// @access  Private (Technician, Admin)
const getTechnicianStats = async (req, res, next) => {
  try {
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      underMaintenanceAssets,
      damagedAssets,
    ] = await Promise.all([
      MaintenanceTask.countDocuments(),
      MaintenanceTask.countDocuments({ status: 'Pending' }),
      MaintenanceTask.countDocuments({ status: 'In Progress' }),
      MaintenanceTask.countDocuments({ status: 'Completed' }),
      Asset.countDocuments({ status: 'Under Maintenance' }),
      Asset.countDocuments({ status: 'Damaged' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        underMaintenanceAssets,
        damagedAssets,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign maintenance task to a technician (Admin 2)
// @route   PUT /api/maintenance/tasks/:id/assign
// @access  Private (Admin)
const assignTechnician = async (req, res, next) => {
  try {
    const { technicianId, priority, adminNotes } = req.body;
    const task = await MaintenanceTask.findById(req.params.id).populate('asset');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Maintenance task not found' });
    }

    const techUser = await User.findById(technicianId);
    if (!techUser) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }

    task.assignedTo = techUser._id;
    task.assignedName = techUser.name;
    task.status = 'In Progress';
    if (priority) task.priority = priority;
    if (adminNotes) task.remarks = `Assigned by Admin: ${adminNotes}`;

    await task.save();

    if (task.asset) {
      await AssetHistory.create({
        asset: task.asset._id,
        assetCode: task.asset.assetCode,
        assetName: task.asset.assetName,
        action: 'Task Assigned',
        performedBy: req.user._id,
        performedByName: req.user.name,
        previousStatus: task.asset.status,
        newStatus: 'Under Maintenance',
        details: `Assigned task [${task.taskCode}] to technician ${techUser.name}. Priority: ${task.priority}`,
      });
    }

    res.json({
      success: true,
      task,
      message: `Task ${task.taskCode} assigned to ${techUser.name} successfully!`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin approve maintenance completion & return asset to operational status (Admin 2)
// @route   PUT /api/maintenance/tasks/:id/approve-completion
// @access  Private (Admin)
const approveMaintenanceCompletion = async (req, res, next) => {
  try {
    const { adminRemarks = 'Approved by Maintenance Administrator' } = req.body;
    const task = await MaintenanceTask.findById(req.params.id).populate('asset');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Maintenance task not found' });
    }

    task.status = 'Completed';
    task.remarks = `${task.remarks || ''} [Approved: ${adminRemarks}]`.trim();
    if (!task.completedAt) task.completedAt = new Date();
    if (!task.completionDate) task.completionDate = new Date().toISOString().split('T')[0];

    const asset = await Asset.findById(task.asset._id || task.asset);
    if (asset) {
      asset.status = asset.assignedTo ? 'Assigned' : 'Available';
      asset.condition = 'Good';
      await asset.save();
    }

    if (task.damageReport) {
      await DamageReport.findByIdAndUpdate(task.damageReport, {
        status: 'Resolved',
        adminRemarks: `Admin sign-off: ${adminRemarks}`,
      });
    }

    await task.save();

    if (asset) {
      await AssetHistory.create({
        asset: asset._id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        action: 'Maintenance Approved',
        performedBy: req.user._id,
        performedByName: req.user.name,
        previousStatus: 'Under Maintenance',
        newStatus: asset.status,
        details: `Admin sign-off for [${task.taskCode}]. Asset restored to '${asset.status}' condition 'Good'. Remarks: ${adminRemarks}`,
      });
    }

    res.json({
      success: true,
      task,
      message: `Maintenance task ${task.taskCode} sign-off approved! Asset restored to operational inventory.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
