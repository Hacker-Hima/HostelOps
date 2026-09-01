import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// GET /api/audit-logs — Fetch audit trail
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY rowid DESC';
    const rows = db.prepare(query).all(...params);

    if (search && search.trim()) {
      const term = search.toLowerCase();
      return res.json(rows.filter(l => l.action.toLowerCase().includes(term) || l.actor.toLowerCase().includes(term) || l.target.toLowerCase().includes(term)));
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/audit-logs — Add audit entry
router.post('/', (req, res) => {
  try {
    const { action, actor, target, timestamp = new Date().toLocaleString(), category = 'System' } = req.body;
    if (!action || !actor || !target) {
      return res.status(400).json({ error: 'action, actor, and target are required' });
    }

    const id = req.body.id || `AL-${Date.now()}`;
    db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, action, actor, target, timestamp, category);

    const created = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
