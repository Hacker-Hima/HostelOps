import React from 'react';

/* Skeleton shimmer cell */
function SkeletonCell({ width = '80%', height = 12, style = {} }) {
  return (
    <div
      className="skeleton-cell"
      style={{ width, height, borderRadius: 6, ...style }}
    />
  );
}

/* A single skeleton table row */
function SkeletonTableRow({ cols = 5 }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '13px 15px' }}>
          <SkeletonCell width={i === 0 ? '60%' : i === cols - 1 ? '40%' : '75%'} />
        </td>
      ))}
    </tr>
  );
}

/* Multiple skeleton rows */
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </>
  );
}

/* Skeleton card */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="skeleton-card" style={{ padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div className="skeleton-cell" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonCell width="55%" height={13} style={{ marginBottom: 6 }} />
          <SkeletonCell width="35%" height={10} />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonCell key={i} width={i === lines - 2 ? '45%' : '90%'} height={11} style={{ marginBottom: 7 }} />
      ))}
    </div>
  );
}

export default SkeletonTable;
