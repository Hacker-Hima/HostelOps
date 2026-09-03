import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setRole, addToast } from '../redux/ticketSlice';
import { api } from '../services/api';
import { useTranslation } from '../utils/translations';

/* â”€â”€ Role definitions (full data preserved) â”€â”€ */
const ROLES = [
  {
    id: 'student', category: 'residents', icon: '🎓',
    name: 'Student Resident', sampleId: '21CS204', samplePass: 'student@123',
    clearance: 'Level 1 - Resident',
    desc: 'Submit room complaints, track live technician dispatch & repair progress.',
    color: '#06b6d4', bgColor: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.3)',
    user: { name: 'Himachalam', initials: 'HC', room: 'A-204', block: 'Block A', floor: 'Floor 2', rollNumber: '21CS204', email: 'hima@hostel.edu', phone: '+91 98765 43210', role: 'student' },
  },
  {
    id: 'staff', category: 'residents', icon: '👨‍🍳',
    name: 'Working Staff', sampleId: 'STAFF-409', samplePass: 'staff@123',
    clearance: 'Level 2 - Operations',
    desc: 'Raise equipment & grocery requisition tickets, track the approval pipeline.',
    color: '#f97316', bgColor: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.3)',
    user: { name: 'Sanji', initials: 'SJ', room: 'Mess Staff Qtrs', block: 'Block A', floor: 'Ground Floor', rollNumber: 'STAFF-409', email: 'sanji@hostel.edu', phone: '+91 98765 12345', role: 'staff' },
  },
  {
    id: 'asst-warden', category: 'admin', icon: '🏫',
    name: 'Assistant Warden', sampleId: 'AW-002', samplePass: 'warden@123',
    clearance: 'Level 3 - Dispatcher',
    desc: 'Review complaints, dispatch technicians, track SLA metrics & block health.',
    color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)',
    user: { name: 'Dr. Meena Sharma', initials: 'MS', room: 'Warden Office 101', block: 'Admin Block', floor: 'Floor 1', rollNumber: 'AW-002', email: 'meena@hostel.edu', phone: '+91 98765 99887', role: 'asst-warden' },
  },
  {
    id: 'res-warden', category: 'admin', icon: '🏛️',
    name: 'Residential Warden', sampleId: 'RW-001', samplePass: 'reswarden@123',
    clearance: 'Level 4 - Fiscal Authority',
    desc: 'Approve budget expenses, review high-priority incidents, inspect audit logs.',
    color: '#ec4899', bgColor: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.3)',
    user: { name: 'Prof. R. Iyer', initials: 'RI', room: 'Res. Warden Office', block: 'Admin Block', floor: 'Floor 2', rollNumber: 'RW-001', email: 'iyer@hostel.edu', phone: '+91 98765 77665', role: 'res-warden' },
  },
  {
    id: 'technician', category: 'maintenance', icon: '⚡',
    name: 'Technician', sampleId: 'TECH-101', samplePass: 'tech@123',
    clearance: 'Level 2 - Field Maintenance',
    desc: 'Receive job dispatches, view room location maps, upload repair proof.',
    color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)',
    user: { name: 'Sarathi Kamal', initials: 'SK', room: 'Maintenance Hub', block: 'Block B', floor: 'Ground Floor', rollNumber: 'TECH-101', email: 'sarathi@hostel.edu', phone: '+91 98765 43210', role: 'technician' },
  },
  {
    id: 'assets', category: 'maintenance', icon: '📦',
    name: 'Asset Logistics', sampleId: 'MGR-301', samplePass: 'assets@123',
    clearance: 'Level 3 - Inventory',
    desc: 'QR telemetry, inventory conditions, room hardware audit & lifecycle tracking.',
    color: '#10b981', bgColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)',
    user: { name: 'Asset Manager', initials: 'AM', room: 'Asset Logistics', block: 'Central Store', floor: 'Floor 1', rollNumber: 'MGR-301', email: 'assets@hostel.edu', phone: '+91 98765 33221', role: 'assets' },
  },
  {
    id: 'principal', category: 'admin', icon: '👑',
    name: 'Principal', sampleId: 'EXEC-001', samplePass: 'principal@123',
    clearance: 'Level 5 - Administrator',
    desc: 'High-value fiscal sign-offs, campus-wide SLA metrics, operations dashboard.',
    color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)',
    user: { name: 'Dr. K. Sundaram', initials: 'KS', room: 'Executive Suite', block: 'Main Campus', floor: 'Floor 3', rollNumber: 'EXEC-001', email: 'principal@hostel.edu', phone: '+91 98765 11100', role: 'principal' },
  },
];

const CATEGORY_LABELS = {
  residents:   'Residents & Staff',
  admin:       'Administration',
  maintenance: 'Maintenance & Assets',
};

