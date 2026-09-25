import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRequestAssetModalOpen, submitAssetRequestAsync, addToast } from '../redux/ticketSlice';

export default function RequestAssetModal() {
  const dispatch = useDispatch();
  const { requestAssetModalOpen, currentUser } = useSelector((s) => s.ticketStore);

  const [assetCategory, setAssetCategory] = useState('Study Equipment');
  const [assetName, setAssetName] = useState('LED Flexible Desk Study Lamp');
  const [reason, setReason] = useState('Required for late night examination study');
  const [urgency, setUrgency] = useState('Medium');

  if (!requestAssetModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetName.trim() || !reason.trim()) {
      alert('Please fill in asset name and reason');
      return;
    }

    try {
      await dispatch(
        submitAssetRequestAsync({
          studentRoll: currentUser?.roll_number || '21CS204',
          studentName: currentUser?.name || 'Student',
          room: currentUser?.room || '204',
          block: currentUser?.block || 'Block A',
          assetCategory,
          assetName,
          reason,
          urgency,
        })
      ).unwrap();

      dispatch(addToast({ id: `req-${Date.now()}`, message: 'Requisition submitted for approval!', type: 'success' }));
      dispatch(setRequestAssetModalOpen(false));
    } catch (err) {
      alert('Requisition failed: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>✨ Request New Asset</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Submit a requisition for study equipment or furniture</span>
          </div>
          <button onClick={() => dispatch(setRequestAssetModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option>Study Equipment</option>
                <option>Furniture</option>
                <option>Electrical</option>
                <option>Electronics</option>
                <option>Appliances</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Priority</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Requested Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. LED Flexible Desk Study Lamp, Extra Book Rack"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Purpose / Reason *</label>
            <textarea
              required
              rows="3"
              placeholder="Explain why you need this item in your room..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
            Submit Requisition to Asset Admin →
          </button>
        </form>

      </div>
    </div>
  );
}
