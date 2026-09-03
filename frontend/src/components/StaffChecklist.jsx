import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../redux/ticketSlice';

const INITIAL_TASKS = [
  { id: 'T1', time: '06:00 AM', text: 'Kitchen Counter Sanitation & Disinfection', category: 'Hygiene', completed: true },
  { id: 'T2', time: '07:00 AM', text: 'Water Filtration Unit TDS & Pressure Check', category: 'Water', completed: true },
  { id: 'T3', time: '08:00 AM', text: 'Cold Storage Room Temperature Audit (<= 4°C)', category: 'Safety', completed: true },
  { id: 'T4', time: '09:30 AM', text: 'Commercial LPG Cylinder Bank Leak Sensor Test', category: 'Safety', completed: false },
  { id: 'T5', time: '11:00 AM', text: 'Vegetable Freshness & Weight Inspection', category: 'Quality', completed: false },
  { id: 'T6', time: '02:30 PM', text: 'Dining Hall Floor Scrubbing & Table Wipe-Down', category: 'Hygiene', completed: false },
  { id: 'T7', time: '05:30 PM', text: 'Evening Tea Boilers & Utensil Steam Wash', category: 'Hygiene', completed: false },
  { id: 'T8', time: '09:00 PM', text: 'Organic Wet Waste Disposal & Kitchen Locking Protocol', category: 'Security', completed: false },
];

export default function StaffDailyChecklist() {
  const dispatch = useDispatch();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [handoverNote, setHandoverNote] = useState('');

  const completedCount = tasks.filter(t => t.completed).length;
  const pct = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const next = !t.completed;
        dispatch(addToast({
          id: `task-${Date.now()}`,
          message: `${t.text} marked as ${next ? 'completed' : 'pending'}`,
          type: next ? 'success' : 'info',
        }));
        return { ...t, completed: next };
      }
      return t;
    }));
  };

  const markAllComplete = () => {
    setTasks(prev => prev.map(t => ({ ...t, completed: true })));
    dispatch(addToast({ id: `all-${Date.now()}`, message: 'All daily tasks marked complete!', type: 'success' }));
  };

  const handleSaveHandover = (e) => {
    e.preventDefault();
    if (!handoverNote.trim()) return;
    dispatch(addToast({ id: `ho-${Date.now()}`, message: 'Shift handover note saved to warden log!', type: 'success' }));
    setHandoverNote('');
  };

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
            <span>✅</span>
            <span>Daily Operations Checklist</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Daily SOP safety audits & hygiene routines for Mess, Dining & Facilities
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={markAllComplete}
          disabled={pct === 100}
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            padding: '8px 18px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-pill)'
          }}
        >
          Check All Complete ✓
        </button>
      </div>

      {/* Progress Bar Card */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: 20,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Shift Routine Completion</span>
          <span style={{ fontWeight: 800, color: pct === 100 ? 'var(--accent-green)' : 'var(--accent-primary)', fontSize: 14 }}>
            {completedCount} of {tasks.length} Completed ({pct}%)
          </span>
        </div>
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: pct === 100 ? 'var(--color-success)' : 'var(--grad-primary)',
            transition: 'width 0.4s ease',
            borderRadius: 999
          }} />
        </div>
      </div>

      {/* Checklist Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        {tasks.map((t) => (
          <div
            key={t.id}
            className={`checklist-item ${t.completed ? 'checked' : ''}`}
            onClick={() => toggleTask(t.id)}
            role="checkbox"
            aria-checked={t.completed}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleTask(t.id); }}
          >
            <div className="checklist-checkbox">
              {t.completed ? '✓' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {t.time}
              </span>
              <span className="badge badge-unassigned" style={{ fontSize: 9.5, padding: '2px 8px', alignSelf: 'flex-start' }}>
                {t.category}
              </span>
            </div>
            <div className="checklist-text">
              {t.text}
            </div>
          </div>
        ))}
      </div>

      {/* Shift Handover Note */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: 22,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📝</span>
          <span>Shift Handover Log for Next Staff & Warden</span>
        </h4>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Record operational handovers, vendor deliveries, and safety notes.</p>
        <form onSubmit={handleSaveHandover} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <textarea
            className="form-input"
            rows={2}
            value={handoverNote}
            onChange={(e) => setHandoverNote(e.target.value)}
            placeholder="e.g. Milk delivery confirmed for 5:00 AM; Cold storage door seal inspected..."
            style={{ flex: 1, fontSize: 12.5, resize: 'vertical', minHeight: 46 }}
          />
          <button type="submit" className="btn btn-primary" disabled={!handoverNote.trim()} style={{ whiteSpace: 'nowrap', padding: '12px 20px', height: 46 }}>
            Log Handover
          </button>
        </form>
      </div>
    </div>
  );
}
