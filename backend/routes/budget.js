import express from 'express';
import { Budget, BudgetCategory } from '../models/index.js';

const router = express.Router();

// GET /api/budget — Fetch budget overview and category allocation
router.get('/', async (req, res) => {
  try {
    const budgetRow = (await Budget.findOne({ id: 1 }).lean()) || {
      total: 500000,
      spent: 340000,
      pending: 115000,
    };

    const categories = (await BudgetCategory.find().lean()) || [];

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
router.patch('/', async (req, res) => {
  try {
    const { total, spent, pending } = req.body;
    const update = {};
    if (total !== undefined) update.total = total;
    if (spent !== undefined) update.spent = spent;
    if (pending !== undefined) update.pending = pending;

    await Budget.updateOne({ id: 1 }, { $set: update }, { upsert: true });

    const budgetRow = await Budget.findOne({ id: 1 }).lean();
    const categories = await BudgetCategory.find().lean();

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

export default router;
