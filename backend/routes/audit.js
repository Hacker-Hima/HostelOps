import express from 'express';
import { AuditLog } from '../models/index.js';

const router = express.Router();

// GET /api/audit-logs — Fetch audit trail
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    let rows = await AuditLog.find(filter).sort({ _id: -1 }).lean();

    if (search && search.trim()) {
      const term = search.toLowerCase();
      rows = rows.filter(
        l =>
          l.action.toLowerCase().includes(term) ||
          l.actor.toLowerCase().includes(term) ||
          l.target.toLowerCase().includes(term)
      );
    }

    res.json(
      rows.map(l => ({
        id: l.id,
        action: l.action,
        actor: l.actor,
        target: l.target,
        timestamp: l.timestamp,
        category: l.category,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/audit-logs — Add audit entry
router.post('/', async (req, res) => {
  try {
    const {
      action,
      actor,
      target,
      timestamp = new Date().toLocaleString(),
      category = 'System',
    } = req.body;

    if (!action || !actor || !target) {
      return res.status(400).json({ error: 'action, actor, and target are required' });
    }

    const id = req.body.id || `AL-${Date.now()}`;
    const created = await AuditLog.create({
      id,
      action,
      actor,
      target,
      timestamp,
      category,
    });

    res.status(201).json({
      id: created.id,
      action: created.action,
      actor: created.actor,
      target: created.target,
      timestamp: created.timestamp,
      category: created.category,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
