import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../redux/ticketSlice';

/* ── Job Stopwatch Timer ── */
export function JobStopwatchTimer({ onInsertDuration }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  const toggle = () => setIsActive((a) => !a);
  const reset = () => {
    setIsActive(false);
    setSeconds(0);
  };

  const formatTime = () => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApply = () => {
    const mins = Math.max(1, Math.round(seconds / 60));
    if (onInsertDuration) {
      onInsertDuration(`Job Duration: ${mins} min${mins > 1 ? 's' : ''}`);
    }
  };

  return (
    <div className="time-log-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⏱️</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-info)' }}>
            WORK DURATION LOGGER
          </span>
        </div>
        <div className="time-display">{formatTime()}</div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-primary'}`}
          style={{ flex: 1, padding: '4px 8px', fontSize: 11 }}
          onClick={toggle}
        >
          {isActive ? '⏸ Pause' : seconds > 0 ? '▶ Resume' : '▶ Start Timer'}
        </button>

        {seconds > 0 && (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={reset}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm"
              style={{ padding: '4px 8px', fontSize: 11 }}
              onClick={handleApply}
            >
              Log to Notes
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Preventive Maintenance Schedule ── */
const ROUTINES = [
  { id: 'PM-1', title: 'Substation Earth Pit Resistance Audit', date: '04', mon: 'OCT', block: 'Main Substation', status: 'overdue', priority: 'High', completed: false },
  { id: 'PM-2', title: 'Block A Solar Water Heater Descaling', date: '08', mon: 'OCT', block: 'Block A Rooftop', status: 'due-soon', priority: 'Medium', completed: false },
  { id: 'PM-3', title: 'Fire Extinguisher Pressure Gauge Audit', date: '12', mon: 'OCT', block: 'Blocks A, B, Mess', status: 'scheduled', priority: 'High', completed: true },
  { id: 'PM-4', title: 'Central RO Plant Membrane Backwash', date: '16', mon: 'OCT', block: 'Dining Block', status: 'scheduled', priority: 'Normal', completed: false },
];

export function PreventiveMaintenanceSchedule() {
  const dispatch = useDispatch();
  const [routines, setRoutines] = useState(ROUTINES);

  const toggleCheck = (id) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === id) {
        const next = !r.completed;
        dispatch(addToast({
          id: `pm-${Date.now()}`,
          message: `${r.title} marked ${next ? 'inspected & logged' : 'pending'}`,
          type: next ? 'success' : 'info',
        }));
        return { ...r, completed: next };
      }
      return r;
    }));
  };

  const pendingCount = routines.filter(r => !r.completed).length;

  return (
    <div style={{ animation: 'fadeIn 0.25s ease', width: '100%' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🗓️</span>
            <span>Preventive Maintenance Schedule</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Quarterly engineering audits, electrical safety checks & equipment servicing routines
          </p>
        </div>
        <span className="badge badge-pending" style={{ fontSize: 12, padding: '6px 14px' }}>
          {pendingCount} Routines Pending
        </span>
      </div>

      {/* Routine Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
        gap: 16
      }}>
        {routines.map((r) => (
          <div
            key={r.id}
            className={`maintenance-item ${r.status === 'overdue' && !r.completed ? 'overdue' : ''} ${r.completed ? 'completed' : ''}`}
          >
            <div className="maintenance-date-box">
              <div className="maintenance-date-day">{r.date}</div>
              <div className="maintenance-date-mon">{r.mon}</div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {r.id}
                </span>
                <span className={`priority-tag p-${r.priority.toLowerCase()}`} style={{ fontSize: 9.5, padding: '2px 7px' }}>
                  {r.priority}
                </span>
                {r.status === 'overdue' && !r.completed && (
                  <span className="badge badge-rejected" style={{ fontSize: 9.5, padding: '2px 8px' }}>⚠️ Overdue</span>
                )}
                {r.status === 'due-soon' && !r.completed && (
                  <span className="badge badge-pending" style={{ fontSize: 9.5, padding: '2px 8px' }}>⏳ Due Soon</span>
                )}
              </div>
              <h4 style={{
                fontSize: 14.5,
                fontWeight: 700,
                margin: '0 0 6px 0',
                color: 'var(--text-primary)',
                textDecoration: r.completed ? 'line-through' : 'none',
                lineHeight: 1.4
              }}>
                {r.title}
              </h4>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>📍</span> <span>{r.block}</span>
              </div>
            </div>

            <button
              type="button"
              className={`btn ${r.completed ? 'btn-ghost' : 'btn-primary'}`}
              style={{
                fontSize: 12,
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                alignSelf: 'center',
                whiteSpace: 'nowrap'
              }}
              onClick={() => toggleCheck(r.id)}
            >
              {r.completed ? '✓ Logged' : 'Sign Off'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
