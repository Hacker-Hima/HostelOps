import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAuditModalOpen, submitAuditAsync, addToast } from '../redux/ticketSlice';

export default function AuditModal() {
  const dispatch = useDispatch();
  const { auditModalOpen, assets, currentUser } = useSelector((s) => s.ticketStore);

  const [block, setBlock] = useState('Block A');
  const [room, setRoom] = useState('204');
  const [notes, setNotes] = useState('Physical spot-check verification completed');
  const [scannedTags, setScannedTags] = useState([]);

  if (!auditModalOpen) return null;

  const roomAssets = assets.filter((a) => a.location?.includes(room) && a.block === block);

  const toggleTag = (tag) => {
    if (scannedTags.includes(tag)) {
      setScannedTags(scannedTags.filter((t) => t !== tag));
    } else {
      setScannedTags([...scannedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        submitAuditAsync({
          block,
          room,
          auditor: currentUser?.name || 'Asset Admin',
          scannedTags,
          notes,
        })
      ).unwrap();

      dispatch(addToast({ id: `aud-${Date.now()}`, message: `Audit for ${block} - Room ${room} recorded!`, type: 'success' }));
      dispatch(setAuditModalOpen(false));
    } catch (err) {
      alert('Audit submission failed: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '560px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>🔍 Submit Inventory Audit</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record physical equipment count & discrepancy report</span>
          </div>
          <button onClick={() => dispatch(setAuditModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Hostel Block</label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option>Block A</option>
                <option>Block B</option>
                <option>Block C</option>
                <option>Block D</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Room #</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              Checklist of Expected Assets in Room {room}:
            </label>
            <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'var(--bg-card)', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {roomAssets.map((a) => {
                const isChecked = scannedTags.includes(a.tag);
                return (
                  <div
                    key={a.tag}
                    onClick={() => toggleTag(a.tag)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${isChecked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: 'var(--text-accent)' }}>{a.tag}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)', marginLeft: '8px' }}>{a.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isChecked ? '#10b981' : '#ef4444' }}>
                      {isChecked ? '✓ Found' : '✗ Missing'}
                    </span>
                  </div>
                );
              })}
              {roomAssets.length === 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                  No assets registered under {block} - Room {room}.
                </div>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Auditor Remarks</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Submit Formal Audit Report →
          </button>
        </form>

      </div>
    </div>
  );
}
