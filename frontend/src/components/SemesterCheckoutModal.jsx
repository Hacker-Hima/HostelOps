import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCheckoutModalOpen, addToast, fetchInitialData } from '../redux/ticketSlice';
import { audioFx } from '../utils/audioFx';
import api from '../services/api';

export default function SemesterCheckoutModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { residentsList = [], assets = [], currentUser } = useSelector((s) => s.ticketStore);

  const [selectedResidentRoll, setSelectedResidentRoll] = useState('');
  const [residentDetail, setResidentDetail] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize selected resident
  useEffect(() => {
    if (residentsList.length > 0 && !selectedResidentRoll) {
      setSelectedResidentRoll(residentsList[0].rollNumber);
    }
  }, [residentsList, selectedResidentRoll]);

  // Load resident details and associated assets
  useEffect(() => {
    if (!selectedResidentRoll) return;

    const res = residentsList.find((r) => r.rollNumber === selectedResidentRoll);
    setResidentDetail(res || null);

    if (res) {
      // Find assets in this room or allocated to student
      const roomAssets = assets.filter(
        (a) =>
          a.assigned_student_roll === res.rollNumber ||
          (a.room === res.roomNumber && a.block?.toLowerCase() === res.block?.toLowerCase())
      );

      setChecklist(
        roomAssets.map((a) => ({
          assetTag: a.tag,
          assetName: a.name,
          category: a.category,
          condition: a.condition || 'Good',
          isDamaged: a.condition !== 'Good',
          damageDescription: a.condition !== 'Good' ? (a.notes || 'Identified with defects') : '',
          penaltyAmount: a.condition !== 'Good' ? 500 : 0,
        }))
      );
    }
  }, [selectedResidentRoll, residentsList, assets]);

  if (!isOpen) return null;

  const handleToggleDamaged = (index) => {
    setChecklist((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newIsDamaged = !item.isDamaged;
        return {
          ...item,
          isDamaged: newIsDamaged,
          penaltyAmount: newIsDamaged ? (item.penaltyAmount || 500) : 0,
        };
      })
    );
    audioFx.playClick();
  };

  const handlePenaltyChange = (index, val) => {
    const num = Math.max(0, Number(val) || 0);
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, penaltyAmount: num } : item))
    );
  };

  const handleDescChange = (index, val) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, damageDescription: val } : item))
    );
  };

  const totalPenalty = checklist.reduce((acc, item) => (item.isDamaged ? acc + (item.penaltyAmount || 0) : acc), 0);

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();
    if (!selectedResidentRoll) return;

    setSubmitting(true);
    audioFx.playClick();

    try {
      const res = await api.residents.checkout(selectedResidentRoll, {
        inspectorName: currentUser?.name || 'Warden',
        items: checklist,
        remarks: remarks || 'End-of-Semester Room Inspection',
      });

      if (res && res.success) {
        audioFx.playSuccess();
        dispatch(
          addToast({
            id: `toast-chk-${Date.now()}`,
            message: res.message || 'Checkout inspection completed!',
            type: totalPenalty > 0 ? 'warn' : 'success',
          })
        );
        dispatch(fetchInitialData());
        onClose();
      }
    } catch (err) {
      audioFx.playPop(300);
      dispatch(
        addToast({
          id: `toast-chk-err-${Date.now()}`,
          message: err.message || 'Failed to complete checkout inspection.',
          type: 'error',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveClearance = async () => {
    if (!selectedResidentRoll) return;
    setSubmitting(true);
    audioFx.playClick();

    try {
      const res = await api.residents.clearance(selectedResidentRoll, {
        approvalStatus: 'Approved',
        remarks: 'Warden verified dues paid & room cleared.',
      });

      if (res && res.success) {
        audioFx.playSuccess();
        dispatch(
          addToast({
            id: `toast-clr-${Date.now()}`,
            message: `Clearance granted for ${residentDetail?.name}. Room & Bed released!`,
            type: 'success',
          })
        );
        dispatch(fetchInitialData());
        onClose();
      }
    } catch (err) {
      audioFx.playPop(300);
      dispatch(
        addToast({
          id: `toast-clr-err-${Date.now()}`,
          message: err.message || 'Clearance approval failed.',
          type: 'error',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 680, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>🏠 Semester Check-In / Check-Out Inspection</h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Conduct room asset audit, detect damage penalties, and release hostel rooms.
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmitCheckout} style={{ marginTop: 16 }}>
          {/* Select Resident */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                SELECT RESIDENT (STUDENT)
              </label>
              <select
                className="input-select"
                style={{ width: '100%', marginTop: 4, height: 38 }}
                value={selectedResidentRoll}
                onChange={(e) => setSelectedResidentRoll(e.target.value)}
              >
                {residentsList.map((r) => (
                  <option key={r.rollNumber} value={r.rollNumber}>
                    {r.name} ({r.rollNumber}) — Room {r.roomNumber} ({r.block})
                  </option>
                ))}
              </select>
            </div>

            {residentDetail && (
              <div
                style={{
                  background: 'var(--card-bg, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  📍 {residentDetail.block} • Room {residentDetail.roomNumber} ({residentDetail.bedNumber || 'Bed-1'})
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Status: <strong>{residentDetail.status}</strong> • Clearance:{' '}
                  <span
                    style={{
                      color:
                        residentDetail.clearanceStatus === 'Cleared'
                          ? 'var(--accent-green, #10b981)'
                          : 'var(--accent-red, #ef4444)',
                      fontWeight: 700,
                    }}
                  >
                    {residentDetail.clearanceStatus}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Asset Verification Checklist */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Room Asset Verification & Damage Audit
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {checklist.length} mapped physical assets
              </span>
            </div>

            {checklist.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12, border: '1px dashed var(--border-color)', borderRadius: 8 }}>
                No assets currently mapped to this room in the registry.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {checklist.map((item, idx) => (
                  <div
                    key={item.assetTag}
                    style={{
                      border: item.isDamaged
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid var(--border-color, #e2e8f0)',
                      background: item.isDamaged ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                      borderRadius: 8,
                      padding: 12,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          {item.assetName}{' '}
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                            ({item.assetTag})
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Category: {item.category}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleDamaged(idx)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: item.isDamaged
                            ? '1px solid var(--accent-red, #ef4444)'
                            : '1px solid var(--accent-green, #10b981)',
                          background: item.isDamaged ? '#ef4444' : 'rgba(16, 185, 129, 0.1)',
                          color: item.isDamaged ? '#fff' : 'var(--accent-green, #10b981)',
                        }}
                      >
                        {item.isDamaged ? '⚠ Flagged Damaged' : '✓ Good Condition'}
                      </button>
                    </div>

                    {/* Damage description and penalty input */}
                    {item.isDamaged && (
                      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                        <input
                          className="input-text"
                          style={{ height: 32, fontSize: 11 }}
                          placeholder="Describe damage (e.g. bent leg, broken hinge)..."
                          value={item.damageDescription}
                          onChange={(e) => handleDescChange(idx, e.target.value)}
                        />
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 8, top: 7, fontSize: 11, color: 'var(--text-muted)' }}>
                            ₹
                          </span>
                          <input
                            type="number"
                            className="input-text"
                            style={{ height: 32, fontSize: 11, paddingLeft: 22 }}
                            placeholder="Penalty"
                            value={item.penaltyAmount}
                            onChange={(e) => handlePenaltyChange(idx, e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
              WARDEN INSPECTION REMARKS
            </label>
            <textarea
              className="input-textarea"
              style={{ width: '100%', height: 60, marginTop: 4, fontSize: 12 }}
              placeholder="e.g. Room inspected, keys returned. Pending fine settlement with mess fees."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* Penalty Calculation Summary */}
          <div
            style={{
              marginTop: 18,
              padding: '12px 16px',
              borderRadius: 8,
              background: totalPenalty > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: totalPenalty > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL DAMAGE PENALTY</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: totalPenalty > 0 ? 'var(--accent-red, #ef4444)' : 'var(--accent-green, #10b981)',
                }}
              >
                ₹{totalPenalty.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: 12, textAlign: 'right', color: 'var(--text-secondary)' }}>
              {totalPenalty > 0 ? '⚠ Clearance will be flagged until paid' : '✓ Eligible for immediate room release'}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            {residentDetail && residentDetail.clearanceStatus === 'DamageFlagged' && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={handleApproveClearance}
                style={{ background: '#10b981', color: '#fff', border: 'none' }}
              >
                ✓ Waive/Approve Clearance & Release Room
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting Inspection...' : 'Log Checkout Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
