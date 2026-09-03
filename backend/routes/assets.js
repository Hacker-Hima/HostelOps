import express from 'express';
import {
  Asset,
  AssetMaintenance,
  AuditLog,
} from '../models/index.js';

const router = express.Router();

async function getAssetWithHistory(tag) {
  const asset = await Asset.findOne({ tag }).lean();
  if (!asset) return null;

  const history = await AssetMaintenance.find({ asset_tag: tag })
    .sort({ _id: -1 })
    .lean();

  return {
    tag: asset.tag,
    name: asset.name,
    category: asset.category,
    location: asset.location,
    condition: asset.condition,
    lastChecked: asset.last_checked || asset.lastChecked,
    value: asset.value,
    maintenanceHistory: history.map(h => ({
      date: h.date,
      action: h.action,
      actor: h.actor,
      color: h.color,
    })),
  };
}

// GET /api/assets — Fetch all assets
router.get('/', async (req, res) => {
  try {
    const { category, condition, search } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (condition && condition !== 'All') {
      filter.condition = condition;
    }

    const assets = await Asset.find(filter).lean();
    const historyRows = await AssetMaintenance.find().sort({ _id: -1 }).lean();

    const historyMap = {};
    for (const h of historyRows) {
      if (!historyMap[h.asset_tag]) historyMap[h.asset_tag] = [];
      historyMap[h.asset_tag].push({
        date: h.date,
        action: h.action,
        actor: h.actor,
        color: h.color,
      });
    }

    const result = assets.map(a => ({
      tag: a.tag,
      name: a.name,
      category: a.category,
      location: a.location,
      condition: a.condition,
      lastChecked: a.last_checked || a.lastChecked,
      value: a.value,
      maintenanceHistory: historyMap[a.tag] || [],
    }));

    if (search && search.trim()) {
      const term = search.toLowerCase();
      return res.json(
        result.filter(
          a =>
            a.name.toLowerCase().includes(term) ||
            a.tag.toLowerCase().includes(term) ||
            a.location.toLowerCase().includes(term)
        )
      );
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/:tag — Single asset by tag
router.get('/:tag', async (req, res) => {
  try {
    const asset = await getAssetWithHistory(req.params.tag);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found with specified QR tag' });
    }
    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets — Create new asset
router.post('/', async (req, res) => {
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

    const lastChecked = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    await Asset.create({
      tag,
      name,
      category,
      location,
      condition,
      last_checked: lastChecked,
      value: parseInt(value, 10) || 0,
    });

    // Initial maintenance log
    await AssetMaintenance.create({
      asset_tag: tag,
      date: lastChecked,
      action: 'Asset Registered & Tagged',
      actor: 'System',
      color: 'var(--accent-green)',
    });

    const created = await getAssetWithHistory(tag);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assets/:tag/condition — Update asset condition
router.patch('/:tag/condition', async (req, res) => {
  try {
    const { tag } = req.params;
    const { condition, actor = 'Dr. Meena Sharma (Asset Mgr)' } = req.body;

    if (!condition) {
      return res.status(400).json({ error: 'condition is required' });
    }

    const existing = await Asset.findOne({ tag }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const lastChecked = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    await Asset.updateOne(
      { tag },
      { condition, last_checked: lastChecked }
    );

    // Add audit log
    await AuditLog.create({
      id: `AL-${Date.now()}`,
      action: 'Asset Condition Updated',
      actor,
      target: tag,
      timestamp: new Date().toLocaleString(),
      category: 'Asset',
    });

    const updated = await getAssetWithHistory(tag);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets/:tag/maintenance — Add maintenance record
router.post('/:tag/maintenance', async (req, res) => {
  try {
    const { tag } = req.params;
    const {
      action,
      actor = 'Dr. Meena Sharma (Asset Mgr)',
      color = 'var(--accent-primary)',
      date = 'Today',
    } = req.body;

    if (!action || !action.trim()) {
      return res.status(400).json({ error: 'Action description is required' });
    }

    const existing = await Asset.findOne({ tag }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await AssetMaintenance.create({
      asset_tag: tag,
      date,
      action: action.trim(),
      actor,
      color,
    });

    const updated = await getAssetWithHistory(tag);
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