const BRAND_METRICS = [
  { value: '2,480+', label: 'Residents' },
  { value: '99.4%',  label: 'SLA Adherence' },
  { value: '< 15m',   label: 'Avg. Dispatch' },
];

const LIVE_DISPATCHES = [
  { id: 'T-4029', icon: '⚡', title: 'HVAC Compressor Calibrated', location: 'Block B • Rm 304', status: 'Resolved', color: '#10b981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)' },
  { id: 'T-4031', icon: '💧', title: 'Hydro-Pneumatic Line', location: 'Mess Wing • Floor 1', status: 'Dispatched', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.35)' },
  { id: 'T-4035', icon: '📡', title: 'Mesh AP Node Sync', location: 'Admin Block • Rm 102', status: 'Active', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)' },
];

const SECURITY_PILLARS = [
  { icon: '🛡️', title: 'Granular 5-Tier RBAC' },
  { icon: '⚡', title: 'Real-Time Dispatch' },
  { icon: '📦', title: 'QR Asset Lifecycle' },
  { icon: '🔐', title: '256-Bit Encrypted' },
];

const CATEGORY_ORDER = ['residents', 'admin', 'maintenance'];
const GROUPED_ROLES = CATEGORY_ORDER
  .map((cat) => ({ category: cat, roles: ROLES.filter((r) => r.category === cat) }))
  .filter((g) => g.roles.length > 0);

