import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTransferModalOpen, transferAssetAsync, addToast } from '../redux/ticketSlice';

export default function TransferAssetModal() {
  const dispatch = useDispatch();
  const { transferModalOpen, assets, selectedAssetTag, currentUser } = useSelector((s) => s.ticketStore);

  const eligibleAssets = assets.filter((a) => a.status !== 'Disposed' && a.status !== 'Missing');
  const selectedAsset = (selectedAssetTag && assets.find((a) => a.tag === selectedAssetTag && a.status !== 'Disposed' && a.status !== 'Missing')) || eligibleAssets[0];

  const [tag, setTag] = useState(selectedAsset?.tag || '');
  const [toBlock, setToBlock] = useState('Block B');
  const [toFloor, setToFloor] = useState('Floor 1');
  const [toRoom, setToRoom] = useState('102');
  const [toStudentRoll, setToStudentRoll] = useState('22EC102');
  const [toStudentName, setToStudentName] = useState('Priya Sharma');
  const [reason, setReason] = useState('Room reassignment / inter-block transfer');

  if (!transferModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tag) {
      alert('Please select an asset to transfer');
      return;
    }

    try {
      await dispatch(
        transferAssetAsync({
          tag,
          toBlock,
          toFloor,
          toRoom,
          toStudentRoll,
          toStudentName,
          reason,
          transferredBy: currentUser?.name || 'Admin',
        })
      ).unwrap();

      dispatch(addToast({ id: `trf-${Date.now()}`, message: `Asset ${tag} transferred to ${toBlock} - Room ${toRoom}!`, type: 'success' }));
      dispatch(setTransferModalOpen(false));
    } catch (err) {
      alert('Transfer failed: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>🔄 Transfer Asset</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Move equipment between hostel rooms with audit trail</span>
          </div>
          <button onClick={() => dispatch(setTransferModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Asset to Transfer *</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              {eligibleAssets.map((a) => (
                <option key={a.tag} value={a.tag}>
                  {a.tag} — {a.name} (Current: {a.location})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Destination Block</label>
              <select
                value={toBlock}
                onChange={(e) => setToBlock(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option>Block A</option>
                <option>Block B</option>
                <option>Block C</option>
                <option>Block D</option>
                <option>Admin Block</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Floor</label>
              <select
                value={toFloor}
                onChange={(e) => setToFloor(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option>Floor 1</option>
                <option>Floor 2</option>
                <option>Floor 3</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Destination Room</label>
              <input
                type="text"
                value={toRoom}
                onChange={(e) => setToRoom(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>New Occupant Name</label>
              <input
                type="text"
                placeholder="Priya Sharma"
                value={toStudentName}
                onChange={(e) => setToStudentName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Roll Number</label>
              <input
                type="text"
                placeholder="22EC102"
                value={toStudentRoll}
                onChange={(e) => setToStudentRoll(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Transfer Reason</label>
            <input
              type="text"
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
              background: '#8b5cf6',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Execute Transfer & Update Registry →
          </button>
        </form>

      </div>
    </div>
  );
}
