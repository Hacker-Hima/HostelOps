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
  const { currentUser, assets, maintenanceTickets, assetRequests, notifications } = useSelector(
    (s) => s.ticketStore
  );

  const [activeSubTab, setActiveSubTab] = useState('my-assets'); // 'my-assets' | 'requests' | 'maintenance' | 'room'

  // Student's room assets
  const myAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        (a.assignedStudent?.roll && a.assignedStudent.roll === currentUser.roll_number) ||
        (a.assigned_student_roll && a.assigned_student_roll === currentUser.roll_number) ||
        (a.room === currentUser.room && a.block === currentUser.block)
    );
  }, [assets, currentUser]);

  // Student's maintenance tickets
  const myMaintenanceTickets = useMemo(() => {
    return maintenanceTickets.filter(
      (m) =>
        m.reported_by?.includes(currentUser.name) ||
        m.reported_by?.includes(currentUser.roll_number) ||
        m.location?.includes(currentUser.room)
    );
  }, [maintenanceTickets, currentUser]);

  // Student's asset requests
  const myRequests = useMemo(() => {
    return assetRequests.filter(
      (r) => r.student_roll === currentUser.roll_number || r.student_name === currentUser.name
    );
  }, [assetRequests, currentUser]);

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
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(6, 182, 212, 0.35)',
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
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: '#06b6d4',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
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
          🪑 My Allocated Assets ({myAssets.length})
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
          📥 My Asset Requests ({myRequests.length})
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
          🛠️ Maintenance Tickets ({myMaintenanceTickets.length})
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

    </div>
  );
}
