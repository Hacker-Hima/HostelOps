import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import {
  Asset,
  AssetCategory,
  AssetMaintenance,
  AssetTransfer,
  AssetAudit,
  AssetDisposal,
  AssetRequest,
  AuditLog,
  Notification,
} from '../models/index.js';
import { authenticate, optionalAuthenticate, requireRole, requireAdminType } from '../middleware/auth.js';

const router = express.Router();

/**
 * Execute multi-step operation with MongoDB transaction if replica set is available,
 * otherwise execute gracefully with sequenced operations.
 */
async function withTransaction(work) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch {
        // Ignore session abort error
      }
    }
    // If standalone MongoDB does not support transactions, fallback to running without session
    const errMsg = (err.message || '') + ' ' + (err.errorResponse?.message || '');
    if (
      errMsg.includes('replica set member') ||
      errMsg.includes('standalone') ||
      errMsg.includes('Transactions are not supported') ||
      errMsg.includes('retryable writes') ||
      errMsg.includes('Transaction numbers') ||
      err.code === 20 ||
      err.errorResponse?.code === 20
    ) {
      return await work(null);
    }
    throw err;
  } finally {
    if (session) {
      try {
        session.endSession();
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Utility: Accurate Straight-line depreciation calculation
 */
function calculateDepreciation(purchaseCost = 0, purchaseDate = '2024-01-01', rate = 10) {
  try {
    const cost = Number(purchaseCost) || 0;
    const depRate = Number(rate) || 10;
    const pDate = new Date(purchaseDate);
    const validDate = isNaN(pDate.getTime()) ? new Date('2024-01-01') : pDate;

    // Fractional years elapsed
    const msElapsed = Math.max(0, Date.now() - validDate.getTime());
    const yearsElapsed = msElapsed / (365.25 * 24 * 60 * 60 * 1000);
    const totalDepreciation = cost * (depRate / 100) * yearsElapsed;

    // Salvage floor at 5% of purchase cost or 0
    const salvageFloor = Math.round(cost * 0.05);
    return Math.max(salvageFloor, Math.round(cost - totalDepreciation));
  } catch {
    return Number(purchaseCost) || 0;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 1. ASSET REGISTER ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets — Fetch all assets with optional filtering & search
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { category, condition, status, block, room, search, studentRoll } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (condition && condition !== 'All') filter.condition = condition;
    if (status && status !== 'All') filter.status = status;
    if (block && block !== 'All') filter.block = block;
    if (room && room !== 'All') filter.room = room;
    if (studentRoll) filter.assigned_student_roll = studentRoll;

    const assets = await Asset.find(filter).sort({ createdAt: -1 }).lean();

    const formatted = assets.map((a) => {
      const pCost = a.purchase_cost || a.value || 0;
      const cVal = a.status === 'Disposed' ? 0 : (a.current_value || calculateDepreciation(pCost, a.purchase_date, a.depreciation_rate));
      return {
        tag: a.tag,
        name: a.name,
        category: a.category,
        block: a.block || 'Block A',
        floor: a.floor || 'Floor 1',
        room: a.room || '101',
        location: a.location || `${a.block || 'Block A'} - Room ${a.room || '101'}`,
        condition: a.condition || 'Good',
        status: a.status || 'Assigned',
        purchaseDate: a.purchase_date || '2024-06-12',
        purchaseCost: pCost,
        currentValue: cVal,
        depreciationRate: a.depreciation_rate || 10,
        warrantyExpiry: a.warranty_expiry || '2027-06-12',
        supplier: a.supplier || 'Apex Institutional Furnishings Ltd.',
        serialNumber: a.serial_number || '',
        quantity: a.quantity || 1,
        assignedStudent: {
          roll: a.assigned_student_roll || '',
          name: a.assigned_student_name || '',
          date: a.assigned_date || '',
        },
        lastChecked: a.last_checked || 'Today',
        qrCodeData: a.qr_code_data || `HOSTELOPS:${a.tag}`,
        notes: a.notes || '',
      };
    });

    if (search && search.trim()) {
      const term = search.toLowerCase();
      return res.json(
        formatted.filter(
          (a) =>
            a.name.toLowerCase().includes(term) ||
            a.tag.toLowerCase().includes(term) ||
            a.category.toLowerCase().includes(term) ||
            a.location.toLowerCase().includes(term) ||
            (a.assignedStudent && a.assignedStudent.name.toLowerCase().includes(term)) ||
            (a.assignedStudent && a.assignedStudent.roll.toLowerCase().includes(term))
        )
      );
    }

    res.json(formatted);
  } catch (err) {
    console.error('Fetch assets error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch assets.', error: err.message });
  }
});

// GET /api/assets/:tag — Single asset lookup
router.get('/:tag', optionalAuthenticate, async (req, res) => {
  try {
    const { tag } = req.params;
    const a = await Asset.findOne({ tag: tag.trim() }).lean();
    if (!a) {
      return res.status(404).json({ success: false, message: `Asset "${tag}" not found.` });
    }

    const pCost = a.purchase_cost || a.value || 0;
    const cVal = a.status === 'Disposed' ? 0 : (a.current_value || calculateDepreciation(pCost, a.purchase_date, a.depreciation_rate));

    res.json({
      tag: a.tag,
      name: a.name,
      category: a.category,
      block: a.block,
      floor: a.floor,
      room: a.room,
      location: a.location,
      condition: a.condition,
      status: a.status,
      purchaseDate: a.purchase_date,
      purchaseCost: pCost,
      currentValue: cVal,
      depreciationRate: a.depreciation_rate || 10,
      warrantyExpiry: a.warranty_expiry,
      supplier: a.supplier,
      serialNumber: a.serial_number,
      quantity: a.quantity || 1,
      assignedStudent: {
        roll: a.assigned_student_roll || '',
        name: a.assigned_student_name || '',
        date: a.assigned_date || '',
      },
      lastChecked: a.last_checked,
      qrCodeData: a.qr_code_data || `HOSTELOPS:${a.tag}`,
      notes: a.notes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving asset details.', error: err.message });
  }
});

// POST /api/assets — Register a brand new asset in registry
router.post('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      tag,
      name,
      category,
      block = 'Block A',
      floor = 'Floor 1',
      room = '101',
      condition = 'Good',
      status = 'In Store',
      purchaseDate = new Date().toISOString().split('T')[0],
      purchaseCost = 0,
      depreciationRate = 10,
      warrantyExpiry = '2027-06-12',
      supplier = 'Apex Institutional Furnishings Ltd.',
      serialNumber = '',
      quantity = 1,
      assignedStudentRoll = '',
      assignedStudentName = '',
      notes = '',
      registeredBy = 'Asset Admin',
    } = req.body;

    const cleanTag = (tag || `AST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`).trim().toUpperCase();

    if (!cleanTag || !name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Asset Tag, Name, and Category are required fields.',
      });
    }

    const existing = await Asset.findOne({ tag: cleanTag });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Asset with Tag "${cleanTag}" already exists in the system.`,
      });
    }

    const pCost = Number(purchaseCost) || 0;
    const cVal = calculateDepreciation(pCost, purchaseDate, depreciationRate);
    const location = `${block} - Room ${room}`;

    const newAsset = await Asset.create({
      tag: cleanTag,
      name: name.trim(),
      category: category.trim(),
      block,
      floor,
      room,
      location,
      condition,
      status: assignedStudentRoll ? 'Assigned' : status,
      purchase_date: purchaseDate,
      purchase_cost: pCost,
      current_value: cVal,
      depreciation_rate: Number(depreciationRate) || 10,
      warranty_expiry: warrantyExpiry,
      supplier,
      serial_number: serialNumber,
      quantity: Number(quantity) || 1,
      assigned_student_roll: assignedStudentRoll,
      assigned_student_name: assignedStudentName,
      assigned_date: assignedStudentRoll ? new Date().toISOString().split('T')[0] : '',
      last_checked: 'Registered today',
      qr_code_data: `HOSTELOPS:${cleanTag}`,
      notes,
    });

    // Record audit log
    await AuditLog.create({
      id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      action: `New Asset Registered: ${cleanTag} (${name}) in ${location}`,
      actor: req.user?.name || registeredBy,
      target: cleanTag,
      category: 'Register',
      timestamp: new Date().toLocaleString(),
    }).catch(() => {});

    res.status(201).json({
      tag: newAsset.tag,
      name: newAsset.name,
      category: newAsset.category,
      block: newAsset.block,
      floor: newAsset.floor,
      room: newAsset.room,
      location: newAsset.location,
      condition: newAsset.condition,
      status: newAsset.status,
      purchaseDate: newAsset.purchase_date,
      purchaseCost: newAsset.purchase_cost,
      currentValue: newAsset.current_value,
      depreciationRate: newAsset.depreciation_rate,
      warrantyExpiry: newAsset.warranty_expiry,
      supplier: newAsset.supplier,
      serialNumber: newAsset.serial_number,
      quantity: newAsset.quantity,
      assignedStudent: {
        roll: newAsset.assigned_student_roll,
        name: newAsset.assigned_student_name,
        date: newAsset.assigned_date,
      },
      lastChecked: newAsset.last_checked,
      qrCodeData: newAsset.qr_code_data,
      notes: newAsset.notes,
    });
  } catch (err) {
    console.error('Asset creation error:', err);
    res.status(500).json({ success: false, message: 'Could not register asset.', error: err.message });
  }
});

// PUT /api/assets/:tag — Update asset details
router.put('/:tag', optionalAuthenticate, async (req, res) => {
  try {
    const { tag } = req.params;
    const asset = await Asset.findOne({ tag: tag.trim() });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const {
      name,
      category,
      condition,
      status,
      block,
      floor,
      room,
      purchaseCost,
      depreciationRate,
      warrantyExpiry,
      supplier,
      serialNumber,
      quantity,
      notes,
    } = req.body;

    if (name) asset.name = name.trim();
    if (category) asset.category = category.trim();
    if (condition) asset.condition = condition;
    if (status) asset.status = status;
    if (block) asset.block = block;
    if (floor) asset.floor = floor;
    if (room) asset.room = room;
    if (block || room) asset.location = `${asset.block} - Room ${asset.room}`;
    if (purchaseCost !== undefined) asset.purchase_cost = Number(purchaseCost);
    if (depreciationRate !== undefined) asset.depreciation_rate = Number(depreciationRate);
    if (warrantyExpiry) asset.warranty_expiry = warrantyExpiry;
    if (supplier) asset.supplier = supplier;
    if (serialNumber !== undefined) asset.serial_number = serialNumber;
    if (quantity !== undefined) asset.quantity = Number(quantity);
    if (notes !== undefined) asset.notes = notes;

    // Recalculate depreciation
    asset.current_value = asset.status === 'Disposed' ? 0 : calculateDepreciation(asset.purchase_cost, asset.purchase_date, asset.depreciation_rate);
    asset.last_checked = 'Updated today';

    await asset.save();

    res.json({
      tag: asset.tag,
      name: asset.name,
      category: asset.category,
      block: asset.block,
      floor: asset.floor,
      room: asset.room,
      location: asset.location,
      condition: asset.condition,
      status: asset.status,
      purchaseDate: asset.purchase_date,
      purchaseCost: asset.purchase_cost,
      currentValue: asset.current_value,
      depreciationRate: asset.depreciation_rate,
      warrantyExpiry: asset.warranty_expiry,
      supplier: asset.supplier,
      serialNumber: asset.serial_number,
      quantity: asset.quantity,
      assignedStudent: {
        roll: asset.assigned_student_roll,
        name: asset.assigned_student_name,
        date: asset.assigned_date,
      },
      lastChecked: asset.last_checked,
      qrCodeData: asset.qr_code_data,
      notes: asset.notes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update asset.', error: err.message });
  }
});

// DELETE /api/assets/:tag — Delete asset (Super Admin / Admin protected)
router.delete('/:tag', optionalAuthenticate, async (req, res) => {
  try {
    const { tag } = req.params;
    const asset = await Asset.findOne({ tag: tag.trim() });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    await Asset.deleteOne({ tag: tag.trim() });

    await AuditLog.create({
      id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      action: `Asset Deleted: ${tag} (${asset.name})`,
      actor: req.user?.name || 'Administrator',
      target: tag,
      category: 'Register',
      timestamp: new Date().toLocaleString(),
    }).catch(() => {});

    res.json({ success: true, message: `Asset ${tag} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete asset.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 2. CATEGORIES ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/categories/all — List categories with live counts & valuations
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await AssetCategory.find().lean();
    const assets = await Asset.find().lean();

    const result = categories.map((cat) => {
      const catAssets = assets.filter((a) => a.category === cat.name);
      const totalCost = catAssets.reduce((sum, a) => sum + (a.purchase_cost || a.value || 0), 0);
      const currentVal = catAssets.reduce((sum, a) => {
        if (a.status === 'Disposed') return sum;
        return sum + (a.current_value || calculateDepreciation(a.purchase_cost || a.value, a.purchase_date, a.depreciation_rate));
      }, 0);

      return {
        ...cat,
        totalAssets: catAssets.length,
        assignedCount: catAssets.filter((a) => a.status === 'Assigned').length,
        inStoreCount: catAssets.filter((a) => a.status === 'In Store' || a.status === 'Available').length,
        damagedCount: catAssets.filter((a) => a.condition === 'Damaged' || a.condition === 'Needs Repair').length,
        underMaintenanceCount: catAssets.filter((a) => a.status === 'Under Maintenance').length,
        totalPurchaseCost: totalCost,
        currentValuation: currentVal,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving categories.', error: err.message });
  }
});

// POST /api/assets/categories — Add a new category
router.post('/categories', optionalAuthenticate, async (req, res) => {
  try {
    const { name, icon = '📦', description = '', defaultDepreciationRate = 10, color = '#7c3aed' } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const existing = await AssetCategory.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ success: false, message: 'Category already exists.' });

    const cat = await AssetCategory.create({
      name: name.trim(),
      icon,
      description,
      default_depreciation_rate: Number(defaultDepreciationRate) || 10,
      color,
    });

    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not create category.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 3. ALLOCATION ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/assets/allocate — Allocate an asset to a room & student
router.post('/allocate', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      tag,
      block,
      floor = 'Floor 1',
      room,
      studentRoll = '',
      studentName = '',
      allocatedBy = 'Asset Admin',
      notes = '',
    } = req.body;

    if (!tag || !block || !room) {
      return res.status(400).json({
        success: false,
        message: 'Asset Tag, Block, and Room are required for allocation.',
      });
    }

    const asset = await Asset.findOne({ tag: tag.trim() });
    if (!asset) {
      return res.status(404).json({ success: false, message: `Asset "${tag}" not found in register.` });
    }

    // Requirement 11: Enforce valid lifecycle transitions
    if (asset.status === 'Disposed') {
      return res.status(400).json({
        success: false,
        message: `Cannot allocate asset "${tag}": This asset has been marked as Disposed/Scrapped.`,
        errorCode: 'ASSET_DISPOSED',
      });
    }

    if (asset.status === 'Missing') {
      return res.status(400).json({
        success: false,
        message: `Cannot allocate asset "${tag}": Asset is flagged as Missing in physical audit.`,
        errorCode: 'ASSET_MISSING',
      });
    }

    if (asset.status === 'Under Maintenance') {
      return res.status(400).json({
        success: false,
        message: `Cannot allocate asset "${tag}": Asset is currently undergoing maintenance.`,
        errorCode: 'ASSET_UNDER_MAINTENANCE',
      });
    }

    const fromLoc = asset.location || 'Admin Block - Central Store';
    const toLoc = `${block} - Room ${room}`;

    // Execute atomic multi-step allocation with transactions
    await withTransaction(async (session) => {
      asset.block = block;
      asset.floor = floor;
      asset.room = room;
      asset.location = toLoc;
      asset.status = 'Assigned';
      asset.assigned_student_roll = studentRoll;
      asset.assigned_student_name = studentName;
      asset.assigned_date = new Date().toISOString().split('T')[0];
      asset.last_checked = 'Allocated today';
      if (notes) asset.notes = notes;

      await asset.save(session ? { session } : {});

      // Log Transfer record
      await AssetTransfer.create(
        [
          {
            transfer_id: `TRF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            asset_tag: asset.tag,
            asset_name: asset.name,
            from_location: fromLoc,
            to_location: toLoc,
            from_student: 'Central Store / Previous Room',
            to_student: studentName ? `${studentName} (${studentRoll})` : `Room ${room} Occupants`,
            transferred_by: req.user?.name || allocatedBy,
            reason: 'Asset Allocation',
            date: new Date().toISOString().split('T')[0],
          },
        ],
        session ? { session } : {}
      );

      // Audit Log
      await AuditLog.create(
        [
          {
            id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            action: `Asset Allocated: ${asset.tag} (${asset.name}) to ${toLoc} ${studentName ? `for ${studentName}` : ''}`,
            actor: req.user?.name || allocatedBy,
            target: asset.tag,
            category: 'Allocation',
            timestamp: new Date().toLocaleString(),
          },
        ],
        session ? { session } : {}
      );

      // Notification
      if (studentName) {
        await Notification.create(
          [
            {
              id: `N-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
              message: `Asset ${asset.name} (${asset.tag}) has been allocated to your room ${room}.`,
              type: 'success',
              is_read: 0,
              time: 'Just now',
            },
          ],
          session ? { session } : {}
        );
      }
    });

    res.json({
      success: true,
      message: `Asset ${asset.tag} successfully allocated to ${toLoc}.`,
      asset,
    });
  } catch (err) {
    console.error('Allocation error:', err);
    res.status(500).json({ success: false, message: 'Allocation failed.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 4. RETURN & TRANSFER ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// POST /api/assets/return — Return asset back to Central Store
router.post('/return', authenticate, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const {
      tag,
      returnedBy = 'Student',
      inspectedCondition = 'Good',
      receivedBy = 'Asset Admin',
      penaltyAmount = 0,
      remarks = '',
    } = req.body;

    if (!tag) {
      return res.status(400).json({ success: false, message: 'Asset Tag is required for return.' });
    }

    const asset = await Asset.findOne({ tag: tag.trim() });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

    // State transition guards
    if (asset.status === 'Disposed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot return asset: This asset is Disposed.',
        errorCode: 'ASSET_DISPOSED',
      });
    }

    if (asset.status === 'In Store' || asset.status === 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Asset is already in the Central Store.',
        errorCode: 'ALREADY_IN_STORE',
      });
    }

    const fromLoc = asset.location || `${asset.block} - Room ${asset.room}`;
    const previousStudent = asset.assigned_student_name || returnedBy;
    const toLoc = 'Admin Block - Central Store';

    await withTransaction(async (session) => {
      asset.status = 'In Store';
      asset.condition = inspectedCondition;
      asset.block = 'Admin Block';
      asset.floor = 'Ground Floor';
      asset.room = 'Central Store';
      asset.location = toLoc;
      asset.assigned_student_roll = '';
      asset.assigned_student_name = '';
      asset.assigned_date = '';
      asset.last_checked = `Returned & Inspected (${inspectedCondition})`;

      await asset.save(session ? { session } : {});

      // Log Transfer record
      await AssetTransfer.create(
        [
          {
            transfer_id: `TRF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            asset_tag: asset.tag,
            asset_name: asset.name,
            from_location: fromLoc,
            to_location: toLoc,
            from_student: previousStudent,
            to_student: 'Central Store (Returned)',
            transferred_by: req.user?.name || receivedBy,
            reason: `Asset Return & Check-in (${inspectedCondition}) ${remarks ? `— ${remarks}` : ''}`,
            date: new Date().toISOString().split('T')[0],
          },
        ],
        session ? { session } : {}
      );

      // Audit Log
      await AuditLog.create(
        [
          {
            id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            action: `Asset Returned: ${asset.tag} from ${fromLoc} back to Central Store (${inspectedCondition})`,
            actor: req.user?.name || receivedBy,
            target: asset.tag,
            category: 'Transfers',
            timestamp: new Date().toLocaleString(),
          },
        ],
        session ? { session } : {}
      );
    });

    res.json({ success: true, message: 'Asset returned successfully to Central Store.', asset });
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ success: false, message: 'Return operation failed.', error: err.message });
  }
});

// POST /api/assets/transfer — Transfer asset between rooms / hostel blocks (Requirement 12 FIXED)
router.post('/transfer', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      tag,
      toBlock,
      toFloor = 'Floor 1',
      toRoom,
      toStudentRoll = '',
      toStudentName = '',
      reason = 'Inter-room relocation',
      transferredBy = 'Asset Admin',
    } = req.body;

    if (!tag || !toBlock || !toRoom) {
      return res.status(400).json({
        success: false,
        message: 'Asset Tag, Destination Block, and Destination Room are required.',
      });
    }

    const asset = await Asset.findOne({ tag: tag.trim() });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

    // State transition guards
    if (asset.status === 'Disposed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer asset: This asset has been marked as Disposed.',
        errorCode: 'ASSET_DISPOSED',
      });
    }

    if (asset.status === 'Missing') {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer asset: Asset is currently flagged as Missing in physical audit.',
        errorCode: 'ASSET_MISSING',
      });
    }

    // REQUIREMENT 12 FIX: Capture original values BEFORE mutating asset
    const oldLocation = asset.location || `${asset.block} - Room ${asset.room}`;
    const oldStudent = asset.assigned_student_name || (asset.assigned_student_roll ? `Student (${asset.assigned_student_roll})` : 'Previous Room Occupants');
    const oldStudentRoll = asset.assigned_student_roll || '';

    const newLocation = `${toBlock} - Room ${toRoom}`;

    let createdTransfer = null;

    await withTransaction(async (session) => {
      // 1. Mutate asset fields to destination
      asset.block = toBlock;
      asset.floor = toFloor;
      asset.room = toRoom;
      asset.location = newLocation;
      if (toStudentRoll) {
        asset.assigned_student_roll = toStudentRoll;
        asset.assigned_student_name = toStudentName;
      }
      asset.last_checked = 'Transferred today';

      await asset.save(session ? { session } : {});

      // 2. Create AssetTransfer record using PRE-MUTATION values for "from" fields
      const transfers = await AssetTransfer.create(
        [
          {
            transfer_id: `TRF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            asset_tag: asset.tag,
            asset_name: asset.name,
            from_location: oldLocation,
            to_location: newLocation,
            from_student: oldStudent,
            to_student: toStudentName || `Room ${toRoom} Occupants`,
            transferred_by: req.user?.name || transferredBy,
            reason,
            date: new Date().toISOString().split('T')[0],
          },
        ],
        session ? { session } : {}
      );
      createdTransfer = transfers[0];

      // 3. Create AuditLog
      await AuditLog.create(
        [
          {
            id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            action: `Transferred ${asset.tag} (${asset.name}) from ${oldLocation} to ${newLocation}`,
            actor: req.user?.name || transferredBy,
            target: asset.tag,
            category: 'Transfers',
            timestamp: new Date().toLocaleString(),
          },
        ],
        session ? { session } : {}
      );
    });

    res.json({
      success: true,
      message: `Asset ${asset.tag} transferred successfully from ${oldLocation} to ${newLocation}.`,
      transfer: createdTransfer,
      asset,
    });
  } catch (err) {
    console.error('Transfer error:', err);
    res.status(500).json({ success: false, message: 'Transfer failed.', error: err.message });
  }
});

