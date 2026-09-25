import express from 'express';
import {
  Asset,
  AssetMaintenance,
  AssetRequest,
  AssetAudit,
  AssetDisposal,
  AssetCategory,
} from '../models/index.js';

const router = express.Router();

/**
 * Utility: Calculate depreciation
 */
function calculateDepreciation(purchaseCost = 0, purchaseDate = '2024-01-01', rate = 10) {
  try {
    const cost = Number(purchaseCost) || 0;
    const depRate = Number(rate) || 10;
    const pDate = new Date(purchaseDate);
    const validDate = isNaN(pDate.getTime()) ? new Date('2024-01-01') : pDate;
    const msElapsed = Math.max(0, Date.now() - validDate.getTime());
    const yearsElapsed = msElapsed / (365.25 * 24 * 60 * 60 * 1000);
    const totalDepreciation = cost * (depRate / 100) * yearsElapsed;
    return Math.max(Math.round(cost * 0.05), Math.round(cost - totalDepreciation));
  } catch {
    return Number(purchaseCost) || 0;
  }
}

// GET /api/analytics or /api/analytics/overview — Live analytics aggregated from MongoDB
router.get(['/', '/overview'], async (req, res) => {
  try {
    // 1. Assets KPIs
    const allAssets = await Asset.find().lean();
    const totalAssets = allAssets.length;
    const assignedAssets = allAssets.filter((a) => a.status === 'Assigned').length;
    const availableAssets = allAssets.filter((a) => a.status === 'In Store' || a.status === 'Available').length;
    const underMaintenanceAssets = allAssets.filter((a) => a.status === 'Under Maintenance').length;
    const missingAssets = allAssets.filter((a) => a.status === 'Missing').length;
    const disposedAssets = allAssets.filter((a) => a.status === 'Disposed').length;

    // 2. Asset Valuations & Depreciation
    const totalPurchaseValuation = allAssets.reduce((sum, a) => sum + (a.purchase_cost || a.value || 0), 0);
    const currentDepreciatedValuation = allAssets.reduce((sum, a) => {
      if (a.status === 'Disposed') return sum;
      const pCost = a.purchase_cost || a.value || 0;
      return sum + (a.current_value || calculateDepreciation(pCost, a.purchase_date, a.depreciation_rate));
    }, 0);
    const totalDepreciation = Math.max(0, totalPurchaseValuation - currentDepreciatedValuation);

    // 3. Maintenance Aggregates
    const maintenanceTickets = await AssetMaintenance.find().lean();
    const totalMaintenanceCount = maintenanceTickets.length;
    const pendingMaintenanceCount = maintenanceTickets.filter((m) => m.status === 'Reported' || m.status === 'Assigned' || m.status === 'In Progress').length;
    const resolvedMaintenanceCount = maintenanceTickets.filter((m) => m.status === 'Repaired').length;
    const totalMaintenanceSpent = maintenanceTickets.reduce((sum, m) => sum + (m.repair_cost || 0), 0);

    // 4. Student Asset Requests
    const allRequests = await AssetRequest.find().lean();
    const pendingRequestsCount = allRequests.filter((r) => r.status === 'Pending').length;
    const approvedRequestsCount = allRequests.filter((r) => r.status === 'Approved' || r.status === 'Allocated').length;

    // 5. Asset Condition Breakdown
    const conditions = {
      Good: allAssets.filter((a) => a.condition === 'Good').length,
      'Needs Repair': allAssets.filter((a) => a.condition === 'Needs Repair').length,
      Damaged: allAssets.filter((a) => a.condition === 'Damaged').length,
      'Under Maintenance': allAssets.filter((a) => a.condition === 'Under Maintenance').length,
      'Beyond Repair': allAssets.filter((a) => a.condition === 'Beyond Repair').length,
    };

    // 6. Category Distribution (Live from DB)
    const categoriesMap = {};
    allAssets.forEach((a) => {
      const cat = a.category || 'Uncategorized';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoriesMap).map(([name, count]) => ({
      category: name,
      name,
      count,
      pct: totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0,
    }));

    // 7. Dynamic Block Distribution (Live from DB)
    const blockCounts = {};
    allAssets.forEach((a) => {
      const b = a.block || 'Admin Block';
      blockCounts[b] = (blockCounts[b] || 0) + 1;
    });

    const blockColors = {
      'Block A': '#7c3aed',
      'Block B': '#06b6d4',
      'Block C': '#10b981',
      'Block D': '#ec4899',
      'Admin Block': '#f59e0b',
      'Service Block': '#6366f1',
    };

    const blockDistribution = Object.entries(blockCounts).map(([name, count]) => {
      const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0;
      return {
        name,
        count,
        pct,
        color: blockColors[name] || '#3b82f6',
      };
    });

    // 8. Audits summary
    const allAudits = await AssetAudit.find().lean();
    const totalAuditsCompleted = allAudits.length;
    const auditsWithDiscrepancies = allAudits.filter((a) => a.missing_count > 0).length;

    // 9. Disposals summary
    const allDisposals = await AssetDisposal.find().lean();
    const totalSalvageRecovered = allDisposals.reduce((sum, d) => sum + (d.salvage_value || 0), 0);

    res.json({
      success: true,
      // Core Asset KPIs
      totalAssets,
      assignedAssets,
      availableAssets,
      underMaintenanceAssets,
      missingAssets,
      disposedAssets,

      // Financials
      totalPurchaseValuation,
      currentDepreciatedValuation,
      totalDepreciation,
      totalMaintenanceSpent,
      totalSalvageRecovered,

      // Operational Status
      totalMaintenanceCount,
      pendingMaintenanceCount,
      resolvedMaintenanceCount,
      pendingRequestsCount,
      approvedRequestsCount,

      // Distributions
      conditions,
      categories: categoriesMap,
      categoryBreakdown,
      blockDistribution,
      blockBreakdown: blockDistribution,

      // Nested metrics structure
      metrics: {
        totalAssets,
        assignedAssets,
        availableAssets,
        underMaintenanceAssets,
        missingAssets,
        disposedAssets,
        totalPurchaseValuation,
        currentDepreciatedValuation,
        totalDepreciation,
        totalMaintenanceSpent,
        totalSalvageRecovered,
      },

      // Audit Status
      totalAuditsCompleted,
      auditsWithDiscrepancies,
    });
  } catch (err) {
    console.error('Analytics aggregation error:', err);
    res.status(500).json({ success: false, message: 'Could not compute analytics overview.', error: err.message });
  }
});

export default router;
