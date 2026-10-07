const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');
const User = require('../models/User');
const AssetRequest = require('../models/AssetRequest');
const DamageReport = require('../models/DamageReport');
const csv = require('csv-parser');
const { Readable } = require('stream');

// @desc    Get assets with backend pagination, search, multi-filter, and sorting
// @route   GET /api/assets
// @access  Private
const getAssets = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      hostelBlock,
      roomNumber,
      condition,
      assignedTo,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const query = {};

    // Search by asset name, code, room number, hostel block, category, status
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { assetName: searchRegex },
        { assetCode: searchRegex },
        { roomNumber: searchRegex },
        { hostelBlock: searchRegex },
        { category: searchRegex },
        { status: searchRegex },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (hostelBlock && hostelBlock !== 'All') {
      query.hostelBlock = hostelBlock;
    }

    if (roomNumber && roomNumber.trim()) {
      query.roomNumber = new RegExp(roomNumber.trim(), 'i');
    }

    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Sort order construction
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = {};
    if (sort === 'assetName') sortObj.assetName = sortOrder;
    else if (sort === 'price') sortObj.price = sortOrder;
    else if (sort === 'status') sortObj.status = sortOrder;
    else if (sort === 'category') sortObj.category = sortOrder;
    else if (sort === 'condition') sortObj.condition = sortOrder;
    else sortObj.createdAt = sortOrder;

    // Database count for accurate pagination metadata
    const totalItems = await Asset.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    // Paginated database fetch
    const assets = await Asset.find(query)
      .populate('assignedTo', 'name email hostelBlock roomNumber studentId')
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: assets,
      assets,
      currentPage: pageNum,
      totalPages,
      totalItems,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Private
const getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id).populate(
      'assignedTo',
      'name email hostelBlock roomNumber phone studentId'
    );

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const history = await AssetHistory.find({ assetCode: asset.assetCode }).sort({
      timestamp: -1,
    });

    res.json({
      success: true,
      asset,
      history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private (Admin)
const createAsset = async (req, res, next) => {
  try {
    const {
      assetName,
      assetCode,
      category,
      hostelBlock,
      roomNumber,
      quantity,
      condition,
      status,
      assignedTo,
      purchaseDate,
      price,
      description,
    } = req.body;

    if (!assetName || !assetCode || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide assetName, assetCode, and category',
      });
    }

    const cleanCode = assetCode.toUpperCase().trim();

    const existingCode = await Asset.findOne({ assetCode: cleanCode });
    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: `Asset code '${cleanCode}' already exists in inventory`,
      });
    }

    const asset = await Asset.create({
      assetName: assetName.trim(),
      assetCode: cleanCode,
      category,
      hostelBlock: hostelBlock || 'Block A',
      roomNumber: roomNumber || '101',
      quantity: Math.max(1, parseInt(quantity, 10) || 1),
      condition: condition || 'Good',
      status: status || (assignedTo ? 'Assigned' : 'Available'),
      assignedTo: assignedTo || null,
      purchaseDate: purchaseDate || Date.now(),
      price: Math.max(0, parseFloat(price) || 0),
      description: description || '',
    });

    // Create history entry
    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Created',
      performedBy: req.user._id,
      performedByName: req.user.name,
      newStatus: asset.status,
      details: `Asset created with status '${asset.status}' in ${asset.hostelBlock} / Room ${asset.roomNumber}`,
    });

    res.status(201).json({
      success: true,
      asset,
      message: 'Asset created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin)
const updateAsset = async (req, res, next) => {
  try {
    let asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const oldStatus = asset.status;
    const oldCondition = asset.condition;
    const oldAssignedTo = asset.assignedTo ? asset.assignedTo.toString() : null;

    if (req.body.assetCode && req.body.assetCode.toUpperCase().trim() !== asset.assetCode) {
      const cleanCode = req.body.assetCode.toUpperCase().trim();
      const codeExists = await Asset.findOne({ assetCode: cleanCode });
      if (codeExists) {
        return res.status(409).json({
          success: false,
          message: `Asset code '${cleanCode}' is already in use by another asset`,
        });
      }
      req.body.assetCode = cleanCode;
    }

    asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email');

    // Build history changes description
    const changes = [];
    if (req.body.status && req.body.status !== oldStatus) {
      changes.push(`status changed from '${oldStatus}' to '${req.body.status}'`);
    }
    if (req.body.condition && req.body.condition !== oldCondition) {
      changes.push(`condition changed from '${oldCondition}' to '${req.body.condition}'`);
    }
    const newAssigned = req.body.assignedTo ? req.body.assignedTo.toString() : null;
    if (newAssigned !== oldAssignedTo) {
      changes.push(newAssigned ? 'assigned to resident' : 'unassigned');
    }

    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Updated',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: oldStatus,
      newStatus: asset.status,
      details: changes.length
        ? `Asset updated: ${changes.join(', ')}`
        : 'Asset specifications updated by administrator',
    });

    res.json({
      success: true,
      asset,
      message: 'Asset updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign asset to user
// @route   PUT /api/assets/:id/assign
// @access  Private (Admin)
const assignAsset = async (req, res, next) => {
  try {
    const { userId, roomNumber, hostelBlock } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Student resident not found' });
    }

    const prevStatus = asset.status;
    asset.assignedTo = user._id;
    asset.status = 'Assigned';
    if (roomNumber) asset.roomNumber = roomNumber;
    if (hostelBlock) asset.hostelBlock = hostelBlock;

    await asset.save();
    await asset.populate('assignedTo', 'name email hostelBlock roomNumber');

    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Assigned',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: prevStatus,
      newStatus: 'Assigned',
      details: `Assigned to ${user.name} (${user.email}) - Room: ${asset.roomNumber}`,
    });

    res.json({
      success: true,
      asset,
      message: `Asset assigned to ${user.name}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unassign asset
// @route   PUT /api/assets/:id/unassign
// @access  Private (Admin)
const unassignAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assignedTo', 'name');

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const prevUser = asset.assignedTo ? asset.assignedTo.name : 'Resident';
    const prevStatus = asset.status;
    asset.assignedTo = null;
    asset.status = 'Available';
    await asset.save();

    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Unassigned',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: prevStatus,
      newStatus: 'Available',
      details: `Returned from ${prevUser}. Status returned to Available.`,
    });

    res.json({
      success: true,
      asset,
      message: 'Asset marked as Available',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student return / handover asset when leaving room or vacating
// @route   PUT /api/assets/:id/return
// @access  Private (Student or Admin)
const returnAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Verify ownership if resident
    if (req.user.role !== 'admin') {
      if (!asset.assignedTo || asset.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only hand over assets currently assigned to your room',
        });
      }
    }

    const { returnReason, condition, remarks } = req.body;
    const prevStatus = asset.status;
    const prevCondition = asset.condition;

    asset.assignedTo = null;
    asset.status = 'Available';
    if (condition) asset.condition = condition;
    await asset.save();

    await AssetHistory.create({
      asset: asset._id,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Returned',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: prevStatus,
      newStatus: 'Available',
      details: `Handed over / returned by ${req.user.name}. Reason: ${returnReason || 'Leaving room / hostel vacation'}. Condition: ${condition || prevCondition}.${remarks ? ` Notes: ${remarks}` : ''}`,
    });

    res.json({
      success: true,
      asset,
      message: `Asset [${asset.assetCode}] ${asset.assetName} returned to hostel inventory successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin)
const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    await AssetHistory.create({
      asset: null,
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      action: 'Deleted',
      performedBy: req.user._id,
      performedByName: req.user.name,
      previousStatus: asset.status,
      newStatus: 'Deleted',
      details: `Asset [${asset.assetCode}] ${asset.assetName} was permanently deleted`,
    });

    await Asset.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Asset removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Export Assets as CSV respecting active filters
// @route   GET /api/assets/export
// @access  Private (Admin)
const exportAssets = async (req, res, next) => {
  try {
    const { search, category, status, hostelBlock, condition } = req.query;

    const query = {};

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { assetName: searchRegex },
        { assetCode: searchRegex },
        { roomNumber: searchRegex },
        { hostelBlock: searchRegex },
      ];
    }

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (hostelBlock && hostelBlock !== 'All') query.hostelBlock = hostelBlock;
    if (condition && condition !== 'All') query.condition = condition;

    const assets = await Asset.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const headers = [
      'assetName',
      'assetCode',
      'category',
      'hostelBlock',
      'roomNumber',
      'quantity',
      'condition',
      'status',
      'assignedTo',
      'purchaseDate',
      'price',
      'description',
    ];

    const rows = assets.map((a) => [
      escapeCsv(a.assetName),
      escapeCsv(a.assetCode),
      escapeCsv(a.category),
      escapeCsv(a.hostelBlock),
      escapeCsv(a.roomNumber),
      a.quantity || 1,
      escapeCsv(a.condition),
      escapeCsv(a.status),
      escapeCsv(a.assignedTo ? `${a.assignedTo.name} (${a.assignedTo.email})` : 'Unassigned'),
      escapeCsv(a.purchaseDate ? new Date(a.purchaseDate).toISOString().split('T')[0] : ''),
      a.price || 0,
      escapeCsv(a.description || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hostel_assets_export_${Date.now()}.csv`
    );
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk Import Assets via CSV file upload
// @route   POST /api/assets/import
// @access  Private (Admin)
const importAssets = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid CSV file to upload',
      });
    }

    const rows = [];
    const stream = Readable.from(req.file.buffer.toString('utf-8'));

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({ trim: true }))
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded CSV file is empty',
      });
    }

    // Prefetch existing asset codes from database
    const existingAssets = await Asset.find({}, 'assetCode').lean();
    const existingCodesSet = new Set(existingAssets.map((a) => a.assetCode.toUpperCase()));

    const seenInCsv = new Set();
    const validRecords = [];
    const failedRows = [];

    const VALID_CATEGORIES = [
      'Bed',
      'Table',
      'Chair',
      'Fan',
      'Light',
      'Computer',
      'Mattress',
      'Cupboard',
      'Electrical Equipment',
      'Other',
    ];

    const VALID_CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Critical', 'Damaged'];
    const VALID_STATUSES = ['Available', 'Assigned', 'Damaged', 'Lost', 'Under Maintenance'];

    // Normalize keys helper
    const getField = (row, candidates) => {
      for (const k of Object.keys(row)) {
        const cleanK = k.trim().toLowerCase().replace(/[\s_-]/g, '');
        for (const c of candidates) {
          if (cleanK === c.toLowerCase().replace(/[\s_-]/g, '')) {
            return row[k];
          }
        }
      }
      return undefined;
    };

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Header is row 1
      const assetName = getField(row, ['assetName', 'name', 'title']);
      const assetCodeRaw = getField(row, ['assetCode', 'code', 'id']);
      const category = getField(row, ['category', 'type']);
      const hostelBlock = getField(row, ['hostelBlock', 'block']) || 'Block A';
      const roomNumber = getField(row, ['roomNumber', 'room']) || '101';
      const quantityRaw = getField(row, ['quantity', 'qty']) || 1;
      const condition = getField(row, ['condition']) || 'Good';
      const status = getField(row, ['status']) || 'Available';
      const priceRaw = getField(row, ['price', 'cost']) || 0;
      const description = getField(row, ['description', 'desc', 'notes']) || '';

      // Validation
      if (!assetName || !assetName.trim()) {
        failedRows.push({
          row: rowNum,
          assetCode: assetCodeRaw || 'N/A',
          reason: 'Missing required field: assetName',
        });
        return;
      }

      if (!assetCodeRaw || !assetCodeRaw.trim()) {
        failedRows.push({
          row: rowNum,
          assetCode: 'N/A',
          reason: 'Missing required field: assetCode',
        });
        return;
      }

      const assetCode = assetCodeRaw.toUpperCase().trim();

      if (seenInCsv.has(assetCode)) {
        failedRows.push({
          row: rowNum,
          assetCode,
          reason: `Duplicate asset code '${assetCode}' found within this CSV upload`,
        });
        return;
      }

      if (existingCodesSet.has(assetCode)) {
        failedRows.push({
          row: rowNum,
          assetCode,
          reason: `Asset code '${assetCode}' already exists in database inventory`,
        });
        return;
      }

      // Match category
      let matchedCategory = VALID_CATEGORIES.find(
        (c) => c.toLowerCase() === (category || '').trim().toLowerCase()
      );
      if (!matchedCategory) {
        matchedCategory = 'Other';
      }

      // Match condition
      let matchedCondition = VALID_CONDITIONS.find(
        (c) => c.toLowerCase() === (condition || '').trim().toLowerCase()
      );
      if (!matchedCondition) {
        matchedCondition = 'Good';
      }

      // Match status
      let matchedStatus = VALID_STATUSES.find(
        (s) => s.toLowerCase() === (status || '').trim().toLowerCase()
      );
      if (!matchedStatus) {
        matchedStatus = 'Available';
      }

      const quantity = Math.max(1, parseInt(quantityRaw, 10) || 1);
      const price = Math.max(0, parseFloat(priceRaw) || 0);

      seenInCsv.add(assetCode);
      validRecords.push({
        assetName: assetName.trim(),
        assetCode,
        category: matchedCategory,
        hostelBlock: hostelBlock.trim(),
        roomNumber: roomNumber.trim(),
        quantity,
        condition: matchedCondition,
        status: matchedStatus,
        price,
        description: description.trim(),
      });
    });

    // Actually insert valid records into MongoDB
    let insertedAssets = [];
    if (validRecords.length > 0) {
      insertedAssets = await Asset.insertMany(validRecords);

      // Create history entries for each imported asset
      const historyEntries = insertedAssets.map((asset) => ({
        asset: asset._id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        action: 'Created',
        performedBy: req.user._id,
        performedByName: req.user.name,
        newStatus: asset.status,
        details: `Bulk imported via CSV with status '${asset.status}' in ${asset.hostelBlock} / Room ${asset.roomNumber}`,
      }));
      await AssetHistory.insertMany(historyEntries);
    }

    res.json({
      success: true,
      message: `Bulk import completed: ${insertedAssets.length} imported, ${failedRows.length} rejected`,
      summary: {
        totalRows: rows.length,
        importedCount: insertedAssets.length,
        failedCount: failedRows.length,
        failedRows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's assigned assets with pagination
// @route   GET /api/assets/my-assets
// @access  Private (Student)
const getMyAssets = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

    const query = { assignedTo: req.user._id };
    const totalItems = await Asset.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: assets,
      assets,
      currentPage: page,
      totalPages,
      totalItems,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics with distributions and recent lists
// @route   GET /api/assets/stats/overview
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const availableAssets = await Asset.countDocuments({ status: 'Available' });
    const assignedAssets = await Asset.countDocuments({ status: 'Assigned' });
    const damagedAssets = await Asset.countDocuments({ status: 'Damaged' });
    const lostAssets = await Asset.countDocuments({ status: 'Lost' });
    const maintenanceAssets = await Asset.countDocuments({
      status: 'Under Maintenance',
    });

    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const pendingRequests = await AssetRequest.countDocuments({ status: 'Pending' });
    const totalReports = await DamageReport.countDocuments();

    // Category distribution counts via MongoDB aggregation
    const categoryCounts = await Asset.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent items for dashboard feed
    const [recentAssets, recentRequests, recentReports, recentHistory] = await Promise.all([
      Asset.find().sort({ createdAt: -1 }).limit(5),
      AssetRequest.find()
        .populate('requestedBy', 'name roomNumber hostelBlock')
        .sort({ createdAt: -1 })
        .limit(5),
      DamageReport.find()
        .populate('asset', 'assetName assetCode')
        .populate('reportedBy', 'name roomNumber')
        .sort({ createdAt: -1 })
        .limit(5),
      AssetHistory.find().sort({ timestamp: -1 }).limit(5),
    ]);

    // Student specific stats if student role
    let studentStats = null;
    if (req.user.role === 'student' || req.user.role === 'user') {
      const myAssignedCount = await Asset.countDocuments({ assignedTo: req.user._id });
      const myPendingRequests = await AssetRequest.countDocuments({
        requestedBy: req.user._id,
        status: 'Pending',
      });
      const myApprovedRequests = await AssetRequest.countDocuments({
        requestedBy: req.user._id,
        status: 'Approved',
      });
      const myDamageReports = await DamageReport.countDocuments({
        reportedBy: req.user._id,
        reportType: 'Damaged',
      });
      const myLostReports = await DamageReport.countDocuments({
        reportedBy: req.user._id,
        reportType: 'Lost',
      });

      studentStats = {
        myAssignedCount,
        myPendingRequests,
        myApprovedRequests,
        myDamageReports,
        myLostReports,
      };
    }

    res.json({
      success: true,
      stats: {
        totalAssets,
        availableAssets,
        assignedAssets,
        damagedAssets,
        lostAssets,
        maintenanceAssets,
        totalUsers,
        pendingRequests,
        totalReports,
        categoryCounts,
        recentAssets,
        recentRequests,
        recentReports,
        recentHistory,
        studentStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
