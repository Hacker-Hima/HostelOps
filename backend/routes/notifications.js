import express from 'express';
import { Notification } from '../models/index.js';

const router = express.Router();

function mapNotif(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    message: doc.message,
    type: doc.type,
    isRead: Boolean(doc.is_read ?? doc.isRead),
    time: doc.time,
  };
}

// GET /api/notifications — Fetch all notifications
router.get('/', async (req, res) => {
  try {
    const rows = await Notification.find().sort({ _id: -1 }).lean();
    res.json(rows.map(mapNotif));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read — Mark single notification read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Notification.findOneAndUpdate(
      { id },
      { is_read: 1 },
      { returnDocument: 'after' }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(mapNotif(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all — Mark all notifications read
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({}, { is_read: 1 });
    const rows = await Notification.find().sort({ _id: -1 }).lean();
    res.json(rows.map(mapNotif));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications — Add notification
router.post('/', async (req, res) => {
  try {
    const { message, type = 'info', time = 'Just now' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    const id = req.body.id || `N-${Date.now()}`;
    const created = await Notification.create({
      id,
      message,
      type,
      is_read: 0,
      time,
    });

    res.status(201).json(mapNotif(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
