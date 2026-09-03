import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import {
  openTicketDrawer,
  addToast,
  updateTicketPriority,
  markJobComplete,
} from '../redux/ticketSlice';

const CAT_MAP = {
  Electrical: '⚡',
  Plumbing: '💧',
  Furniture: '🪑',
  Networking: '📡',
  Appliance: '❄️',
  Default: '🔧',
};

const COLUMNS = [
  { id: 'Pending', label: 'Reported / Pending', color: 'var(--accent-yellow)', icon: '📝' },
  { id: 'Assigned', label: 'Assigned', color: 'var(--accent-primary)', icon: '👷' },
  { id: 'In Progress', label: 'In Progress', color: 'var(--accent-cyan)', icon: '🔧' },
  { id: 'Resolved', label: 'Resolved / Closed', color: 'var(--accent-green)', icon: '✅' },
];

export default function KanbanBoard({ tickets = [], onTicketMove, currentRole = 'warden' }) {
  const dispatch = useDispatch();
  const [draggedTicketId, setDraggedTicketId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [search, setSearch] = useState('');

  // Categorize tickets into columns
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchCat = filterCategory === 'All' || t.category === filterCategory;
      const matchPri = filterPriority === 'All' || t.priority === filterPriority;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.id?.toLowerCase().includes(q) ||
        t.room?.toLowerCase().includes(q) ||
        t.assignedWorker?.toLowerCase().includes(q);
      return matchCat && matchPri && matchSearch;
    });
  }, [tickets, filterCategory, filterPriority, search]);

  const getColTickets = (colId) => {
    return filteredTickets.filter((t) => {
      if (colId === 'Pending') {
        return t.status === 'Pending' && (t.assignedWorker === 'Unassigned' || !t.assignedWorker);
      }
      if (colId === 'Assigned') {
        return t.status === 'Pending' && t.assignedWorker && t.assignedWorker !== 'Unassigned';
      }
      if (colId === 'In Progress') {
        return t.status === 'In Progress';
      }
      if (colId === 'Resolved') {
        return t.status === 'Resolved';
      }
      return false;
    });
  };

  // Drag handlers
  const handleDragStart = (e, ticketId) => {
    setDraggedTicketId(ticketId);
    e.dataTransfer.setData('text/plain', ticketId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    setDragOverCol(null);
    const ticketId = e.dataTransfer.getData('text/plain') || draggedTicketId;
    if (!ticketId) return;

    if (onTicketMove) {
      onTicketMove(ticketId, targetColId);
    } else {
      // Default fallback move
      if (targetColId === 'Resolved') {
        dispatch(markJobComplete(ticketId));
        dispatch(addToast({ id: `toast-${Date.now()}`, message: `${ticketId} moved to Resolved`, type: 'success' }));
      } else {
        dispatch(addToast({ id: `toast-${Date.now()}`, message: `${ticketId} updated to ${targetColId}`, type: 'info' }));
      }
    }
    setDraggedTicketId(null);
  };

  const handleCardClick = (ticketId) => {
    dispatch(openTicketDrawer(ticketId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* ── Filters Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: '1 1 240px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search tickets by ID, room, worker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ width: '100%', height: 32, fontSize: 12 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-input"
              style={{ height: 32, fontSize: 12, padding: '0 8px' }}
            >
              <option value="All">All Categories</option>
              {Object.keys(CAT_MAP).filter(k => k !== 'Default').map(cat => (
                <option key={cat} value={cat}>{CAT_MAP[cat]} {cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="form-input"
              style={{ height: 32, fontSize: 12, padding: '0 8px' }}
            >
              <option value="All">All Priorities</option>
              <option value="High">🔴 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Kanban Grid ── */}
      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colTickets = getColTickets(col.id);
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`kanban-column ${isOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="kanban-col-header" style={{ borderTop: `3px solid ${col.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{col.icon}</span>
                  <span className="kanban-col-title">{col.label}</span>
                </div>
                <span className="kanban-col-count">{colTickets.length}</span>
              </div>

              {/* Column Cards */}
              <div className="kanban-col-body">
                {colTickets.length === 0 ? (
                  <div className="kanban-empty-col">
                    <span>No tickets in {col.label.toLowerCase()}</span>
                  </div>
                ) : (
                  colTickets.map((ticket) => {
                    const isDragging = draggedTicketId === ticket.id;
                    const catIcon = CAT_MAP[ticket.category] || CAT_MAP.Default;

                    return (
                      <div
                        key={ticket.id}
                        className={`kanban-card ${isDragging ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onClick={() => handleCardClick(ticket.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(ticket.id); }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-accent)', fontWeight: 700 }}>
                            {ticket.id}
                          </span>
                          <span className={`priority-tag p-${ticket.priority?.toLowerCase()}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                            {ticket.priority}
                          </span>
                        </div>

                        <div className="kanban-card-title">{ticket.title}</div>

                        <div className="kanban-card-meta" style={{ marginTop: 8 }}>
                          <span>{catIcon} {ticket.room}</span>
                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {ticket.assignedWorker !== 'Unassigned' ? (
                              <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: 10 }}>
                                👷 {ticket.assignedWorker?.split(' ')[0]}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                                Unassigned
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
