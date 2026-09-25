import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setReturnModalOpen, returnAssetAsync, addToast } from '../redux/ticketSlice';

export default function ReturnAssetModal() {
  const dispatch = useDispatch();
  const { returnModalOpen, assets, selectedAssetTag, currentUser } = useSelector((s) => s.ticketStore);

  const assignedAssets = assets.filter((a) => a.status === 'Assigned');
  const [tag, setTag] = useState(selectedAssetTag || (assignedAssets[0]?.tag || ''));
  const [inspectedCondition, setInspectedCondition] = useState('Good');
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [remarks, setRemarks] = useState('Semester vacation check-in');

  if (!returnModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tag) {
      alert('Please select an asset to return');
      return;
    }

    try {
      await dispatch(
        returnAssetAsync({
          tag,
          returnedBy: currentUser?.name || 'Student',
          inspectedCondition,
          receivedBy: currentUser?.role === 'admin' ? currentUser.name : 'Asset Admin',
          penaltyAmount: Number(penaltyAmount) || 0,
          remarks,
        })
      ).unwrap();

      dispatch(addToast({ id: `ret-${Date.now()}`, message: `Asset ${tag} returned to Central Store (${inspectedCondition})!`, type: 'success' }));
      dispatch(setReturnModalOpen(false));
    } catch (err) {
      alert('Return check-in failed: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>📥 Asset Return & Check-in</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Return equipment from room back to Central Store buffer</span>
          </div>
          <button onClick={() => dispatch(setReturnModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Asset to Return *</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              {assignedAssets.map((a) => (
                <option key={a.tag} value={a.tag}>
                  {a.tag} — {a.name} ({a.location})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Inspected Condition</label>
              <select
                value={inspectedCondition}
                onChange={(e) => setInspectedCondition(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option value="Good">🟢 Good (No wear)</option>
                <option value="Needs Repair">🟡 Minor Wear / Needs Repair</option>
                <option value="Damaged">🔴 Damaged (Discrepancy Fee)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Damage Fine / Penalty (₹)</label>
              <input
                type="number"
                value={penaltyAmount}
                onChange={(e) => setPenaltyAmount(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Handover Inspection Notes</label>
            <textarea
              rows="2"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: '#f59e0b',
              border: 'none',
              color: '#000',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Confirm Return & Check-in to Store →
          </button>
        </form>

      </div>
    </div>
  );
}
