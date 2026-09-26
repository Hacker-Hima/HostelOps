import express from 'express';
import { Resident, Room, Asset, AuditLog, Notification } from '../models/index.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';
import { generateResidentId } from '../utils/idGenerator.js';

const router = express.Router();

/**
 * GET /api/residents — List all residents with query filtering
 */
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { block, room, status, search } = req.query;
    const filter = {};

    if (block) filter.block = new RegExp(`^${block.trim()}$`, 'i');
    if (room) filter.roomNumber = room.trim();
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { rollNumber: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') },
      ];
    }

    const residents = await Resident.find(filter).sort({ block: 1, roomNumber: 1 }).lean();

    res.json({
      success: true,
      count: residents.length,
      residents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch residents.', error: err.message });
  }
});

/**
 * GET /api/residents/:rollNumber — Single resident detail with assigned assets
 */
router.get('/:rollNumber', optionalAuthenticate, async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const resident = await Resident.findOne({ rollNumber: rollNumber.trim() }).lean();
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found.' });
    }

    // Fetch assigned assets for inspection checklist
    const assignedAssets = await Asset.find({
      $or: [
        { assigned_student_roll: resident.rollNumber },
        { room: resident.roomNumber, block: resident.block },
      ],
    }).lean();

    res.json({
      success: true,
      resident,
      assets: assignedAssets,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving resident.', error: err.message });
  }
});

/**
 * POST /api/residents — Register new resident and allocate bed
 */
router.post('/', authenticate, requirePermission(PERMISSIONS.RESIDENT_MANAGE), async (req, res) => {
  try {
    const {
      rollNumber,
      name,
      email,
      phone = '',
      department = 'Engineering',
      year = 1,
      block,
      floor,
      roomNumber,
      bedNumber = 'Bed-1',
    } = req.body;

    if (!rollNumber || !name || !email || !block || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'rollNumber, name, email, block, and roomNumber are required.',
      });
    }

    const existing = await Resident.findOne({ rollNumber: rollNumber.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Resident with this Roll Number already exists.' });
    }

    const resident = await Resident.create({
      residentId: generateResidentId(),
      rollNumber: rollNumber.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      department,
      year: Number(year) || 1,
      block,
      floor: floor || 'Floor 1',
      roomNumber,
      bedNumber,
      checkInDate: new Date(),
      status: 'Active',
      clearanceStatus: 'Cleared',
    });

    // Update Room occupancy and bed assignment
    await Room.updateOne(
      { roomNumber, block },
      {
        $inc: { occupancy: 1 },
        $set: {
          'beds.$[b].status': 'Occupied',
          'beds.$[b].residentId': resident.residentId,
          'beds.$[b].residentName': resident.name,
          'beds.$[b].residentRoll': resident.rollNumber,
        },
      },
      { arrayFilters: [{ 'b.bedNumber': bedNumber }] }
    ).catch(() => {});

    res.status(201).json({ success: true, resident });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create resident.', error: err.message });
  }
});

/**
 * POST /api/residents/:rollNumber/checkout — Semester Checkout & Room Inspection
 * Performs damage detection, penalty calculation, and sets pending clearance
 */
