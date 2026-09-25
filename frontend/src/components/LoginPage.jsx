import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, addToast, registerUserAsync } from '../redux/ticketSlice';
import api from '../services/api';

const ROLE_OPTIONS = [
  {
    id: 'admin',
    label: '👨‍💼 Administrator / Asset Manager',
    badge: 'Admin Access',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    userPlaceholder: 'Username / Admin ID (e.g. superadmin)',
    defaultUsername: 'superadmin',
    defaultPassword: 'admin@123',
    demoAccounts: [
      {
        id: 'adm-1',
        title: 'Super Admin',
        name: 'Dr. K. Sundaram',
        username: 'superadmin',
        password: 'admin@123',
        role: 'admin',
        admin_type: 'superadmin',
        room: 'Executive Suite 301',
        block: 'Admin Block',
        roll: 'ADM-SUPER-01',
        color: '#ef4444',
      },
      {
        id: 'adm-2',
        title: 'Asset Admin',
        name: 'Dr. Meena Sharma',
        username: 'assetadmin',
        password: 'admin@123',
        role: 'admin',
        admin_type: 'assetadmin',
        room: 'Asset Logistics 102',
        block: 'Admin Block',
        roll: 'ADM-ASSET-02',
        color: '#8b5cf6',
      },
    ],
  },
  {
    id: 'student',
    label: '🎓 Student / Resident',
    badge: 'Student Portal',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    userPlaceholder: 'Roll Number / Username (e.g. student1 or 21CS204)',
    defaultUsername: 'student1',
    defaultPassword: 'user@123',
    demoAccounts: [
      {
        id: 'usr-1',
        title: 'Student A',
        name: 'Himachalam',
        username: 'student1',
        password: 'user@123',
        role: 'user',
        admin_type: '',
        room: '204',
        block: 'Block A',
        floor: 'Floor 2',
        roll: '21CS204',
        color: '#06b6d4',
      },
      {
        id: 'usr-2',
        title: 'Student B',
        name: 'Priya Sharma',
        username: 'student2',
        password: 'user@123',
        role: 'user',
        admin_type: '',
        room: '102',
        block: 'Block B',
        floor: 'Floor 1',
        roll: '22EC102',
        color: '#ec4899',
      },
      {
        id: 'usr-3',
        title: 'Student C',
        name: 'Naveen Kumar',
        username: 'student3',
        password: 'user@123',
        role: 'user',
        admin_type: '',
        room: '112',
        block: 'Block A',
        floor: 'Floor 1',
        roll: '21IT112',
        color: '#f59e0b',
      },
      {
        id: 'usr-4',
        title: 'Student D',
        name: 'Devansh Chouhan',
        username: 'student4',
        password: 'user@123',
        role: 'user',
        admin_type: '',
        room: '305',
        block: 'Block C',
        floor: 'Floor 3',
        roll: '23ME305',
        color: '#10b981',
      },
    ],
  },
  {
    id: 'staff',
    label: '⚡ Staff / Maintenance Technician',
    badge: 'Staff & Tech Portal',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    userPlaceholder: 'Staff ID / Username (e.g. staff1 or sarathi)',
    defaultUsername: 'staff1',
    defaultPassword: 'user@123',
    demoAccounts: [
      {
        id: 'stf-1',
        title: 'Technician',
        name: 'Sarathi Kamal',
        username: 'staff1',
        password: 'user@123',
        role: 'staff',
        admin_type: '',
        room: 'Maintenance Workshop',
        block: 'Service Block',
        floor: 'Ground Floor',
        roll: 'STF-TECH-01',
        color: '#f59e0b',
      },
    ],
  },
];

