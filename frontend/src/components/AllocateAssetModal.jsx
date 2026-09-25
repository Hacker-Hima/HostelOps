import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setAllocateModalOpen, allocateAssetAsync, addToast } from '../redux/ticketSlice';

export default function AllocateAssetModal() {
  const dispatch = useDispatch();
  const { allocateModalOpen, assets, selectedAssetTag, currentUser } = useSelector((s) => s.ticketStore);

  const availableAssets = assets.filter((a) => a.status === 'In Store' || a.status === 'Available');

  const [tag, setTag] = useState(selectedAssetTag || (availableAssets[0]?.tag || ''));
  const [block, setBlock] = useState('Block A');
  const [floor, setFloor] = useState('Floor 2');
  const [room, setRoom] = useState('204');
  const [studentRoll, setStudentRoll] = useState('21CS204');
  const [studentName, setStudentName] = useState('Himachalam');
  const [notes, setNotes] = useState('');

  if (!allocateModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tag) {
      alert('Please select an asset to allocate');
      return;
    }

    try {
      await dispatch(
        allocateAssetAsync({
          tag,
          block,
          floor,
          room,
          studentRoll,
          studentName,
          allocatedBy: currentUser?.name || 'Admin',
          notes,
        })
      ).unwrap();

      dispatch(addToast({ id: `alc-${Date.now()}`, message: `Asset ${tag} allocated to Room ${room} (${studentName})!`, type: 'success' }));
      dispatch(setAllocateModalOpen(false));
    } catch (err) {
      alert('Allocation failed: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>📍 Allocate Asset</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assign in-store equipment to a hostel room & student</span>
          </div>
          <button onClick={() => dispatch(setAllocateModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Select In-Store Asset *</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              {availableAssets.map((a) => (
                <option key={a.tag} value={a.tag}>
                  {a.tag} — {a.name} ({a.category})
                </option>
              ))}
              {availableAssets.length === 0 && (
                <option value="">No in-store buffer assets available</option>
              )}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Building / Block</label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option>Block A</option>
                <option>Block B</option>
                <option>Block C</option>
                <option>Block D</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Floor</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              >
                <option>Floor 1</option>
                <option>Floor 2</option>
                <option>Floor 3</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Room #</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                style={{ width: '100%', padding: '9px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Student Roll #</label>
              <input
                type="text"
                value={studentRoll}
                onChange={(e) => setStudentRoll(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Allocation Notes / Remarks</label>
            <textarea
              rows="2"
              placeholder="e.g. Semester 1 room setup"
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
              background: '#06b6d4',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Confirm & Complete Allocation →
          </button>
        </form>

      </div>
    </div>
  );
}