router.post('/:rollNumber/checkout', authenticate, requirePermission(PERMISSIONS.ROOM_MANAGE), async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const { inspectorName, items = [], remarks = '' } = req.body;

    const resident = await Resident.findOne({ rollNumber: rollNumber.trim() });
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found.' });
    }

    // Calculate total penalties for damaged items
    let totalPenalty = 0;
    const inspectionItems = items.map((item) => {
      const penalty = item.isDamaged ? Number(item.penaltyAmount || 0) : 0;
      totalPenalty += penalty;
      return {
        assetTag: item.assetTag,
        assetName: item.assetName,
        conditionOnCheckIn: item.conditionOnCheckIn || 'Good',
        conditionOnCheckOut: item.conditionOnCheckOut || (item.isDamaged ? 'Damaged' : 'Good'),
        isDamaged: Boolean(item.isDamaged),
        damageDescription: item.damageDescription || '',
        penaltyAmount: penalty,
        verifiedBy: req.user?.name || inspectorName || 'Warden',
      };
    });

    const newInspection = {
      type: 'CheckOut',
      date: new Date(),
      inspectorName: req.user?.name || inspectorName || 'Hostel Warden',
      inspectorRole: req.user?.role || 'Warden',
      items: inspectionItems,
      totalPenalty,
      wardenApproval: {
        status: totalPenalty > 0 ? 'Pending' : 'Approved',
        approvedBy: totalPenalty === 0 ? req.user?.name || 'Automated' : '',
        approvedAt: totalPenalty === 0 ? new Date() : null,
        remarks: remarks || (totalPenalty > 0 ? 'Damage penalty requires clearance' : 'No damages recorded'),
      },
      roomReleased: totalPenalty === 0,
    };

    resident.inspections.push(newInspection);
    resident.status = totalPenalty > 0 ? 'PendingClearance' : 'CheckedOut';
    resident.clearanceStatus = totalPenalty > 0 ? 'DamageFlagged' : 'Cleared';
    resident.totalOutstandingDues = totalPenalty;
    resident.checkOutDate = new Date();

    await resident.save();

    // If cleared with no damages, free up bed immediately
    if (totalPenalty === 0) {
      await Room.updateOne(
        { roomNumber: resident.roomNumber, block: resident.block },
        {
          $inc: { occupancy: -1 },
          $set: {
            'beds.$[b].status': 'Available',
            'beds.$[b].residentId': null,
            'beds.$[b].residentName': null,
            'beds.$[b].residentRoll': null,
          },
        },
        { arrayFilters: [{ 'b.bedNumber': resident.bedNumber }] }
      ).catch(() => {});
    }

    // Create Audit Log
    await AuditLog.create({
      id: `AL-CHK-${Date.now()}`,
      action: `Semester Checkout Inspection: ${resident.name} (${resident.rollNumber})`,
      actor: req.user?.name || inspectorName || 'Warden',
      target: resident.rollNumber,
      category: 'Residents',
      details: `Room: ${resident.roomNumber}, Penalty: ₹${totalPenalty}, Clearance: ${resident.clearanceStatus}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }).catch(() => {});

    res.json({
      success: true,
      message: totalPenalty > 0 ? `Checkout logged. Damages detected: ₹${totalPenalty} penalty pending review.` : 'Checkout approved. Room released successfully.',
      inspection: newInspection,
      resident,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Semester checkout inspection failed.', error: err.message });
  }
});

/**
 * PATCH /api/residents/:rollNumber/clearance — Warden approves checkout clearance & penalty waiver/payment
 */
router.patch('/:rollNumber/clearance', authenticate, requirePermission(PERMISSIONS.ROOM_MANAGE), async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const { approvalStatus = 'Approved', remarks = 'Cleared by Warden' } = req.body;

    const resident = await Resident.findOne({ rollNumber: rollNumber.trim() });
    if (!resident) {
      return res.status(404).json({ success: false, message: 'Resident not found.' });
    }

    const latestInspection = resident.inspections[resident.inspections.length - 1];
    if (latestInspection) {
      latestInspection.wardenApproval.status = approvalStatus;
      latestInspection.wardenApproval.approvedBy = req.user?.name || 'Warden';
      latestInspection.wardenApproval.approvedAt = new Date();
      latestInspection.wardenApproval.remarks = remarks;
      latestInspection.roomReleased = approvalStatus === 'Approved';
    }

    if (approvalStatus === 'Approved') {
      resident.status = 'CheckedOut';
      resident.clearanceStatus = 'Cleared';
      resident.totalOutstandingDues = 0;

      // Release bed
      await Room.updateOne(
        { roomNumber: resident.roomNumber, block: resident.block },
        {
          $inc: { occupancy: -1 },
          $set: {
            'beds.$[b].status': 'Available',
            'beds.$[b].residentId': null,
            'beds.$[b].residentName': null,
            'beds.$[b].residentRoll': null,
          },
        },
        { arrayFilters: [{ 'b.bedNumber': resident.bedNumber }] }
      ).catch(() => {});
    }

    await resident.save();

    res.json({
      success: true,
      message: `Resident clearance marked as ${approvalStatus}.`,
      resident,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update clearance.', error: err.message });
  }
});

export default router;
