const User = require('../models/User');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');

// @desc    Get all users (residents and wardens) with pagination & search
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));

    const query = {};

    if (role && role !== 'All') {
      query.role = role;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { roomNumber: searchRegex },
        { hostelBlock: searchRegex },
      ];
    }

    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Attach count of assigned assets for each user
    const usersWithAssets = await Promise.all(
      users.map(async (user) => {
        const assignedCount = await Asset.countDocuments({ assignedTo: user._id });
        return {
          ...user.toObject(),
          assignedAssetsCount: assignedCount,
        };
      })
    );

    res.json({
      success: true,
      data: usersWithAssets,
      users: usersWithAssets,
      currentPage: pageNum,
      totalPages,
      totalItems,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID with assigned inventory assets
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const assignedAssets = await Asset.find({ assignedTo: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      assignedAssets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new user (Admin)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, hostelBlock, roomNumber, phone, studentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'student',
      hostelBlock: hostelBlock || 'Block A',
      roomNumber: roomNumber || '101',
      phone: phone || '',
      studentId: studentId || '',
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        phone: user.phone,
        studentId: user.studentId,
      },
      message: 'User account created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user account details
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, role, hostelBlock, roomNumber, phone, studentId, password } = req.body;

    if (name) user.name = name.trim();
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email address is already in use by another user account',
        });
      }
      user.email = email.toLowerCase().trim();
    }
    if (role) user.role = role;
    if (hostelBlock) user.hostelBlock = hostelBlock.trim();
    if (roomNumber) user.roomNumber = roomNumber.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (studentId !== undefined) user.studentId = studentId.trim();
    if (password && password.length >= 6) user.password = password;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        phone: user.phone,
        studentId: user.studentId,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and unassign their allocated assets
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Unassign all assets first
    await Asset.updateMany(
      { assignedTo: user._id },
      { $set: { assignedTo: null, status: 'Available' } }
    );

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `User ${user.name} removed and assigned assets restored to Available.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get asset audit history logs with pagination, filter, and code search
// @route   GET /api/history
// @access  Private
const getAssetHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, assetCode, action, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));

    const query = {};

    // Non-admin students only see history pertaining to their own room assets and handovers
    if (req.user.role !== 'admin') {
      const studentAssets = await Asset.find({ assignedTo: req.user._id }).select('_id');
      const assetIds = studentAssets.map((a) => a._id);
      query.$or = [
        { performedBy: req.user._id },
        { details: new RegExp(req.user.name, 'i') },
        { details: new RegExp(req.user.email, 'i') },
        { asset: { $in: assetIds } },
      ];
    }

    if (assetCode && assetCode.trim()) {
      query.assetCode = new RegExp(assetCode.trim(), 'i');
    }

    if (action && action !== 'All') {
      query.action = action;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { assetCode: searchRegex },
        { assetName: searchRegex },
        { details: searchRegex },
        { performedByName: searchRegex },
      ];
    }

    const totalItems = await AssetHistory.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const history = await AssetHistory.find(query)
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: history,
      history,
      currentPage: pageNum,
      totalPages,
      totalItems,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAssetHistory,
};
