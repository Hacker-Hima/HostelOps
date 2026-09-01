import express from 'express';
import db from '../db/database.js';

const router = express.Router();

function mapWorker(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    skill: row.skill,
    phone: row.phone,
    availability: row.availability,
    jobs: row.jobs,
    rating: row.rating,
    completedJobs: row.completed_jobs,
  };
}

// GET /api/workers — Fetch all technicians
router.get('/', (req, res) => {
  try {
    const { skill } = req.query;
    let query = 'SELECT * FROM workers WHERE 1=1';
    const params = [];

    if (skill && skill !== 'All') {
      query += ' AND skill = ?';
      params.push(skill);
    }

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(rows.map(mapWorker));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/workers/:id/availability — Toggle availability
router.patch('/:id/availability', (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({ error: 'availability is required' });
    }

    const checkStmt = db.prepare('SELECT * FROM workers WHERE id = ?');
    const existing = checkStmt.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    db.prepare('UPDATE workers SET availability = ? WHERE id = ?').run(availability, id);
    const updated = db.prepare('SELECT * FROM workers WHERE id = ?').get(id);
    res.json(mapWorker(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:name/jobs — Get assigned tickets for worker
router.get('/:name/jobs', (req, res) => {
  try {
    const { name } = req.params;
    const stmt = db.prepare('SELECT * FROM tickets WHERE assigned_worker = ?');
    const rows = stmt.all(name);
    res.json(rows.map(r => ({
      id: r.id,
      title: r.title,
      student: r.student,
      room: r.room,
      category: r.category,
      priority: r.priority,
      status: r.status,
      assignedWorker: r.assigned_worker,
      assetTag: r.asset_tag,
      createdAt: r.created_at,
      creatorRole: r.creator_role,
      description: r.description,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
