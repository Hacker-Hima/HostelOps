import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveTab,
  setSelectedAssetTag,
  setQrPreviewTag,
  setNewAssetModalOpen,
  setAllocateModalOpen,
  setTransferModalOpen,
  setReturnModalOpen,
  setMaintenanceModalOpen,
  setDisposalModalOpen,
  setAuditModalOpen,
  setQrScannerModalOpen,
  deleteAssetAsync,
  addToast,
  reviewAssetRequestAsync,
  updateMaintenanceAsync,
} from '../redux/ticketSlice';

export default function AdminDashboard({ isMobile }) {
  const dispatch = useDispatch();
  const {
    currentUser,
    adminType,
    activeTab,
    assets,
    categories,
    maintenanceTickets,
    transfers,
    audits,
    disposals,
    assetRequests,
    reportsSummary,
    workers,
    auditLogs,
    usersList,
  } = useSelector((s) => s.ticketStore);

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedCond, setSelectedCond] = useState('All');
  const [selectedStat, setSelectedStat] = useState('All');
  const [selectedBlk, setSelectedBlk] = useState('All');
  const [selectedAuditRoom, setSelectedAuditRoom] = useState('204');
  const [selectedAuditBlock, setSelectedAuditBlock] = useState('Block A');
  const [auditScannedTags, setAuditScannedTags] = useState([]);
  const [maintenanceFilter, setMaintenanceFilter] = useState('All');

  // Calculate high-level KPIs
  const totalValuation = useMemo(
    () => assets.reduce((sum, a) => sum + (a.purchaseCost || a.purchase_cost || 0), 0),
    [assets]
  );
  const currentValuation = useMemo(
    () => assets.reduce((sum, a) => sum + (a.currentValue || a.current_value || (a.purchaseCost || 0) * 0.9), 0),
    [assets]
  );
  const damagedCount = useMemo(
    () => assets.filter((a) => a.condition === 'Damaged' || a.condition === 'Needs Repair' || a.condition === 'Beyond Repair').length,
    [assets]
  );
  const missingCount = useMemo(
    () => assets.filter((a) => a.status === 'Missing').length,
    [assets]
  );
  const inStoreCount = useMemo(
    () => assets.filter((a) => a.status === 'In Store' || a.status === 'Available').length,
    [assets]
  );
  const totalMaintenanceSpent = useMemo(
    () => maintenanceTickets.reduce((sum, m) => sum + (m.repair_cost || 0), 0),
    [maintenanceTickets]
  );

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchCat = selectedCat === 'All' || a.category === selectedCat;
      const matchCond = selectedCond === 'All' || a.condition === selectedCond;
      const matchStat = selectedStat === 'All' || a.status === selectedStat;
      const matchBlk = selectedBlk === 'All' || a.block === selectedBlk;
      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        a.name?.toLowerCase().includes(term) ||
        a.tag?.toLowerCase().includes(term) ||
        a.location?.toLowerCase().includes(term) ||
        a.assignedStudent?.name?.toLowerCase().includes(term) ||
        a.assigned_student_name?.toLowerCase().includes(term);
      return matchCat && matchCond && matchStat && matchBlk && matchSearch;
    });
  }, [assets, selectedCat, selectedCond, selectedStat, selectedBlk, search]);

  // Recently Accessed Items (tracked across actions)
  const [recentlyAccessed, setRecentlyAccessed] = useState(() => {
    try {
      const saved = localStorage.getItem('hostelops_recent_admin');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'AST-FUR-101', type: 'asset', icon: '🪑', title: 'AST-FUR-101', subtitle: 'Study Desk' },
      { id: 'AST-APP-304', type: 'asset', icon: '❄️', title: 'AST-APP-304', subtitle: 'Voltas 1.5T AC' },
      { id: 'TKT-802', type: 'maintenance', icon: '⚡', title: 'TKT-802', subtitle: 'Geyser Sparking' },
      { id: 'AST-FUR-201', type: 'asset', icon: '🚪', title: 'AST-FUR-201', subtitle: 'Godrej Almirah' },
      { id: 'AST-NET-501', type: 'asset', icon: '📡', title: 'AST-NET-501', subtitle: 'Cisco Switch' },
    ];
  });

  const recordAccess = useCallback((item) => {
    setRecentlyAccessed((prev) => {
      const filtered = prev.filter((p) => p.id !== item.id);
      const updated = [item, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('hostelops_recent_admin', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleRecentClick = (item) => {
    if (item.type === 'asset') {
      dispatch(setSelectedAssetTag(item.id));
      dispatch(setQrPreviewTag(item.id));
    } else if (item.type === 'maintenance') {
      dispatch(setActiveTab('maintenance'));
    }
  };

  const tabs = [
    { id: 'register', label: 'Asset Register', icon: '🗂️', count: assets.length },
    { id: 'categories', label: 'Categories', icon: '🏷️', count: categories.length },
    { id: 'allocation', label: 'Allocation', icon: '📍', count: assets.filter((a) => a.status === 'Assigned').length },
    { id: 'transfers', label: 'Return & Transfer', icon: '🔄', count: transfers.length },
    { id: 'maintenance', label: 'Maintenance', icon: '🛠️', count: maintenanceTickets.filter((m) => m.status !== 'Repaired').length },
    { id: 'history', label: 'Asset History', icon: '📜', count: auditLogs.length },
    { id: 'audit', label: 'Inventory Audit', icon: '🔍', count: audits.length },
    { id: 'disposal', label: 'Disposal', icon: '♻️', count: disposals.length },
    { id: 'requests', label: 'Asset Requests', icon: '📥', count: assetRequests.filter((r) => r.status === 'Pending').length },
    { id: 'reports', label: 'Reports & Analytics', icon: '📊' },
    ...(adminType === 'superadmin' ? [{ id: 'users', label: 'User Manager', icon: '👥', count: usersList.length }] : []),
  ];

  const handleExportCSV = () => {
    const headers = 'Asset Tag,Asset Name,Category,Location,Condition,Status,Purchase Cost,Current Value,Assigned To\n';
    const rows = assets
      .map(
        (a) =>
          `"${a.tag}","${a.name}","${a.category}","${a.location}","${a.condition}","${a.status}",${a.purchaseCost || a.purchase_cost || 0},${a.currentValue || a.current_value || 0},"${a.assignedStudent?.name || a.assigned_student_name || 'None'}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hostel_Asset_Register_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    dispatch(addToast({ id: `csv-${Date.now()}`, message: 'Asset Register CSV exported successfully!', type: 'success' }));
  };

  return (
    <div style={{ padding: '14px 18px', maxWidth: '1440px', width: '100%', marginInline: 'auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Top Identity & Role Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '14px 18px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: adminType === 'superadmin' ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
            }}
          >
            {adminType === 'superadmin' ? '👑' : '🛡️'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {currentUser?.name || 'Administrator'}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 9px',
                  borderRadius: '50px',
                  background: adminType === 'superadmin' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                  color: adminType === 'superadmin' ? '#ef4444' : '#0284c7',
                  border: `1px solid ${adminType === 'superadmin' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(2, 132, 199, 0.25)'}`,
                }}
              >
                {adminType === 'superadmin' ? 'Super Administrator' : 'Asset Logistics Admin'}
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {adminType === 'superadmin'
                ? 'Full System Authority • User Management • Asset Lifecycle Governance'
                : 'Asset Logistics • Allocation • Maintenance & Verification Controls'}
            </div>
          </div>
        </div>

        {/* Action Quick Launchers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => dispatch(setQrScannerModalOpen(true))}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📷</span>
            <span>QR Scanner</span>
          </button>

          <button
            onClick={() => dispatch(setNewAssetModalOpen(true))}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)',
            }}
          >
            <span>➕</span>
            <span>Register Asset</span>
          </button>

          <button
            onClick={() => dispatch(setAllocateModalOpen(true))}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              color: '#0284c7',
              fontWeight: 700,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📍</span>
            <span>Allocate</span>
          </button>

          <button
            onClick={() => dispatch(setReturnModalOpen(true))}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#d97706',
              fontWeight: 700,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📥</span>
            <span>Check-in Return</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Compact, Fits in 1 Row) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Assets</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{assets.length}</div>
          <div style={{ fontSize: '10.5px', color: '#10b981', marginTop: '2px' }}>{categories.length} Categories</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Purchase Value</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>₹{totalValuation.toLocaleString()}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Original Invoiced</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Current Worth</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>₹{currentValuation.toLocaleString()}</div>
          <div style={{ fontSize: '10.5px', color: '#f59e0b', marginTop: '2px' }}>₹{(totalValuation - currentValuation).toLocaleString()} Deprec.</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>In Store</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0ea5e9', marginTop: '4px' }}>{inStoreCount}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Ready to Allocate</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Damaged/Repairs</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: damagedCount > 0 ? '#f59e0b' : '#10b981', marginTop: '4px' }}>{damagedCount}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>₹{totalMaintenanceSpent.toLocaleString()} Spent</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Audit Status</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: missingCount > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>{missingCount}</div>
          <div style={{ fontSize: '10.5px', color: missingCount > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>
            {missingCount > 0 ? 'Discrepancies' : '100% Verified'}
          </div>
        </div>
      </div>

      {/* 🕒 Recently Accessed Quick Access Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          padding: '8px 14px',
          marginBottom: '14px',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          border: '1px solid var(--border-default)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🕒</span>
          <span>Recently Accessed:</span>
        </span>
        {recentlyAccessed.map((item) => (
          <button
            key={item.id}
            onClick={() => handleRecentClick(item)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <span>{item.icon}</span>
            <span>{item.title}</span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', background: 'var(--accent-primary-soft)', padding: '1px 5px', borderRadius: '4px' }}>
              {item.subtitle}
            </span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2-COLUMN WORKSPACE: LEFT VERTICAL NAVIGATION + RIGHT CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <div className="admin-ops-container">
        
        {/* Left Side Vertical Navigation Sidebar */}
        <aside className="admin-ops-sidebar" aria-label="Operations Navigation">
          <div
            style={{
              padding: '6px 8px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px' }}>⚡</span>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Operations Hub
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '999px',
                background: 'var(--accent-primary-soft)',
                color: 'var(--accent-primary)',
              }}
            >
              {tabs.length} Modules
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => dispatch(setActiveTab(tab.id))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: isActive ? 'var(--accent-primary)' : 'transparent',
                    border: `1px solid ${isActive ? 'transparent' : 'transparent'}`,
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.28)' : 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>{tab.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tab.label}
                    </span>
                  </div>

                  {tab.count !== undefined && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '1px 7px',
                        borderRadius: '12px',
                        background: isActive ? 'rgba(255,255,255,0.22)' : 'var(--bg-glass-hover)',
                        color: isActive ? '#ffffff' : 'var(--accent-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Content Area */}
        <main className="admin-ops-main">

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: ASSET REGISTER
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'register' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              background: 'var(--bg-card)',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border-default)',
            }}
          >
            {/* Search Input */}
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search tag, asset, room, or student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 32px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px' }}>
                🔍
              </span>
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer' }}
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>

              <select
                value={selectedCond}
                onChange={(e) => setSelectedCond(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer' }}
              >
                <option value="All">All Conditions</option>
                <option value="Good">🟢 Good</option>
                <option value="Needs Repair">🟡 Needs Repair</option>
                <option value="Damaged">🔴 Damaged</option>
                <option value="Under Maintenance">🔵 Under Maintenance</option>
                <option value="Beyond Repair">⚫ Beyond Repair</option>
              </select>

              <select
                value={selectedStat}
                onChange={(e) => setSelectedStat(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer' }}
              >
                <option value="All">All Statuses</option>
                <option value="Assigned">Assigned</option>
                <option value="In Store">In Store</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Missing">Missing</option>
                <option value="Disposed">Disposed</option>
              </select>

              <select
                value={selectedBlk}
                onChange={(e) => setSelectedBlk(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '11.5px', cursor: 'pointer' }}
              >
                <option value="All">All Blocks</option>
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Admin Block">Admin Block</option>
              </select>

              <button
                onClick={handleExportCSV}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                }}
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Master Asset Table */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-default)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)',
            }}
          >
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Asset Tag & QR</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Asset Name</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Category</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Location / Room</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Condition</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Status</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Invoiced / Current (₹)</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px' }}>Assigned To</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, fontSize: '11.5px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const cost = asset.purchaseCost || asset.purchase_cost || 0;
                    const val = asset.currentValue || asset.current_value || cost * 0.9;
                    const student = asset.assignedStudent?.name || asset.assigned_student_name;
                    return (
                      <tr
                        key={asset.tag}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          transition: 'background 0.12s',
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => dispatch(setQrPreviewTag(asset.tag))}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: 'rgba(2, 132, 199, 0.08)',
                                border: '1px solid rgba(2, 132, 199, 0.2)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                              }}
                              title="View & Print QR Code"
                            >
                              📱
                            </button>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{asset.tag}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                            {categories.find((c) => c.name === asset.category)?.icon || '📦'} {asset.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{asset.location}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background:
                                asset.condition === 'Good'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : asset.condition === 'Needs Repair'
                                  ? 'rgba(245, 158, 11, 0.12)'
                                  : asset.condition === 'Beyond Repair'
                                  ? 'rgba(0, 0, 0, 0.15)'
                                  : 'rgba(239, 68, 68, 0.12)',
                              color:
                                asset.condition === 'Good'
                                  ? '#10b981'
                                  : asset.condition === 'Needs Repair'
                                  ? '#d97706'
                                  : asset.condition === 'Beyond Repair'
                                  ? '#64748b'
                                  : '#ef4444',
                            }}
                          >
                            {asset.condition}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background:
                                asset.status === 'Assigned'
                                  ? 'rgba(2, 132, 199, 0.12)'
                                  : asset.status === 'In Store'
                                  ? 'rgba(14, 165, 233, 0.12)'
                                  : asset.status === 'Missing'
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(100, 116, 139, 0.12)',
                              color:
                                asset.status === 'Assigned'
                                  ? '#0284c7'
                                  : asset.status === 'In Store'
                                  ? '#0284c7'
                                  : asset.status === 'Missing'
                                  ? '#ef4444'
                                  : '#64748b',
                            }}
                          >
                            {asset.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{Math.round(val).toLocaleString()}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Orig: ₹{cost.toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {student ? (
                            <span style={{ fontWeight: 600, color: '#0284c7' }}>👤 {student}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Central Store</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '5px' }}>
                            <button
                              onClick={() => {
                                dispatch(setSelectedAssetTag(asset.tag));
                                dispatch(setTransferModalOpen(true));
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)', cursor: 'pointer', fontSize: '11px', color: '#0284c7', fontWeight: 600 }}
                              title="Transfer asset"
                            >
                              🔄 Move
                            </button>
                            <button
                              onClick={() => {
                                dispatch(setSelectedAssetTag(asset.tag));
                                dispatch(setMaintenanceModalOpen(true));
                              }}
                              style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#d97706', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                              title="Log maintenance"
                            >
                              🛠️ Repair
                            </button>
                            {asset.condition === 'Beyond Repair' && (
                              <button
                                onClick={() => {
                                  dispatch(setSelectedAssetTag(asset.tag));
                                  dispatch(setDisposalModalOpen(true));
                                }}
                                style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                                title="Approve disposal"
                              >
                                ♻️ Scrap
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No assets found matching your search and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: CATEGORIES MANAGEMENT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {categories.map((cat) => {
              const catAssets = assets.filter((a) => a.category === cat.name);
              const catCost = catAssets.reduce((sum, a) => sum + (a.purchaseCost || a.purchase_cost || 0), 0);
              const inStore = catAssets.filter((a) => a.status === 'In Store' || a.status === 'Available').length;
              const assigned = catAssets.filter((a) => a.status === 'Assigned').length;
              const damaged = catAssets.filter((a) => a.condition === 'Damaged' || a.condition === 'Needs Repair').length;

              return (
                <div
                  key={cat.name}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                      <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{cat.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Depreciation: {cat.default_depreciation_rate || 10}% / yr</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '34px' }}>
                    {cat.description || 'General hostel asset category inventory'}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-surface-glass)', padding: '12px', borderRadius: '10px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total Items</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{catAssets.length}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Invoiced Value</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>₹{catCost.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>In Store Buffer</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-primary)' }}>{inStore} units</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Damaged / Repair</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: damaged > 0 ? '#f59e0b' : '#10b981' }}>{damaged} units</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCat(cat.name);
                      dispatch(setActiveTab('register'));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'var(--accent-primary-soft)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    View Registered {cat.name} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: ALLOCATION HIERARCHY & ROOM EXPLORER
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'allocation' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: '24px' }}>
          {/* Left Block / Room Selector */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
              📍 Allocation Hierarchy
            </h4>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Hostel Building ➔ Floor ➔ Room ➔ Occupant
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Block A - Room 204', 'Block B - Room 102', 'Block A - Room 112', 'Block C - Room 305', 'Admin Block - Central Store'].map((loc) => {
                const isSelected = selectedAuditBlock + ' - Room ' + selectedAuditRoom === loc || (loc.includes('Central Store') && selectedAuditRoom === 'Central Store');
                const [b, r] = loc.split(' - ');
                const roomAssets = assets.filter((a) => a.location.includes(r.replace('Room ', '')));
                return (
                  <div
                    key={loc}
                    onClick={() => {
                      setSelectedAuditBlock(b);
                      setSelectedAuditRoom(r.replace('Room ', ''));
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isSelected ? 'var(--accent-primary-soft)' : 'var(--bg-surface-glass)',
                      border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{loc}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{roomAssets.length} Assets Allocated</div>
                    </div>
                    <span style={{ fontSize: '16px' }}>{isSelected ? '👉' : '›'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Room Inventory Breakdown */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedAuditBlock} - Room {selectedAuditRoom}
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Current Occupant: {assets.find((a) => a.room === selectedAuditRoom && a.assignedStudent?.name)?.assignedStudent?.name || 'Assigned Students / Buffer Store'}
                </span>
              </div>

              <button
                onClick={() => dispatch(setAllocateModalOpen(true))}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                + Allocate Asset to this Room
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {assets
                .filter((a) => a.location.includes(selectedAuditRoom) || (selectedAuditRoom === 'Central Store' && a.status === 'In Store'))
                .map((a) => (
                  <div
                    key={a.tag}
                    style={{
                      background: 'var(--bg-surface-glass)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>{a.tag}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: a.condition === 'Good' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: a.condition === 'Good' ? '#10b981' : '#f59e0b' }}>
                        {a.condition}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{a.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category: {a.category} • Cost: ₹{a.purchaseCost || a.purchase_cost}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: RETURN & TRANSFERS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => dispatch(setReturnModalOpen(true))}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              📥 Process Asset Return & Check-in
            </button>
            <button
              onClick={() => dispatch(setTransferModalOpen(true))}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                color: '#0284c7',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
              }}
            >
              🔄 Transfer Asset Between Rooms
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-default)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              Asset Movement & Transfer Audit Logs ({transfers.length})
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Transfer ID</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Asset Tag & Name</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>From Location</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>To Location</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Reason</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Authorized By</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.transfer_id || t._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{t.transfer_id || 'TRF-001'}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.asset_tag} — {t.asset_name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{t.from_location}</td>
                      <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 600 }}>{t.to_location}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{t.reason}</td>
                      <td style={{ padding: '10px 14px' }}>{t.transferred_by}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 5: MAINTENANCE & REPAIRS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'maintenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Header & Quick Action */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Asset Maintenance & Repair Dispatch Hub
                </h3>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                  {maintenanceTickets.length} Incidents
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Track damages, technician assignment, spare part expenses & repair lifecycle.
              </span>
            </div>

            <button
              onClick={() => dispatch(setMaintenanceModalOpen(true))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span>+</span>
              <span>Report Damage / Log Ticket</span>
            </button>
          </div>

          {/* Quick Metrics KPI Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Logged Incidents</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>{maintenanceTickets.length} Tickets</div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending / In Progress</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                {maintenanceTickets.filter(m => m.status !== 'Repaired' && m.status !== 'Beyond Repair').length} Open
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Restored & Operational</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                {maintenanceTickets.filter(m => m.status === 'Repaired').length} Restored
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Repair Spend</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
                ₹{maintenanceTickets.reduce((acc, m) => acc + (Number(m.repair_cost) || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'All', label: 'All Tickets', count: maintenanceTickets.length },
              { id: 'Open', label: 'Needs Action / Open', count: maintenanceTickets.filter(m => m.status !== 'Repaired' && m.status !== 'Beyond Repair').length },
              { id: 'Repaired', label: 'Resolved & Repaired', count: maintenanceTickets.filter(m => m.status === 'Repaired').length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setMaintenanceFilter(f.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: maintenanceFilter === f.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: maintenanceFilter === f.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: maintenanceFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{f.label}</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: maintenanceFilter === f.id ? 'rgba(255,255,255,0.25)' : 'var(--bg-card-hover)', color: maintenanceFilter === f.id ? '#ffffff' : 'var(--text-muted)' }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {maintenanceTickets
              .filter(m => {
                if (maintenanceFilter === 'Open') return m.status !== 'Repaired' && m.status !== 'Beyond Repair';
                if (maintenanceFilter === 'Repaired') return m.status === 'Repaired';
                return true;
              })
              .map((ticket, idx) => {
                const asset = assets.find((a) => a.tag === ticket.asset_tag) || {};
                const ticketId = ticket.ticket_id || ticket.ticketId || `MNT-${String(ticket._id || idx + 101).slice(-5).toUpperCase()}`;
                const assetName = ticket.asset_name || asset.name || (ticket.asset_tag?.includes('CHR') ? 'Ergonomic Study Chair' : ticket.asset_tag?.includes('GYS') ? 'Instant Water Geyser 25L' : ticket.asset_tag?.includes('RTR') ? 'Enterprise Dual-Band Router' : ticket.asset_tag?.includes('LGT') ? 'High-Lumen Study Lamp' : ticket.asset_tag?.includes('FAN') ? 'High-Speed Ceiling Fan' : ticket.asset_tag?.includes('AC') ? 'Daikin Inverter Split AC 1.5T' : ticket.asset_tag?.includes('DSK') ? 'Heavy-Duty Teakwood Desk' : ticket.asset_tag?.includes('BED') ? 'Modular Metal Bunk Bed' : 'Institutional Campus Equipment');
                const category = ticket.category || asset.category || (ticket.asset_tag?.includes('CHR') || ticket.asset_tag?.includes('DSK') || ticket.asset_tag?.includes('BED') ? 'Furniture' : ticket.asset_tag?.includes('AC') ? 'HVAC' : ticket.asset_tag?.includes('GYS') || ticket.asset_tag?.includes('LGT') || ticket.asset_tag?.includes('FAN') ? 'Electrical' : 'General Asset');
                const location = ticket.location || asset.location || (asset.block ? `${asset.block} - ${asset.room}` : ticket.asset_tag?.includes('B205') ? 'Block B - Room 205' : ticket.asset_tag?.includes('D101') ? 'Block D - Room 101' : ticket.asset_tag?.includes('A304') ? 'Block A - Room 304' : ticket.asset_tag?.includes('C208') ? 'Block C - Room 208' : ticket.asset_tag?.includes('B112') ? 'Block B - Room 112' : ticket.asset_tag?.includes('A302') ? 'Block A - Room 302' : 'Campus Hostel Facility');
                const issueDesc = ticket.issue_description || ticket.action || 'Scheduled preventive maintenance and health inspection';
                const reportedBy = ticket.reported_by || ticket.actor || 'Facility Supervisor';
                const assignedTech = ticket.assigned_technician || (ticket.actor && /kamal|kumar|selvam/i.test(ticket.actor) ? ticket.actor : 'Unassigned');
                const isRepaired = ticket.status === 'Repaired' || /good|passed|done|updated/i.test(issueDesc);
                const status = ticket.status || (isRepaired ? 'Repaired' : /under maintenance|refill/i.test(issueDesc) ? 'In Progress' : 'Reported');
                const repairCost = ticket.repair_cost !== undefined ? ticket.repair_cost : (isRepaired ? 350 : status === 'In Progress' ? 650 : 0);
                const reportedDate = ticket.reported_date || ticket.date || (ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recent');

                const statusThemes = {
                  'Repaired': { bg: 'rgba(5, 150, 105, 0.12)', color: '#059669', border: 'rgba(5, 150, 105, 0.25)', icon: '✓' },
                  'In Progress': { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.25)', icon: '⚡' },
                  'Beyond Repair': { bg: 'rgba(220, 38, 38, 0.12)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.25)', icon: '✕' },
                  'Reported': { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: 'rgba(217, 119, 6, 0.25)', icon: '⏱' },
                };
                const sTheme = statusThemes[status] || statusThemes['Reported'];

                return (
                  <div
                    key={ticket.ticket_id || ticket._id || idx}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '18px 20px',
                      boxShadow: 'var(--shadow-card)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--accent-primary)',
                              background: 'var(--accent-primary-soft)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                            }}
                          >
                            {ticket.asset_tag || 'AST-TAG'}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              background: 'var(--bg-card-hover)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            {category}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: sTheme.bg,
                            color: sTheme.color,
                            border: `1px solid ${sTheme.border}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{sTheme.icon}</span>
                          <span>{status}</span>
                        </span>
                      </div>

                      {/* Asset Title & Ticket Subtitle */}
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                        {assetName}
                      </h4>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 600 }}>{ticketId}</span>
                        <span>•</span>
                        <span>Logged: {reportedDate}</span>
                      </div>

                      {/* Issue Box */}
                      <div
                        style={{
                          background: 'var(--bg-card-hover)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          marginBottom: '14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>🔧</span>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                            Reported Observation / Task
                          </div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {issueDesc}
                          </div>
                        </div>
                      </div>

                      {/* Key Details Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px 12px',
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          padding: '4px 0',
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Location</span>
                          <strong style={{ color: 'var(--text-primary)' }}>📍 {location}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Reported By</span>
                          <strong style={{ color: 'var(--text-primary)' }}>👤 {reportedBy}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Assigned Tech</span>
                          <strong style={{ color: assignedTech === 'Unassigned' ? '#d97706' : 'var(--text-primary)' }}>
                            ⚡ {assignedTech}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10.5px' }}>Repair Cost</span>
                          <strong style={{ color: 'var(--text-primary)' }}>💰 ₹{repairCost}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      {status !== 'Repaired' && status !== 'Beyond Repair' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              dispatch(
                                updateMaintenanceAsync({
                                  ticketId: ticketId,
                                  data: {
                                    status: 'In Progress',
                                    assignedTechnician: 'Sarathi Kamal (HVAC & Electrician)',
                                    repairCost: 350,
                                  },
                                })
                              );
                              dispatch(addToast({ id: `mnt-${Date.now()}`, message: `Technician assigned to ${ticketId}`, type: 'info' }));
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: 'var(--accent-primary-soft)',
                              border: '1px solid rgba(37, 99, 235, 0.25)',
                              color: 'var(--accent-primary)',
                              fontWeight: 650,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>⚡</span>
                            <span>Assign Tech</span>
                          </button>

                          <button
                            onClick={() => {
                              dispatch(
                                updateMaintenanceAsync({
                                  ticketId: ticketId,
                                  data: {
                                    status: 'Repaired',
                                    repairCost: 450,
                                    notes: 'Repaired and restored to Good condition',
                                  },
                                })
                              );
                              dispatch(addToast({ id: `mnt-${Date.now()}`, message: `${assetName} marked Repaired & Restored`, type: 'success' }));
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: '#059669',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: 650,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: 'var(--shadow-sm)',
                            }}
                          >
                            <span>✓</span>
                            <span>Mark Repaired</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(5, 150, 105, 0.08)',
                            color: '#059669',
                            fontSize: '11.5px',
                            fontWeight: 650,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>✓ Verified Operational & Certified</span>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>Restored</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 6: INVENTORY PHYSICAL AUDIT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '24px' }}>
          {/* Main Room Verification Workspace */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Physical Inventory Audit Scanner
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Verify expected room inventory against physical items found on site.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedAuditBlock}
                  onChange={(e) => setSelectedAuditBlock(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option>Block A</option>
                  <option>Block B</option>
                  <option>Block C</option>
                </select>

                <select
                  value={selectedAuditRoom}
                  onChange={(e) => setSelectedAuditRoom(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '12px' }}
                >
                  <option value="204">Room 204</option>
                  <option value="102">Room 102</option>
                  <option value="112">Room 112</option>
                  <option value="305">Room 305</option>
                </select>
              </div>
            </div>

            {/* Expected vs Scanned Comparison Table */}
            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface-glass)', borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>Expected Tag</th>
                    <th style={{ padding: '12px' }}>Asset Name</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px' }}>Physical Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {assets
                    .filter((a) => a.location.includes(selectedAuditRoom))
                    .map((a) => {
                      const isFound = auditScannedTags.includes(a.tag);
                      return (
                        <tr key={a.tag} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>{a.tag}</td>
                          <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                          <td style={{ padding: '12px' }}>{a.category}</td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={() => {
                                if (isFound) {
                                  setAuditScannedTags(auditScannedTags.filter((t) => t !== a.tag));
                                } else {
                                  setAuditScannedTags([...auditScannedTags, a.tag]);
                                }
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: isFound ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${isFound ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: isFound ? '#10b981' : '#ef4444',
                                fontWeight: 700,
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              {isFound ? '✅ Found / Scanned' : '❌ Mark Missing'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => dispatch(setAuditModalOpen(true))}
              style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Generate Formal Audit Discrepancy Report →
            </button>
          </div>

          {/* Past Audits Archive */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
              Past Audit Logs
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {audits.map((au) => (
                <div key={au.audit_id} style={{ background: 'var(--bg-surface-glass)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <span>{au.block} - {au.room}</span>
                    <span style={{ color: au.missing_count === 0 ? '#10b981' : '#ef4444' }}>{au.status}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Auditor: {au.auditor} • Date: {au.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 7: ASSET DISPOSAL & SCRAP LOGS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'disposal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Asset Disposal & Write-Off Register
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Lifecycle End: Active ➔ Damaged ➔ Beyond Economical Repair ➔ Certified Disposed / Scrap
              </span>
            </div>

            <button
              onClick={() => dispatch(setDisposalModalOpen(true))}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              + Approve Disposal
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-glass)', borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 18px' }}>Disposal ID</th>
                  <th style={{ padding: '12px 18px' }}>Asset Tag & Name</th>
                  <th style={{ padding: '12px 18px' }}>Category</th>
                  <th style={{ padding: '12px 18px' }}>Purchase Cost</th>
                  <th style={{ padding: '12px 18px' }}>Salvage Recovered (₹)</th>
                  <th style={{ padding: '12px 18px' }}>Disposal Method</th>
                  <th style={{ padding: '12px 18px' }}>Certificate #</th>
                  <th style={{ padding: '12px 18px' }}>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {disposals.map((d) => (
                  <tr key={d.disposal_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>{d.disposal_id}</td>
                    <td style={{ padding: '12px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>{d.asset_tag} — {d.asset_name}</td>
                    <td style={{ padding: '12px 18px' }}>{d.category}</td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>₹{d.purchase_cost?.toLocaleString()}</td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: '#10b981' }}>₹{d.salvage_value?.toLocaleString()}</td>
                    <td style={{ padding: '12px 18px' }}>{d.disposal_method}</td>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.certificate_number || 'CERT-2026'}</td>
                    <td style={{ padding: '12px 18px' }}>{d.approved_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 8: STUDENT ASSET REQUESTS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Student Asset Requisitions Queue
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Review and allocate study lamps, chairs, racks, and accessories requested by residents.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {assetRequests.map((req) => (
              <div
                key={req.request_id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>{req.request_id}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background:
                        req.status === 'Approved'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : req.status === 'Allocated'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : req.status === 'Rejected'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        req.status === 'Approved'
                          ? '#10b981'
                          : req.status === 'Allocated'
                          ? '#3b82f6'
                          : req.status === 'Rejected'
                          ? '#ef4444'
                          : '#f59e0b',
                    }}
                  >
                    {req.status}
                  </span>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{req.asset_name}</h4>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Requested by <strong>{req.student_name}</strong> ({req.room}, {req.block}) • {req.request_date}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface-glass)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                  "{req.reason}"
                </div>

                {req.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        dispatch(
                          reviewAssetRequestAsync({
                            requestId: req.request_id,
                            data: {
                              status: 'Approved',
                              reviewedBy: currentUser.name,
                              reviewNotes: 'Approved from buffer inventory stock',
                            },
                          })
                        );
                        dispatch(addToast({ id: `req-${Date.now()}`, message: 'Request approved!', type: 'success' }));
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: '#10b981',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => {
                        dispatch(
                          reviewAssetRequestAsync({
                            requestId: req.request_id,
                            data: {
                              status: 'Rejected',
                              reviewedBy: currentUser.name,
                              reviewNotes: 'Out of stock in buffer inventory',
                            },
                          })
                        );
                        dispatch(addToast({ id: `req-${Date.now()}`, message: 'Request rejected', type: 'warn' }));
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 9: REPORTS & ANALYTICS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Executive Asset Intelligence & Valuation
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Comprehensive financial and health reporting across all hostel blocks.
              </span>
            </div>

            <button
              onClick={() => window.print()}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🖨️ Print PDF Summary Report
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Category Valuation Breakdown */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
                Category Capital Distribution
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categories.map((c) => {
                  const catCost = assets.filter((a) => a.category === c.name).reduce((sum, a) => sum + (a.purchaseCost || a.purchase_cost || 0), 0);
                  const pct = totalValuation > 0 ? Math.round((catCost / totalValuation) * 100) : 0;
                  return (
                    <div key={c.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.icon} {c.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>₹{catCost.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-surface-glass)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asset Condition Health Matrix */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '20px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
                Hostel Asset Health Matrix
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>🟢 Good Condition</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{assets.filter((a) => a.condition === 'Good').length} Items</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>🟡 Needs Repair / Maintenance</span>
                  <span style={{ fontWeight: 800, color: '#f59e0b' }}>{assets.filter((a) => a.condition === 'Needs Repair').length} Items</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 Damaged / Beyond Repair</span>
                  <span style={{ fontWeight: 800, color: '#ef4444' }}>{assets.filter((a) => a.condition === 'Damaged' || a.condition === 'Beyond Repair').length} Items</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 10: USER MANAGEMENT (SUPER ADMIN ONLY)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && adminType === 'superadmin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-default)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-default)', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              System Accounts & Access Governance ({usersList.length || 6} Registered)
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>User ID</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Name</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Role</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Assigned Room / Office</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Email</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700 }}>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {(usersList.length > 0 ? usersList : [currentUser]).map((u) => (
                    <tr key={u.id || u.username} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{u.username || u.id}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(2, 132, 199, 0.12)', color: u.role === 'admin' ? '#ef4444' : '#0284c7' }}>
                          {u.admin_type || u.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{u.block} - {u.room}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{u.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>

    </div>
  );
}
