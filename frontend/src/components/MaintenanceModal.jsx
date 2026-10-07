import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMaintenanceModalOpen, reportMaintenanceAsync, addToast } from '../redux/ticketSlice';

export default function MaintenanceModal() {
  const dispatch = useDispatch();
  const {
    maintenanceModalOpen,
    assets,
    selectedAssetTag,
    currentUser,
    currentRole,
  } = useSelector((s) => s.ticketStore);

  const isStudent =
    currentRole === 'user' ||
    currentRole === 'student' ||
    currentUser?.role === 'user' ||
    currentUser?.role === 'student';

  // Build unique room list from existing assets across the hostel
  const availableRooms = useMemo(() => {
    const roomMap = new Map();
    (assets || []).forEach((a) => {
      const roomNum = (a.room || '').trim();
      const blockName = (a.block || '').trim() || 'Block A';
      if (roomNum) {
        const key = `${blockName} - Room ${roomNum}`;
        if (!roomMap.has(key)) {
          roomMap.set(key, {
            key,
            block: blockName,
            room: roomNum,
            label: `${blockName} — Room ${roomNum}`,
          });
        }
      }
    });

    // If current student has a room not yet in map, include it
    if (isStudent && currentUser?.room) {
      const sBlock = currentUser?.block || 'Block A';
      const sRoom = currentUser?.room;
      const key = `${sBlock} - Room ${sRoom}`;
      if (!roomMap.has(key)) {
        roomMap.set(key, {
          key,
          block: sBlock,
          room: sRoom,
          label: `${sBlock} — Room ${sRoom}`,
        });
      }
    }

    return Array.from(roomMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true })
    );
  }, [assets, isStudent, currentUser]);

  const [selectedRoomKey, setSelectedRoomKey] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize room when modal opens or user/selected asset changes
  useEffect(() => {
    if (!maintenanceModalOpen) return;

    if (isStudent) {
      const studentKey = `${currentUser?.block || 'Block A'} - Room ${currentUser?.room || '204'}`;
      setSelectedRoomKey(studentKey);
    } else if (selectedAssetTag) {
      const preAsset = (assets || []).find((a) => a.tag === selectedAssetTag);
      if (preAsset && preAsset.room) {
        setSelectedRoomKey(`${preAsset.block || 'Block A'} - Room ${preAsset.room}`);
      } else if (availableRooms.length > 0 && !selectedRoomKey) {
        setSelectedRoomKey(availableRooms[0].key);
      }
    } else if (!selectedRoomKey && availableRooms.length > 0) {
      setSelectedRoomKey(availableRooms[0].key);
    }
  }, [maintenanceModalOpen, isStudent, currentUser, selectedAssetTag, availableRooms]);

  // Determine active room metadata
  const activeRoomInfo = useMemo(() => {
    if (isStudent) {
      return {
        room: (currentUser?.room || '204').trim(),
        block: (currentUser?.block || 'Block A').trim(),
        label: `${currentUser?.block || 'Block A'} — Room ${currentUser?.room || '204'}`,
      };
    }
    const found = availableRooms.find((r) => r.key === selectedRoomKey);
    if (found) return found;
    if (availableRooms.length > 0) return availableRooms[0];
    return { room: '', block: '', label: 'Select Room' };
  }, [isStudent, currentUser, availableRooms, selectedRoomKey]);

  // Filter assets to ONLY those in the active room (excluding already disposed/retired assets)
  const roomAssets = useMemo(() => {
    const targetRoom = (activeRoomInfo.room || '').toLowerCase().trim();
    const targetBlock = (activeRoomInfo.block || '').toLowerCase().trim();

    return (assets || []).filter((a) => {
      // Exclude disposed or retired assets
      if (a.status === 'Disposed' || a.status === 'Retired') return false;

      // For students, also match assets explicitly assigned to their student roll
      if (isStudent && currentUser?.roll_number) {
        const studentRoll = currentUser.roll_number.toLowerCase().trim();
        const aRoll = (a.assigned_student_roll || a.assignedStudent?.roll || '').toLowerCase().trim();
        if (aRoll && aRoll === studentRoll) return true;
      }

      if (!targetRoom) return false;

      const aRoom = (a.room || '').toLowerCase().trim();
      const aLoc = (a.location || '').toLowerCase().trim();

      const matchesRoom =
        aRoom === targetRoom ||
        aLoc.includes(`room ${targetRoom}`) ||
        aLoc.endsWith(targetRoom);

      if (!matchesRoom) return false;

      // If target block is known, verify block match
      if (targetBlock) {
        const aBlock = (a.block || '').toLowerCase().trim();
        if (aBlock && aBlock !== targetBlock && !aLoc.includes(targetBlock)) {
          return false;
        }
      }

      return true;
    });
  }, [assets, activeRoomInfo, isStudent, currentUser]);

  // Keep assetTag in sync with the room's available assets
  useEffect(() => {
    if (!maintenanceModalOpen) return;

    if (selectedAssetTag && roomAssets.some((a) => a.tag === selectedAssetTag)) {
      setAssetTag(selectedAssetTag);
    } else if (roomAssets.length > 0) {
      if (!roomAssets.some((a) => a.tag === assetTag)) {
        setAssetTag(roomAssets[0].tag);
      }
    } else {
      setAssetTag('');
    }
  }, [maintenanceModalOpen, roomAssets, selectedAssetTag]);

  if (!maintenanceModalOpen) return null;

  const currentSelectedAsset = roomAssets.find((a) => a.tag === assetTag);

  const handleClose = () => {
    dispatch(setMaintenanceModalOpen(false));
    setIssueDescription('');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetTag) {
      alert('Please select a damaged asset from this room.');
      return;
    }
    if (!issueDescription.trim()) {
      alert('Please describe the issue or damage.');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        reportMaintenanceAsync({
          assetTag,
          issueDescription: issueDescription.trim(),
          urgency,
          reportedBy: `${currentUser?.name || 'Resident'} (${currentUser?.roll_number || currentUser?.role || 'User'})`,
          reporterRole: currentUser?.role === 'admin' ? 'Admin' : 'Student',
        })
      ).unwrap();

      dispatch(
        addToast({
          id: `mnt-${Date.now()}`,
          message: `Maintenance ticket reported successfully for ${assetTag} (${activeRoomInfo.label})!`,
          type: 'success',
        })
      );
      handleClose();
    } catch (err) {
      alert('Failed to report maintenance: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-surface-glass, #1e293b)',
          border: '1px solid var(--border-strong, rgba(255,255,255,0.15))',
          borderRadius: '24px',
          padding: '26px',
          boxShadow: 'var(--shadow-float, 0 20px 40px rgba(0,0,0,0.5))',
          color: 'var(--text-primary, #f8fafc)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              🛠️ Report Damaged Asset
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Log a repair ticket for equipment in your room
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '22px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Room Scope Card / Selector */}
        {isStudent ? (
          <div
            style={{
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📍 Your Room Location
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeRoomInfo.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                Resident: {currentUser?.name} ({currentUser?.roll_number || 'Room Resident'})
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '50px',
                background: roomAssets.length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: roomAssets.length > 0 ? '#10b981' : '#ef4444',
                border: `1px solid ${roomAssets.length > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {roomAssets.length} {roomAssets.length === 1 ? 'Asset' : 'Assets'}
            </span>
          </div>
        ) : (
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Select Hostel Room / Location *
            </label>
            <select
              value={selectedRoomKey}
              onChange={(e) => setSelectedRoomKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {availableRooms.map((r) => {
                const count = (assets || []).filter(
                  (a) =>
                    a.status !== 'Disposed' &&
                    a.status !== 'Retired' &&
                    ((a.room && a.room.toLowerCase() === r.room.toLowerCase()) ||
                      (a.location && a.location.toLowerCase().includes(`room ${r.room.toLowerCase()}`)))
                ).length;
                return (
                  <option key={r.key} value={r.key}>
                    {r.label} ({count} assets registered)
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Select Damaged Asset (Filtered to Room Only) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Select Damaged Asset in Room {activeRoomInfo.room} *
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {roomAssets.length} found in room
              </span>
            </div>

            {roomAssets.length > 0 ? (
              <select
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              >
                {roomAssets.map((a) => (
                  <option key={a.tag} value={a.tag}>
                    {a.tag} — {a.name} ({a.category} • {a.condition})
                  </option>
                ))}
              </select>
            ) : (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '12px',
                  lineHeight: '1.4',
                }}
              >
                ⚠️ <strong>No assets found in Room {activeRoomInfo.room}.</strong>
                <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                  If equipment in your room is not listed, please request asset allocation or contact hostel stores.
                </div>
              </div>
            )}
          </div>

          {/* Selected Asset Information Badge */}
          {currentSelectedAsset && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '11.5px',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Item Name:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{currentSelectedAsset.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Category:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{currentSelectedAsset.category}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Current Condition:</span>{' '}
                <span
                  style={{
                    color:
                      currentSelectedAsset.condition === 'Good'
                        ? '#10b981'
                        : currentSelectedAsset.condition === 'Needs Repair'
                          ? '#f59e0b'
                          : '#ef4444',
                    fontWeight: 700,
                  }}
                >
                  {currentSelectedAsset.condition}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                <span style={{ color: '#0284c7', fontWeight: 600 }}>{currentSelectedAsset.status}</span>
              </div>
            </div>
          )}

          {/* Issue Priority / Urgency */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Issue Priority / Urgency
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['Low', 'Medium', 'High', 'Critical'].map((p) => {
                const isSelected = urgency === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setUrgency(p)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--accent-primary, #0284c7)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'transparent' : 'var(--border-default)'}`,
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Detailed Issue Description *
            </label>
            <textarea
              required
              rows="3"
              placeholder="Describe the defect, breakdown, loose wiring, water leakage, or physical damage..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!assetTag || roomAssets.length === 0 || isSubmitting}
            style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '10px',
              background:
                !assetTag || roomAssets.length === 0
                  ? 'rgba(148, 163, 184, 0.2)'
                  : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              color: !assetTag || roomAssets.length === 0 ? 'var(--text-muted)' : '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: !assetTag || roomAssets.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: !assetTag || roomAssets.length === 0 ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.3)',
              transition: 'opacity 0.2s ease',
            }}
          >
            {isSubmitting ? 'Dispatching...' : 'Dispatch Repair Ticket →'}
          </button>
        </form>
      </div>
    </div>
  );
}