export default function LoginPage() {
  const dispatch = useDispatch();

  const [selectedRole, setSelectedRole] = useState('admin');
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('admin@123');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // New student registration form state
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    name: '',
    roll_number: '',
    email: '',
    phone: '',
    block: 'Block A',
    floor: 'Floor 1',
    room: '101',
    role: 'user',
  });

  const activeRoleConfig = ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[0];

  // When changing role from dropdown, update fields and pre-set default credentials
  const handleRoleChange = (newRoleId) => {
    setSelectedRole(newRoleId);
    setErrorMsg('');
    const targetConfig = ROLE_OPTIONS.find((r) => r.id === newRoleId);
    if (targetConfig) {
      setUsername(targetConfig.defaultUsername);
      setPassword(targetConfig.defaultPassword);
    }
  };

  // Helper chip fill
  const handleQuickFill = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.auth.login({
        username: cleanUser,
        password: cleanPass,
        role: selectedRole === 'admin' ? 'admin' : selectedRole === 'staff' ? 'staff' : 'user',
      });

      const user = res?.user;
      const token = res?.token;

      dispatch(loginSuccess({ user, token, remember: rememberMe }));

      dispatch(
        addToast({
          id: `login-${Date.now()}`,
          message: `Welcome back, ${user?.name || cleanUser}!`,
          type: 'success',
        })
      );
    } catch (err) {
      console.error('Backend login error:', err.message);

      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

      if (isDemoMode) {
        let matchedAcc = null;
        for (const roleGroup of ROLE_OPTIONS) {
          const found = roleGroup.demoAccounts.find(
            (a) =>
              (a.username.toLowerCase() === cleanUser.toLowerCase() ||
                a.roll.toLowerCase() === cleanUser.toLowerCase()) &&
              a.password === cleanPass
          );
          if (found) {
            matchedAcc = found;
            break;
          }
        }

        if (matchedAcc) {
          const fallbackUser = {
            id: matchedAcc.id,
            username: matchedAcc.username,
            name: matchedAcc.name,
            initials: matchedAcc.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
            room: matchedAcc.room,
            block: matchedAcc.block,
            floor: matchedAcc.floor || 'Floor 1',
            roll_number: matchedAcc.roll,
            email: `${matchedAcc.username}@hostel.edu`,
            phone: '+91 98765 00000',
            role: matchedAcc.role,
            admin_type: matchedAcc.admin_type,
            avatar_color: matchedAcc.color,
          };

          dispatch(loginSuccess({ user: fallbackUser, token: 'demo-local-jwt', remember: rememberMe }));
          dispatch(
            addToast({
              id: `login-${Date.now()}`,
              message: `[DEMO MODE] Signed in as ${matchedAcc.name}`,
              type: 'warn',
            })
          );
          return;
        }
      }

      setErrorMsg(err.message || 'Invalid username or password. Please verify credentials.');
      dispatch(
        addToast({
          id: `login-err-${Date.now()}`,
          message: err.message || 'Authentication failed. Please verify credentials.',
          type: 'error',
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.username || !regForm.password || !regForm.name || !regForm.email) {
      alert('Please fill in username, password, full name, and email');
      return;
    }

    try {
      await api.auth.registerUser(regForm);
      dispatch(
        addToast({
          id: `reg-${Date.now()}`,
          message: `User ${regForm.name} registered successfully! You may now sign in.`,
          type: 'success',
        })
      );
      setShowRegisterModal(false);
      setSelectedRole('student');
      setUsername(regForm.username);
      setPassword(regForm.password);
    } catch (err) {
      alert('Registration failed: ' + (err.message || err));
    }
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      {/* Single Centralized Login Glass Card */}
      <div
        className="login-glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(28px)',
          border: '1px solid var(--border-strong)',
          borderRadius: '24px',
          padding: '36px 32px 28px',
          boxShadow: 'var(--shadow-float)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Brand & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${activeRoleConfig.color}, #7c3aed)`,
              margin: '0 auto 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: `0 8px 24px ${activeRoleConfig.bg}`,
              border: `1.5px solid ${activeRoleConfig.borderColor}`,
              transition: 'all 0.3s ease',
            }}
          >
            🏢
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              letterSpacing: '-0.4px',
            }}
          >
            Hostel Asset Portal
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Sign in to access your designated role workspace
          </p>
        </div>

        {/* Unified Login Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 1. ROLE DROPDOWN */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="role-select"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--text-secondary)',
                }}
              >
                Select Role / Portal
              </label>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: activeRoleConfig.bg,
                  color: activeRoleConfig.color,
                  border: `1px solid ${activeRoleConfig.borderColor}`,
                }}
              >
                {activeRoleConfig.badge}
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 36px 11px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  border: `1.5px solid ${activeRoleConfig.borderColor}`,
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  appearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  boxShadow: `0 2px 8px ${activeRoleConfig.bg}`,
                }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                }}
              >
                ▼
              </div>
            </div>
          </div>

          {/* 2. USERNAME / ROLL NUMBER INPUT */}
          <div>
            <label
              htmlFor="username-input"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Username / ID
            </label>
            <input
              id="username-input"
              type="text"
              required
              placeholder={activeRoleConfig.userPlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '12px',
                background: 'var(--bg-surface-glass)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
          </div>

          {/* 3. PASSWORD INPUT */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="password-input"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--text-secondary)',
                }}
              >
                Password
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Demo: admin@123 / user@123</span>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 42px 11px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg-surface-glass)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  padding: '4px',
                }}
                aria-label="Toggle password visibility"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Quick Demo Pre-fill Chips */}
          <div style={{ marginTop: '-4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              ⚡ Quick Fill {activeRoleConfig.label.split(' ')[1]}:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {activeRoleConfig.demoAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: username === acc.username ? activeRoleConfig.bg : 'var(--bg-card)',
                    border: `1px solid ${username === acc.username ? activeRoleConfig.color : 'var(--border-subtle)'}`,
                    color: username === acc.username ? activeRoleConfig.color : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {acc.title} ({acc.name.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>

          {/* Remember me & Notice */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: activeRoleConfig.color }}
              />
              Remember session
            </label>
            <span style={{ color: 'var(--text-muted)' }}>🔒 256-bit Encrypted</span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '13px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${activeRoleConfig.color} 0%, #7c3aed 100%)`,
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: `0 6px 20px ${activeRoleConfig.bg}`,
              transition: 'all 0.2s',
              opacity: isLoading ? 0.75 : 1,
            }}
          >
            {isLoading ? (
              <>
                <span className="login-btn-spinner" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as {selectedRole.toUpperCase()}</span>
                <span>→</span>
              </>
            )}
          </button>

          {/* Registration link */}
          <div style={{ textAlign: 'center', marginTop: '6px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>New student without an account? </span>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-accent)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              + Register Student
            </button>
          </div>

        </form>
      </div>

      {/* Self-Registration Modal */}
      {showRegisterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
              maxWidth: '480px',
              background: 'var(--bg-surface-glass)',
              border: '1px solid var(--border-strong)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Register New Student / Resident
              </h3>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. student5"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Create a secure password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 24CS101"
                    value={regForm.roll_number}
                    onChange={(e) => setRegForm({ ...regForm, roll_number: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@hostel.edu"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Block</label>
                  <select
                    value={regForm.block}
                    onChange={(e) => setRegForm({ ...regForm, block: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option>Block A</option>
                    <option>Block B</option>
                    <option>Block C</option>
                    <option>Block D</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Floor</label>
                  <select
                    value={regForm.floor}
                    onChange={(e) => setRegForm({ ...regForm, floor: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    <option>Floor 1</option>
                    <option>Floor 2</option>
                    <option>Floor 3</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Room</label>
                  <input
                    type="text"
                    placeholder="204"
                    value={regForm.room}
                    onChange={(e) => setRegForm({ ...regForm, room: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Register & Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}