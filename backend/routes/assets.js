import express from 'express';
import {
  Asset,
  AssetMaintenance,
  AssetTransfer,
  AssetAudit,
  HandoverClearance,
  AuditLog,
} from '../models/index.js';

const router = express.Router();

function calculateDepreciation(purchaseCost = 0, purchaseDate = '2024-01-01', rate = 10) {
  try {
    const purchaseYear = new Date(purchaseDate).getFullYear() || 2024;
    const currentYear = new Date().getFullYear();
    const yearsElapsed = Math.max(0, currentYear - purchaseYear);
    const depAmount = purchaseCost * (rate / 100) * yearsElapsed;
    return Math.max(0, Math.round(purchaseCost - depAmount));
  } catch {
    return purchaseCost;
  }
}

async function getAssetWithHistory(tag) {
  const asset = await Asset.findOne({ tag }).lean();
  if (!asset) return null;

  const history = await AssetMaintenance.find({ asset_tag: tag })
    .sort({ _id: -1 })
    .lean();

  const transfers = await AssetTransfer.find({ asset_tag: tag })
    .sort({ _id: -1 })
    .lean();

  return {
    ...asset,
    lastChecked: asset.last_checked || asset.lastChecked,
    purchaseCost: asset.purchase_cost || asset.purchaseCost || asset.value || 0,
    currentValue: asset.current_value || calculateDepreciation(asset.purchase_cost || asset.value, asset.purchase_date, asset.depreciation_rate),
    warrantyExpiry: asset.warranty_expiry || asset.warrantyExpiry,
    assignedStudent: {
      roll: asset.assigned_student_roll || '',
      name: asset.assigned_student_name || '',
    },
    maintenanceHistory: history.map(h => ({
      date: h.date,
      action: h.action,
      actor: h.actor,
      cost: h.cost || 0,
      color: h.color,
    })),
    transfers: transfers.map(t => ({
      from: t.from_location,
      to: t.to_location,
      transferredBy: t.transferred_by,
      reason: t.reason,
      date: t.date,
    })),
  };
}

