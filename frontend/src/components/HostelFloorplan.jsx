import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setFloorplanModalOpen,
  setSelectedRoomId,
  updateRoomAssetStatus,
  addTicket,
  addToast,
  openTicketDrawer,
} from '../redux/ticketSlice';
import { audioFx } from '../utils/audioFx';
import { useTranslation } from '../utils/translations';

const ASSET_ICONS = {
  ac: '❄️',
  fan: '💨',
  plumbing: '💧',
  wifi: '📡',
  desk: '🪑',
  geyser: '♨️',
  light: '💡',
};

const STATUS_CONFIG = {
  normal:   { label: 'Optimal',  color: 'var(--accent-green)',  border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.08)' },
  warning:  { label: 'Needs Care',color: 'var(--accent-yellow)', border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)' },
  critical: { label: 'Issue Logged', color: 'var(--accent-red)',  border: 'rgba(239,68,68,0.4)', bg: 'rgba(239,68,68,0.1)' },
};

export default function HostelFloorplan({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { roomMatrix, tickets, selectedRoomId } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const [activeBlock, setActiveBlock] = useState('All');
  const [activeFloor, setActiveFloor] = useState('All');
  const [inspectedRoomId, setInspectedRoomId] = useState(selectedRoomId || 'A-204');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Plumbing');

  const filteredRooms = useMemo(() => {
    return roomMatrix.filter((r) => {
      const matchBlock = activeBlock === 'All' || r.block.includes(activeBlock);
      const matchFloor = activeFloor === 'All' || r.floor === Number(activeFloor);
      return matchBlock && matchFloor;
    });
  }, [roomMatrix, activeBlock, activeFloor]);

  const inspectedRoom = useMemo(() => {
    return roomMatrix.find((r) => r.id === inspectedRoomId) || roomMatrix[0];
  }, [roomMatrix, inspectedRoomId]);

  const roomTickets = useMemo(() => {
    if (!inspectedRoom) return [];
    return tickets.filter((tk) => tk.room === inspectedRoom.id);
  }, [tickets, inspectedRoom]);

  const handleSelectRoom = (roomId) => {
    setInspectedRoomId(roomId);
    audioFx.playClick();
  };

  const handleToggleAssetStatus = (assetKey, currentStatus) => {
    const nextStatus = currentStatus === 'good' ? 'needs_repair' : currentStatus === 'needs_repair' ? 'damaged' : 'good';
    dispatch(updateRoomAssetStatus({
      roomId: inspectedRoom.id,
      assetKey,
      status: nextStatus,
    }));
    audioFx.playPop(480);
    dispatch(addToast({
      id: `toast-asset-${Date.now()}`,
      message: `${inspectedRoom.id} ${assetKey.toUpperCase()} status updated to ${nextStatus.replace('_', ' ')}`,
      type: 'info',
    }));
  };

  const handleQuickLogTicket = (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !inspectedRoom) return;

    const newId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
    const newTk = {
      id: newId,
      title: quickTitle,
      student: inspectedRoom.student,
      room: inspectedRoom.id,
      category: quickCategory,
      priority: 'High',
      status: 'Pending',
      assignedWorker: 'Unassigned',
      assetTag: `QR-${inspectedRoom.id}-${quickCategory.substring(0, 3).toUpperCase()}-01`,
      createdAt: 'Just now',
      creatorRole: 'Warden/Floorplan',
      description: `Dispatched from Interactive Floorplan Matrix for ${inspectedRoom.student}.`,
    };

    dispatch(addTicket(newTk));
    audioFx.playSuccess();
    setQuickTitle('');
    dispatch(addToast({
      id: `toast-tk-${Date.now()}`,
      message: `Ticket ${newId} logged for ${inspectedRoom.id}!`,
      type: 'success',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="floorplan-backdrop" onClick={onClose}>
      <div className="floorplan-modal" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="floorplan-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="floorplan-icon-badge">🗺️</div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Hostel 3D / Isometric Floorplan Matrix</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Live room telemetry, active ticket tracking & interactive asset inspector
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Filter Controls */}
        <div className="floorplan-toolbar">
          <div className="floorplan-filter-group">
            <span className="floorplan-filter-lbl">Block:</span>
            {['All', 'A', 'B', 'C', 'D'].map((blk) => (
              <button
                key={blk}
                className={`floorplan-chip ${activeBlock === blk ? 'active' : ''}`}
                onClick={() => { setActiveBlock(blk); audioFx.playPop(420); }}
              >
                {blk === 'All' ? 'All Blocks' : `Block ${blk}`}
              </button>
            ))}
          </div>

          <div className="floorplan-filter-group">
            <span className="floorplan-filter-lbl">Floor:</span>
            {['All', '1', '2', '3'].map((flr) => (
              <button
                key={flr}
                className={`floorplan-chip ${activeFloor === flr ? 'active' : ''}`}
                onClick={() => { setActiveFloor(flr); audioFx.playPop(420); }}
              >
                {flr === 'All' ? 'All Floors' : `Floor ${flr}`}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Showing {filteredRooms.length} Rooms
            </span>
          </div>
        </div>

        {/* Modal Body: Split View (Room Grid on Left, Room Inspector HUD on Right) */}
        <div className="floorplan-body">

          {/* Left: Rooms Matrix Grid */}
          <div className="floorplan-matrix-scroll">
            <div className="floorplan-rooms-grid">
              {filteredRooms.map((room) => {
                const isSelected = inspectedRoom && inspectedRoom.id === room.id;
                const statusStyle = STATUS_CONFIG[room.status] || STATUS_CONFIG.normal;
                const hasIssues = room.activeTickets.length > 0 || Object.values(room.assets || {}).some(v => v !== 'good');

                return (
                  <div
                    key={room.id}
                    className={`floorplan-room-card ${isSelected ? 'selected' : ''} ${hasIssues ? 'has-issue' : ''}`}
                    onClick={() => handleSelectRoom(room.id)}
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : statusStyle.border,
                      background: isSelected ? 'var(--accent-primary-soft)' : statusStyle.bg,
                    }}
                  >
                    {/* Room Top info */}
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <span className="room-card-number">{room.id}</span>
                      <span
                        className="room-card-status-dot"
                        style={{ background: statusStyle.color }}
                        title={statusStyle.label}
                      />
                    </div>

                    {/* Student Name */}
                    <div className="room-card-student truncate">👤 {room.student}</div>

                    {/* Mini Asset Icons strip */}
                    <div className="room-assets-strip">
                      {Object.entries(room.assets || {}).map(([key, val]) => (
                        <span
                          key={key}
                          className={`mini-asset-indicator ${val}`}
                          title={`${key.toUpperCase()}: ${val}`}
                        >
                          {ASSET_ICONS[key] || '🔧'}
                        </span>
                      ))}
                    </div>

                    {/* Active Tickets Pill */}
                    {room.activeTickets.length > 0 && (
                      <div className="room-active-tickets-tag">
                        ⚠️ {room.activeTickets.length} Ticket{room.activeTickets.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Room Inspector HUD */}
          {inspectedRoom && (
            <div className="floorplan-inspector-hud">
              <div className="inspector-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="inspector-room-badge">{inspectedRoom.id}</div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700 }}>{inspectedRoom.student}</h4>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {inspectedRoom.block} • Floor {inspectedRoom.floor}
                    </p>
                  </div>
                </div>
                <span
                  className="badge"
                  style={{
                    background: STATUS_CONFIG[inspectedRoom.status]?.bg,
                    color: STATUS_CONFIG[inspectedRoom.status]?.color,
                    borderColor: STATUS_CONFIG[inspectedRoom.status]?.border,
                  }}
                >
                  {STATUS_CONFIG[inspectedRoom.status]?.label}
                </span>
              </div>

              {/* Asset Health Controls */}
              <div style={{ marginTop: 14 }}>
                <div className="section-title" style={{ fontSize: 12, marginBottom: 8 }}>
                  ⚡ Interactive Asset Health (Click to Cycle Status)
                </div>
                <div className="inspector-assets-grid">
                  {Object.entries(inspectedRoom.assets || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className={`inspector-asset-btn ${val}`}
                      onClick={() => handleToggleAssetStatus(key, val)}
                    >
                      <span style={{ fontSize: 16 }}>{ASSET_ICONS[key] || '🔧'}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{key}</div>
                        <div className="asset-status-sub">{val.replace('_', ' ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Tickets */}
              <div style={{ marginTop: 16 }}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <div className="section-title" style={{ fontSize: 12, marginBottom: 0 }}>
                    📋 Active Room Tickets ({roomTickets.length})
                  </div>
                </div>
                {roomTickets.length === 0 ? (
                  <div style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: 8, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                    ✅ All room equipment operating optimally!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {roomTickets.map((tk) => (
                      <div
                        key={tk.id}
                        className="inspector-ticket-item"
                        onClick={() => { dispatch(openTicketDrawer(tk.id)); audioFx.playPop(520); }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tk.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tk.id} • {tk.assignedWorker}</div>
                        </div>
                        <span className={`priority-tag p-${tk.priority.toLowerCase()}`} style={{ fontSize: 9 }}>
                          {tk.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 1-Click Fast Ticket Dispatch Form */}
              <form onSubmit={handleQuickLogTicket} style={{ marginTop: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <div className="section-title" style={{ fontSize: 12, marginBottom: 8 }}>
                  🚀 Instant Ticket Dispatch
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    className="search-bar"
                    style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
                    placeholder="E.g., AC condenser leak..."
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                  />
                  <select
                    className="form-select"
                    style={{ width: 110, fontSize: 11, padding: '7px 6px' }}
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Networking">Networking</option>
                    <option value="Appliance">Appliance</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm btn-full">
                  ⚡ Dispatch Ticket to {inspectedRoom.id}
                </button>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
