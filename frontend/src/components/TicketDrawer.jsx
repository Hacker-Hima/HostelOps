import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  closeTicketDrawer, addComment, rateTicket,
  assignWorkerToTicket, updateTicketPriority, markJobComplete,
  addToast, addAuditEntry,
  addCommentAsync, rateTicketAsync, assignWorkerAsync, updateTicketPriorityAsync, resolveTicketAsync,
} from '../redux/ticketSlice';

const CAT_MAP = { Electrical:'⚡', Plumbing:'💧', Furniture:'🪑', Networking:'📡', Appliance:'❄️', Default:'🔧' };

const statusBadge = (s) => {
  const m = { Pending:'badge-pending', 'In Progress':'badge-inprogress', Resolved:'badge-resolved' };
  return `badge ${m[s] || 'badge-unassigned'}`;
};

function buildTimeline(ticket) {
  return [
    { time: ticket.createdAt, action: 'Ticket Submitted', actor: ticket.student, icon: '📝', color: 'var(--accent-cyan)', done: true },
    ticket.assignedWorker !== 'Unassigned' && { time: 'Shortly after', action: `Assigned to ${ticket.assignedWorker}`, actor: 'Asst. Warden', icon: '👷', color: 'var(--accent-primary)', done: true },
    ticket.status === 'In Progress' && { time: 'Ongoing', action: 'Work in progress', actor: ticket.assignedWorker, icon: '🔧', color: 'var(--accent-yellow)', done: false },
    ticket.status === 'Resolved' && { time: 'Completed', action: 'Issue resolved & closed', actor: ticket.assignedWorker, icon: '✅', color: 'var(--accent-green)', done: true },
    ticket.status !== 'Resolved' && { time: 'Pending', action: 'Closure & verification', actor: '—', icon: '🔒', color: 'var(--text-muted)', done: false, locked: true },
  ].filter(Boolean);
}

/* ── Comment Thread ── */
function CommentThread({ ticketId, comments = [], currentRole }) {
  const dispatch   = useDispatch();
  const [text, setText] = useState('');
  const { currentUser } = useSelector(s => s.ticketStore);

  const roleLabels = {
    student: 'Student', staff: 'Staff', 'asst-warden': 'Asst. Warden',
    'res-warden': 'Res. Warden', technician: 'Technician',
    assets: 'Asset Manager', principal: 'Principal',
  };

  const handleSend = useCallback(async () => {
    if (!text.trim()) return;
    const author = currentUser.name;
    const role = roleLabels[currentRole] || currentRole;
    const commentText = text.trim();
    setText('');
    try {
      await dispatch(addCommentAsync({
        ticketId,
        comment: { author, role, text: commentText },
      })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: 'Comment saved to database', type: 'success' }));
    } catch {
      const comment = {
        id: `C${Date.now()}`,
        author,
        role,
        text: commentText,
        time: 'Just now',
      };
      dispatch(addComment({ ticketId, comment }));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: 'Comment added', type: 'success' }));
    }
  }, [text, dispatch, ticketId, currentRole, currentUser.name]);

  return (
    <div className="drawer-section">
      <div className="section-title">💬 Comments & Notes</div>
      <div className="drawer-comments">
        {comments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--text-muted)', fontSize: 12 }}>
            No comments yet. Be the first to add a note.
          </div>
        )}
        {comments.map(c => (
          <div key={c.id} className="comment-item">
            <div className="comment-avatar">{c.author.slice(0, 2).toUpperCase()}</div>
            <div className="comment-body">
              <div className="comment-meta">
                <strong>{c.author}</strong>
                <span className="dept-chip" style={{ fontSize: 8, padding: '1px 6px' }}>{c.role}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{c.time}</span>
              </div>
              <p className="comment-text">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <textarea
          className="form-textarea"
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a note or update..."
          style={{ marginBottom: 8, fontSize: 12 }}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSend(); }}
        />
        <button className="btn btn-primary btn-sm btn-full" onClick={handleSend} disabled={!text.trim()} style={{ opacity: text.trim() ? 1 : 0.5 }}>
          Send Comment
        </button>
      </div>
    </div>
  );
}

