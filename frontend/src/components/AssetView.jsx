import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setPage,
  addAsset,
  updateAsset,
  retireAsset,
  transferAsset,
  recordAudit,
  addAssetMaintenanceRecord,
  addToast,
  addAuditEntry,
  createAssetAsync,
  transferAssetAsync,
  recordAuditAsync,
  retireAssetAsync,
  updateAssetConditionAsync,
  setProfileModalOpen,
} from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';
import EmptyState from './EmptyState';
import { getAssetImage, IMAGES } from '../utils/assetImages';

const CONDITION_COLORS = {
  Good: '#10b981',
  'Needs Repair': '#f59e0b',
  Damaged: '#ef4444',
  'Under Maintenance': '#8b5cf6',
};

const CATEGORIES = [
  'All',
  'Furniture',
  'Electrical',
  'Electronics',
  'Plumbing',
  'Appliances',
  'Study Equipment',
  'Safety Equipment',
];

const BLOCKS = ['All', 'Block A', 'Block B', 'Block C', 'Central Store'];

const condBadge = (c) => {
  const m = {
    Good: 'badge-good',
    'Needs Repair': 'badge-needsrepair',
    Damaged: 'badge-damaged',
    'Under Maintenance': 'badge-undermaintenance',
  };
  return `badge ${m[c] || 'badge-unassigned'}`;
};

const statusBadge = (s) => {
  const m = {
    Assigned: 'badge-resolved',
    'In Store': 'badge-pending',
    Available: 'badge-pending',
    Missing: 'badge-damaged',
    Retired: 'badge-unassigned',
  };
  return `badge ${m[s] || 'badge-unassigned'}`;
};