export default function LoginPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [selectedRole, setSelectedRole] = useState(null);
  const [userId,       setUserId]       = useState('');
  const [password,     setPassword]     = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [inputError,   setInputError]   = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setUserId(role.sampleId);
    setPassword(role.samplePass);
    setErrorMsg('');
    setInputError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInputError('');
    if (!selectedRole) { setErrorMsg('Please select a role first.'); return; }
    if (!userId.trim()) { setInputError('userId'); setErrorMsg('Please enter your User ID.'); return; }
    if (!password.trim()) { setInputError('password'); setErrorMsg('Please enter your password.'); return; }

    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      let authResponse;
      try {
        authResponse = await api.auth.login({ username: userId.trim(), password: password.trim(), role: selectedRole.id });
      } catch (apiErr) {
        const msg = apiErr.message || 'Invalid credentials';
        // If backend server is offline or unreachable, seamlessly fall back to demo credentials
        if (msg.includes('Failed to fetch') || msg.includes('Network') || msg.includes('connection refused') || msg.includes('Load failed')) {
          authResponse = {
            token: `jwt_demo_${Date.now()}`,
            user: selectedRole.user,
          };
        } else {
          setIsLoading(false);
          setInputError('both');
          setErrorMsg(msg.includes('401') || msg.includes('Authentication')
            ? `Incorrect credentials for ${selectedRole.name}. Demo credentials are pre-filled.`
            : msg);
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 300));
      setIsLoading(false);
      dispatch(setRole({ role: selectedRole.id, token: authResponse?.token || `jwt_sec_${Date.now()}`, user: authResponse?.user || selectedRole.user }));
      dispatch(addToast({ id: `login-${Date.now()}`, message: `Welcome, ${authResponse?.user?.name || selectedRole.user.name}!`, type: 'success' }));
    } catch {
      setIsLoading(false);
      setErrorMsg('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="login-split">

      {/* BRAND PANEL */}
      <div className="login-brand-panel">
        <div className="login-brand-mesh" aria-hidden="true">
          <div className="login-brand-orb login-brand-orb-1" />
          <div className="login-brand-orb login-brand-orb-2" />
          <div className="login-brand-orb login-brand-orb-3" />
        </div>

        <div className="login-brand-content">
          <div className="login-brand-header">
            <div className="login-brand-logo-wrap">
              <div className="login-brand-logo-glow" aria-hidden="true" />
              <div className="login-brand-logo" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 3L4 11V31C4 32.1 4.9 33 6 33H30C31.1 33 32 32.1 32 31V11L18 3Z" fill="url(#heroBrandGrad)" fillOpacity="0.2" />
                  <path d="M18 3L4 11V31C4 32.1 4.9 33 6 33H30C31.1 33 32 32.1 32 31V11L18 3Z" stroke="url(#heroBrandGrad)" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M18 3V33" stroke="url(#heroBrandGrad)" strokeWidth="1.5" strokeDasharray="2 2" />
                  <path d="M10 16H14M10 21H14M10 26H14" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
                  <path d="M22 16H26M22 21H26M22 26H26" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                  <path d="M15 33V27H21V33" stroke="url(#heroBrandGrad)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="18" cy="10" r="2.2" fill="#38bdf8" />
                  <defs>
                    <linearGradient id="heroBrandGrad" x1="4" y1="3" x2="32" y2="33" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#8b5cf6" />
                      <stop offset="0.5" stopColor="#3b82f6" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="login-brand-chip">
              <span className="login-pulse-dot" />
              <span>Campus Ops System • v2.4</span>
            </div>

            <div className="login-brand-wordmark">HostelOps</div>
            <p className="login-brand-tagline">
              Unified facility management, instant technician dispatches, and real-time SLA governance.
            </p>
          </div>

          {/* Live Operations Telemetry Card */}
          <div className="login-telemetry-card">
            <div className="login-telemetry-header">
              <div className="login-telemetry-title">
                <span className="login-pulse-dot" />
                <span>Live Operational Telemetry</span>
              </div>
              <span className="login-telemetry-status-badge">99.8% ONLINE</span>
            </div>

            {/* Quick Metrics */}
            <div className="login-stat-grid">
              {BRAND_METRICS.map((m) => (
                <div className="login-stat-card" key={m.label}>
                  <div className="login-stat-card-val">{m.value}</div>
                  <div className="login-stat-card-lbl">{m.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Live Feed */}
            <div className="login-feed-title">Recent Dispatches & Automations</div>
            <div className="login-feed-list">
              {LIVE_DISPATCHES.map((feed) => (
                <div className="login-feed-item" key={feed.id}>
                  <div className="login-feed-left">
                    <span className="login-feed-icon">{feed.icon}</span>
                    <div className="login-feed-info">
                      <span className="login-feed-headline">{feed.title}</span>
                      <span className="login-feed-sub">{feed.location}</span>
                    </div>
                  </div>
                  <span
                    className="login-feed-badge"
                    style={{ color: feed.color, background: feed.bg, border: `1px solid ${feed.border}` }}
                  >
                    {feed.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Architecture Pillars */}
          <div className="login-pillars-grid">
            {SECURITY_PILLARS.map((p) => (
              <div className="login-pillar-card" key={p.title}>
                <span className="login-pillar-icon">{p.icon}</span>
                <span className="login-pillar-text">{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AUTH PANEL */}
      <div className="login-auth-panel">
        <div className="login-auth-inner">
          <h1 className="login-auth-heading">Sign in to HostelOps</h1>
          <p className="login-auth-sub">Select your role, then enter your credentials.</p>

          {GROUPED_ROLES.map(({ category, roles }) => (
            <div key={category}>
              <div className="login-role-category-label">{CATEGORY_LABELS[category]}</div>
              <div className="login-role-grid">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`login-role-card${selectedRole?.id === role.id ? ' selected' : ''}`}
                    style={{ '--card-role-color': role.color, '--card-role-bg': role.bgColor, '--card-role-border': role.borderColor }}
                    onClick={() => handleSelectRole(role)}
                    aria-pressed={selectedRole?.id === role.id}
                    aria-label={`${role.name} - ${role.clearance}`}
                  >
                    <div className="login-role-icon">{role.icon}</div>
                    <div className="login-role-info">
                      <span className="login-role-name">{role.name}</span>
                      <span className="login-role-clearance">{role.clearance}</span>
                    </div>
                    <div className="login-role-check" aria-hidden="true">✓</div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-cred-box">
              <div className="login-input-wrap">
                <label className="login-input-label" htmlFor="login-userid">User ID / Roll Number</label>
                <input
                  id="login-userid"
                  type="text"
                  autoComplete="username"
                  className={`login-input${inputError === 'userId' || inputError === 'both' ? ' error' : ''}`}
                  placeholder={selectedRole ? selectedRole.sampleId : 'Select a role above first...'}
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setInputError(''); setErrorMsg(''); }}
                  disabled={!selectedRole || isLoading}
                  aria-invalid={inputError === 'userId' || inputError === 'both'}
                />
              </div>
              <div className="login-input-wrap">
                <label className="login-input-label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`login-input${inputError === 'password' || inputError === 'both' ? ' error' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setInputError(''); setErrorMsg(''); }}
                    disabled={!selectedRole || isLoading}
                    style={{ paddingRight: '48px' }}
                    aria-invalid={inputError === 'password' || inputError === 'both'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    disabled={!selectedRole}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div role="alert" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="login-form-footer">
              <label className="login-remember">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <button type="button" className="login-forgot">Forgot password?</button>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="login-submit-btn"
              disabled={!selectedRole || isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <><span className="login-btn-spinner" />Signing in...</>
              ) : (
                <><span>Sign In</span>{selectedRole && <span aria-hidden="true"> →</span>}</>
              )}
            </button>

            {selectedRole && !isLoading && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
                Demo credentials pre-filled - just press Sign In
              </p>
            )}
          </form>
        </div>
      </div>

    </div>
  );
}