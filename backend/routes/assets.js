import express from 'express';
import db from '../db/database.js';

const router = express.Router();

function getAssetWithHistory(tag) {
  const asset = db.prepare('SELECT * FROM assets WHERE tag = ?').get(tag);
  if (!asset) return null;

  const history = db.prepare('SELECT date, action, actor, color FROM asset_maintenance WHERE asset_tag = ? ORDER BY id DESC').all(tag);

  return {
    tag: asset.tag,
    name: asset.name,
    category: asset.category,
    location: asset.location,
    condition: asset.condition,
    lastChecked: asset.last_checked,
    value: asset.value,
    maintenanceHistory: history,
  };
}

// GET /api/assets — Fetch all assets
router.get('/', (req, res) => {
  try {
    const { category, condition, search } = req.query;
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (condition && condition !== 'All') {
      query += ' AND condition = ?';
      params.push(condition);
    }

    query += ' ORDER BY rowid ASC';
    const assets = db.prepare(query).all(...params);

    const historyRows = db.prepare('SELECT asset_tag, date, action, actor, color FROM asset_maintenance ORDER BY id DESC').all();
    const historyMap = {};
    for (const h of historyRows) {
      if (!historyMap[h.asset_tag]) historyMap[h.asset_tag] = [];
      historyMap[h.asset_tag].push({ date: h.date, action: h.action, actor: h.actor, color: h.color });
    }

    const result = assets.map(a => ({
      tag: a.tag,
      name: a.name,
      category: a.category,
      location: a.location,
      condition: a.condition,
      lastChecked: a.last_checked,
      value: a.value,
      maintenanceHistory: historyMap[a.tag] || [],
    }));

    if (search && search.trim()) {
      const term = search.toLowerCase();
      return res.json(result.filter(a => a.name.toLowerCase().includes(term) || a.tag.toLowerCase().includes(term) || a.location.toLowerCase().includes(term)));
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/:tag — Single asset by tag
router.get('/:tag', (req, res) => {
  try {
    const asset = getAssetWithHistory(req.params.tag);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found with specified QR tag' });
    }
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets — Create new asset
router.post('/', (req, res) => {
  try {
    const {
      tag,
      name,
      category = 'Furniture',
      location = 'Room 101, Block A',
      condition = 'Good',
      value = 1000,
    } = req.body;

    if (!tag || !name) {
      return res.status(400).json({ error: 'Tag and Name are required' });
    }

    const lastChecked = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    db.prepare(`
      INSERT INTO assets (tag, name, category, location, condition, last_checked, value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tag, name, category, location, condition, lastChecked, parseInt(value, 10) || 0);

    // Initial maintenance log
    db.prepare(`
      INSERT INTO asset_maintenance (asset_tag, date, action, actor, color)
      VALUES (?, ?, ?, ?, ?)
    `).run(tag, lastChecked, 'Asset Registered & Tagged', 'System', 'var(--accent-green)');

    res.status(201).json(getAssetWithHistory(tag));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assets/:tag/condition — Update asset condition
router.patch('/:tag/condition', (req, res) => {
  try {
    const { tag } = req.params;
    const { condition, actor = 'Dr. Meena Sharma (Asset Mgr)' } = req.body;

    if (!condition) {
      return res.status(400).json({ error: 'condition is required' });
    }

    const existing = db.prepare('SELECT * FROM assets WHERE tag = ?').get(tag);
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const lastChecked = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    db.prepare(`
      UPDATE assets
      SET condition = ?, last_checked = ?
      WHERE tag = ?
    `).run(condition, lastChecked, tag);

    // Add audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`AL-${Date.now()}`, 'Asset Condition Updated', actor, tag, new Date().toLocaleString(), 'Asset');

    res.json(getAssetWithHistory(tag));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets/:tag/maintenance — Add maintenance record
router.post('/:tag/maintenance', (req, res) => {
  try {
    const { tag } = req.params;
    const { action, actor = 'Dr. Meena Sharma (Asset Mgr)', color = 'var(--accent-primary)', date = 'Today' } = req.body;

    if (!action || !action.trim()) {
      return res.status(400).json({ error: 'Action description is required' });
    }

    const existing = db.prepare('SELECT * FROM assets WHERE tag = ?').get(tag);
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    db.prepare(`
      INSERT INTO asset_maintenance (asset_tag, date, action, actor, color)
      VALUES (?, ?, ?, ?, ?)
    `).run(tag, date, action.trim(), actor, color);

    res.status(201).json(getAssetWithHistory(tag));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
