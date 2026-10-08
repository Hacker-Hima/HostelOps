import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Settings,
  Building,
  Shield,
  Bell,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Server,
  Database,
  Sliders,
  Mail,
  Phone,
  RotateCcw,
  Palette,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

const AdminSettings = () => {
  const { user, login } = useAuth();
  const { language, setLanguage, themeMode, setThemeMode, themeColor, setThemeColor, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [saving, setSaving] = useState(false);

  // General Hostel Configuration
  const [generalSettings, setGeneralSettings] = useState({
    hostelName: 'HAMS Central University Hostel',
    hostelCode: 'HST-MAIN-01',
    address: 'Campus North Avenue, University Enclave',
    contactEmail: 'warden.office@hostel.edu',
    contactPhone: '+91 98765 43210',
    currencySymbol: 'INR (₹)',
    academicYear: '2025-2026',
    availableBlocks: 'Block A, Block B, Block C, Block D',
  });

  // System & Policy Settings
  const [policySettings, setPolicySettings] = useState({
    maxRequestsPerStudent: 3,
    autoAlertDays: 7,
    allowStudentRegistration: true,
    requireApprovalForReturns: true,
    maintenanceUrgencyThreshold: 'High',
  });

  // Admin Account & Password State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // System Diagnostics State
  const [systemHealth, setSystemHealth] = useState({
    status: 'Checking...',
    uptime: '',
    dbStatus: 'Connected',
  });

  useEffect(() => {
    // Load cached settings if saved in localStorage
    const savedGen = localStorage.getItem('hams_admin_settings_general');
    if (savedGen) {
      try {
        setGeneralSettings(JSON.parse(savedGen));
      } catch (e) {}
    }
    const savedPol = localStorage.getItem('hams_admin_settings_policy');
    if (savedPol) {
      try {
        setPolicySettings(JSON.parse(savedPol));
      } catch (e) {}
    }

    // Ping health API
    api.get('/health')
      .then((res) => {
        setSystemHealth({
          status: 'Online & Operational',
          uptime: `${Math.round(res.data.uptime || 0)}s`,
          dbStatus: 'MongoDB 127.0.0.1:27017 (Connected)',
        });
      })
      .catch(() => {
        setSystemHealth({
          status: 'Degraded',
          uptime: 'N/A',
          dbStatus: 'Check Local MongoDB Service',
        });
      });
  }, []);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('hams_admin_settings_general', JSON.stringify(generalSettings));
    setTimeout(() => {
      setSaving(false);
      setMessage({ text: 'Hostel configuration saved successfully.', type: 'success' });
    }, 400);
  };

  const handleSavePolicies = (e) => {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('hams_admin_settings_policy', JSON.stringify(policySettings));
    setTimeout(() => {
      setSaving(false);
      setMessage({ text: 'Asset requisition policies updated successfully.', type: 'success' });
    }, 400);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileData.newPassword) {
      if (profileData.newPassword.length < 6) {
        setMessage({ text: 'New password must be at least 6 characters.', type: 'danger' });
        return;
      }
      if (profileData.newPassword !== profileData.confirmPassword) {
        setMessage({ text: 'New passwords do not match.', type: 'danger' });
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        name: profileData.name,
        phone: profileData.phone,
      };
      if (profileData.newPassword) {
        payload.password = profileData.newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        setMessage({ text: 'Administrator profile and credentials updated.', type: 'success' });
        setProfileData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating administrator profile',
        type: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Warden & System Settings</h1>
          <p className="page-subtitle">
            Configure hostel asset management parameters, approval policies, system diagnostics, and admin credentials
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

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('general')}
          className={`btn btn-sm ${activeTab === 'general' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Building size={16} />
          <span>Hostel Information</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`btn btn-sm ${activeTab === 'policies' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Sliders size={16} />
          <span>Requisition Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Lock size={16} />
          <span>Admin Security</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`btn btn-sm ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Server size={16} />
          <span>System Diagnostics</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`btn btn-sm ${activeTab === 'appearance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          id="tab-admin-appearance"
        >
          <Palette size={16} />
          <span>{t('appearance')}</span>
        </button>
      </div>

      {/* Tab 1: General Hostel Info */}
      {activeTab === 'general' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Hostel Institutional Details
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              General metadata stamped onto asset reports, audit export documents, and resident notifications.
            </p>
          </div>

          <form onSubmit={handleSaveGeneral}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Hostel Facility Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalSettings.hostelName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, hostelName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hostel Facility Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalSettings.hostelCode}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, hostelCode: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Campus Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalSettings.address}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Warden Office Official Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={generalSettings.contactEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="form-control"
                  placeholder="9876543210"
                  value={generalSettings.contactPhone}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Currency Symbol</label>
                <input
                  type="text"
                  className="form-control"
                  value={generalSettings.currencySymbol}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, currencySymbol: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Recognized Hostel Blocks (Comma separated)</label>
              <input
                type="text"
                className="form-control"
                value={generalSettings.availableBlocks}
                onChange={(e) => setGeneralSettings({ ...generalSettings, availableBlocks: e.target.value })}
              />
              <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                Used for resident room allocations, block-level filtering, and inventory tracking.
              </small>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Policy & Requisition Rules */}
      {activeTab === 'policies' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Inventory Allocation & Requisition Policies
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Configure automatic approval rules, maximum possession ceilings, and maintenance thresholds.
            </p>
          </div>

          <form onSubmit={handleSavePolicies}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Max Active Requests per Student</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-control"
                  value={policySettings.maxRequestsPerStudent}
                  onChange={(e) => setPolicySettings({ ...policySettings, maxRequestsPerStudent: Number(e.target.value) })}
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Prevents student accounts from submitting unlimited simultaneous requisitions.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Maintenance Urgency Alert Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  className="form-control"
                  value={policySettings.autoAlertDays}
                  onChange={(e) => setPolicySettings({ ...policySettings, autoAlertDays: Number(e.target.value) })}
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Flags unresolved maintenance reports older than this threshold on the dashboard.
                </small>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={policySettings.allowStudentRegistration}
                  onChange={(e) => setPolicySettings({ ...policySettings, allowStudentRegistration: e.target.checked })}
                />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                  <strong>Allow Student Self-Registration:</strong> Permit students to sign up from the public register page.
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={policySettings.requireApprovalForReturns}
                  onChange={(e) => setPolicySettings({ ...policySettings, requireApprovalForReturns: e.target.checked })}
                />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                  <strong>Mandatory Physical Inspection:</strong> Require warden physical condition sign-off prior to unassigning assets.
                </span>
              </label>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Policies'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Security & Credentials */}
      {activeTab === 'security' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              Administrator Account & Credentials
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Update your name, contact phone, or set a new password secured via bcrypt encryption.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Administrator Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={user?.email || ''}
                  disabled
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Email identifier is linked to your JWT token and cannot be changed here.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Change Password (Optional)
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                Leave fields empty if you do not wish to change your current password.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Updating...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: System Diagnostics */}
      {activeTab === 'system' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              System Health & Architecture Telemetry
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Status of backend Express REST services, local MongoDB persistence, and security tokens.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Server size={18} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>REST Server</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>
                {systemHealth.status}
              </p>
              <small style={{ color: '#64748b' }}>Port 5000 • Express.js</small>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Database size={18} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Database</span>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                {systemHealth.dbStatus}
              </p>
              <small style={{ color: '#64748b' }}>Mongoose ODM 8.9</small>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Lock size={18} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Authentication</span>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                JWT + Bcrypt (10 Rounds)
              </p>
              <small style={{ color: '#64748b' }}>Stateless Bearer Tokens</small>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <RotateCcw size={18} color="#2563eb" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Server Uptime</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {systemHealth.uptime || 'Active'}
              </p>
              <small style={{ color: '#64748b' }}>Continuous runtime</small>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Appearance, Language & Theme Settings */}
      {activeTab === 'appearance' && (
        <div className="card">
          <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              {t('appearance')}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Global localization language, dark mode theme, and color accents apply throughout the entire HAMS system.
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
                id="admin-settings-language"
              >
                <option value="en">English (English)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="ml">മലയാളം (Malayalam)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
              <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                Updates navigation bars, sidebars, metrics, buttons, and dashboards across admin & student views.
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

export default AdminSettings;
