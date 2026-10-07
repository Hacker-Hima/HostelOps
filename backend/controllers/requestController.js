const AssetRequest = require('../models/AssetRequest');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');

// @desc    Submit a new asset request
// @route   POST /api/requests
// @access  Private (Student)
const createRequest = async (req, res, next) => {
  try {
    const { assetName, category, hostelBlock, roomNumber, reason } = req.body;

    if (!assetName || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assetName and reason for request',
      });
    }

    const request = await AssetRequest.create({
      requestedBy: req.user._id,
      assetName: assetName.trim(),
      category: category || 'Other',
      hostelBlock: hostelBlock || req.user.hostelBlock || 'Block A',
      roomNumber: roomNumber || req.user.roomNumber || '101',
      reason: reason.trim(),
      status: 'Pending',
    });

    await request.populate('requestedBy', 'name email hostelBlock roomNumber studentId');

    res.status(201).json({
      success: true,
      request,
      message: 'Asset request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's requests
// @route   GET /api/requests/my
// @access  Private (Student)
const getMyRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

    const query = { requestedBy: req.user._id };
    const totalItems = await AssetRequest.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const requests = await AssetRequest.find(query)
      .populate('allocatedAsset', 'assetName assetCode status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: requests,
      requests,
      currentPage: page,
      totalPages,
      totalItems,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests with backend pagination, status filter, and search
// @route   GET /api/requests
// @access  Private (Admin)
const getAllRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { assetName: searchRegex },
        { hostelBlock: searchRegex },
        { roomNumber: searchRegex },
        { reason: searchRegex },
      ];
    }

    const totalItems = await AssetRequest.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const requests = await AssetRequest.find(query)
      .populate('requestedBy', 'name email hostelBlock roomNumber studentId phone')
      .populate('allocatedAsset', 'assetName assetCode')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: requests,
      requests,
      currentPage: pageNum,
      totalPages,
      totalItems,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update request status (Approve/Reject) with conflict prevention
// @route   PUT /api/requests/:id
// @access  Private (Admin)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, adminRemarks, allocatedAssetId } = req.body;

    let request = await AssetRequest.findById(req.params.id).populate(
      'requestedBy',
      'name email hostelBlock roomNumber'
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Prevent approving if already approved
    if (request.status === 'Approved' && status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'This request is already approved and processed.',
      });
    }

    // If an asset is allocated and approved
    if (status === 'Approved' && allocatedAssetId) {
      const asset = await Asset.findById(allocatedAssetId);
      if (!asset) {
        return res.status(404).json({
          success: false,
          message: 'Selected asset for allocation was not found in inventory',
        });
      }

      // CRITICAL MWT REQUIREMENT: Prevent two users from receiving the same available asset
      if (asset.status !== 'Available') {
        return res.status(400).json({
          success: false,
          message: `Asset [${asset.assetCode}] is currently '${asset.status}' and cannot be allocated. Prevented duplicate assignment.`,
        });
      }

      const prevStatus = asset.status;
      asset.status = 'Assigned';
      asset.assignedTo = request.requestedBy._id;
      asset.hostelBlock = request.hostelBlock;
      asset.roomNumber = request.roomNumber;
      await asset.save();

      request.allocatedAsset = asset._id;

      // Log asset audit history
      await AssetHistory.create({
        asset: asset._id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        action: 'Assigned',
        performedBy: req.user._id,
        performedByName: req.user.name,
        previousStatus: prevStatus,
        newStatus: 'Assigned',
        details: `Allocated to ${request.requestedBy.name} (${request.requestedBy.email}) via approved requisition #${request._id}`,
      });
    }

    request.status = status || request.status;
    if (adminRemarks !== undefined) request.adminRemarks = adminRemarks;

    await request.save();

    res.json({
      success: true,
      request,
      message: `Request marked as ${request.status}`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
};
