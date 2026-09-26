import express from 'express';
import { Room, Hostel, Asset, Ticket, Resident } from '../models/index.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';

const router = express.Router();

/**
 * GET /api/rooms — List all rooms with query filtering
 */
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { block, floor, status, type } = req.query;
    const filter = {};

    if (block) filter.block = new RegExp(`^${block.trim()}$`, 'i');
    if (floor) filter.floor = new RegExp(floor.trim(), 'i');
    if (status) filter.status = status;
    if (type) filter.roomType = type;

    const rooms = await Room.find(filter).sort({ block: 1, floorNumber: 1, roomNumber: 1 }).lean();

    res.json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch rooms.', error: err.message });
  }
});

/**
 * GET /api/rooms/digital-twin/:block — Aggregated live Digital Twin data per block
 */
router.get('/digital-twin/:block', optionalAuthenticate, async (req, res) => {
  try {
    const { block } = req.params;
    const blockRooms = await Room.find({ block: new RegExp(`^${block.trim()}$`, 'i') }).lean();

    // Enrich rooms with real-time assets count and ticket counts
    const enriched = await Promise.all(
      blockRooms.map(async (room) => {
        const assetsCount = await Asset.countDocuments({
          block: new RegExp(`^${room.block}$`, 'i'),
          room: new RegExp(`^${room.roomNumber}$`, 'i'),
        });
        const openTickets = await Ticket.countDocuments({
          room: new RegExp(`^${room.roomNumber}$`, 'i'),
          status: { $in: ['Open', 'In Progress', 'Pending'] },
        });

        // Compute room health status dynamically
        let computedStatus = room.status;
        let score = 100 - openTickets * 15;
        if (score < 50) computedStatus = 'Critical';
        else if (score < 75) computedStatus = 'Maintenance';
        else if (score < 90) computedStatus = 'Attention';
        else computedStatus = 'Optimal';

        return {
          ...room,
          assetsCount,
          openTicketsCount: openTickets,
          maintenanceScore: Math.max(score, 20),
          status: computedStatus,
        };
      })
    );

    res.json({
      success: true,
      block,
      totalRooms: enriched.length,
      rooms: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Digital twin data error.', error: err.message });
  }
});

/**
 * GET /api/rooms/:roomNumber — Get full room detail with real assets & residents
 */
router.get('/:roomNumber', optionalAuthenticate, async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { block } = req.query;

    const query = { roomNumber: roomNumber.trim() };
    if (block) query.block = new RegExp(`^${block.trim()}$`, 'i');

    const room = await Room.findOne(query).lean();
    if (!room) {
      return res.status(404).json({ success: false, message: `Room "${roomNumber}" not found.` });
    }

    // Get current residents
    const residents = await Resident.find({
      roomNumber: room.roomNumber,
      status: 'Active',
    }).lean();

    // Get assets in this room
    const assets = await Asset.find({
      room: room.roomNumber,
    }).lean();

    // Get active maintenance tickets
    const tickets = await Ticket.find({
      room: room.roomNumber,
      status: { $nin: ['Resolved', 'Closed'] },
    }).lean();

    res.json({
      success: true,
      room,
      residents,
      assets,
      activeTickets: tickets,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving room detail.', error: err.message });
  }
});

/**
 * POST /api/rooms — Create room (Admin / Warden)
 */
router.post('/', authenticate, requirePermission(PERMISSIONS.ROOM_MANAGE), async (req, res) => {
  try {
    const { roomNumber, hostelName = 'Hostel Main', block, floor, floorNumber = 1, roomType = 'Double', capacity = 2 } = req.body;

    if (!roomNumber || !block || !floor) {
      return res.status(400).json({ success: false, message: 'roomNumber, block, and floor are required.' });
    }

    const beds = Array.from({ length: capacity }, (_, i) => ({
      bedNumber: `Bed-${i + 1}`,
      status: 'Available',
    }));

    const newRoom = await Room.create({
      roomNumber: roomNumber.trim(),
      hostelName,
      block: block.trim(),
      floor: floor.trim(),
      floorNumber: Number(floorNumber) || 1,
      roomType,
      capacity: Number(capacity) || 2,
      occupancy: 0,
      status: 'Optimal',
      beds,
    });

    res.status(201).json({ success: true, room: newRoom });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create room.', error: err.message });
  }
});

/**
 * PATCH /api/rooms/:roomNumber — Update room settings / status
 */
router.patch('/:roomNumber', authenticate, requirePermission(PERMISSIONS.ROOM_MANAGE), async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { block } = req.query;
    const query = { roomNumber: roomNumber.trim() };
    if (block) query.block = new RegExp(`^${block.trim()}$`, 'i');

    const updated = await Room.findOneAndUpdate(query, { $set: req.body }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    res.json({ success: true, room: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update room.', error: err.message });
  }
});

export default router;
