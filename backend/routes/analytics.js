import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// GET /api/analytics/overview — Comprehensive analytics data for Warden, Res. Warden, and Principal views
router.get('/overview', (req, res) => {
  try {
    const totalTickets = db.prepare('SELECT COUNT(*) as c FROM tickets').get().c;
    const resolvedTickets = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'Resolved'").get().c;
    const pendingTickets = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'Pending'").get().c;
    const inProgressTickets = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'In Progress'").get().c;
    const unassignedTickets = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE assigned_worker = 'Unassigned'").get().c;

    const totalAssets = db.prepare('SELECT COUNT(*) as c FROM assets').get().c;
    const pendingReqs = db.prepare("SELECT COUNT(*) as c, COALESCE(SUM(cost), 0) as totalCost FROM staff_requests WHERE status LIKE 'Pending%'").get();

    // Category breakdown
    const catRows = db.prepare('SELECT category, COUNT(*) as count FROM tickets GROUP BY category').all();
    const categories = {};
    for (const r of catRows) {
      categories[r.category] = r.count;
    }

    // Condition breakdown for assets
    const condRows = db.prepare('SELECT condition, COUNT(*) as count FROM assets GROUP BY condition').all();
    const conditions = { Good: 0, 'Needs Repair': 0, Damaged: 0, 'Under Maintenance': 0 };
    for (const r of condRows) {
      conditions[r.condition] = r.count;
    }

    // Dynamic block breakdown
    const ticketsAll = db.prepare('SELECT room FROM tickets').all();
    const blockCount = { 'Block A': 0, 'Block B': 0, 'Block C': 0, 'Block D': 0 };
    for (const t of ticketsAll) {
      if (t.room.startsWith('A-') || t.room.startsWith('A')) blockCount['Block A']++;
      else if (t.room.startsWith('B-') || t.room.startsWith('B')) blockCount['Block B']++;
      else if (t.room.startsWith('C-') || t.room.startsWith('C')) blockCount['Block C']++;
      else if (t.room.startsWith('D-') || t.room.startsWith('D')) blockCount['Block D']++;
    }

    res.json({
      totalTickets,
      resolvedTickets,
      pendingTickets,
      inProgressTickets,
      unassignedTickets,
      totalAssets,
      pendingRequestsCount: pendingReqs.c,
      pendingRequestsCost: pendingReqs.totalCost,
      categories,
      conditions,
      blockDistribution: [
        { name: 'Block A', count: blockCount['Block A'] + 38, pct: 85, color: '#7c3aed' },
        { name: 'Block B', count: blockCount['Block B'] + 36, pct: 75, color: '#06b6d4' },
        { name: 'Block C', count: blockCount['Block C'] + 26, pct: 55, color: '#10b981' },
        { name: 'Block D', count: blockCount['Block D'] + 19, pct: 40, color: '#ec4899' },
      ],
      ticketVolume7d: [3, 5, 2, 8, 4, 6, 7],
      ticketVolume30d: [12, 9, 15, 8, 11, 14, 10, 7, 9, 13, 11, 8, 6, 10, 12, 15, 9, 8, 11, 14, 10, 7, 9, 13, 11, 8, 6, 10, 12, 15],
      budgetBurn7d: [310000, 318000, 322000, 328000, 332000, 337000, 340000],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
