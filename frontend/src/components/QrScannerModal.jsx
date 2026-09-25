import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setQrScannerModalOpen, setQrPreviewTag, addToast } from '../redux/ticketSlice';

export default function QrScannerModal() {
  const dispatch = useDispatch();
  const { qrScannerModalOpen, assets } = useSelector((s) => s.ticketStore);

  const [inputTag, setInputTag] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  if (!qrScannerModalOpen) return null;

  const handleLookup = (tagToLookup) => {
    const clean = (tagToLookup || inputTag).trim().toUpperCase();
    if (!clean) return;
    const found = assets.find((a) => a.tag.toUpperCase() === clean || a.tag.toUpperCase().includes(clean));

    if (found) {
      if (found.status === 'Disposed') {
        dispatch(addToast({ id: `scan-${Date.now()}`, message: `Asset ${found.tag} is marked as DISPOSED.`, type: 'warn' }));
      } else if (found.status === 'Missing') {
        dispatch(addToast({ id: `scan-${Date.now()}`, message: `Asset ${found.tag} is currently flagged as MISSING.`, type: 'error' }));
      } else {
        dispatch(addToast({ id: `scan-${Date.now()}`, message: `Found asset: ${found.name} (${found.tag})`, type: 'success' }));
      }
      dispatch(setQrScannerModalOpen(false));
      dispatch(setQrPreviewTag(found.tag));
    } else {
      dispatch(addToast({ id: `scan-err-${Date.now()}`, message: `Asset tag "${clean}" not found in register.`, type: 'error' }));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-strong)', borderRadius: '24px', padding: '28px', boxShadow: 'var(--shadow-float)', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>📷 Asset QR Scanner</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scan or look up any equipment QR code instantly</span>
          </div>
          <button onClick={() => dispatch(setQrScannerModalOpen(false))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Live Camera Scanner Viewport Simulation */}
        <div
          style={{
            position: 'relative',
            width: '240px',
            height: '240px',
            marginInline: 'auto',
            background: '#0a0f1d',
            borderRadius: '20px',
            border: '2px dashed var(--accent-primary)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          {/* Animated Laser Scanning Line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #00ffc8, transparent)',
              boxShadow: '0 0 15px #00ffc8',
              animation: 'scanLaser 2.2s infinite ease-in-out',
            }}
          />

          <div style={{ textAlign: 'center', color: 'var(--text-muted)', zIndex: 5 }}>
            <span style={{ fontSize: '36px' }}>📷</span>
            <div style={{ fontSize: '11px', marginTop: '6px' }}>Aim camera at Asset QR Tag</div>
          </div>
        </div>

        {/* Quick Demo Scan Tags */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Or click to simulate scanning sample QR tag:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {assets.slice(0, 4).map((a) => (
              <button
                key={a.tag}
                onClick={() => handleLookup(a.tag)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'var(--accent-primary-soft)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-accent)',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {a.tag}
              </button>
            ))}
          </div>
        </div>

        {/* Manual ID Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleLookup(); }} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. AST-A204-BED-01"
            value={inputTag}
            onChange={(e) => setInputTag(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Lookup
          </button>
        </form>

      </div>
    </div>
  );
}
