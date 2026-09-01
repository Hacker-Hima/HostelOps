import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRole, addToast } from '../redux/ticketSlice';
import { api } from '../services/api';
import { useTranslation } from '../utils/translations';

const ROLES = [
  {
    id: 'student',
    icon: '🎓',
    name: 'Student Portal',
    sampleId: '21CS204',
    samplePass: 'student@123',
    clearance: 'Level 1 · Student Resident',
    desc: 'Submit room complaints, scan QR asset tags, and track live technician progress.',
    color: 'var(--accent-cyan)',
    tag: 'Resident Access',
    user: { name: 'Himachalam', initials: 'HC', room: 'A-204', block: 'Block A', floor: 'Floor 2', rollNumber: '21CS204', email: 'hima@hostel.edu', phone: '+91 98765 43210', role: 'student' },
  },
  {
    id: 'staff',
    icon: '👨‍🍳',
    name: 'Working Staff',
    sampleId: 'STAFF-409',
    samplePass: 'staff@123',
    clearance: 'Level 2 · Department Requisition',
    desc: 'Raise equipment & grocery requisition tickets, and track the multi-tier approval pipeline.',
    color: 'var(--accent-orange)',
    tag: 'Operations Staff',
    user: { name: 'Sanji', initials: 'SJ', room: 'Mess Staff Qtrs', block: 'Block A', floor: 'Ground Floor', rollNumber: 'STAFF-409', email: 'sanji@hostel.edu', phone: '+91 98765 12345', role: 'staff' },
  },
  {
    id: 'asst-warden',
    icon: '🏫',
    name: 'Assistant Warden',
    sampleId: 'AW-002',
    samplePass: 'warden@123',
    clearance: 'Level 3 · Operations Dispatcher',
    desc: 'Review complaints, dispatch technicians, track SLA metrics, and monitor block health.',
    color: 'var(--accent-primary)',
    tag: 'Warden Dispatch',
    user: { name: 'Dr. Meena Sharma', initials: 'MS', room: 'Warden Office 101', block: 'Admin Block', floor: 'Floor 1', rollNumber: 'AW-002', email: 'meena@hostel.edu', phone: '+91 98765 99887', role: 'asst-warden' },
  },
  {
    id: 'res-warden',
    icon: '🏛️',
    name: 'Residential Warden',
    sampleId: 'RW-001',
    samplePass: 'reswarden@123',
    clearance: 'Level 4 · Fiscal Authority',
    desc: 'Approve budget expenses, review high-priority incidents, and inspect audit logs.',
    color: '#ec4899',
    tag: 'Executive Warden',
    user: { name: 'Prof. R. Iyer', initials: 'RI', room: 'Res. Warden Office', block: 'Admin Block', floor: 'Floor 2', rollNumber: 'RW-001', email: 'iyer@hostel.edu', phone: '+91 98765 77665', role: 'res-warden' },
  },
  {
    id: 'technician',
    icon: '⚡',
    name: 'Technician Field View',
    sampleId: 'TECH-101',
    samplePass: 'tech@123',
    clearance: 'Level 2 · Field Maintenance',
    desc: 'Receive job dispatches, view room location maps, and upload proof of repair completion.',
    color: 'var(--accent-yellow)',
    tag: 'Maintenance Hub',
    user: { name: 'Sarathi Kamal', initials: 'SK', room: 'Maintenance Hub', block: 'Block B', floor: 'Ground Floor', rollNumber: 'TECH-101', email: 'sarathi@hostel.edu', phone: '+91 98765 43210', role: 'technician' },
  },
  {
    id: 'assets',
    icon: '📦',
    name: 'Asset Registry',
    sampleId: 'MGR-301',
    samplePass: 'assets@123',
    clearance: 'Level 3 · Inventory & Telemetry',
    desc: 'QR telemetry, inventory conditions, room-by-room hardware audit & lifecycle tracking.',
    color: 'var(--accent-green)',
    tag: 'Inventory Hub',
    user: { name: 'Dr. Meena Sharma', initials: 'AM', room: 'Asset Logistics', block: 'Central Store', floor: 'Floor 1', rollNumber: 'MGR-301', email: 'assets@hostel.edu', phone: '+91 98765 33221', role: 'assets' },
  },
  {
    id: 'principal',
    icon: '👑',
    name: 'Principal Executive',
    sampleId: 'EXEC-001',
    samplePass: 'principal@123',
    clearance: 'Level 5 · Supreme Administrator',
    desc: 'High-value fiscal sign-offs, campus-wide SLA metrics, and real-time operations dashboard.',
    color: 'var(--accent-red)',
    tag: 'Campus Executive',
    user: { name: 'Dr. K. Sundaram', initials: 'KS', room: 'Executive Suite', block: 'Main Campus', floor: 'Floor 3', rollNumber: 'EXEC-001', email: 'principal@hostel.edu', phone: '+91 98765 11100', role: 'principal' },
  },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const { isBackendConnected } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  // Stage: 1 = Role Selection, 2 = ID/Password Login Form
  const [selectedRole, setSelectedRole] = useState(null);

  // Form fields for Step 2
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);

  // Step 1: User selects a role
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setUserId('');
    setPassword('');
    setErrorMessage('');
  };

  // Quick fill sample credentials
  const handleQuickFill = () => {
    if (selectedRole) {
      setUserId(selectedRole.sampleId);
      setPassword(selectedRole.samplePass);
      setErrorMessage('');
    }
  };

  // Back to role selection
  const handleBackToRoles = () => {
    setSelectedRole(null);
    setUserId('');
    setPassword('');
    setErrorMessage('');
    setIsVerifying(false);
  };

  // Step 2: Form submit with validation
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!userId.trim()) {
      setErrorMessage('Please enter your User ID or Roll Number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your Password.');
      return;
    }

    setIsVerifying(true);
    setVerifyStep(1);

    try {
      // Step 1: Handshake
      await new Promise((r) => setTimeout(r, 300));
      setVerifyStep(2);

      // Call API for real validation
      let authResponse;
      try {
        authResponse = await api.auth.login({
          username: userId.trim(),
          password: password.trim(),
          role: selectedRole.id,
        });
      } catch (apiErr) {
        // Handle API 401 error or connection failure
        const msg = apiErr.message || 'Invalid User ID or Password';
        setIsVerifying(false);
        setVerifyStep(0);
        setErrorMessage(msg.includes('401') || msg.includes('Authentication') ? `Invalid User ID or Password for ${selectedRole.name}. Please check your credentials.` : msg);
        return;
      }

      // Step 2: Signature generation
      await new Promise((r) => setTimeout(r, 350));
      setVerifyStep(3);

      await new Promise((r) => setTimeout(r, 250));
      setIsVerifying(false);

      // Success! Enter Dashboard
      dispatch(setRole({
        role: selectedRole.id,
        token: authResponse?.token || `jwt_sec_${Date.now()}`,
        user: authResponse?.user || selectedRole.user,
      }));

      dispatch(addToast({
        id: `login-${Date.now()}`,
        message: `Welcome, ${authResponse?.user?.name || selectedRole.user.name}! (${selectedRole.name})`,
        type: 'success',
      }));
    } catch (err) {
      setIsVerifying(false);
      setVerifyStep(0);
      setErrorMessage('Authentication error: ' + (err.message || 'Please try again'));
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '24px 16px', animation: 'fadeIn 0.25s ease' }}>

      {/* ══════════════════════════════════════════════════
          STEP 1: ROLE SELECTION ONLY
      ══════════════════════════════════════════════════ */}
      {!selectedRole && (
        <div style={{ animation: 'slideUp 0.25s ease' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', borderRadius: 999,
              background: 'var(--accent-primary-soft)',
              border: '1px solid var(--border-strong)',
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)' }}>
                Step 1 of 2 · Identity Selection
              </span>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Select Your Portal to Login
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>
              Choose your role below to proceed to the secure credential checkup screen.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}>
            {ROLES.map((role) => (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border-default)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '22px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: 'var(--shadow-card)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-float)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--accent-primary-soft)',
                    border: '1px solid var(--border-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {role.icon}
                  </div>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                    padding: '3px 9px', borderRadius: 999,
                    background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-accent)',
                  }}>
                    {role.tag}
                  </span>
                </div>

                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {role.name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {role.clearance}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, marginBottom: 18 }}>
                  {role.desc}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 12, borderTop: '1px solid var(--border-subtle)',
                  fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)',
                }}>
                  <span>Sign In as {role.name.split(' ')[0]}</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STEP 2: CREDENTIAL LOGIN FORM FOR SELECTED ROLE
      ══════════════════════════════════════════════════ */}
      {selectedRole && (
        <div style={{ maxWidth: 540, margin: '0 auto', animation: 'slideUp 0.25s ease' }}>

          {/* Back Button */}
          <button
            onClick={handleBackToRoles}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', marginBottom: 16, padding: '4px 0',
              fontFamily: 'var(--font-main)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <span>←</span>
            <span>Back to Role Selection</span>
          </button>

          {/* Login Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-default)',
            borderRadius: 'var(--radius-2xl)',
            padding: '32px 28px',
            boxShadow: 'var(--shadow-float)',
          }}>

            {/* Role Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 52, height: 52,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-primary-soft)',
                border: '1.5px solid var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, flexShrink: 0,
              }}>
                {selectedRole.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedRole.name}
                  </h2>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 600, marginTop: 2 }}>
                  {selectedRole.clearance}
                </div>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: 12,
                lineHeight: 1.5,
                marginBottom: 18,
                animation: 'slideIn 0.2s ease',
              }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span style={{ fontWeight: 600 }}>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmitLogin}>
              {/* User ID */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ fontSize: 11, fontWeight: 700 }}>
                  User ID / Roll Number / Staff ID
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`e.g. ${selectedRole.sampleId}`}
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setErrorMessage(''); }}
                  required
                  autoFocus
                  style={{ fontSize: 13, height: 44, background: 'var(--bg-input)' }}
                />
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <label className="form-label" style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-accent)', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', padding: 0,
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'} Password
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  required
                  style={{ fontSize: 13, height: 44, background: 'var(--bg-input)' }}
                />
              </div>

              {/* Sample Credentials Hint & Quick Fill */}
              <div style={{
                background: 'var(--bg-root)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
              }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  Demo ID: <strong style={{ color: 'var(--text-primary)' }}>{selectedRole.sampleId}</strong> | Pass: <strong style={{ color: 'var(--text-primary)' }}>{selectedRole.samplePass}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  style={{
                    background: 'var(--accent-primary-soft)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 9px',
                    color: 'var(--text-accent)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Quick Fill
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying}
                className="btn btn-primary btn-full btn-lg"
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  height: 46,
                  gap: 8,
                }}
              >
                {isVerifying ? (
                  <>
                    <span className="typing-dot" style={{ background: '#fff' }} />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Sign In & Enter Dashboard</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Security Handshake Loading Modal Overlay ── */}
      {isVerifying && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            width: 'min(400px, 90vw)',
            boxShadow: 'var(--shadow-float)',
            textAlign: 'center',
            animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{
              width: 50, height: 50,
              margin: '0 auto 14px',
              borderRadius: '50%',
              background: 'var(--accent-primary-soft)',
              border: '2px solid var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🛡️
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              Verifying Security Credentials
            </h3>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 18 }}>
              Authorizing {selectedRole?.name}...
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', marginBottom: 16 }}>
              {[
                { step: 1, label: '1. Checking User ID & Password in SQLite DB', done: verifyStep >= 2 },
                { step: 2, label: '2. Generating Cryptographic HS256 Token', done: verifyStep >= 3 },
                { step: 3, label: '3. Authorizing Dashboard Permissions', done: verifyStep >= 3 },
              ].map((s) => (
                <div
                  key={s.step}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: s.done ? 'rgba(16,185,129,0.08)' : verifyStep === s.step ? 'var(--accent-primary-soft)' : 'var(--bg-glass)',
                    border: '1px solid',
                    borderColor: s.done ? 'rgba(16,185,129,0.25)' : verifyStep === s.step ? 'var(--border-strong)' : 'var(--border-subtle)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: s.done ? 'var(--accent-green)' : verifyStep === s.step ? 'var(--text-accent)' : 'var(--text-muted)',
                  }}
                >
                  <span>{s.done ? '✓' : verifyStep === s.step ? '⏳' : '○'}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--text-muted)',
        marginTop: 24,
      }}>
        HostelOps Security Engine v4.0 · Real-Time Operations Platform · Authorized Access Only
      </div>

    </div>
  );
}
