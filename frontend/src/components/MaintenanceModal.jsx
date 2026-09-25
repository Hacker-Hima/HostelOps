import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMaintenanceModalOpen, reportMaintenanceAsync, addToast } from '../redux/ticketSlice';

export default function MaintenanceModal() {
  const dispatch = useDispatch();
  const { maintenanceModalOpen, assets, selectedAssetTag, currentUser } = useSelector(
    (s) => s.ticketStore
  );

  const selectedAsset = assets.find((a) => a.tag === selectedAssetTag) || assets[0];

  const [assetTag, setAssetTag] = useState(selectedAsset?.tag || (assets[0]?.tag || ''));
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');

  if (!maintenanceModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetTag || !issueDescription.trim()) {
      alert('Please select an asset and describe the issue');
      return;
    }

    try {
      await dispatch(
        reportMaintenanceAsync({
          assetTag,
          issueDescription: issueDescription.trim(),
          urgency,
          reportedBy: `${currentUser?.name} (${currentUser?.roll_number || currentUser?.role})`,
          reporterRole: currentUser?.role === 'admin' ? 'Admin' : 'Student',
        })
      ).unwrap();

      dispatch(addToast({ id: `mnt-${Date.now()}`, message: `Maintenance ticket reported for ${assetTag}!`, type: 'success' }));
      dispatch(setMaintenanceModalOpen(false));
      setIssueDescription('');
    } catch (err) {
      alert('Failed to report maintenance: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>🛠️ Report Damaged Asset</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Log a repair ticket and request technician dispatch</span>
          </div>
          <button onClick={() => dispatch(setMaintenanceModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Damaged Asset *</label>
            <select
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              {assets.map((a) => (
                <option key={a.tag} value={a.tag}>
                  {a.tag} — {a.name} ({a.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Issue Priority / Urgency</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
              {['Low', 'Medium', 'High', 'Critical'].map((p) => {
                const isSelected = urgency === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setUrgency(p)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--accent-primary)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'transparent' : 'var(--border-default)'}`,
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Detailed Issue Description *</label>
            <textarea
              required
              rows="3"
              placeholder="Describe the defect, sound, leak, electrical sparking, or damage..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            />
          </div>

          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
            }}
          >
            Dispatch Repair Ticket →
          </button>
        </form>

      </div>
    </div>
  );
}
