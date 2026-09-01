import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// GET /api/budget — Fetch budget overview and category allocation
router.get('/', (req, res) => {
  try {
    const budgetStmt = db.prepare('SELECT * FROM budget WHERE id = 1');
    const budgetRow = budgetStmt.get() || { total: 500000, spent: 340000, pending: 115000 };

    const catStmt = db.prepare('SELECT * FROM budget_categories');
    const categories = catStmt.all() || [];

    res.json({
      total: budgetRow.total,
      spent: budgetRow.spent,
      pending: budgetRow.pending,
      categories: categories.map(c => ({
        name: c.name,
        spent: c.spent,
        budget: c.budget,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/budget — Update overall budget
router.patch('/', (req, res) => {
  try {
    const { total, spent, pending } = req.body;
    db.prepare(`
      UPDATE budget
      SET total = COALESCE(?, total),
          spent = COALESCE(?, spent),
          pending = COALESCE(?, pending)
      WHERE id = 1
    `).run(total, spent, pending);

    const budgetRow = db.prepare('SELECT * FROM budget WHERE id = 1').get();
    const categories = db.prepare('SELECT * FROM budget_categories').all();

    res.json({
      total: budgetRow.total,
      spent: budgetRow.spent,
      pending: budgetRow.pending,
      categories: categories.map(c => ({ name: c.name, spent: c.spent, budget: c.budget })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