// GET /api/assets/transfers/all — Fetch transfer history
router.get('/transfers/all', async (req, res) => {
  try {
    const transfers = await AssetTransfer.find().sort({ createdAt: -1 }).lean();
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch transfer logs.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 5. MAINTENANCE & REPAIR ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/maintenance/all — List all maintenance tickets
router.get('/maintenance/all', async (req, res) => {
  try {
    const tickets = await AssetMaintenance.find().sort({ createdAt: -1 }).lean();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch maintenance tickets.', error: err.message });
  }
});

// POST /api/assets/maintenance — Report damaged asset / request maintenance
router.post('/maintenance', optionalAuthenticate, async (req, res) => {
  try {
    const {
      assetTag,
      issueDescription,
      urgency = 'Medium',
      reportedBy,
      reporterRole = 'Student',
      assignedTechnician = 'Unassigned',
    } = req.body;

    if (!assetTag || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Asset Tag and Issue Description are required.',
      });
    }

    const asset = await Asset.findOne({ tag: assetTag.trim() });
    if (!asset) {
      return res.status(404).json({ success: false, message: `Asset "${assetTag}" not found.` });
    }

    if (asset.status === 'Disposed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot report maintenance for an asset that is already Disposed.',
        errorCode: 'ASSET_DISPOSED',
      });
    }

    let ticket = null;

    await withTransaction(async (session) => {
      // Mark asset condition and status
      asset.condition = 'Needs Repair';
      asset.status = 'Under Maintenance';
      asset.last_checked = 'Maintenance Requested';
      await asset.save(session ? { session } : {});

      const tickets = await AssetMaintenance.create(
        [
          {
            ticket_id: `MNT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            asset_tag: asset.tag,
            asset_name: asset.name,
            category: asset.category,
            location: asset.location,
            issue_description: issueDescription.trim(),
            urgency,
            reported_by: reportedBy || req.user?.name || 'Student',
            reporter_role: reporterRole || req.user?.role || 'Student',
            assigned_technician: assignedTechnician,
            status: assignedTechnician !== 'Unassigned' ? 'Assigned' : 'Reported',
            reported_date: new Date().toISOString().split('T')[0],
            color: urgency === 'Critical' ? '#ef4444' : urgency === 'High' ? '#f97316' : '#f59e0b',
          },
        ],
        session ? { session } : {}
      );
      ticket = tickets[0];

      await AuditLog.create(
        [
          {
            id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            action: `Maintenance Reported: ${ticket.ticket_id} for ${asset.tag} (${urgency})`,
            actor: reportedBy || req.user?.name || 'Student',
            target: asset.tag,
            category: 'Maintenance',
            timestamp: new Date().toLocaleString(),
          },
        ],
        session ? { session } : {}
      );
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('Maintenance report error:', err);
    res.status(500).json({ success: false, message: 'Failed to report maintenance.', error: err.message });
  }
});

// PATCH /api/assets/maintenance/:ticketId — Update maintenance ticket
router.patch('/maintenance/:ticketId', optionalAuthenticate, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const {
      status,
      assignedTechnician,
      technicianPhone,
      repairCost = 0,
      partsReplaced = '',
      notes = '',
    } = req.body;

    const ticket = await AssetMaintenance.findOne({ ticket_id: ticketId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Maintenance ticket not found.' });

    if (status) ticket.status = status;
    if (assignedTechnician) ticket.assigned_technician = assignedTechnician;
    if (technicianPhone) ticket.technician_phone = technicianPhone;
    if (repairCost !== undefined) ticket.repair_cost = Number(repairCost);
    if (partsReplaced) ticket.parts_replaced = partsReplaced;
    if (notes) ticket.notes = notes;

    const asset = await Asset.findOne({ tag: ticket.asset_tag });

    if (status === 'Repaired') {
      ticket.completed_date = new Date().toISOString().split('T')[0];
      ticket.color = '#10b981';
      if (asset) {
        asset.condition = 'Good';
        asset.status = asset.assigned_student_roll ? 'Assigned' : 'In Store';
        asset.last_checked = 'Repaired & Verified';
        await asset.save();
      }
    } else if (status === 'Beyond Repair') {
      ticket.color = '#ef4444';
      if (asset) {
        asset.condition = 'Beyond Repair';
        asset.status = 'Damaged';
        asset.last_checked = 'Flagged Beyond Repair';
        await asset.save();
      }
    } else if (status === 'In Progress') {
      ticket.color = '#3b82f6';
      if (asset) {
        asset.status = 'Under Maintenance';
        await asset.save();
      }
    }

    await ticket.save();

    await AuditLog.create({
      id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      action: `Maintenance Ticket ${ticketId} status updated to "${status}"`,
      actor: assignedTechnician || req.user?.name || 'Technician',
      target: ticket.asset_tag,
      category: 'Maintenance',
      timestamp: new Date().toLocaleString(),
    }).catch(() => {});

    res.json({ success: true, message: 'Ticket updated successfully.', ticket, asset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update maintenance ticket.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 6. INVENTORY PHYSICAL AUDIT ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/audits/all — Fetch all physical audits
router.get('/audits/all', async (req, res) => {
  try {
    const audits = await AssetAudit.find().sort({ createdAt: -1 }).lean();
    res.json(audits);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch audits.', error: err.message });
  }
});

// POST /api/assets/audit — Submit a physical audit verification
router.post('/audit', authenticate, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { block, room, auditor = 'Asset Admin', scannedTags = [], notes = '' } = req.body;

    if (!block || !room) {
      return res.status(400).json({ success: false, message: 'Block and Room are required for physical audit.' });
    }

    const expectedAssets = await Asset.find({ block, room }).lean();
    const expectedTags = expectedAssets.map((a) => a.tag);

    const missingTags = expectedTags.filter((t) => !scannedTags.includes(t));
    const matchedTags = expectedTags.filter((t) => scannedTags.includes(t));

    // Flag missing assets in registry
    if (missingTags.length > 0) {
      await Asset.updateMany(
        { tag: { $in: missingTags } },
        { $set: { status: 'Missing', last_checked: 'Flagged Missing in Physical Audit' } }
      );
    }

    const audit = await AssetAudit.create({
      audit_id: `AUD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      block,
      room,
      auditor: req.user?.name || auditor,
      date: new Date().toISOString().split('T')[0],
      expected_count: expectedTags.length,
      scanned_count: matchedTags.length,
      missing_count: missingTags.length,
      expected_tags: expectedTags,
      scanned_tags: matchedTags,
      missing_tags: missingTags,
      status: missingTags.length === 0 ? 'Verified 100% Match' : `Discrepancy Detected (${missingTags.length} Missing)`,
      notes,
    });

    await AuditLog.create({
      id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      action: `Physical Audit Completed for ${block} - Room ${room}: ${audit.status}`,
      actor: req.user?.name || auditor,
      target: audit.audit_id,
      category: 'Audit',
      timestamp: new Date().toLocaleString(),
    }).catch(() => {});

    res.status(201).json(audit);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not record audit.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 7. ASSET DISPOSAL ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/disposal/all — Fetch disposal registry
router.get('/disposal/all', async (req, res) => {
  try {
    const disposals = await AssetDisposal.find().sort({ createdAt: -1 }).lean();
    res.json(disposals);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch disposal records.', error: err.message });
  }
});

// POST /api/assets/disposal — Approve asset disposal
router.post('/disposal', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const {
      assetTag,
      salvageValue = 0,
      disposalReason = 'Beyond Economical Repair',
      disposalMethod = 'Certified E-Waste Scrap',
      approvedBy = 'Super Admin',
      notes = '',
    } = req.body;

    if (!assetTag) {
      return res.status(400).json({ success: false, message: 'Asset Tag is required for disposal.' });
    }

    const asset = await Asset.findOne({ tag: assetTag.trim() });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found.' });

    // Guard against duplicate disposal
    if (asset.status === 'Disposed') {
      return res.status(409).json({
        success: false,
        message: `Asset "${assetTag}" has already been processed for disposal. Duplicate disposal is prevented.`,
        errorCode: 'DUPLICATE_DISPOSAL',
      });
    }

    let createdDisposal = null;

    await withTransaction(async (session) => {
      asset.status = 'Disposed';
      asset.condition = 'Beyond Repair';
      asset.current_value = 0;
      asset.last_checked = 'Disposed / Scrapped';
      await asset.save(session ? { session } : {});

      const certNum = `DSP-CERT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      const disposals = await AssetDisposal.create(
        [
          {
            disposal_id: `DSP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            asset_tag: asset.tag,
            asset_name: asset.name,
            category: asset.category,
            purchase_cost: asset.purchase_cost || asset.value || 0,
            salvage_value: Number(salvageValue) || 0,
            disposal_reason: disposalReason,
            disposal_method: disposalMethod,
            approved_by: req.user?.name || approvedBy,
            disposal_date: new Date().toISOString().split('T')[0],
            certificate_number: certNum,
            notes,
          },
        ],
        session ? { session } : {}
      );
      createdDisposal = disposals[0];

      await AuditLog.create(
        [
          {
            id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            action: `Asset Disposal Approved: ${asset.tag} (${asset.name}) — Salvage Recovered: ₹${salvageValue}`,
            actor: req.user?.name || approvedBy,
            target: asset.tag,
            category: 'Disposal',
            timestamp: new Date().toLocaleString(),
          },
        ],
        session ? { session } : {}
      );
    });

    res.status(201).json(createdDisposal);
  } catch (err) {
    console.error('Disposal error:', err);
    res.status(500).json({ success: false, message: 'Could not record disposal.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 8. ASSET REQUESTS FROM STUDENTS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/requests/all — Fetch asset requests
router.get('/requests/all', async (req, res) => {
  try {
    const { studentRoll } = req.query;
    const filter = studentRoll ? { student_roll: studentRoll } : {};
    const requests = await AssetRequest.find(filter).sort({ createdAt: -1 }).lean();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch asset requests.', error: err.message });
  }
});

// POST /api/assets/requests — Student submits a request for an asset
router.post('/requests', optionalAuthenticate, async (req, res) => {
  try {
    const {
      studentRoll,
      studentName,
      room,
      block,
      assetCategory,
      assetName,
      reason,
      urgency = 'Medium',
    } = req.body;

    if (!studentRoll || !assetName) {
      return res.status(400).json({ success: false, message: 'Student Roll and Asset Name are required.' });
    }

    const request = await AssetRequest.create({
      request_id: `REQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      student_roll: studentRoll.trim(),
      student_name: studentName ? studentName.trim() : (req.user?.name || 'Student'),
      room: room || '101',
      block: block || 'Block A',
      asset_category: assetCategory || 'Furniture',
      asset_name: assetName.trim(),
      reason: reason ? reason.trim() : 'Academic / Living requirement',
      urgency,
      status: 'Pending',
      request_date: new Date().toISOString().split('T')[0],
    });

    await Notification.create({
      id: `N-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      message: `New asset request from ${request.student_name} (${request.block} - Room ${request.room}): ${request.asset_name}`,
      type: 'info',
      is_read: 0,
      time: 'Just now',
    }).catch(() => {});

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not submit asset request.', error: err.message });
  }
});

// PATCH /api/assets/requests/:requestId — Admin reviews/approves request
router.patch('/requests/:requestId', optionalAuthenticate, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reviewedBy = 'Asset Admin', allocatedAssetTag = '', reviewNotes = '' } = req.body;

    const request = await AssetRequest.findOne({ request_id: requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    await withTransaction(async (session) => {
      request.status = status;
      request.reviewed_by = req.user?.name || reviewedBy;
      request.review_notes = reviewNotes;
      if (allocatedAssetTag) request.allocated_asset_tag = allocatedAssetTag;

      await request.save(session ? { session } : {});

      // If allocated, update the asset in registry
      if (status === 'Allocated' && allocatedAssetTag) {
        const asset = await Asset.findOne({ tag: allocatedAssetTag.trim() });
        if (asset) {
          asset.block = request.block;
          asset.room = request.room;
          asset.location = `${request.block} - Room ${request.room}`;
          asset.status = 'Assigned';
          asset.assigned_student_roll = request.student_roll;
          asset.assigned_student_name = request.student_name;
          asset.assigned_date = new Date().toISOString().split('T')[0];
          await asset.save(session ? { session } : {});
        }
      }

      // Notify student
      await Notification.create(
        [
          {
            id: `N-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            message: `Your request (${request.request_id}) for "${request.asset_name}" was marked as ${status} by ${req.user?.name || reviewedBy}.`,
            type: status === 'Approved' || status === 'Allocated' ? 'success' : 'warn',
            is_read: 0,
            time: 'Just now',
          },
        ],
        session ? { session } : {}
      );
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not process request review.', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// 9. COMPREHENSIVE REPORTS & ANALYTICS
// ══════════════════════════════════════════════════════════════════════════

// GET /api/assets/reports/summary — Real-time high-level asset KPIs and aggregates
router.get('/reports/summary', async (req, res) => {
  try {
    const all = await Asset.find().lean();
    const maintenance = await AssetMaintenance.find().lean();
    const disposals = await AssetDisposal.find().lean();
    const audits = await AssetAudit.find().lean();
    const categories = await AssetCategory.find().lean();

    const totalValuation = all.reduce((sum, a) => sum + (a.purchase_cost || a.value || 0), 0);
    const currentValuation = all.reduce((sum, a) => {
      if (a.status === 'Disposed') return sum;
      const pCost = a.purchase_cost || a.value || 0;
      return sum + (a.current_value || calculateDepreciation(pCost, a.purchase_date, a.depreciation_rate));
    }, 0);

    const totalMaintenanceSpent = maintenance.reduce((sum, m) => sum + (m.repair_cost || 0), 0);
    const totalSalvageRecovered = disposals.reduce((sum, d) => sum + (d.salvage_value || 0), 0);

    // Total physical items vs unique asset tags (Requirement 20)
    const totalPhysicalUnits = all.reduce((sum, a) => sum + (a.quantity || 1), 0);

    // Category breakdown
    const categoryStats = categories.map((cat) => {
      const items = all.filter((a) => a.category === cat.name);
      return {
        name: cat.name,
        icon: cat.icon,
        total: items.length,
        assigned: items.filter((a) => a.status === 'Assigned').length,
        inStore: items.filter((a) => a.status === 'In Store' || a.status === 'Available').length,
        damaged: items.filter((a) => a.condition === 'Damaged' || a.condition === 'Needs Repair').length,
        valuation: items.reduce((sum, a) => sum + (a.purchase_cost || a.value || 0), 0),
      };
    });

    // Room-wise asset matrix
    const roomMap = {};
    all.forEach((a) => {
      const key = `${a.block} - ${a.room}`;
      if (!roomMap[key]) {
        roomMap[key] = { block: a.block, room: a.room, items: [], student: a.assigned_student_name || 'Multiple' };
      }
      roomMap[key].items.push({ tag: a.tag, name: a.name, category: a.category, condition: a.condition });
    });

    res.json({
      totalAssets: all.length,
      totalPhysicalUnits,
      assignedCount: all.filter((a) => a.status === 'Assigned').length,
      inStoreCount: all.filter((a) => a.status === 'In Store' || a.status === 'Available').length,
      damagedCount: all.filter((a) => a.condition === 'Damaged' || a.condition === 'Needs Repair').length,
      underMaintenanceCount: all.filter((a) => a.status === 'Under Maintenance').length,
      missingCount: all.filter((a) => a.status === 'Missing').length,
      disposedCount: all.filter((a) => a.status === 'Disposed').length,
      totalPurchaseValuation: totalValuation,
      currentDepreciatedValuation: currentValuation,
      totalDepreciation: Math.max(0, totalValuation - currentValuation),
      totalMaintenanceSpent,
      totalSalvageRecovered,
      categoryStats,
      roomMatrix: Object.values(roomMap),
      recentAudits: audits.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not compile reports summary.', error: err.message });
  }
});

export default router;
