import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setNewAssetModalOpen, createAssetAsync, addToast } from '../redux/ticketSlice';

export default function AddAssetModal() {
  const dispatch = useDispatch();
  const { newAssetModalOpen, categories } = useSelector((s) => s.ticketStore);

  const [form, setForm] = useState({
    tag: `AST-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`,
    name: '',
    category: 'Furniture',
    block: 'Block A',
    floor: 'Floor 1',
    room: 'Central Store',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    depreciationRate: 10,
    warrantyExpiry: '2027-12-31',
    supplier: 'Apex Institutional Furnishings',
    condition: 'Good',
    status: 'In Store',
    notes: '',
  });

  if (!newAssetModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tag || !form.name) {
      alert('Asset Tag and Name are required');
      return;
    }

    try {
      await dispatch(createAssetAsync(form)).unwrap();
      dispatch(addToast({ id: `ast-${Date.now()}`, message: `Asset ${form.tag} registered successfully!`, type: 'success' }));
      dispatch(setNewAssetModalOpen(false));
    } catch (err) {
      alert('Failed to register asset: ' + err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '580px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Register New Asset</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Add a newly procured asset to the institutional register</span>
          </div>
          <button onClick={() => dispatch(setNewAssetModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Asset Tag / ID *</label>
              <input
                type="text"
                required
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-accent)', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Asset Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ergonomic Study Desk with Drawers"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Purchase Cost (₹)</label>
              <input
                type="number"
                placeholder="4500"
                value={form.purchaseCost}
                onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Depreciation %</label>
              <input
                type="number"
                value={form.depreciationRate}
                onChange={(e) => setForm({ ...form, depreciationRate: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Warranty Expiry</label>
              <input
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Initial Location</label>
              <input
                type="text"
                placeholder="Admin Block - Central Store"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Supplier</label>
              <input
                type="text"
                placeholder="Apex Institutional Furnishings"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '10px',
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
            Save Asset into Register →
          </button>
        </form>

      </div>
    </div>
  );
}
