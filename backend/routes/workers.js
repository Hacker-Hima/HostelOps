import express from 'express';
import { Worker, Ticket } from '../models/index.js';

const router = express.Router();

function mapWorker(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    name: doc.name,
    skill: doc.skill,
    phone: doc.phone,
    availability: doc.availability,
    jobs: doc.jobs,
    rating: doc.rating,
    completedJobs: doc.completed_jobs ?? doc.completedJobs ?? 0,
  };
}

// GET /api/workers — Fetch all technicians
router.get('/', async (req, res) => {
  try {
    const { skill } = req.query;
    const filter = {};

    if (skill && skill !== 'All') {
      filter.skill = skill;
    }

    const rows = await Worker.find(filter).lean();
    res.json(rows.map(mapWorker));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/workers/:id/availability — Toggle availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    if (!availability) {
      return res.status(400).json({ error: 'availability is required' });
    }

    const existing = await Worker.findOne({ id }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const updated = await Worker.findOneAndUpdate(
      { id },
      { availability },
      { returnDocument: 'after' }
    ).lean();

    res.json(mapWorker(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:name/jobs — Get assigned tickets for worker
router.get('/:name/jobs', async (req, res) => {
  try {
    const { name } = req.params;
    const rows = await Ticket.find({ assigned_worker: name }).lean();
    res.json(
      rows.map(r => ({
        id: r.id,
        title: r.title,
        student: r.student,
        room: r.room,
        category: r.category,
        priority: r.priority,
        status: r.status,
        assignedWorker: r.assigned_worker || r.assignedWorker,
        assetTag: r.asset_tag || r.assetTag,
        createdAt: r.created_at || r.createdAt,
        creatorRole: r.creator_role || r.creatorRole,
        description: r.description,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
