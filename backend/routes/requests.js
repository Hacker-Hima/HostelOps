import express from 'express';
import {
  StaffRequest,
  Budget,
  AuditLog,
  Notification,
} from '../models/index.js';

const router = express.Router();

function mapRequest(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    title: doc.title,
    dept: doc.dept,
    cost: doc.cost,
    status: doc.status,
    time: doc.time,
    submittedBy: doc.submitted_by || doc.submittedBy,
    urgency: doc.urgency,
    note: doc.note,
  };
}

// GET /api/requests — Fetch all staff requests
router.get('/', async (req, res) => {
  try {
    const { status, dept } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (dept && dept !== 'All') {
      filter.dept = dept;
    }

    const rows = await StaffRequest.find(filter).sort({ createdAt: -1, _id: -1 }).lean();
    res.json(rows.map(mapRequest));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests — Submit new staff request
router.post('/', async (req, res) => {
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

    const created = await StaffRequest.create({
      id,
      title: title.trim(),
      dept,
      cost: numCost,
      status,
      time,
      submitted_by: submittedBy,
      urgency,
      note,
    });

    // Audit log
    await AuditLog.create({
      id: `AL-${Date.now()}`,
      action: 'Staff Request Submitted',
      actor: `${submittedBy} (Staff)`,
      target: id,
      timestamp: new Date().toLocaleString(),
      category: 'Request',
    });

    // Notification
    await Notification.create({
      id: `N-${Date.now()}`,
      message: `New ${dept} request ${id} for ₹${numCost.toLocaleString()} submitted`,
      type: 'info',
      is_read: 0,
      time: 'Just now',
    });

    res.status(201).json(mapRequest(created));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/requests/:id/approve — Approve staff request
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { actor = 'Prof. R. Iyer (RW)' } = req.body;

    const existing = await StaffRequest.findOne({ id }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Staff request not found' });
    }

    const updated = await StaffRequest.findOneAndUpdate(
      { id },
      { status: 'Approved' },
      { returnDocument: 'after' }
    ).lean();

    // Update budget spent & pending
    const currentBudget = await Budget.findOne({ id: 1 }).lean();
    if (currentBudget) {
      await Budget.updateOne(
        { id: 1 },
        {
          $inc: { spent: existing.cost },
          pending: Math.max(0, currentBudget.pending - existing.cost),
        }
      );
    }

    // Audit log
    await AuditLog.create({
      id: `AL-${Date.now()}`,
      action: 'Request Approved',
      actor,
      target: id,
      timestamp: new Date().toLocaleString(),
      category: 'Approval',
    });

    // Notification
    await Notification.create({
      id: `N-${Date.now()}`,
      message: `${id} (${existing.title}) has been approved — ₹${existing.cost.toLocaleString()} released`,
      type: 'success',
      is_read: 0,
      time: 'Just now',
    });

    res.json(mapRequest(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/requests/:id/reject — Reject staff request
router.patch('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { actor = 'Prof. R. Iyer (RW)' } = req.body;

    const existing = await StaffRequest.findOne({ id }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Staff request not found' });
    }

    const updated = await StaffRequest.findOneAndUpdate(
      { id },
      { status: 'Rejected' },
      { returnDocument: 'after' }
    ).lean();

    const currentBudget = await Budget.findOne({ id: 1 }).lean();
    if (currentBudget) {
      await Budget.updateOne(
        { id: 1 },
        { pending: Math.max(0, currentBudget.pending - existing.cost) }
      );
    }

    // Audit log
    await AuditLog.create({
      id: `AL-${Date.now()}`,
      action: 'Request Rejected',
      actor,
      target: id,
      timestamp: new Date().toLocaleString(),
      category: 'Approval',
    });

    // Notification
    await Notification.create({
      id: `N-${Date.now()}`,
      message: `${id} (${existing.title}) was rejected`,
      type: 'warn',
      is_read: 0,
      time: 'Just now',
    });

    res.json(mapRequest(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/requests/bulk-approve — Bulk approve
router.patch('/bulk-approve', async (req, res) => {
  try {
    const { ids = [], actor = 'Prof. R. Iyer (RW)' } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const reqs = await StaffRequest.find({ id: { $in: ids } }).lean();
    let totalCost = 0;

    for (const r of reqs) {
      totalCost += r.cost;
      await AuditLog.create({
        id: `AL-${Date.now()}-${r.id}`,
        action: 'Request Approved',
        actor,
        target: r.id,
        timestamp: new Date().toLocaleString(),
        category: 'Approval',
      });
    }

    await StaffRequest.updateMany({ id: { $in: ids } }, { status: 'Approved' });

    const currentBudget = await Budget.findOne({ id: 1 }).lean();
    if (currentBudget) {
      await Budget.updateOne(
        { id: 1 },
        {
          $inc: { spent: totalCost },
          pending: Math.max(0, currentBudget.pending - totalCost),
        }
      );
    }

    res.json({ success: true, count: ids.length, totalCost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
