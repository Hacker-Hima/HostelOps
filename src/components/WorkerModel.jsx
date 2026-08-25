import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { assignWorkerToTicket } from '../redux/ticketSlice';

const SKILL_CATEGORIES = ['All', 'Electrician', 'Plumber', 'Carpenter'];

const CATEGORY_TO_SKILL = {
  Electrical: 'Electrician',
  Plumbing:   'Plumber',
  Furniture:  'Carpenter',
  Networking: 'Electrician',
  Appliance:  'Electrician',
};

/**
 * WorkerModel — Assign Outside Worker modal.
 *
 * Props:
 *   isOpen   : bool
 *   ticket   : ticket object
 *   onClose  : () => void
 */
export default function WorkerModel({ isOpen, ticket, onClose }) {
  const dispatch = useDispatch();
  const { workers } = useSelector((state) => state.ticketStore);

  const defaultSkill = ticket ? (CATEGORY_TO_SKILL[ticket.category] || 'All') : 'All';
  const [skillFilter, setSkillFilter] = useState(defaultSkill);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  // Reset when ticket changes
  const handleSelectWorker = useCallback((id) => {
    setSelectedWorkerId((prev) => (prev === id ? null : id));
  }, []);

  // Filtered workers by skill
  const filteredWorkers = useMemo(() => {
    if (skillFilter === 'All') return workers;
    return workers.filter((w) => w.skill === skillFilter);
  }, [workers, skillFilter]);

  const handleConfirm = useCallback(() => {
    if (!selectedWorkerId || !ticket) return;
    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (worker) {
      dispatch(assignWorkerToTicket({ ticketId: ticket.id, workerName: worker.name }));
    }
    onClose?.();
  }, [selectedWorkerId, ticket, workers, dispatch, onClose]);

  const handleSkillFilter = useCallback((skill) => {
    setSkillFilter(skill);
    setSelectedWorkerId(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3>Assign Outside Worker</h3>
            {ticket && (
              <p className="muted" style={{ marginTop: 4 }}>
                🎫 {ticket.id} — {ticket.title}
              </p>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Skill Filter */}
        <div className="form-group">
          <label className="form-label">Filter by Skill</label>
          <div className="chip-row">
            {SKILL_CATEGORIES.map((skill) => (
              <button
                key={skill}
                className={`chip ${skillFilter === skill ? 'chip-active' : ''}`}
                onClick={() => handleSkillFilter(skill)}
              >
                {skill === 'Electrician' && '⚡'} {skill === 'Plumber' && '💧'} {skill === 'Carpenter' && '🪑'}
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Worker List */}
        <div className="form-group">
          <label className="form-label">
            Available Workers ({filteredWorkers.length})
          </label>
          {filteredWorkers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 12 }}>
              No workers found for this skill category
            </div>
          ) : (
            filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                className={`worker-card ${selectedWorkerId === worker.id ? 'selected' : ''}`}
                onClick={() => handleSelectWorker(worker.id)}
              >
                <div className="avatar avatar-sm">{worker.name.slice(0, 2).toUpperCase()}</div>
                <div className="worker-card-info">
                  <strong>{worker.name}</strong>
                  <span>{worker.skill} • {worker.phone}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`badge badge-${worker.availability === 'Available' ? 'resolved' : 'rejected'}`} style={{ fontSize: 9 }}>
                    {worker.availability}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{worker.jobs} active jobs</span>
                </div>
                {selectedWorkerId === worker.id && (
                  <span style={{ color: 'var(--accent-cyan)', fontSize: 16, marginLeft: 4 }}>✓</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!selectedWorkerId}
            style={{ opacity: selectedWorkerId ? 1 : 0.5, cursor: selectedWorkerId ? 'pointer' : 'not-allowed' }}
          >
            ✓ Assign Worker
          </button>
        </div>
      </div>
    </div>
  );
}