// GET /api/assets — Fetch all assets with rich fields
router.get('/', async (req, res) => {
  try {
    const { category, condition, status, block, room, search } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (condition && condition !== 'All') filter.condition = condition;
    if (status && status !== 'All') filter.status = status;
    if (block && block !== 'All') filter.block = block;
    if (room && room !== 'All') filter.room = room;

    const assets = await Asset.find(filter).lean();
    const historyRows = await AssetMaintenance.find().sort({ _id: -1 }).lean();

    const historyMap = {};
    for (const h of historyRows) {
      if (!historyMap[h.asset_tag]) historyMap[h.asset_tag] = [];
      historyMap[h.asset_tag].push({
        date: h.date,
        action: h.action,
        actor: h.actor,
        cost: h.cost || 0,
        color: h.color,
      });
    }

    const result = assets.map(a => {
      const pCost = a.purchase_cost || a.purchaseCost || a.value || 0;
      const cVal = a.current_value || calculateDepreciation(pCost, a.purchase_date, a.depreciation_rate);
      return {
        tag: a.tag,
        name: a.name,
        category: a.category,
        block: a.block || 'Block A',
        floor: a.floor || 'Floor 1',
        room: a.room || '101',
        location: a.location || `${a.block || 'Block A'} - Room ${a.room || '101'}`,
        condition: a.condition || 'Good',
        status: a.status || 'Assigned',
        purchaseDate: a.purchase_date || '2024-06-12',
        purchaseCost: pCost,
        currentValue: cVal,
        depreciationRate: a.depreciation_rate || 10,
        warrantyExpiry: a.warranty_expiry || '2027-06-12',
        supplier: a.supplier || 'Apex Institutional Furnishings Ltd.',
        assignedStudent: {
          roll: a.assigned_student_roll || '',
          name: a.assigned_student_name || '',
        },
        lastChecked: a.last_checked || a.lastChecked || 'Today',
        qrCodeData: a.qr_code_data || `HOSTELOPS:${a.tag}`,
        notes: a.notes || '',
        maintenanceHistory: historyMap[a.tag] || [],
      };
    });

    if (search && search.trim()) {
      const term = search.toLowerCase();
      return res.json(
        result.filter(
          a =>
            a.name.toLowerCase().includes(term) ||
            a.tag.toLowerCase().includes(term) ||
            a.location.toLowerCase().includes(term) ||
            (a.assignedStudent && a.assignedStudent.name.toLowerCase().includes(term))
        )
      );
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/inventory-summary — Aggregated inventory metrics & stock thresholds
router.get('/inventory-summary', async (req, res) => {
  try {
    const all = await Asset.find().lean();
    const categories = ['Furniture', 'Electrical', 'Electronics', 'Plumbing', 'Appliances', 'Study Equipment', 'Safety Equipment'];
    
    const categoryBreakdown = {};
    categories.forEach(c => {
      const items = all.filter(a => a.category === c);
      categoryBreakdown[c] = {
        total: items.length,
        assigned: items.filter(a => a.status === 'Assigned').length,
        inStore: items.filter(a => a.status === 'In Store' || a.status === 'Available').length,
        damaged: items.filter(a => a.condition === 'Damaged' || a.condition === 'Needs Repair').length,
        missing: items.filter(a => a.status === 'Missing').length,
      };
    });

    // Low stock warnings (Threshold: minimum 5 in-store)
    const stockAlerts = [];
    Object.keys(categoryBreakdown).forEach(cat => {
      const storeQty = categoryBreakdown[cat].inStore;
      if (storeQty < 5) {
        stockAlerts.push({
          category: cat,
          available: storeQty,
          minRequired: 5,
          alert: `Low Stock: Only ${storeQty} available in store. Reorder recommended.`,
        });
      }
    });

    const totalValuation = all.reduce((sum, a) => sum + (a.purchase_cost || a.value || 0), 0);
    const currentValuation = all.reduce((sum, a) => {
      const pCost = a.purchase_cost || a.value || 0;
      return sum + (a.current_value || calculateDepreciation(pCost, a.purchase_date, a.depreciation_rate));
    }, 0);

    res.json({
      totalAssets: all.length,
      assigned: all.filter(a => a.status === 'Assigned').length,
      inStore: all.filter(a => a.status === 'In Store' || a.status === 'Available').length,
      damaged: all.filter(a => a.condition === 'Damaged' || a.condition === 'Needs Repair').length,
      underRepair: all.filter(a => a.condition === 'Under Maintenance').length,
      missing: all.filter(a => a.status === 'Missing').length,
      totalValuation,
      currentValuation,
      totalDepreciation: totalValuation - currentValuation,
      categoryBreakdown,
      stockAlerts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/transfers — Movement history
router.get('/transfers', async (req, res) => {
  try {
    const transfers = await AssetTransfer.find().sort({ createdAt: -1 }).lean();
    res.json(transfers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/audits — Physical audit records
router.get('/audits', async (req, res) => {
  try {
    const audits = await AssetAudit.find().sort({ createdAt: -1 }).lean();
    res.json(audits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/handovers — Student checkout handover clearances
router.get('/handovers', async (req, res) => {
  try {
    const handovers = await HandoverClearance.find().sort({ createdAt: -1 }).lean();
    res.json(handovers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/by-student/:roll — Assigned assets for a specific student
router.get('/by-student/:roll', async (req, res) => {
  try {
    const { roll } = req.params;
    const assets = await Asset.find({ assigned_student_roll: roll }).lean();
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/:tag — Single asset lookup
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

// POST /api/assets — Register a new physical asset
router.post('/', async (req, res) => {
  try {
    const {
      tag,
      name,
      category,
      block,
      floor,
      room,
      condition = 'Good',
      status = 'Assigned',
      purchaseDate = 'Today',
      purchaseCost = 0,
      depreciationRate = 10,
      warrantyExpiry = '2027-01-01',
      supplier = 'Hostel Furnishings Ltd.',
      assignedStudentRoll = '',
      assignedStudentName = '',
      notes = '',
    } = req.body;

    if (!tag || !name || !category) {
      return res.status(400).json({ error: 'Tag, Name, and Category are required.' });
    }

    const existing = await Asset.findOne({ tag }).lean();
    if (existing) {
      return res.status(400).json({ error: `Asset with tag ${tag} already exists.` });
    }

    const loc = `${block || 'Block A'} - Room ${room || '101'}`;
    const pCost = Number(purchaseCost) || 0;
    const cVal = calculateDepreciation(pCost, purchaseDate, depreciationRate);

    const asset = await Asset.create({
      tag,
      name,
      category,
      block: block || 'Block A',
      floor: floor || 'Floor 1',
      room: room || '101',
      location: loc,
      condition,
      status,
      purchase_date: purchaseDate,
      purchase_cost: pCost,
      current_value: cVal,
      depreciation_rate: Number(depreciationRate) || 10,
      warranty_expiry: warrantyExpiry,
      supplier,
      assigned_student_roll: assignedStudentRoll,
      assigned_student_name: assignedStudentName,
      last_checked: 'Registered today',
      qr_code_data: `HOSTELOPS:${tag}`,
      notes,
    });

    await AssetMaintenance.create({
      asset_tag: tag,
      date: new Date().toISOString().split('T')[0],
      action: 'Registered into Inventory',
      actor: 'Asset Manager',
      cost: pCost,
      color: '#10b981',
    });

    await AuditLog.create({
      id: `audit-${Date.now()}`,
      action: `Asset Registered: ${tag} (${name})`,
      actor: 'Asset Manager',
      category: 'Inventory',
      time: 'Just now',
    });

    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets/transfer — Transfer asset between rooms/blocks
router.post('/transfer', async (req, res) => {
  try {
    const { tag, toBlock, toFloor, toRoom, reason, transferredBy = 'Warden' } = req.body;
    const asset = await Asset.findOne({ tag });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    const fromLoc = asset.location || `${asset.block} - Room ${asset.room}`;
    const toLoc = `${toBlock} - Room ${toRoom}`;

    asset.block = toBlock;
    asset.floor = toFloor || asset.floor;
    asset.room = toRoom;
    asset.location = toLoc;
    asset.last_checked = 'Transferred today';
    await asset.save();

    const transferRecord = await AssetTransfer.create({
      asset_tag: tag,
      asset_name: asset.name,
      from_location: fromLoc,
      to_location: toLoc,
      transferred_by: transferredBy,
      reason: reason || 'Room rearrangement',
      date: new Date().toISOString().split('T')[0],
    });

    await AssetMaintenance.create({
      asset_tag: tag,
      date: new Date().toISOString().split('T')[0],
      action: `Transferred from ${fromLoc} to ${toLoc}`,
      actor: transferredBy,
      color: '#8b5cf6',
    });

    await AuditLog.create({
      id: `audit-${Date.now()}`,
      action: `Transferred ${tag} to ${toLoc}`,
      actor: transferredBy,
      category: 'Transfers',
      time: 'Just now',
    });

    res.json({ message: 'Asset transferred successfully', transfer: transferRecord, asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets/audit — Submit a physical audit verification
router.post('/audit', async (req, res) => {
  try {
    const { block, room, auditor = 'Warden', scannedTags = [] } = req.body;

    const expectedAssets = await Asset.find({ block, room }).lean();
    const expectedTags = expectedAssets.map(a => a.tag);

    const missingTags = expectedTags.filter(t => !scannedTags.includes(t));
    const matchedTags = expectedTags.filter(t => scannedTags.includes(t));

    // Update missing assets status
    if (missingTags.length > 0) {
      await Asset.updateMany(
        { tag: { $in: missingTags } },
        { $set: { status: 'Missing', last_checked: 'Flagged Missing in Audit' } }
      );
    }

    const audit = await AssetAudit.create({
      audit_id: `AUD-${Date.now().toString().slice(-6)}`,
      block,
      room,
      auditor,
      date: new Date().toISOString().split('T')[0],
      expected_count: expectedTags.length,
      scanned_count: matchedTags.length,
      missing_count: missingTags.length,
      expected_tags: expectedTags,
      scanned_tags: matchedTags,
      missing_tags: missingTags,
      status: missingTags.length === 0 ? 'Verified 100%' : 'Discrepancy Found',
    });

    res.status(201).json(audit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assets/handover — Submit student vacate handover checklist
router.post('/handover', async (req, res) => {
  try {
    const { studentRoll, studentName, room, block, items = [], remarks = '' } = req.body;

    const handover = await HandoverClearance.create({
      handover_id: `CLR-${Date.now().toString().slice(-6)}`,
      student_roll: studentRoll,
      student_name: studentName,
      room,
      block,
      date: new Date().toISOString().split('T')[0],
      items,
      status: 'Pending Review',
      remarks,
    });

    res.status(201).json(handover);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assets/handover/:id/clear — Warden clears student handover
router.patch('/handover/:id/clear', async (req, res) => {
  try {
    const { id } = req.params;
    const { clearedBy = 'Warden', penaltyAmount = 0, status = 'Cleared', remarks } = req.body;

    const handover = await HandoverClearance.findOne({ handover_id: id });
    if (!handover) return res.status(404).json({ error: 'Handover record not found' });

    handover.cleared_by = clearedBy;
    handover.penalty_amount = penaltyAmount;
    handover.status = status;
    if (remarks) handover.remarks = remarks;
    await handover.save();

    res.json(handover);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assets/:tag/condition — Update condition & record repair/inspection
router.patch('/:tag/condition', async (req, res) => {
  try {
    const { condition, status, actor = 'System Inspector', cost = 0, action = 'Condition Update' } = req.body;
    const asset = await Asset.findOne({ tag: req.params.tag });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    asset.condition = condition;
    if (status) asset.status = status;
    asset.last_checked = 'Updated today';
    await asset.save();

    await AssetMaintenance.create({
      asset_tag: req.params.tag,
      date: new Date().toISOString().split('T')[0],
      action,
      actor,
      cost: Number(cost) || 0,
      color: condition === 'Good' ? '#10b981' : '#f59e0b',
    });

    res.json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assets/:tag — Retire or delete asset
router.delete('/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const asset = await Asset.findOne({ tag });
    if (!asset) return res.status(404).json({ error: 'Asset not found' });

    // Mark as retired
    asset.status = 'Retired';
    asset.condition = 'Damaged';
    await asset.save();

    await AssetMaintenance.create({
      asset_tag: tag,
      date: new Date().toISOString().split('T')[0],
      action: 'Asset Retired from Service',
      actor: 'Asset Manager',
      color: '#ef4444',
    });

    res.json({ message: `Asset ${tag} retired from active registry.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
