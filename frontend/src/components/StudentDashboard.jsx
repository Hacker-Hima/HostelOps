import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedAssetTag,
  setQrPreviewTag,
  setMaintenanceModalOpen,
  setRequestAssetModalOpen,
  setReturnModalOpen,
  addToast,
} from '../redux/ticketSlice';

export default function StudentDashboard({ isMobile }) {
  const dispatch = useDispatch();
  const { currentUser, assets, maintenanceTickets, assetRequests, transfers, categories, notifications } = useSelector(
    (s) => s.ticketStore
  );

  const [activeSubTab, setActiveSubTab] = useState('my-assets'); // 'my-assets' | 'available-assets' | 'requests' | 'maintenance' | 'my-history'

  // Student's room assets
  const myAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        (a.assignedStudent?.roll && a.assignedStudent.roll === currentUser?.roll_number) ||
        (a.assigned_student_roll && a.assigned_student_roll === currentUser?.roll_number) ||
        (a.room === currentUser?.room && a.block === currentUser?.block)
    );
  }, [assets, currentUser]);

  // Available hostel assets in central store
  const availableAssets = useMemo(() => {
    return assets.filter((a) => a.status === 'In Store' || a.status === 'Available');
  }, [assets]);

  // Student's maintenance tickets
  const myMaintenanceTickets = useMemo(() => {
    return maintenanceTickets.filter(
      (m) =>
        m.reported_by?.includes(currentUser?.name) ||
        m.reported_by?.includes(currentUser?.roll_number) ||
        m.location?.includes(currentUser?.room)
    );
  }, [maintenanceTickets, currentUser]);

  // Student's asset requests
  const myRequests = useMemo(() => {
    return assetRequests.filter(
      (r) => r.student_roll === currentUser?.roll_number || r.student_name === currentUser?.name
    );
  }, [assetRequests, currentUser]);

  // Student's personal asset history & lifecycle audit trail
  const myHistory = useMemo(() => {
    const list = [];
    (transfers || []).forEach((t) => {
      if (
        t.from_student === currentUser?.name ||
        t.to_student === currentUser?.name ||
        t.from_location?.includes(currentUser?.room) ||
        t.to_location?.includes(currentUser?.room)
      ) {
        list.push({
          id: t.transfer_id,
          type: 'Transfer',
          title: `Asset ${t.asset_tag} (${t.asset_name || 'Item'}) Moved`,
          detail: `From: ${t.from_location} → To: ${t.to_location}`,
          date: t.date || 'Recent',
          icon: '🔄',
          badge: 'Transfer',
          color: '#f59e0b',
        });
      }
    });

    (myMaintenanceTickets || []).forEach((m) => {
      list.push({
        id: m.ticket_id,
        type: 'Maintenance',
        title: `Maintenance: ${m.asset_name || m.asset_tag}`,
        detail: `${m.issue_description} — Status: ${m.status}`,
        date: m.reported_date || 'Recent',
        icon: '🛠️',
        badge: m.status,
        color: m.status === 'Repaired' ? '#10b981' : '#ef4444',
      });
    });

    (myRequests || []).forEach((r) => {
      list.push({
        id: r.request_id,
        type: 'Requisition',
        title: `Requisition: ${r.asset_name}`,
        detail: `Category: ${r.asset_category} — Urgency: ${r.urgency}`,
        date: r.request_date || 'Recent',
        icon: '📥',
        badge: r.status,
        color: r.status === 'Approved' ? '#10b981' : r.status === 'Allocated' ? '#0284c7' : '#f59e0b',
      });
    });

    return list.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [transfers, myMaintenanceTickets, myRequests, currentUser]);

  // Recently Accessed Quick Items
  const [recentlyAccessed, setRecentlyAccessed] = useState(() => {
    try {
      const saved = localStorage.getItem('hostelops_recent_student');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'AST-FUR-101', type: 'asset', icon: '🪑', title: 'Study Desk', subtitle: 'Room Assigned' },
      { id: 'AST-APP-102', type: 'asset', icon: '❄️', title: 'Ceiling Fan', subtitle: 'Room Assigned' },
      { id: 'AST-FUR-103', type: 'asset', icon: '🛏️', title: 'Spring Cot Bed', subtitle: 'Room Assigned' },
      { id: 'REQ-101', type: 'tab', target: 'requests', icon: '📋', title: 'LAN Cable', subtitle: 'Request Status' },
    ];
  });

  const handleRecentClick = (item) => {
    if (item.type === 'asset') {
      dispatch(setSelectedAssetTag(item.id));
      dispatch(setQrPreviewTag(item.id));
    } else if (item.type === 'tab') {
      setActiveSubTab(item.target);
    }
  };

  return (
    <div style={{ padding: '16px 20px', maxWidth: '1440px', width: '100%', marginInline: 'auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Student Profile & Room Header Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'var(--grad-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            🎓
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {currentUser?.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '50px',
                  background: 'var(--accent-primary-soft)',
                  color: 'var(--text-accent)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                Roll: {currentUser?.roll_number}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              📍 <strong>Allocated Room:</strong> {currentUser?.block} — Room {currentUser?.room} ({currentUser?.floor || 'Floor 1'}) • {currentUser?.email}
            </div>
          </div>
        </div>

        {/* Quick Student Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => dispatch(setRequestAssetModalOpen(true))}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)',
            }}
          >
            <span>✨</span>
            <span>Request New Asset</span>
          </button>

          <button
            onClick={() => dispatch(setMaintenanceModalOpen(true))}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛠️</span>
            <span>Report Damaged Asset</span>
          </button>

          <button
            onClick={() => dispatch(setReturnModalOpen(true))}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <span>📥</span>
            <span>Return / Vacate</span>
          </button>
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
          marginBottom: '16px',
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

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: '10px',
        }}
      >
        <button
          onClick={() => setActiveSubTab('my-assets')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            background: activeSubTab === 'my-assets' ? 'var(--accent-primary)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'my-assets' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🪑 My Room Assets ({myAssets.length})
        </button>

        <button
          onClick={() => setActiveSubTab('available-assets')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            background: activeSubTab === 'available-assets' ? 'var(--accent-primary)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'available-assets' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          📦 Available Inventory ({availableAssets.length})
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            background: activeSubTab === 'requests' ? 'var(--accent-primary)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'requests' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          📥 My Requisitions ({myRequests.length})
        </button>

        <button
          onClick={() => setActiveSubTab('maintenance')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            background: activeSubTab === 'maintenance' ? 'var(--accent-primary)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'maintenance' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🛠️ Maintenance ({myMaintenanceTickets.length})
        </button>

        <button
          onClick={() => setActiveSubTab('my-history')}
          style={{
            padding: '8px 18px',
            borderRadius: '10px',
            background: activeSubTab === 'my-history' ? 'var(--accent-primary)' : 'transparent',
            border: 'none',
            color: activeSubTab === 'my-history' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          📜 Asset History ({myHistory.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SUB-TAB 1: MY ALLOCATED ASSETS
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'my-assets' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {myAssets.map((asset) => (
              <div
                key={asset.tag}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '18px',
                  padding: '22px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => dispatch(setQrPreviewTag(asset.tag))}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'var(--accent-primary-soft)',
                          border: '1px solid var(--border-default)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                        }}
                        title="View Asset QR Code"
                      >
                        📱
                      </button>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>
                        {asset.tag}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: asset.condition === 'Good' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: asset.condition === 'Good' ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {asset.condition}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {asset.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Category: <strong>{asset.category}</strong> • Warranty: {asset.warrantyExpiry || '2027'}
                  </div>

                  <div style={{ background: 'var(--bg-surface-glass)', padding: '12px', borderRadius: '10px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <div>📍 <strong>Location:</strong> {asset.location}</div>
                    <div style={{ marginTop: '4px' }}>🏷️ <strong>Status:</strong> {asset.status}</div>
                    <div style={{ marginTop: '4px' }}>📅 <strong>Last Inspected:</strong> {asset.lastChecked || 'Recently'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      dispatch(setSelectedAssetTag(asset.tag));
                      dispatch(setMaintenanceModalOpen(true));
                    }}
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#f59e0b',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    🛠️ Report Issue
                  </button>

                  <button
                    onClick={() => {
                      dispatch(setSelectedAssetTag(asset.tag));
                      dispatch(setReturnModalOpen(true));
                    }}
                    style={{
                      flex: 1,
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'var(--accent-primary-soft)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    📥 Request Return
                  </button>
                </div>
              </div>
            ))}

            {myAssets.length === 0 && (
              <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '40px', borderRadius: '18px', textAlign: 'center', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '40px' }}>📦</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '14px 0 6px 0' }}>
                  No assets currently assigned to your room
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  You can submit a requisition to have furniture, appliances, or study equipment allocated.
                </p>
                <button
                  onClick={() => dispatch(setRequestAssetModalOpen(true))}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  + Request Asset Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUB-TAB 2: MY ASSET REQUESTS
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'requests' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {myRequests.map((req) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>{req.request_id}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: req.status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: req.status === 'Approved' ? '#10b981' : '#f59e0b',
                  }}
                >
                  {req.status}
                </span>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{req.asset_name}</h4>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>Category: {req.asset_category} • {req.request_date}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface-glass)', padding: '10px', borderRadius: '8px' }}>
                "{req.reason}"
              </div>
            </div>
          ))}
          {myRequests.length === 0 && (
            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '36px', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active asset requests found. Click "Request New Asset" to submit one.
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUB-TAB 3: MY MAINTENANCE TICKETS
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'maintenance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {myMaintenanceTickets.map((t) => (
            <div
              key={t.ticket_id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>{t.ticket_id}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: t.status === 'Repaired' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: t.status === 'Repaired' ? '#10b981' : '#f59e0b',
                  }}
                >
                  {t.status}
                </span>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>{t.asset_name}</h4>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface-glass)', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                {t.issue_description}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Assigned Tech: <strong>{t.assigned_technician || 'Pending assignment'}</strong>
              </div>
            </div>
          ))}
          {myMaintenanceTickets.length === 0 && (
            <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '36px', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No maintenance tickets reported for your room. All assets are operating smoothly!
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUB-TAB 4: AVAILABLE ASSETS INVENTORY
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'available-assets' && (
        <div>
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Hostel Central Store Inventory ({availableAssets.length} Items Available)
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                You can request any available asset below for allocation to your room.
              </span>
            </div>
            <button
              onClick={() => dispatch(setRequestAssetModalOpen(true))}
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
              + Custom Requisition
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {availableAssets.map((asset) => (
              <div
                key={asset.tag}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '16px',
                  padding: '18px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-accent)' }}>
                      {asset.tag}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                      }}
                    >
                      Available in Store
                    </span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {asset.name}
                  </h4>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Category: <strong>{asset.category}</strong> • Condition: <strong>{asset.condition}</strong>
                  </div>

                  <div style={{ background: 'var(--bg-surface-glass)', padding: '10px', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    <div>📍 Location: {asset.location || 'Central Inventory Store'}</div>
                    <div style={{ marginTop: '3px' }}>🛡️ Warranty: {asset.warrantyExpiry || 'Active'}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    dispatch(setRequestAssetModalOpen(true));
                    dispatch(addToast({ id: `prefill-${Date.now()}`, message: `Requisition opened for ${asset.name}`, type: 'info' }));
                  }}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: '8px',
                    background: 'var(--accent-primary-soft)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <span>✨</span>
                  <span>Request This Item</span>
                </button>
              </div>
            ))}

            {availableAssets.length === 0 && (
              <div style={{ gridColumn: '1 / -1', background: 'var(--bg-card)', padding: '36px', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No assets currently available in the central store. Check back soon or submit a custom requisition.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUB-TAB 5: PERSONAL ASSET HISTORY & AUDIT TRAIL
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'my-history' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Personal Asset Activity & History
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Complete record of all equipment movements, repair tickets, and requisitions for your room.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myHistory.map((h) => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                    }}
                  >
                    {h.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{h.title}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>{h.detail}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      background: 'rgba(2, 132, 199, 0.1)',
                      color: h.color || 'var(--text-accent)',
                      marginBottom: '4px',
                    }}
                  >
                    {h.badge}
                  </span>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{h.date}</div>
                </div>
              </div>
            ))}

            {myHistory.length === 0 && (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No past asset history recorded for your room yet.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
