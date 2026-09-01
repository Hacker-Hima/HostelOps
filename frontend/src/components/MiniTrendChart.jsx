import React, { useMemo } from 'react';

/**
 * MiniTrendChart — pure SVG area/line chart, no library needed.
 * Props:
 *   data      number[]  — array of values
 *   width     number    — SVG width (default 220)
 *   height    number    — SVG height (default 64)
 *   color     string    — stroke color (CSS var or hex)
 *   gradient  string[]  — [topColor, bottomColor] for area fill
 *   label     string    — optional label
 *   showDots  boolean   — show data points
 *   animated  boolean   — animate line draw on mount
 */
export default function MiniTrendChart({
  data = [],
  width = 220,
  height = 64,
  color = 'var(--accent-primary)',
  gradient = null,
  label = '',
  showDots = false,
  animated = true,
}) {
  const id = useMemo(() => `grad-${Math.random().toString(36).slice(2)}`, []);

  const points = useMemo(() => {
    if (!data.length) return { path: '', area: '', dots: [] };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 6;
    const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (width - pad * 2));
    const ys = data.map(v => pad + (1 - (v - min) / range) * (height - pad * 2));

    const linePts = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
    const areaPts = `${xs[0]},${height} ${linePts} ${xs[xs.length - 1]},${height}`;

    return { path: linePts, area: areaPts, dots: xs.map((x, i) => ({ x, y: ys[i] })) };
  }, [data, width, height]);

  const fillId = `url(#${id})`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</div>}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: 'visible', display: 'block' }}
        aria-label={label || 'Trend chart'}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={gradient?.[0] || color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={gradient?.[1] || color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <polygon
          points={points.area}
          fill={fillId}
          style={{ transition: animated ? 'all 0.8s ease' : 'none' }}
        />

        {/* Line */}
        <polyline
          points={points.path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 1px 6px ${color === 'var(--accent-primary)' ? 'rgba(124,58,237,0.4)' : 'rgba(0,0,0,0.3)'})`,
          }}
        />

        {/* Dots */}
        {showDots && points.dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3} fill={color} stroke="var(--bg-root)" strokeWidth={1.5} />
        ))}
      </svg>
    </div>
  );
}
