import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setProfileModalOpen, updateUserProfile, setRole, addToast } from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';

const ROLE_META = {
  student: {
    label: 'Student Resident',
    icon: '🎓',
    clearance: 'Level 1 · Resident Access',
    dept: 'Hostel Resident',
    permissions: ['Submit Complaints', 'QR Inventory Audit', 'Track Live SLA', 'Rate Resolutions'],
    color: 'var(--accent-cyan)',
  },
  staff: {
    label: 'Working Staff',
    icon: '👨‍🍳',
    clearance: 'Level 2 · Department Requisition',
    dept: 'Mess & Dining Department',
    permissions: ['Raise Equipment Requisitions', 'Track Multi-Tier Approvals', 'Kitchen Inventory Audit'],
    color: 'var(--accent-orange)',
  },
  'asst-warden': {
    label: 'Assistant Warden',
    icon: '🏫',
    clearance: 'Level 3 · Operations Dispatcher',
    dept: 'Hostel Operations Management',
    permissions: ['Complaint Dispatch', 'Worker Assignment', 'Block Health Monitoring', 'SLA Override'],
    color: 'var(--accent-primary)',
  },
  'res-warden': {
    label: 'Residential Warden',
    icon: '🏛️',
    clearance: 'Level 4 · Fiscal Approval Authority',
    dept: 'Administration & Budget Office',
    permissions: ['Budget Expense Sign-Off', 'Incident Audit Log Review', 'Staff Requisition Approval'],
    color: '#ec4899',
  },
  technician: {
    label: 'Field Technician',
    icon: '⚡',
    clearance: 'Level 2 · Field Operations',
    dept: 'Maintenance & Engineering Dept',
    permissions: ['Receive Job Dispatches', 'Upload Proof of Work', 'Toggle Shift Availability', 'Asset Inspection'],
    color: 'var(--accent-yellow)',
  },
  assets: {
    label: 'Asset Manager',
    icon: '📦',
    clearance: 'Level 3 · Inventory & Telemetry',
    dept: 'Central Stores & Logistics',
    permissions: ['QR Code Generation', 'Hardware Lifecycle Management', 'Room Hardware Audit', 'Telemetry Sync'],
    color: 'var(--accent-green)',
  },
  principal: {
    label: 'Principal Executive',
    icon: '👑',
    clearance: 'Level 5 · Supreme Administrator',
    dept: 'Campus Executive Directorate',
    permissions: ['Supreme Fiscal Sign-Off', 'Campus-Wide SLA Analytics', 'Full Audit Trail Access', 'Emergency Override'],
    color: 'var(--accent-red)',
  },
};

export default function UserProfileModal() {
  const dispatch = useDispatch();
  const { profileModalOpen, currentUser, currentRole, authToken, themeMode } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    block: '',
    floor: '',
    phone: '',
    email: '',
    rollNumber: '',
  });

  // Sync form data when modal opens or user updates
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        room: currentUser.room || '',
        block: currentUser.block || '',
        floor: currentUser.floor || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        rollNumber: currentUser.rollNumber || '',
      });
    }
  }, [currentUser, profileModalOpen]);

  if (!profileModalOpen) return null;

  const meta = ROLE_META[currentRole] || ROLE_META.student;

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile(formData));
    dispatch(addToast({
      id: `profile-saved-${Date.now()}`,
      message: 'Profile details saved successfully!',
      type: 'success',
    }));
    setIsEditing(false);
  };

  const handleSignOut = () => {
    dispatch(setProfileModalOpen(false));
    dispatch(setRole('login'));
    dispatch(addToast({
      id: `logout-${Date.now()}`,
      message: 'Signed out of workspace',
      type: 'info',
    }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={() => dispatch(setProfileModalOpen(false))}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--border-default)',
          borderRadius: 'var(--radius-2xl)',
          width: 'min(520px, 96vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-float)',
          padding: '24px 28px',
          position: 'relative',
          animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>👤</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                User Profile & Credentials
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Active Session Details · {meta.clearance.split('·')[0].trim()}
              </div>
            </div>
          </div>
          <button
            onClick={() => dispatch(setProfileModalOpen(false))}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            ✕
          </button>
        </div>

        {/* User Card Hero */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-root) 100%)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 18,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            boxShadow: 'var(--shadow-card)',
          }}>
            {currentUser?.initials || meta.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>
                {currentUser?.name || 'User Profile'}
              </div>
              <span style={{
                fontSize: 9.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 999,
                background: 'var(--accent-primary-soft)',
                color: 'var(--text-accent)',
                border: '1px solid var(--border-strong)',
              }}>
                {meta.label}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>
              {meta.dept} · {currentUser?.room || 'HQ'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {currentUser?.email || 'No email attached'}
            </div>
          </div>
        </div>

        {/* Details or Edit Form */}
        {!isEditing ? (
          <div>
            {/* Properties Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Role / Designation', value: meta.label, icon: '💼' },
                { label: 'Department / Unit', value: currentUser?.block || meta.dept, icon: '🏢' },
                { label: 'Room / Office', value: currentUser?.room || 'Admin 101', icon: '📍' },
                { label: 'Floor / Location', value: currentUser?.floor || 'Floor 1', icon: '🏗️' },
                { label: 'ID / Roll Number', value: currentUser?.rollNumber || 'STAFF-001', icon: '🎓' },
                { label: 'Contact Phone', value: currentUser?.phone || '+91 98765 00000', icon: '📞' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Access Permissions Checklist */}
            <div style={{
              background: 'var(--bg-root)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Authorized System Permissions ({meta.clearance})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {meta.permissions.map((perm) => (
                  <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>✓</span>
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, fontWeight: 700 }}
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Details
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Edit Profile Form */
          <form onSubmit={handleSave} style={{ animation: 'slideUp 0.2s ease' }}>
            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 18px',
              marginBottom: 18,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 14 }}>
                Edit Identity Details
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: 11 }}>Full Name</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Room / Office</label>
                  <input
                    className="form-input"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Block / Dept</label>
                  <input
                    className="form-input"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: 11 }}>ID / Roll Number</label>
                <input
                  className="form-input"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 11 }}>Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success"
                style={{ flex: 1.5, fontWeight: 700 }}
              >
                💾 Save Changes
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
