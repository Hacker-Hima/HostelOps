import express from 'express';
import db from '../db/database.js';

const router = express.Router();

function mapRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    dept: row.dept,
    cost: row.cost,
    status: row.status,
    time: row.time,
    submittedBy: row.submitted_by,
    urgency: row.urgency,
    note: row.note,
  };
}

// GET /api/requests — Fetch all staff requests
router.get('/', (req, res) => {
  try {
    const { status, dept } = req.query;
    let query = 'SELECT * FROM staff_requests WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (dept && dept !== 'All') {
      query += ' AND dept = ?';
      params.push(dept);
    }

    query += ' ORDER BY rowid DESC';
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows.map(mapRequest));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests — Submit new staff request
router.post('/', (req, res) => {
  try {
    const {
      title,
      dept = 'Mess & Dining',
      cost = 0,
      urgency = 'Normal',
      note = '',
      submittedBy = 'Sanji',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const numCost = parseInt(cost, 10) || 0;
    const reqNum = Math.floor(4100 + Math.random() * 900);
    const id = req.body.id || `REQ-${reqNum}`;
    const time = 'Submitted today';
    const status = numCost > 75000 ? 'Pending Principal' : 'Pending Res. Warden';

    const insertStmt = db.prepare(`
      INSERT INTO staff_requests (id, title, dept, cost, status, time, submitted_by, urgency, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(id, title.trim(), dept, numCost, status, time, submittedBy, urgency, note);

    // Audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(`AL-${Date.now()}`, 'Staff Request Submitted', `${submittedBy} (Staff)`, id, new Date().toLocaleString(), 'Request');

    // Notification
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, time)
      VALUES (?, ?, 'info', 0, 'Just now')
    `);
    notifStmt.run(`N-${Date.now()}`, `New ${dept} request ${id} for ₹${numCost.toLocaleString()} submitted`);

    const created = db.prepare('SELECT * FROM staff_requests WHERE id = ?').get(id);
    res.status(201).json(mapRequest(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/requests/:id/approve — Approve staff request
router.patch('/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const { actor = 'Prof. R. Iyer (RW)' } = req.body;

    const checkStmt = db.prepare('SELECT * FROM staff_requests WHERE id = ?');
    const existing = checkStmt.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Staff request not found' });
    }

    db.prepare("UPDATE staff_requests SET status = 'Approved' WHERE id = ?").run(id);

    // Update budget spent
    db.prepare('UPDATE budget SET spent = spent + ?, pending = MAX(0, pending - ?) WHERE id = 1').run(existing.cost, existing.cost);

    // Audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(`AL-${Date.now()}`, 'Request Approved', actor, id, new Date().toLocaleString(), 'Approval');

    // Notification
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, time)
      VALUES (?, ?, 'success', 0, 'Just now')
    `);
    notifStmt.run(`N-${Date.now()}`, `${id} (${existing.title}) has been approved — ₹${existing.cost.toLocaleString()} released`);

    const updated = db.prepare('SELECT * FROM staff_requests WHERE id = ?').get(id);
    res.json(mapRequest(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/requests/:id/reject — Reject staff request
router.patch('/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { actor = 'Prof. R. Iyer (RW)' } = req.body;

    const checkStmt = db.prepare('SELECT * FROM staff_requests WHERE id = ?');
    const existing = checkStmt.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Staff request not found' });
    }

    db.prepare("UPDATE staff_requests SET status = 'Rejected' WHERE id = ?").run(id);
    db.prepare('UPDATE budget SET pending = MAX(0, pending - ?) WHERE id = 1').run(existing.cost);

    // Audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(`AL-${Date.now()}`, 'Request Rejected', actor, id, new Date().toLocaleString(), 'Approval');

    // Notification
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, time)
      VALUES (?, ?, 'warn', 0, 'Just now')
    `);
    notifStmt.run(`N-${Date.now()}`, `${id} (${existing.title}) was rejected`);

    const updated = db.prepare('SELECT * FROM staff_requests WHERE id = ?').get(id);
    res.json(mapRequest(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/requests/bulk-approve — Bulk approve
router.patch('/bulk-approve', (req, res) => {
  try {
    const { ids = [], actor = 'Prof. R. Iyer (RW)' } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const findStmt = db.prepare(`SELECT * FROM staff_requests WHERE id IN (${placeholders})`);
    const reqs = findStmt.all(...ids);

    let totalCost = 0;
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const r of reqs) {
      totalCost += r.cost;
      auditStmt.run(`AL-${Date.now()}-${r.id}`, 'Request Approved', actor, r.id, new Date().toLocaleString(), 'Approval');
    }

    db.prepare(`UPDATE staff_requests SET status = 'Approved' WHERE id IN (${placeholders})`).run(...ids);
    db.prepare('UPDATE budget SET spent = spent + ?, pending = MAX(0, pending - ?) WHERE id = 1').run(totalCost, totalCost);

    res.json({ success: true, count: ids.length, totalCost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
