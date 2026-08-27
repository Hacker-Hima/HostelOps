import express from 'express';
import db from '../db/database.js';

const router = express.Router();

function mapTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    student: row.student,
    room: row.room,
    category: row.category,
    priority: row.priority,
    status: row.status,
    assignedWorker: row.assigned_worker,
    assetTag: row.asset_tag,
    createdAt: row.created_at,
    creatorRole: row.creator_role,
    description: row.description,
  };
}

// GET /api/tickets — Fetch all tickets
router.get('/', (req, res) => {
  try {
    const { status, category, student } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (student) {
      query += ' AND student = ?';
      params.push(student);
    }

    query += ' ORDER BY rowid DESC';
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows.map(mapTicket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/comments/all — Get all comments grouped by ticketId
router.get('/comments/all', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM ticket_comments ORDER BY created_timestamp ASC');
    const rows = stmt.all();
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
router.get('/ratings/all', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM ticket_ratings');
    const rows = stmt.all();
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
router.get('/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
    const row = stmt.get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const commentsStmt = db.prepare('SELECT * FROM ticket_comments WHERE ticket_id = ? ORDER BY created_timestamp ASC');
    const comments = commentsStmt.all(req.params.id);

    const ratingStmt = db.prepare('SELECT rating FROM ticket_ratings WHERE ticket_id = ?');
    const rating = ratingStmt.get(req.params.id);

    res.json({
      ...mapTicket(row),
      comments: comments.map(c => ({ id: c.id, author: c.author, role: c.role, text: c.text, time: c.time })),
      rating: rating ? rating.rating : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets — Create new ticket/complaint
router.post('/', (req, res) => {
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

    const insertStmt = db.prepare(`
      INSERT INTO tickets (id, title, student, room, category, priority, status, assigned_worker, asset_tag, created_at, creator_role, description)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Unassigned', ?, ?, 'Student', ?)
    `);

    insertStmt.run(id, title.trim(), student, room, category, priority, finalAssetTag, createdAt, description || 'No description provided.');

    // Log to audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const dateStr = new Date().toLocaleString();
    auditStmt.run(`AL-${Date.now()}`, 'Ticket Created', `${student} (Student)`, id, dateStr, 'Ticket');

    // Add notification
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, time)
      VALUES (?, ?, 'info', 0, 'Just now')
    `);
    notifStmt.run(`N-${Date.now()}`, `New complaint ${id} logged in ${room} (${category})`);

    const created = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.status(201).json(mapTicket(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id/resolve — Mark resolved
router.patch('/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const { notes, actor = 'Student' } = req.body;

    const checkStmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
    const existing = checkStmt.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updateStmt = db.prepare('UPDATE tickets SET status = ? WHERE id = ?');
    updateStmt.run('Resolved', id);

    // If notes provided, append a comment
    if (notes && notes.trim()) {
      const commentStmt = db.prepare(`
        INSERT INTO ticket_comments (id, ticket_id, author, role, text, time, created_timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      commentStmt.run(`C${Date.now()}`, id, actor, actor.includes('Tech') ? 'Technician' : 'Student', notes.trim(), 'Just now', Date.now());
    }

    // Add audit entry
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(`AL-${Date.now()}`, 'Ticket Resolved', `${actor}`, id, new Date().toLocaleString(), 'Ticket');

    // Add notification
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, time)
      VALUES (?, ?, 'success', 0, 'Just now')
    `);
    notifStmt.run(`N-${Date.now()}`, `Ticket ${id} (${existing.title}) has been resolved.`);

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(mapTicket(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id/assign — Assign worker
router.patch('/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { workerName, actor = 'Dr. Meena Sharma (AW)' } = req.body;

    if (!workerName) {
      return res.status(400).json({ error: 'workerName is required' });
    }

    const checkStmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
    const existing = checkStmt.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updateStmt = db.prepare(`
      UPDATE tickets
      SET assigned_worker = ?, status = 'In Progress'
      WHERE id = ?
    `);
    updateStmt.run(workerName, id);

    // Also update worker active jobs count
    db.prepare('UPDATE workers SET jobs = jobs + 1 WHERE name = ?').run(workerName);

    // Add audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(`AL-${Date.now()}`, 'Worker Assigned', actor, id, new Date().toLocaleString(), 'Assignment');

    // Notification
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, time)
      VALUES (?, ?, 'info', 0, 'Just now')
    `);
    notifStmt.run(`N-${Date.now()}`, `Your ticket ${id} has been assigned to ${workerName}`);

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(mapTicket(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/:id/priority — Update priority
router.patch('/:id/priority', (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ error: 'Valid priority (Low, Medium, High) is required' });
    }

    const updateStmt = db.prepare('UPDATE tickets SET priority = ? WHERE id = ?');
    updateStmt.run(priority, id);

    const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
    res.json(mapTicket(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tickets/bulk-status — Update multiple tickets
router.patch('/bulk-status', (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ error: 'ids array and status are required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const updateStmt = db.prepare(`UPDATE tickets SET status = ? WHERE id IN (${placeholders})`);
    updateStmt.run(status, ...ids);

    res.json({ success: true, count: ids.length, updated: ids.length, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tickets/:id/comments — Add comment
router.post('/:id/comments', (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { author = 'User', role = 'Student', text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const commentId = `C${Date.now()}`;
    const time = 'Just now';
    const stmt = db.prepare(`
      INSERT INTO ticket_comments (id, ticket_id, author, role, text, time, created_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(commentId, ticketId, author, role, text.trim(), time, Date.now());

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
router.post('/:id/rate', (req, res) => {
  try {
    const { id: ticketId } = req.params;
    const { rating } = req.body;
    const num = parseInt(rating, 10);

    if (isNaN(num) || num < 1 || num > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO ticket_ratings (ticket_id, rating, created_timestamp)
      VALUES (?, ?, ?)
    `);
    stmt.run(ticketId, num, Date.now());

    res.json({ ticketId, rating: num });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
