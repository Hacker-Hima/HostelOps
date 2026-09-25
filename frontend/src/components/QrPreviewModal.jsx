import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setQrPreviewTag } from '../redux/ticketSlice';

export default function QrPreviewModal() {
  const dispatch = useDispatch();
  const { qrPreviewTag, assets } = useSelector((s) => s.ticketStore);

  if (!qrPreviewTag) return null;

  const asset = assets.find((a) => a.tag === qrPreviewTag) || {
    tag: qrPreviewTag,
    name: 'Hostel Asset',
    category: 'Inventory',
    location: 'Campus Store',
    condition: 'Good',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', color: '#0f172a', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative' }}>
        
        <button
          onClick={() => dispatch(setQrPreviewTag(null))}
          style={{ position: 'absolute', right: '18px', top: '18px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#475569' }}
        >
          ✕
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 14px', borderRadius: '50px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px' }}>🏢</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' }}>HOSTEL ASSET MANAGEMENT</span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>{asset.name}</h3>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px 0' }}>{asset.location} • Category: {asset.category}</p>

        {/* High-Resolution QR Simulation Box */}
        <div style={{ background: '#f8fafc', border: '2px solid #0f172a', borderRadius: '16px', padding: '20px', display: 'inline-block', marginBottom: '20px' }}>
          <div style={{ width: '160px', height: '160px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginInline: 'auto' }}>
            {/* Top row alignment blocks */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '34px', height: '34px', background: '#0f172a', border: '4px solid #fff', outline: '3px solid #0f172a' }} />
              <div style={{ width: '34px', height: '34px', background: '#0f172a', border: '4px solid #fff', outline: '3px solid #0f172a' }} />
            </div>

            {/* Simulated QR matrix patterns */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', padding: '4px' }}>
              <div style={{ width: '8px', height: '8px', background: '#0f172a' }} />
              <div style={{ width: '8px', height: '8px', background: '#0f172a' }} />
              <div style={{ width: '8px', height: '8px', background: 'transparent' }} />
              <div style={{ width: '8px', height: '8px', background: '#0f172a' }} />
              <div style={{ width: '8px', height: '8px', background: 'transparent' }} />
              <div style={{ width: '8px', height: '8px', background: '#0f172a' }} />
              <div style={{ width: '8px', height: '8px', background: '#0f172a' }} />
              <div style={{ width: '8px', height: '8px', background: '#0f172a' }} />
            </div>

            {/* Bottom left alignment block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ width: '34px', height: '34px', background: '#0f172a', border: '4px solid #fff', outline: '3px solid #0f172a' }} />
              <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>VERIFIED</span>
            </div>
          </div>

          <div style={{ marginTop: '12px', fontFamily: 'monospace', fontWeight: 800, fontSize: '15px', color: '#0f172a', letterSpacing: '1px' }}>
            {asset.tag}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.print()}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
          >
            🖨️ Print QR Tag Label
          </button>
          <button
            onClick={() => dispatch(setQrPreviewTag(null))}
            style={{ padding: '10px 18px', borderRadius: '8px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