function exportCSV(data, filename) {
  if (!data.length) return;
  const keys = ['tag', 'name', 'category', 'block', 'room', 'location', 'condition', 'status', 'purchaseCost', 'currentValue', 'warrantyExpiry', 'supplier'];
  const csv = [
    keys.join(','),
    ...data.map((row) =>
      keys.map((k) => `"${(row[k] || '').toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AssetView({ page, isMobile }) {
  const dispatch = useDispatch();
  const { assets = [], transfers = [], audits = [], currentUser } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('registry'); // 'registry' | 'rooms' | 'stock' | 'transfers' | 'audit' | 'procurement'
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [condFilter, setCondFilter] = useState('All');
  const [blockFilter, setBlockFilter] = useState('All');

  // Modals
  const [selectedAssetTag, setSelectedAssetTag] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAuditRunner, setShowAuditRunner] = useState(false);

  // Form States
  const [newAsset, setNewAsset] = useState({
    tag: `HST-BLK-A-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    category: 'Furniture',
    block: 'Block A',
    floor: 'Floor 1',
    room: '101',
    condition: 'Good',
    status: 'Assigned',
    purchaseCost: 3500,
    warrantyExpiry: '2027-12-31',
    supplier: 'Apex Institutional Furnishings',
  });

  const [transferForm, setTransferForm] = useState({
    tag: assets[0]?.tag || '',
    toBlock: 'Block B',
    toFloor: 'Floor 2',
    toRoom: '205',
    reason: 'Room rearrangement',
  });

  // Audit State
  const [auditBlock, setAuditBlock] = useState('Block A');
  const [auditRoom, setAuditRoom] = useState('204');
  const [scannedTags, setScannedTags] = useState([]);
  const [auditSubmitted, setAuditSubmitted] = useState(false);

  const selectedAsset = useMemo(
    () => assets.find((a) => a.tag === selectedAssetTag) || null,
    [assets, selectedAssetTag]
  );

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    const term = search.toLowerCase();
    return assets.filter((a) => {
      const matchCat = catFilter === 'All' || a.category === catFilter;
      const matchCond = condFilter === 'All' || a.condition === condFilter;
      const matchBlock = blockFilter === 'All' || a.block === blockFilter || (a.location && a.location.includes(blockFilter));
      const matchSearch =
        a.name.toLowerCase().includes(term) ||
        a.tag.toLowerCase().includes(term) ||
        (a.location && a.location.toLowerCase().includes(term)) ||
        (a.assignedStudent && a.assignedStudent.name.toLowerCase().includes(term));
      return matchCat && matchCond && matchBlock && matchSearch;
    });
  }, [assets, search, catFilter, condFilter, blockFilter]);

  // Stock Summary & Reorder Thresholds
  const stockSummary = useMemo(() => {
    const cats = ['Furniture', 'Electrical', 'Electronics', 'Plumbing', 'Appliances', 'Study Equipment'];
    const summary = cats.map((cat) => {
      const items = assets.filter((a) => a.category === cat);
      const inStore = items.filter((a) => a.status === 'In Store' || a.status === 'Available').length;
      const assigned = items.filter((a) => a.status === 'Assigned').length;
      const damaged = items.filter((a) => a.condition === 'Damaged' || a.condition === 'Needs Repair').length;
      const missing = items.filter((a) => a.status === 'Missing').length;
      const minRequired = 5;
      const needsReorder = inStore < minRequired;
      return {
        category: cat,
        total: items.length,
        inStore,
        assigned,
        damaged,
        missing,
        minRequired,
        needsReorder,
      };
    });
    return summary;
  }, [assets]);

  // Depreciation Calculation
  const financialSummary = useMemo(() => {
    let totalPurchase = 0;
    let totalCurrent = 0;
    assets.forEach((a) => {
      const cost = Number(a.purchaseCost || a.value || 0);
      const curr = Number(a.currentValue || cost * 0.85);
      totalPurchase += cost;
      totalCurrent += curr;
    });
    return {
      totalPurchase,
      totalCurrent,
      totalDepreciation: totalPurchase - totalCurrent,
    };
  }, [assets]);

  // Handlers
  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!newAsset.name.trim()) return;
    const pCost = Number(newAsset.purchaseCost) || 0;
    const assetPayload = {
      ...newAsset,
      purchaseCost: pCost,
      currentValue: pCost,
      location: `${newAsset.block} - Room ${newAsset.room}`,
      lastChecked: 'Today',
      maintenanceHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          action: 'Asset registered in system',
          actor: currentUser.name || 'Asset Manager',
          cost: pCost,
          color: 'var(--accent-green)',
        },
      ],
    };

    dispatch(addAsset(assetPayload));
    dispatch(
      addToast({
        id: `toast-${Date.now()}`,
        message: `Asset ${assetPayload.tag} registered successfully!`,
        type: 'success',
      })
    );
    setShowAddModal(false);
    setNewAsset({
      tag: `HST-BLK-A-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Furniture',
      block: 'Block A',
      floor: 'Floor 1',
      room: '101',
      condition: 'Good',
      status: 'Assigned',
      purchaseCost: 3500,
      warrantyExpiry: '2027-12-31',
      supplier: 'Apex Institutional Furnishings',
    });

    try {
      await dispatch(createAssetAsync(assetPayload)).unwrap();
    } catch (_) {}
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const asset = assets.find((a) => a.tag === transferForm.tag);
    if (!asset) return;

    const payload = {
      tag: transferForm.tag,
      toBlock: transferForm.toBlock,
      toFloor: transferForm.toFloor,
      toRoom: transferForm.toRoom,
      reason: transferForm.reason,
      transferredBy: currentUser.name || 'Warden',
      date: new Date().toISOString().split('T')[0],
    };

    dispatch(transferAsset(payload));
    dispatch(
      addToast({
        id: `toast-${Date.now()}`,
        message: `Transferred ${payload.tag} to ${payload.toBlock} - Room ${payload.toRoom}`,
        type: 'success',
      })
    );
    setShowTransferModal(false);

    try {
      await dispatch(transferAssetAsync(payload)).unwrap();
    } catch (_) {}
  };

  const handleRetire = async (tag) => {
    if (window.confirm(`Are you sure you want to retire asset ${tag} from service?`)) {
      dispatch(retireAsset(tag));
      dispatch(
        addToast({
          id: `toast-${Date.now()}`,
          message: `Asset ${tag} marked as Retired.`,
          type: 'info',
        })
      );
      if (selectedAssetTag === tag) setSelectedAssetTag(null);
      try {
        await dispatch(retireAssetAsync(tag)).unwrap();
      } catch (_) {}
    }
  };

  // Run Room Audit
  const roomExpectedAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        (a.block === auditBlock || (a.location && a.location.includes(auditBlock))) &&
        (a.room === auditRoom || (a.location && a.location.includes(`Room ${auditRoom}`)))
    );
  }, [assets, auditBlock, auditRoom]);

  const toggleScanTag = (tag) => {
    setScannedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submitAuditReport = () => {
    const expected = roomExpectedAssets.map((a) => a.tag);
    const missing = expected.filter((t) => !scannedTags.includes(t));
    const auditPayload = {
      auditId: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      block: auditBlock,
      room: auditRoom,
      auditor: currentUser.name || 'Dr. Meena Sharma',
      date: new Date().toISOString().split('T')[0],
      expectedCount: expected.length,
      scannedCount: scannedTags.length,
      missingCount: missing.length,
      missingTags: missing,
      status: missing.length === 0 ? 'Verified 100%' : 'Discrepancy Found',
    };

    dispatch(recordAudit(auditPayload));
    setAuditSubmitted(true);
    dispatch(
      addToast({
        id: `toast-${Date.now()}`,
        message:
          missing.length === 0
            ? 'Audit complete: 100% assets accounted for!'
            : `Audit recorded: ${missing.length} missing asset(s) flagged!`,
        type: missing.length === 0 ? 'success' : 'warn',
      })
    );
  };

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: '0 0 32px 0', animation: 'fadeIn 0.25s ease' }}>
      {/* Top Title Bar */}
      <div className="desktop-topbar">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📦</span>
            <span>Hostel Asset Operations ERP</span>
          </h2>
          <div className="page-subtitle">
            Physical lifecycle management, room allocations, QR telemetry, and audit discrepancies
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filteredAssets, 'hostel_assets_inventory.csv')}>
            📥 Export CSV
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowTransferModal(true)}>
            🔄 Transfer Asset
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Register Asset
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12,
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'registry', icon: '📋', label: 'Asset Registry' },
          { id: 'rooms', icon: '🏢', label: 'Room & Block Hierarchy' },
          { id: 'stock', icon: '📊', label: 'Inventory & Reorder Levels' },
          { id: 'transfers', icon: '🔄', label: `Transfers (${transfers.length})` },
          { id: 'audit', icon: '🔐', label: 'Physical QR Audit' },
          { id: 'procurement', icon: '💰', label: 'Depreciation & Suppliers' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--radius-md)', padding: '6px 14px', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════ TAB 1: ASSET REGISTRY ════════════════════ */}
      {activeTab === 'registry' && (
        <>
          {/* KPI Summary Cards */}
          <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
            <div className="kpi-card" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
              <div className="kpi-label">Total Assets</div>
              <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>{assets.length}</div>
              <div className="kpi-sub">Registered physical units</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '3px solid #10b981' }}>
              <div className="kpi-label">Good Condition</div>
              <div className="kpi-value" style={{ color: '#10b981' }}>
                {assets.filter((a) => a.condition === 'Good').length}
              </div>
              <div className="kpi-sub">Optimal working state</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '3px solid #f59e0b' }}>
              <div className="kpi-label">Needs Repair</div>
              <div className="kpi-value" style={{ color: '#f59e0b' }}>
                {assets.filter((a) => a.condition === 'Needs Repair').length}
              </div>
              <div className="kpi-sub">Maintenance queued</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '3px solid #ef4444' }}>
              <div className="kpi-label">Damaged / Missing</div>
              <div className="kpi-value" style={{ color: '#ef4444' }}>
                {assets.filter((a) => a.condition === 'Damaged' || a.status === 'Missing').length}
              </div>
              <div className="kpi-sub">Action required</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              className="search-bar"
              style={{ width: 280 }}
              placeholder="🔍 Search name, QR ID, student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-select" style={{ width: 150 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select className="form-select" style={{ width: 140 }} value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)}>
              {BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select className="form-select" style={{ width: 160 }} value={condFilter} onChange={(e) => setCondFilter(e.target.value)}>
              <option value="All">All Conditions</option>
              <option value="Good">Good</option>
              <option value="Needs Repair">Needs Repair</option>
              <option value="Damaged">Damaged</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* Asset Data Table */}
          {filteredAssets.length === 0 ? (
            <EmptyState icon="📦" title="No assets match query" subtitle="Try clearing your search or filters." />
          ) : (
            <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>QR Tag ID</th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Location / Room</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Assigned Resident</th>
                    <th>Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((a, idx) => (
                    <tr
                      key={a.tag}
                      style={{ cursor: 'pointer', animation: `slideIn 0.2s ease both`, animationDelay: `${idx * 20}ms` }}
                      onClick={() => setSelectedAssetTag(a.tag)}
                    >
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--accent-cyan)',
                            background: 'rgba(6,182,212,0.1)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: '1px solid rgba(6,182,212,0.2)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>📱</span> {a.tag}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={getAssetImage(a.name, a.category)} alt={a.name} className="table-asset-thumb" />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{a.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.supplier || 'Standard Supply'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{a.category}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {a.location || `${a.block} - Room ${a.room}`}
                        </span>
                      </td>
                      <td>
                        <span className={condBadge(a.condition)}>{a.condition}</span>
                      </td>
                      <td>
                        <span className={statusBadge(a.status)}>{a.status}</span>
                      </td>
                      <td>
                        {a.assignedStudent?.name ? (
                          <div style={{ fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.assignedStudent.name}</span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>
                              Roll: {a.assignedStudent.roll}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— Unassigned —</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{(a.purchaseCost || a.value || 0).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Inspect QR Code & Full History"
                            onClick={() => setSelectedAssetTag(a.tag)}
                          >
                            🔍 Scan
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Retire Asset"
                            style={{ color: '#ef4444' }}
                            onClick={() => handleRetire(a.tag)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ════════════════════ TAB 2: ROOM & BLOCK HIERARCHY ════════════════════ */}
      {activeTab === 'rooms' && (
        <div>
          {/* Spatial Mapping Photo Banner with Frosted Glassmorphism */}
          <div className="room-photo-banner" style={{ height: 160 }}>
            <img src={IMAGES.ROOM_INTERIOR} alt="Hostel Rooms" />
            <div className="room-photo-banner-overlay">
              <div className="room-photo-badge">Live Room Hardware Allocation</div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
                Spatial Room & Living Area Containers
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                Hierarchical asset containment across Block A, Block B, Floor levels, and Resident Suites
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {['Block A - Room 204', 'Block A - Room 102', 'Block B - Room 112', 'Block C - Room 208', 'Central Store - Floor 1'].map((loc) => {
              const roomAssets = assets.filter((a) => a.location === loc || (a.block && loc.includes(a.block) && loc.includes(a.room)));
              return (
                <div
                  key={loc}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 16,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      🏢 {loc}
                    </h4>
                    <span className="badge badge-resolved">{roomAssets.length} Assets</span>
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Assigned Resident:{' '}
                    <strong style={{ color: 'var(--accent-cyan)' }}>
                      {roomAssets.find((a) => a.assignedStudent?.name)?.assignedStudent?.name || 'Store Stock / Unassigned'}
                    </strong>
                  </div>

                  {/* Asset list pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {roomAssets.map((a) => (
                      <div
                        key={a.tag}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedAssetTag(a.tag)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src={getAssetImage(a.name, a.category)} alt={a.name} className="table-asset-thumb" style={{ width: 28, height: 28 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div>
                            <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{a.tag}</div>
                          </div>
                        </div>
                        <span className={condBadge(a.condition)} style={{ fontSize: 10 }}>
                          {a.condition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 3: INVENTORY & STOCK LEVELS ════════════════════ */}
      {activeTab === 'stock' && (
        <div>
          {/* Reorder Alerts */}
          {stockSummary.filter((s) => s.needsReorder).length > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span style={{ fontSize: 28 }}>⚠️</span>
              <div>
                <h4 style={{ margin: 0, color: '#f59e0b', fontSize: 14, fontWeight: 700 }}>
                  Minimum Stock Threshold Alert
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  The following categories have dropped below the minimum reserve threshold of 5 units in the Central Store.
                  Immediate procurement reordering is recommended.
                </p>
              </div>
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Category</th>
                <th>Total In Hostel</th>
                <th>Assigned to Rooms</th>
                <th>Available in Store</th>
                <th>Damaged / Repair</th>
                <th>Missing</th>
                <th>Stock Health</th>
              </tr>
            </thead>
            <tbody>
              {stockSummary.map((s) => (
                <tr key={s.category}>
                  <td style={{ fontWeight: 700, fontSize: 13 }}>{s.category}</td>
                  <td>{s.total}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{s.assigned}</td>
                  <td>
                    <strong style={{ color: s.needsReorder ? '#f59e0b' : 'var(--accent-cyan)' }}>
                      {s.inStore}
                    </strong>{' '}
                    / min {s.minRequired}
                  </td>
                  <td style={{ color: s.damaged > 0 ? '#ef4444' : 'var(--text-muted)' }}>{s.damaged}</td>
                  <td style={{ color: s.missing > 0 ? '#ef4444' : 'var(--text-muted)' }}>{s.missing}</td>
                  <td>
                    {s.needsReorder ? (
                      <span className="badge badge-needsrepair">⚠️ Reorder Required</span>
                    ) : (
                      <span className="badge badge-resolved">✓ Healthy</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════ TAB 4: TRANSFERS & MOVEMENTS ════════════════════ */}
      {activeTab === 'transfers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="section-title">Asset Movement & Custody Chain</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Audit trail of assets moved between rooms, blocks, or store facilities.
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTransferModal(true)}>
              + Initiate Movement
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Transfer ID</th>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>From Location</th>
                <th>To Location</th>
                <th>Transferred By</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.id}</code></td>
                  <td><code style={{ color: 'var(--accent-cyan)' }}>{t.assetTag}</code></td>
                  <td style={{ fontWeight: 600 }}>{t.assetName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.from}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{t.to}</td>
                  <td>{t.transferredBy}</td>
                  <td style={{ fontSize: 12 }}>{t.reason}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════ TAB 5: PHYSICAL QR AUDIT ════════════════════ */}
      {activeTab === 'audit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          {/* Audit Configuration */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700 }}>🔐 Walkthrough Room Audit</h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Select a room to compare system records against physical assets present.
            </p>

            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Hostel Block</label>
              <select className="form-select" value={auditBlock} onChange={(e) => { setAuditBlock(e.target.value); setAuditSubmitted(false); setScannedTags([]); }}>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Room Number</label>
              <select className="form-select" value={auditRoom} onChange={(e) => { setAuditRoom(e.target.value); setAuditSubmitted(false); setScannedTags([]); }}>
                <option value="204">Room 204</option>
                <option value="102">Room 102</option>
                <option value="112">Room 112</option>
                <option value="208">Room 208</option>
              </select>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-glass)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expected Assets: {roomExpectedAssets.length}</div>
              <div style={{ fontSize: 11, color: '#10b981' }}>Scanned/Verified: {scannedTags.length}</div>
              <div style={{ fontSize: 11, color: '#ef4444' }}>
                Unchecked / Missing: {Math.max(0, roomExpectedAssets.length - scannedTags.length)}
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              disabled={roomExpectedAssets.length === 0}
              onClick={submitAuditReport}
            >
              ✓ Complete & Save Audit
            </button>
          </div>

          {/* Audit Verification List */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                Inspection Checklist: {auditBlock} — Room {auditRoom}
              </h4>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setScannedTags(roomExpectedAssets.map((a) => a.tag))}
              >
                Scan All in Room
              </button>
            </div>

            {roomExpectedAssets.length === 0 ? (
              <EmptyState icon="🔍" title="No assets mapped to this room" subtitle="Select a different block or room number." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roomExpectedAssets.map((a) => {
                  const isChecked = scannedTags.includes(a.tag);
                  return (
                    <div
                      key={a.tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 14,
                        background: isChecked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${isChecked ? 'rgba(16,185,129,0.35)' : 'var(--border-subtle)'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => toggleScanTag(a.tag)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{a.name}</div>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                            {a.tag} • Condition: {a.condition}
                          </div>
                        </div>
                      </div>
                      <span className={isChecked ? 'badge badge-resolved' : 'badge badge-pending'}>
                        {isChecked ? '✓ Scanned' : 'Unchecked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Audit History Log */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <h5 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Past Room Audits</h5>
              {audits.map((aud) => (
                <div
                  key={aud.auditId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span>
                    <strong>{aud.auditId}</strong> — {aud.block} Room {aud.room} ({aud.auditor})
                  </span>
                  <span style={{ color: aud.missingCount > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    {aud.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ TAB 6: PROCUREMENT & DEPRECIATION ════════════════════ */}
      {activeTab === 'procurement' && (
        <div>
          {/* Financial Cards */}
          <div className="kpi-row" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 20 }}>
            <div className="kpi-card" style={{ borderTop: '3px solid var(--accent-cyan)' }}>
              <div className="kpi-label">Gross Procurement Cost</div>
              <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>
                ₹{financialSummary.totalPurchase.toLocaleString()}
              </div>
              <div className="kpi-sub">Total capital investment</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '3px solid #10b981' }}>
              <div className="kpi-label">Current Depreciated Value</div>
              <div className="kpi-value" style={{ color: '#10b981' }}>
                ₹{financialSummary.totalCurrent.toLocaleString()}
              </div>
              <div className="kpi-sub">Straight-line depreciation balance</div>
            </div>
            <div className="kpi-card" style={{ borderTop: '3px solid #f59e0b' }}>
              <div className="kpi-label">Accumulated Depreciation</div>
              <div className="kpi-value" style={{ color: '#f59e0b' }}>
                ₹{financialSummary.totalDepreciation.toLocaleString()}
              </div>
              <div className="kpi-sub">Value written off over time</div>
            </div>
          </div>

          <div className="section-title">Institutional Suppliers & Warranty Tracker</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Supplier</th>
                <th>Purchase Cost</th>
                <th>Current Value</th>
                <th>Depreciation</th>
                <th>Warranty Expiry</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const cost = a.purchaseCost || a.value || 0;
                const curr = a.currentValue || cost * 0.85;
                return (
                  <tr key={a.tag}>
                    <td><code>{a.tag}</code></td>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td>{a.supplier || 'Apex Furnishings'}</td>
                    <td>₹{cost.toLocaleString()}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>₹{Math.round(curr).toLocaleString()}</td>
                    <td style={{ color: 'var(--text-muted)' }}>-₹{Math.round(cost - curr).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-unassigned" style={{ fontSize: 11 }}>
                        📅 {a.warrantyExpiry || '2027-12-31'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ════════════════════ MODAL: QR TELEMETRY & SPEC SHEET ════════════════════ */}
      {selectedAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setSelectedAssetTag(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 560,
              width: '100%',
              padding: 24,
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              animation: 'scaleUp 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🏷️</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedAsset.name}</h3>
                  <code style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>{selectedAsset.tag}</code>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedAssetTag(null)}>
                ✕
              </button>
            </div>

            {/* QR Sticker Viewfinder with Hardware Asset Photograph */}
            <div
              style={{
                background: '#ffffff',
                color: '#111827',
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                border: '2px dashed #9ca3af',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              }}
            >
              {/* Product Photo Thumbnail */}
              <div style={{ width: 84, height: 84, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid #d1d5db', background: '#f3f4f6' }}>
                <img
                  src={getAssetImage(selectedAsset.name, selectedAsset.category)}
                  alt={selectedAsset.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Stylized QR Tag Code */}
              <div
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  padding: 6,
                  borderRadius: 8,
                  fontFamily: 'monospace',
                  fontSize: 7.5,
                  lineHeight: 1.1,
                  textAlign: 'center',
                  letterSpacing: 1,
                  width: 84,
                  height: 84,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div>███████ ██</div>
                <div>█ ▄▄▄ █ ▄█</div>
                <div>█ ███ █ █ </div>
                <div>███████ ▄█</div>
                <div>▄▄▄▄▄ ▄▄▄ </div>
                <div>███████ █ </div>
                <div>█ ▄▄▄ █ ▄▄</div>
                <div style={{ fontSize: 6, marginTop: 3, color: '#00ffff' }}>{selectedAsset.tag}</div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  HOSTEL PROPERTY TAG
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', margin: '2px 0' }}>Location: <strong>{selectedAsset.location}</strong></div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Category: {selectedAsset.category}</div>
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                  Assigned: {selectedAsset.assignedStudent?.name || 'Available / In Store'}
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 12 }}>
              <div style={{ background: 'var(--bg-glass)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Condition:</span>
                <span className={condBadge(selectedAsset.condition)} style={{ marginLeft: 8 }}>
                  {selectedAsset.condition}
                </span>
              </div>
              <div style={{ background: 'var(--bg-glass)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className={statusBadge(selectedAsset.status)} style={{ marginLeft: 8 }}>
                  {selectedAsset.status}
                </span>
              </div>
              <div style={{ background: 'var(--bg-glass)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Purchase Cost:</span>
                <strong style={{ marginLeft: 8 }}>₹{(selectedAsset.purchaseCost || selectedAsset.value || 0).toLocaleString()}</strong>
              </div>
              <div style={{ background: 'var(--bg-glass)', padding: 10, borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Warranty Till:</span>
                <strong style={{ marginLeft: 8 }}>{selectedAsset.warrantyExpiry || '2027-12-31'}</strong>
              </div>
            </div>

            {/* Maintenance History */}
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Maintenance & Movement Trail</h5>
              <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(selectedAsset.maintenanceHistory || []).map((m, i) => (
                  <div key={i} style={{ fontSize: 11, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6 }}>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{m.date}:</span> {m.action} (by {m.actor})
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedAssetTag(null)}>
                Close
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Print Barcode Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ MODAL: REGISTER NEW ASSET ════════════════════ */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 520,
              width: '100%',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: 18, fontWeight: 800 }}>📦 Register New Asset</h3>
            <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Asset Tag ID</label>
                  <input
                    className="form-input"
                    value={newAsset.tag}
                    onChange={(e) => setNewAsset({ ...newAsset, tag: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Asset Name / Description</label>
                <input
                  className="form-input"
                  placeholder="e.g. Ergonomic Study Desk with Bookshelf"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Block</label>
                  <select
                    className="form-select"
                    value={newAsset.block}
                    onChange={(e) => setNewAsset({ ...newAsset, block: e.target.value })}
                  >
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                    <option value="Central Store">Central Store</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Floor</label>
                  <input
                    className="form-input"
                    value={newAsset.floor}
                    onChange={(e) => setNewAsset({ ...newAsset, floor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Room</label>
                  <input
                    className="form-input"
                    value={newAsset.room}
                    onChange={(e) => setNewAsset({ ...newAsset, room: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newAsset.purchaseCost}
                    onChange={(e) => setNewAsset({ ...newAsset, purchaseCost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Supplier</label>
                  <input
                    className="form-input"
                    value={newAsset.supplier}
                    onChange={(e) => setNewAsset({ ...newAsset, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════ MODAL: TRANSFER ASSET ════════════════════ */}
      {showTransferModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setShowTransferModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: 480,
              width: '100%',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 14px 0', fontSize: 18, fontWeight: 800 }}>🔄 Transfer Asset Location</h3>
            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Select Asset to Transfer</label>
                <select
                  className="form-select"
                  value={transferForm.tag}
                  onChange={(e) => setTransferForm({ ...transferForm, tag: e.target.value })}
                >
                  {assets.map((a) => (
                    <option key={a.tag} value={a.tag}>
                      {a.name} ({a.tag}) — Currently at {a.location}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Destination Block</label>
                  <select
                    className="form-select"
                    value={transferForm.toBlock}
                    onChange={(e) => setTransferForm({ ...transferForm, toBlock: e.target.value })}
                  >
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                    <option value="Central Store">Central Store</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Destination Room</label>
                  <input
                    className="form-input"
                    value={transferForm.toRoom}
                    onChange={(e) => setTransferForm({ ...transferForm, toRoom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Transfer Reason</label>
                <input
                  className="form-input"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="e.g. Student room reallocation"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
