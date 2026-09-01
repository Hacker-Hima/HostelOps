import React from 'react';

export default function EmptyState({ icon = '📭', title = 'Nothing here', subtitle = 'No data to display.', actionLabel, onAction, size = 'md' }) {
  const sizes = {
    sm: { padding: '24px 16px', iconSize: 28, titleSize: 13, subSize: 11 },
    md: { padding: '40px 24px', iconSize: 40, titleSize: 15, subSize: 12 },
    lg: { padding: '60px 32px', iconSize: 56, titleSize: 18, subSize: 13 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className="empty-state"
      style={{ padding: s.padding, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
    >
      <div
        className="empty-state-icon"
        style={{ fontSize: s.iconSize, lineHeight: 1, filter: 'grayscale(0.3)', marginBottom: 4 }}
      >
        {icon}
      </div>
      <div style={{ fontSize: s.titleSize, fontWeight: 700, color: 'var(--text-secondary)' }}>{title}</div>
      <div style={{ fontSize: s.subSize, color: 'var(--text-muted)', maxWidth: 260, lineHeight: 1.55 }}>{subtitle}</div>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
