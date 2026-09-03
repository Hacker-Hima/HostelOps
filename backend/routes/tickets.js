import express from 'express';
import {
  Ticket,
  TicketComment,
  TicketRating,
  Worker,
  AuditLog,
  Notification,
} from '../models/index.js';

const router = express.Router();

function mapTicket(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    title: doc.title,
    student: doc.student,
    room: doc.room,
    category: doc.category,
    priority: doc.priority,
    status: doc.status,
    assignedWorker: doc.assigned_worker || doc.assignedWorker || 'Unassigned',
    assetTag: doc.asset_tag || doc.assetTag || '',
    createdAt: doc.created_at || doc.createdAt || 'Just now',
    creatorRole: doc.creator_role || doc.creatorRole || 'Student',
    description: doc.description || '',
  };
}

// GET /api/tickets — Fetch all tickets
router.get('/', async (req, res) => {
  try {
    const { status, category, student } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (student) {
      filter.student = student;
    }

    const rows = await Ticket.find(filter).sort({ createdAt: -1, _id: -1 }).lean();
    res.json(rows.map(mapTicket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/comments/all — Get all comments grouped by ticketId
router.get('/comments/all', async (req, res) => {
  try {
    const rows = await TicketComment.find().sort({ created_timestamp: 1 }).lean();
    const result = {};
    for (const r of rows) {
      if (!result[r.ticket_id]) {
        result[r.ticket_id] = [];
      }
      result[r.ticket_id].push({
        id: r.id,
        author: r.author,
        role: r.role,
        text: r.text,
        time: r.time,
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/ratings/all — Get all ratings grouped by ticketId
router.get('/ratings/all', async (req, res) => {
  try {
    const rows = await TicketRating.find().lean();
    const result = {};
    for (const r of rows) {
      result[r.ticket_id] = r.rating;
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/:id — Single ticket
router.get('/:id', async (req, res) => {
  try {
    const doc = await Ticket.findOne({ id: req.params.id }).lean();
    if (!doc) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comments = await TicketComment.find({ ticket_id: req.params.id })
      .sort({ created_timestamp: 1 })
      .lean();

    const rating = await TicketRating.findOne({ ticket_id: req.params.id }).lean();

    res.json({
      ...mapTicket(doc),
      comments: comments.map(c => ({
        id: c.id,
        author: c.author,
        role: c.role,
        text: c.text,
        time: c.time,
      })),
      rating: rating ? rating.rating : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets — Create new ticket/complaint
router.post('/', async (req, res) => {
  try {
    const {
      title,
      student = 'Himachalam',
      room = 'A-204',
      category = 'Electrical',
      priority = 'Medium',
      description = '',
      assetTag,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const randomNum = Math.floor(330 + Math.random() * 70);
    const id = req.body.id || `TKT-${randomNum}`;
    const cleanRoomTag = (room || 'A204').replace(/-/g, '');
    const cleanCat = (category || 'GEN').toUpperCase().slice(0, 3);
    const finalAssetTag = assetTag || `QR-${cleanRoomTag}-${cleanCat}-01`;
    const createdAt = 'Just now';

    const newTicket = await Ticket.create({
      id,
      title: title.trim(),
      student,
      room,
      category,
      priority,
      status: 'Pending',
      assigned_worker: 'Unassigned',
      asset_tag: finalAssetTag,
      created_at: createdAt,
      creator_role: 'Student',
      description: description || 'No description provided.',
    });

    // Log to audit log
    const dateStr = new Date().toLocaleString();
    await AuditLog.create({
      id: `AL-${Date.now()}`,
      action: 'Ticket Created',
      actor: `${student} (Student)`,
      target: id,
      timestamp: dateStr,
      category: 'Ticket',
    });

    // Add notification
    await Notification.create({
      id: `N-${Date.now()}`,
      message: `New complaint ${id} logged in ${room} (${category})`,
      type: 'info',
      is_read: 0,
      time: 'Just now',
    });

    res.status(201).json(mapTicket(newTicket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id/resolve — Mark resolved
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, actor = 'Student' } = req.body;

    const existing = await Ticket.findOne({ id }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await Ticket.findOneAndUpdate(
      { id },
      { status: 'Resolved' },
      { returnDocument: 'after' }
    ).lean();

    // If notes provided, append a comment
    if (notes && notes.trim()) {
      await TicketComment.create({
        id: `C${Date.now()}`,
        ticket_id: id,
        author: actor,
        role: actor.includes('Tech') ? 'Technician' : 'Student',
        text: notes.trim(),
        time: 'Just now',
        created_timestamp: Date.now(),
      });
    }

    // Add audit entry
    await AuditLog.create({
      id: `AL-${Date.now()}`,
      action: 'Ticket Resolved',
      actor: `${actor}`,
      target: id,
      timestamp: new Date().toLocaleString(),
      category: 'Ticket',
    });

    // Add notification
    await Notification.create({
      id: `N-${Date.now()}`,
      message: `Ticket ${id} (${existing.title}) has been resolved.`,
      type: 'success',
      is_read: 0,
      time: 'Just now',
    });

    res.json(mapTicket(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id/assign — Assign worker
router.patch('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { workerName, actor = 'Dr. Meena Sharma (AW)' } = req.body;

    if (!workerName) {
      return res.status(400).json({ error: 'workerName is required' });
    }

    const existing = await Ticket.findOne({ id }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updated = await Ticket.findOneAndUpdate(
      { id },
      { assigned_worker: workerName, status: 'In Progress' },
      { returnDocument: 'after' }
    ).lean();

    // Also update worker active jobs count
    await Worker.updateOne({ name: workerName }, { $inc: { jobs: 1 } });

    // Add audit log
    await AuditLog.create({
      id: `AL-${Date.now()}`,
      action: 'Worker Assigned',
      actor,
      target: id,
      timestamp: new Date().toLocaleString(),
      category: 'Assignment',
    });

    // Notification
    await Notification.create({
      id: `N-${Date.now()}`,
      message: `Your ticket ${id} has been assigned to ${workerName}`,
      type: 'info',
      is_read: 0,
      time: 'Just now',
    });

    res.json(mapTicket(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id/priority — Update priority
router.patch('/:id/priority', async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ error: 'Valid priority (Low, Medium, High) is required' });
    }

    const updated = await Ticket.findOneAndUpdate(
      { id },
      { priority },
      { returnDocument: 'after' }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(mapTicket(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/bulk-status — Update multiple tickets
router.patch('/bulk-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ error: 'ids array and status are required' });
    }

    await Ticket.updateMany({ id: { $in: ids } }, { status });

    res.json({ success: true, count: ids.length, updated: ids.length, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/:id/comments — Add comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { author = 'User', role = 'Student', text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const commentId = `C${Date.now()}`;
    const time = 'Just now';

    await TicketComment.create({
      id: commentId,
      ticket_id: ticketId,
      author,
      role,
      text: text.trim(),
      time,
      created_timestamp: Date.now(),
    });

    res.status(201).json({
      id: commentId,
      ticketId,
      author,
      role,
      text: text.trim(),
      time,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/:id/rate — Rate ticket
router.post('/:id/rate', async (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { rating } = req.body;
    const num = parseInt(rating, 10);

    if (isNaN(num) || num < 1 || num > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    await TicketRating.findOneAndUpdate(
      { ticket_id: ticketId },
      { ticket_id: ticketId, rating: num, created_timestamp: Date.now() },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ ticketId, rating: num });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
