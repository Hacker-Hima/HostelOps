import React from 'react';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K', desc: 'Open command palette' },
    { key: 'Escape',   desc: 'Close any overlay / drawer / palette' },
    { key: '/',        desc: 'Focus search bar (when not in input)' },
    { key: '↑ / ↓',   desc: 'Navigate command palette results' },
    { key: '↵ Enter', desc: 'Select highlighted command palette item' },
    { key: 'Ctrl + ↵','desc': 'Send comment in ticket drawer' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 3 }}>⌨️ Keyboard Shortcuts</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Speed up your workflow with these shortcuts</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {shortcuts.map(({ key, desc }) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span>
              <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '3px 9px', fontSize: 11, fontWeight: 600, color: 'var(--text-accent)', fontFamily: 'monospace', letterSpacing: '0.03em', boxShadow: '0 2px 0 var(--border-default)' }}>{key}</kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--accent-primary-soft)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: 11, color: 'var(--text-accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💡</span>
          <span>Press <kbd style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-default)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>?</kbd> anytime to open this panel again.</span>
        </div>
      </div>
    </div>
  );
}
