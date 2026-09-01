import express from 'express';
import db from '../db/database.js';

const router = express.Router();

function mapNotif(row) {
  if (!row) return null;
  return {
    id: row.id,
    message: row.message,
    type: row.type,
    isRead: Boolean(row.is_read),
    time: row.time,
  };
}

// GET /api/notifications — Fetch all notifications
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM notifications ORDER BY rowid DESC');
    const rows = stmt.all();
    res.json(rows.map(mapNotif));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read — Mark single notification read
router.patch('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    res.json(mapNotif(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all — Mark all notifications read
router.patch('/read-all', (req, res) => {
  try {
    db.exec('UPDATE notifications SET is_read = 1');
    const rows = db.prepare('SELECT * FROM notifications ORDER BY rowid DESC').all();
    res.json(rows.map(mapNotif));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications — Add notification
router.post('/', (req, res) => {
  try {
    const { message, type = 'info', time = 'Just now' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const id = `N-${Date.now()}`;
    db.prepare(`
      INSERT INTO notifications (id, message, type, is_read, time)
      VALUES (?, ?, ?, 0, ?)
    `).run(id, message, type, time);

    const created = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    res.status(201).json(mapNotif(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