/* ── Star Rating ── */
function StarRating({ ticketId, existing }) {
  const dispatch = useDispatch();
  const [hover, setHover] = useState(0);
  const [rated, setRated] = useState(existing || 0);

  const handleRate = async (n) => {
    setRated(n);
    try {
      await dispatch(rateTicketAsync({ ticketId, rating: n })).unwrap();
      dispatch(addToast({ id: `toast-rate-${Date.now()}`, message: `Thanks for rating ${n} ⭐ — feedback saved to database!`, type: 'success' }));
    } catch {
      dispatch(rateTicket({ ticketId, rating: n }));
      dispatch(addToast({ id: `toast-rate-${Date.now()}`, message: `Thanks for rating ${n} ⭐ — feedback submitted!`, type: 'success' }));
    }
  };

  return (
    <div className="drawer-section" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--accent-green)' }}>✅ Issue Resolved — How did we do?</div>
      <div className="star-rating" style={{ marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            className={`star ${n <= (hover || rated) ? 'star-active' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRate(n)}
            aria-label={`Rate ${n} stars`}
          >★</button>
        ))}
      </div>
      {rated > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>You rated {rated}/5 — thank you!</div>}
    </div>
  );
}

/* ── Quick Actions by role ── */
function QuickActions({ ticket, currentRole, workers, onClose }) {
  const dispatch = useDispatch();
  const [showAssign, setShowAssign] = useState(false);
  const [selWorker, setSelWorker]   = useState('');
  const [notes, setNotes]           = useState('');

  const canAssign   = ['asst-warden', 'res-warden'].includes(currentRole);
  const canComplete = currentRole === 'technician';
  const canPriority = ['asst-warden', 'res-warden', 'principal'].includes(currentRole);

  const handleAssign = async () => {
    if (!selWorker) return;
    try {
      await dispatch(assignWorkerAsync({ ticketId: ticket.id, workerName: selWorker, actor: 'Dr. Meena Sharma (AW)' })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${selWorker} assigned to ${ticket.id} in database`, type: 'success' }));
    } catch {
      dispatch(assignWorkerToTicket({ ticketId: ticket.id, workerName: selWorker }));
      dispatch(addAuditEntry({ id: `AL-${Date.now()}`, action: 'Worker Assigned', actor: 'Dr. Meena Sharma (AW)', target: ticket.id, timestamp: new Date().toLocaleString(), category: 'Assignment' }));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${selWorker} assigned to ${ticket.id}`, type: 'success' }));
    }
    setShowAssign(false);
    onClose();
  };

  const handleComplete = async () => {
    try {
      await dispatch(resolveTicketAsync({
        ticketId: ticket.id,
        notes: notes || 'Work completed by technician.',
        actor: 'Sarathi Kamal (Worker)',
      })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${ticket.id} marked complete & saved in database!`, type: 'success' }));
    } catch {
      dispatch(markJobComplete(ticket.id));
      if (notes.trim()) {
        dispatch(addComment({ ticketId: ticket.id, comment: { id: `C${Date.now()}`, author: 'Sarathi Kamal', role: 'Technician', text: `✅ Job completed. Notes: ${notes}`, time: 'Just now' } }));
      }
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${ticket.id} marked complete!`, type: 'success' }));
    }
    onClose();
  };

  const handlePriority = async (p) => {
    try {
      await dispatch(updateTicketPriorityAsync({ ticketId: ticket.id, priority: p })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${ticket.id} priority changed to ${p}`, type: 'info' }));
    } catch {
      dispatch(updateTicketPriority({ ticketId: ticket.id, priority: p }));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${ticket.id} priority changed to ${p}`, type: 'info' }));
    }
  };

  if (ticket.status === 'Resolved') return null;

  return (
    <div className="drawer-section">
      <div className="section-title">⚡ Quick Actions</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {canPriority && (
          ['High', 'Medium', 'Low'].map(p => (
            <button key={p} className={`btn btn-sm btn-ghost priority-btn p-${p.toLowerCase()} ${ticket.priority === p ? 'selected' : ''}`} onClick={() => handlePriority(p)}>
              {p}
            </button>
          ))
        )}
        {canAssign && (
          <button className="btn btn-sm btn-primary" onClick={() => setShowAssign(p => !p)}>
            👷 {ticket.assignedWorker === 'Unassigned' ? 'Assign Worker' : 'Reassign'}
          </button>
        )}
      </div>

      {showAssign && (
        <div style={{ marginTop: 12 }}>
          {workers.map(w => (
            <div key={w.id} className={`worker-card ${selWorker === w.name ? 'selected' : ''}`} onClick={() => setSelWorker(w.name)}>
              <div className="avatar avatar-sm">{w.name.slice(0, 2).toUpperCase()}</div>
              <div className="worker-card-info">
                <strong>{w.name}</strong>
                <span>{w.skill} • ⭐{w.rating} • {w.jobs} jobs</span>
              </div>
              <span className={`badge badge-${w.availability === 'Available' ? 'resolved' : 'pending'}`}>{w.availability}</span>
            </div>
          ))}
          <button className="btn btn-primary btn-full btn-sm" style={{ marginTop: 8 }} disabled={!selWorker} onClick={handleAssign}>Confirm Assign</button>
        </div>
      )}

      {canComplete && (
        <div style={{ marginTop: 12 }}>
          <textarea className="form-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Completion notes (optional)..." style={{ marginBottom: 8, fontSize: 12 }} />
          <button className="btn btn-success btn-full" onClick={handleComplete}>✓ Mark Job Complete</button>
        </div>
      )}
    </div>
  );
}

/* ── Horizontal Ticket Lifecycle Stepper ── */
function TicketLifecycleStepper({ ticket, rating }) {
  const steps = [
    { label: 'Reported', done: true, current: ticket.status === 'Pending' && ticket.assignedWorker === 'Unassigned' },
    { label: 'Assigned', done: ticket.assignedWorker !== 'Unassigned', current: ticket.status === 'Pending' && ticket.assignedWorker !== 'Unassigned' },
    { label: 'In Progress', done: ticket.status === 'In Progress' || ticket.status === 'Resolved', current: ticket.status === 'In Progress' },
    { label: 'Resolved', done: ticket.status === 'Resolved', current: ticket.status === 'Resolved' && !rating },
    { label: 'Verified', done: Boolean(rating), current: false },
  ];

  return (
    <div className="ticket-lifecycle-stepper" role="group" aria-label="Ticket progress lifecycle">
      {steps.map((step, idx) => {
        const stateClass = step.done ? 'done' : step.current ? 'active' : 'pending';
        return (
          <div key={step.label} className={`lifecycle-step ${stateClass}`}>
            <div className="lifecycle-dot">
              {step.done ? '✓' : idx + 1}
            </div>
            <span className="lifecycle-step-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════ MAIN DRAWER ══════════════ */
export default function TicketDrawer() {
  const dispatch = useDispatch();
  const { drawerTicketId, tickets, ticketComments, ticketRatings, workers, currentRole } = useSelector(s => s.ticketStore);

  const ticket   = tickets.find(t => t.id === drawerTicketId);
  const comments = ticketComments[drawerTicketId] || [];
  const rating   = ticketRatings[drawerTicketId];
  const timeline = ticket ? buildTimeline(ticket) : [];

  const close = useCallback(() => dispatch(closeTicketDrawer()), [dispatch]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') close(); };
    if (drawerTicketId) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerTicketId, close]);

  if (!drawerTicketId) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={close} />
      <div className="ticket-drawer" role="dialog" aria-modal="true" aria-label={`Ticket ${drawerTicketId}`}>
        {/* Header */}
        <div className="ticket-drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-cyan)' }}>{drawerTicketId}</span>
              {ticket && <span className={statusBadge(ticket.status)}>{ticket.status}</span>}
              {ticket && <span className={`priority-tag p-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>}
            </div>
            <h3 style={{ fontSize: 15, marginTop: 5, color: 'var(--text-primary)' }}>{ticket?.title || 'Unknown Ticket'}</h3>
          </div>
          <button className="modal-close" onClick={close} aria-label="Close drawer">✕</button>
        </div>

        {!ticket ? (
          <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Ticket not found.</div>
        ) : (
          <div className="ticket-drawer-body">
            {/* Horizontal Lifecycle Stepper */}
            <div className="drawer-section" style={{ paddingBottom: 6 }}>
              <div className="section-title" style={{ marginBottom: 4 }}>📈 Lifecycle Status</div>
              <TicketLifecycleStepper ticket={ticket} rating={rating} />
            </div>

            {/* Description */}
            <div className="drawer-section">
              <div className="section-title">{CAT_MAP[ticket.category] || CAT_MAP.Default} Description</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{ticket.description}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', color: 'var(--text-secondary)' }}>📍 {ticket.room}</span>
                <span style={{ fontSize: 11, background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', color: 'var(--text-secondary)' }}>🏷️ {ticket.category}</span>
                <span style={{ fontSize: 11, background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', color: 'var(--text-secondary)' }}>👤 {ticket.student}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-sm)', padding: '3px 8px', color: 'var(--accent-cyan)' }}>🏷 {ticket.assetTag}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="drawer-section">
              <div className="section-title">🕐 Status Timeline</div>
              <div className="stepper">
                {timeline.map((step, i) => (
                  <div key={i} className={`step-item ${step.done ? 'done' : step.locked ? '' : 'current'}`}>
                    <div className={`step-dot ${step.done ? 'done' : step.locked ? 'locked' : 'current'}`} style={step.done ? { background: `${step.color}20`, color: step.color, borderColor: `${step.color}50` } : {}}>
                      {step.icon}
                    </div>
                    <div className="step-body">
                      <strong>{step.action}</strong>
                      <p>{step.actor} · {step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Worker */}
            {ticket.assignedWorker !== 'Unassigned' && (
              <div className="drawer-section">
                <div className="section-title">👷 Assigned Technician</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#f97316,#eab308)' }}>⚡</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{ticket.assignedWorker}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assigned technician</div>
                  </div>
                  <span className="badge badge-inprogress" style={{ marginLeft: 'auto' }}>On-site</span>
                </div>
              </div>
            )}

            {/* Satisfaction rating (student + resolved) */}
            {currentRole === 'student' && ticket.status === 'Resolved' && (
              <StarRating ticketId={ticket.id} existing={rating} />
            )}

            {/* Quick Actions */}
            <QuickActions ticket={ticket} currentRole={currentRole} workers={workers} onClose={close} />

            {/* Comments */}
            <CommentThread ticketId={ticket.id} comments={comments} currentRole={currentRole} />
          </div>
        )}
      </div>
    </>
  );
}
