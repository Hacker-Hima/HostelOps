import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Settings,
  User,
  Bell,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Building,
  Phone,
  Mail,
  Shield,
  HelpCircle,
  Palette,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

const StudentSettings = () => {
  const { user } = useAuth();
  const { language, setLanguage, themeMode, setThemeMode, themeColor, setThemeColor, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  // Student Profile Data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    studentId: user?.studentId || '',
    hostelBlock: user?.hostelBlock || 'Block A',
    roomNumber: user?.roomNumber || '101',
    phone: user?.phone || '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    requestApprovalEmail: true,
    maintenanceStatusEmail: true,
    inventoryAuditAlerts: true,
  });

  useEffect(() => {
    // Load cached notification settings
    const saved = localStorage.getItem('hams_student_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {}
    }
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        studentId: user.studentId || '',
        hostelBlock: user.hostelBlock || 'Block A',
        roomNumber: user.roomNumber || '101',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setMessage({ text: 'New password must be at least 6 characters long.', type: 'danger' });
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ text: 'New passwords do not match.', type: 'danger' });
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        phone: formData.phone,
        studentId: formData.studentId,
      };
      if (formData.newPassword) {
        payload.password = formData.newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        setMessage({ text: 'Student profile settings updated successfully.', type: 'success' });
        setFormData((prev) => ({
          ...prev,
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating student profile',
        type: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('hams_student_notifications', JSON.stringify(notifications));
    setTimeout(() => {
      setSaving(false);
      setMessage({ text: 'Notification preferences saved.', type: 'success' });
    }, 300);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resident Account & Settings</h1>
          <p className="page-subtitle">
            Manage your student details, room identification, alerts, and password credentials
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`alert alert-${message.type}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <User size={16} />
          <span>Profile & Room Info</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`btn btn-sm ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Bell size={16} />
          <span>Notification Preferences</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Lock size={16} />
          <span>Account Security</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`btn btn-sm ${activeTab === 'appearance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          id="tab-student-appearance"
        >
          <Palette size={16} />
          <span>{t('appearance')}</span>
        </button>
      </div>

      {/* Profile & Room Info */}
      {activeTab === 'profile' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Hostel Resident Details
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Your current room allocation and student directory contact details.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Login ID)</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  disabled
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Student ID / Roll Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="e.g. HST-2026-0204"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 00000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allocated Hostel Block</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.hostelBlock}
                  disabled
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Room relocations must be updated by the Hostel Warden via Admin Panel.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Allocated Room Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.roomNumber}
                  disabled
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Hostel Notification Preferences
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Select which notifications you wish to receive regarding your room assets and requisitions.
            </p>
          </div>

          <form onSubmit={handleSaveNotifications}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: '0.2rem' }}
                  checked={notifications.requestApprovalEmail}
                  onChange={(e) => setNotifications({ ...notifications, requestApprovalEmail: e.target.checked })}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>
                    Asset Requisition Status Updates
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Receive real-time notifications when the Hostel Warden approves or rejects your requested asset.
                  </span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: '0.2rem' }}
                  checked={notifications.maintenanceStatusEmail}
                  onChange={(e) => setNotifications({ ...notifications, maintenanceStatusEmail: e.target.checked })}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>
                    Damage & Maintenance Resolution Alerts
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Get notified when reported damaged assets are scheduled for technician repair or marked resolved.
                  </span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: '0.2rem' }}
                  checked={notifications.inventoryAuditAlerts}
                  onChange={(e) => setNotifications({ ...notifications, inventoryAuditAlerts: e.target.checked })}
                />
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>
                    Annual Room Inventory Audit Notices
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Alerts regarding physical inventory checks and semester end-of-term asset clearances.
                  </span>
                </div>
              </label>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Password */}
      {activeTab === 'security' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Change Password & Credentials
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Update your account password with standard bcrypt encryption.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Lock size={16} />
                <span>{saving ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appearance & Themes */}
      {activeTab === 'appearance' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              {t('appearance')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Choose your preferred language, lighting mode, and accent theme color.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Language Selector */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={16} color="var(--primary)" />
                <span>{t('language')}</span>
              </label>
              <select
                className="form-control"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setMessage({ text: `Language changed to ${e.target.options[e.target.selectedIndex].text}`, type: 'success' });
                }}
                id="student-settings-language"
              >
                <option value="en">English (English)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
              <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                Updates all resident dashboard panels, inventory views, and forms.
              </small>
            </div>

            {/* Theme Mode */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sun size={16} color="var(--primary)" />
                <span>{t('themeMode')}</span>
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('light');
                    setMessage({ text: 'Light mode enabled.', type: 'success' });
                  }}
                  className={`btn ${themeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Sun size={15} />
                  <span>{t('lightMode')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThemeMode('dark');
                    setMessage({ text: 'Dark mode enabled.', type: 'success' });
                  }}
                  className={`btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Moon size={15} />
                  <span>{t('darkMode')}</span>
                </button>
              </div>
            </div>

            {/* Theme Color Palette */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Palette size={16} color="var(--primary)" />
                <span>{t('themeColor')}</span>
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                {[
                  { name: 'Blue', hex: '#2563eb' },
                  { name: 'Emerald', hex: '#059669' },
                  { name: 'Purple', hex: '#7c3aed' },
                  { name: 'Amber', hex: '#ea580c' },
                  { name: 'Rose', hex: '#e11d48' },
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => {
                      setThemeColor(color.hex);
                      setMessage({ text: `${color.name} theme color applied.`, type: 'success' });
                    }}
                    title={color.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color.hex,
                      border: themeColor === color.hex ? '3px solid #0f172a' : '2px solid #ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                      transform: themeColor === color.hex ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSettings;
