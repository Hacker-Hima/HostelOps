import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setDisposalModalOpen, submitDisposalAsync, addToast } from '../redux/ticketSlice';

export default function DisposalModal() {
  const dispatch = useDispatch();
  const { disposalModalOpen, assets, selectedAssetTag, currentUser } = useSelector((s) => s.ticketStore);

  const eligibleAssets = assets.filter((a) => a.status !== 'Disposed');
  const selectedAsset = (selectedAssetTag && assets.find((a) => a.tag === selectedAssetTag && a.status !== 'Disposed')) || eligibleAssets[0];

  const [assetTag, setAssetTag] = useState(selectedAsset?.tag || '');
  const [salvageValue, setSalvageValue] = useState(300);
  const [disposalReason, setDisposalReason] = useState('Beyond Economical Repair');
  const [disposalMethod, setDisposalMethod] = useState('Certified E-Waste Scrap');
  const [notes, setNotes] = useState('Asset damaged beyond recovery. Certified disposal authorized.');

  if (!disposalModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetTag) {
      alert('Please select an asset to dispose');
      return;
    }

    try {
      await dispatch(
        submitDisposalAsync({
          assetTag,
          salvageValue: Number(salvageValue) || 0,
          disposalReason,
          disposalMethod,
          approvedBy: currentUser?.name || 'Super Admin',
          notes,
        })
      ).unwrap();

      dispatch(addToast({ id: `dsp-${Date.now()}`, message: `Disposal approved for ${assetTag} (Salvage: ₹${salvageValue})`, type: 'success' }));
      dispatch(setDisposalModalOpen(false));
    } catch (err) {
      alert('Disposal approval failed: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>♻️ Approve Asset Disposal</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authorize scrap write-off and record salvage value recovery</span>
          </div>
          <button onClick={() => dispatch(setDisposalModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Asset to Write-Off *</label>
            <select
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              {(eligibleAssets.length > 0 ? eligibleAssets : assets).map((a) => (
                <option key={a.tag} value={a.tag}>
                  {a.tag} — {a.name} ({a.condition})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Salvage / Scrap Value (₹)</label>
              <input
                type="number"
                value={salvageValue}
                onChange={(e) => setSalvageValue(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Disposal Method</label>
              <select
                value={disposalMethod}
                onChange={(e) => setDisposalMethod(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option>Certified E-Waste Scrap</option>
                <option>Auction / Buyback</option>
                <option>Recycled by Vendor</option>
                <option>Donated / Discarded</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Reason for Disposal</label>
            <select
              value={disposalReason}
              onChange={(e) => setDisposalReason(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <option>Beyond Economical Repair</option>
              <option>Obsolete & End of Life</option>
              <option>Structural Damage</option>
              <option>Health & Safety Hazard</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Disposal Certificate Notes</label>
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
              background: '#ef4444',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Issue Disposal Certificate & Write-Off →
          </button>
        </form>

      </div>
    </div>
  );
}
