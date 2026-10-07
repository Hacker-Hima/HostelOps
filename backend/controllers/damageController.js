const DamageReport = require('../models/DamageReport');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');

// @desc    Report damaged or lost asset
// @route   POST /api/damage
// @access  Private (Student/Admin)
const reportDamage = async (req, res, next) => {
  try {
    const { assetId, reportType, description, severity } = req.body;

    if (!assetId || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assetId and description of damage/loss',
      });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const isLost = reportType === 'Lost';
    const report = await DamageReport.create({
      asset: asset._id,
      reportedBy: req.user._id,
      reportType: isLost ? 'Lost' : 'Damaged',
      description: description.trim(),
      severity: severity || 'Moderate',
      status: 'Reported',
    });

    const prevStatus = asset.status;
    asset.status = isLost ? 'Lost' : 'Damaged';
    if (!isLost) {
      asset.condition = severity === 'Severe' || severity === 'Total Loss' ? 'Critical' : 'Poor';
    }
    await asset.save();

    // Log history
    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: isLost ? 'Reported Lost' : 'Damage Reported',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: prevStatus,
      newStatus: asset.status,
      details: `${isLost ? 'Lost' : 'Damaged'} reported: ${description} (Severity: ${report.severity})`,
    });

    await report.populate('asset', 'assetName assetCode category roomNumber hostelBlock');
    await report.populate('reportedBy', 'name email hostelBlock roomNumber');

    res.status(201).json({
      success: true,
      report,
      message: `${isLost ? 'Lost property' : 'Damage incident'} reported successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all damage and lost reports with backend pagination, filter, and search
// @route   GET /api/damage
// @access  Private (Admin)
const getAllDamageReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, reportType, status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const query = {};

    if (reportType && reportType !== 'All') {
      query.reportType = reportType;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.description = new RegExp(search.trim(), 'i');
    }

    const totalItems = await DamageReport.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const reports = await DamageReport.find(query)
      .populate('asset', 'assetName assetCode category hostelBlock roomNumber status condition')
      .populate('reportedBy', 'name email hostelBlock roomNumber studentId phone')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: reports,
      reports,
      currentPage: pageNum,
      totalPages,
      totalItems,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's damage reports
// @route   GET /api/damage/my
// @access  Private (Student)
const getMyDamageReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

    const query = { reportedBy: req.user._id };
    const totalItems = await DamageReport.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const reports = await DamageReport.find(query)
      .populate('asset', 'assetName assetCode category hostelBlock roomNumber status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: reports,
      reports,
      currentPage: page,
      totalPages,
      totalItems,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update damage report status & synchronize asset condition
// @route   PUT /api/damage/:id
// @access  Private (Admin)
const updateDamageStatus = async (req, res, next) => {
  try {
    const { status, adminRemarks, resolveAction } = req.body;

    const report = await DamageReport.findById(req.params.id)
      .populate('asset')
      .populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Damage report not found' });
    }

    report.status = status || report.status;
    if (adminRemarks !== undefined) report.adminRemarks = adminRemarks;

    // Automatic asset status alignment
    if (report.asset) {
      const asset = await Asset.findById(report.asset._id);
      if (asset) {
        const prevAssetStatus = asset.status;
        let actionLogged = null;

        if (status === 'Under Maintenance' || resolveAction === 'under_maintenance') {
          asset.status = 'Under Maintenance';
          actionLogged = 'Sent for Maintenance';
        } else if (status === 'Resolved' || resolveAction === 'mark_available') {
          asset.status = asset.assignedTo ? 'Assigned' : 'Available';
          asset.condition = 'Good';
          actionLogged = 'Asset Restored';
        }

        if (actionLogged) {
          await asset.save();
          await AssetHistory.create({
            asset: asset._id,
            assetCode: asset.assetCode,
            assetName: asset.assetName,
            action: actionLogged,
            performedBy: req.user._id,
            performedByName: req.user.name,
            previousStatus: prevAssetStatus,
            newStatus: asset.status,
            details: `Incident resolution: status updated to '${asset.status}' (Remark: ${adminRemarks || 'None'})`,
          });
        }
      }
    }

    await report.save();

    res.json({
      success: true,
      report,
      message: `Damage report updated to '${report.status}'`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  reportDamage,
  getAllDamageReports,
  getMyDamageReports,
  updateDamageStatus,
};
