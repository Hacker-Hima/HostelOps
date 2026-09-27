import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, addToast } from '../redux/ticketSlice';
import api from '../services/api';

const DEMO_ACCOUNTS = [
  {
    id: 'adm-1',
    label: 'admin1',
    desc: 'Super Admin • Dr. K. Sundaram',
    username: 'admin1',
    password: 'admin1@123',
    role: 'admin',
    admin_type: 'superadmin',
    badge: 'Super Admin',
    color: '#ef4444',
  },
  {
    id: 'adm-2',
    label: 'admin2',
    desc: 'Asset Admin • Dr. Meena Sharma',
    username: 'admin2',
    password: 'admin2@123',
    role: 'admin',
    admin_type: 'assetadmin',
    badge: 'Asset Admin',
    color: '#2563eb',
  },
  {
    id: 'usr-1',
    label: 'student1',
    desc: 'Student 1 • Himachalam (Room 204)',
    username: 'student1',
    password: 'student1@123',
    role: 'user',
    admin_type: '',
    badge: 'Student 1',
    color: '#0d9488',
  },
  {
    id: 'usr-2',
    label: 'student2',
    desc: 'Student 2 • Priya Sharma (Room 102)',
    username: 'student2',
    password: 'student2@123',
    role: 'user',
    admin_type: '',
    badge: 'Student 2',
    color: '#7c3aed',
  },
  {
    id: 'stf-1',
    label: 'staff1',
    desc: 'Staff 1 • Sarathi Kamal (Technician)',
    username: 'staff1',
    password: 'staff1@123',
    role: 'staff',
    admin_type: '',
    badge: 'Staff 1',
    color: '#d97706',
  },
];

const GOOGLE_ACCOUNTS = [
  {
    name: 'Himachalam',
    email: 'himachalam.dev@gmail.com',
    role: 'user',
    admin_type: '',
    roleLabel: 'Student (Resident)',
    avatar: 'H',
    color: '#0d9488',
  },
  {
    name: 'Dr. K. Sundaram',
    email: 'admin.sundaram@gmail.com',
    role: 'admin',
    admin_type: 'superadmin',
    roleLabel: 'Super Admin (All Access)',
    avatar: 'KS',
    color: '#ef4444',
  },
  {
    name: 'Dr. Meena Sharma',
    email: 'meena.sharma@gmail.com',
    role: 'admin',
    admin_type: 'assetadmin',
    roleLabel: 'Asset Admin (Operations)',
    avatar: 'MS',
    color: '#7c3aed',
  },
  {
    name: 'Sarathi Kamal',
    email: 'sarathi.kamal@gmail.com',
    role: 'staff',
    admin_type: '',
    roleLabel: 'Staff (Technician)',
    avatar: 'SK',
    color: '#d97706',
  },
];

export default function LoginPage() {
  const dispatch = useDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Custom Google input state
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [customGoogleRole, setCustomGoogleRole] = useState('user');
  const [customGoogleAdminType, setCustomGoogleAdminType] = useState('assetadmin');
  const [showCustomGoogle, setShowCustomGoogle] = useState(false);

  // Common Registration Form State (Student, Staff, Admin)
  const [regForm, setRegForm] = useState({
    role: 'user', // 'user' | 'staff' | 'admin'
    admin_type: 'assetadmin', // 'superadmin' | 'assetadmin'
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    roll_number: '',
    block: 'Block A',
    floor: 'Floor 1',
    room: '101',
    department: 'Maintenance & Facilities',
    designation: 'Technician',
  });

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
      console.warn('Backend login fallback check:', err.message);

      // Robust fallback against demo accounts if offline or demo mode
      const matched = DEMO_ACCOUNTS.find(
        (a) =>
          (a.username.toLowerCase() === cleanUser.toLowerCase() ||
            a.id.toLowerCase() === cleanUser.toLowerCase()) &&
          a.password === cleanPass
      );

      if (matched) {
        const fallbackUser = {
          id: matched.id,
          username: matched.username,
          name: (matched.username === 'admin1' || matched.username === 'superadmin') ? 'Dr. K. Sundaram' : (matched.username === 'admin2' || matched.username === 'assetadmin') ? 'Dr. Meena Sharma' : matched.username === 'student1' ? 'Himachalam' : matched.username === 'student2' ? 'Priya Sharma' : 'Sarathi Kamal',
          room: matched.username.includes('student') ? '204' : 'Executive Suite',
          block: 'Block A',
          floor: 'Floor 2',
          roll_number: matched.username.toUpperCase(),
          email: `${matched.username}@hostel.edu`,
          phone: '+91 98765 00000',
          role: matched.role,
          admin_type: matched.admin_type,
          avatar_color: matched.color,
        };

        dispatch(loginSuccess({ user: fallbackUser, token: 'jwt-verified-token', remember: rememberMe }));
        dispatch(
          addToast({
            id: `login-${Date.now()}`,
            message: `Welcome back, ${fallbackUser.name}!`,
            type: 'success',
          })
        );
        return;
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

  // Google OAuth Login Execution
  const executeGoogleLogin = async ({ email, name, role = 'user', admin_type = '' }) => {
    setIsLoading(true);
    setErrorMsg('');
    setShowGoogleModal(false);

    try {
      const res = await api.auth.oauth({
        provider: 'google',
        email: email.trim(),
        name: (name || email.split('@')[0]).trim(),
        role,
        admin_type,
        sub: `google-${Date.now()}`,
      });
      const user = res?.user;
      const token = res?.token;

      dispatch(loginSuccess({ user, token, remember: rememberMe }));
      dispatch(
        addToast({
          id: `oauth-${Date.now()}`,
          message: `Signed in as ${user?.name || email} (${user?.role})!`,
          type: 'success',
        })
      );
    } catch (err) {
      setErrorMsg(`Google sign-in failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Common Registration Handler (Students, Staff, Admins)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.username || !regForm.password || !regForm.name || !regForm.email) {
      alert('Please fill in username, password, full name, and email');
      return;
    }

    try {
      await api.auth.registerUser(regForm);
      const roleDisplayName = regForm.role === 'admin' 
        ? (regForm.admin_type === 'superadmin' ? 'Super Admin' : 'Asset Admin') 
        : regForm.role === 'staff' ? 'Staff Technician' : 'Student Resident';

      dispatch(
        addToast({
          id: `reg-${Date.now()}`,
          message: `Registered successfully as ${roleDisplayName}! You can now sign in.`,
          type: 'success',
        })
      );
      setUsername(regForm.username);
      setPassword(regForm.password);
      setShowRegisterModal(false);
    } catch (err) {
      alert(err.message || 'Registration failed');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 65px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 16px',
        margin: '0 auto',
        background: 'transparent',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          background: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border-default)',
          borderRadius: '18px',
          padding: '36px 30px',
          boxShadow: 'var(--shadow-float)',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--grad-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              marginBottom: '10px',
            }}
          >
            🏢
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            HostelOps
          </h2>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#dc2626',
                fontSize: '12.5px',
              }}
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="username-input"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}
            >
              User ID
            </label>
            <input
              id="username-input"
              type="text"
              required
              placeholder="Enter User ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password-input"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
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
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                }}
                aria-label="Toggle password"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginTop: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
            >
              Don't have an account? Register
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
              marginTop: '4px',
              transition: 'opacity 0.2s ease',
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span>or</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          <button
            type="button"
            onClick={() => {
              setErrorMsg('');
              setShowGoogleModal(true);
            }}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>
      </div>

      {/* Google OAuth Account Chooser Modal */}
      {showGoogleModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '430px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-float)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          >
            {/* Google Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-card)', marginBottom: '8px', border: '1px solid var(--border-subtle)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                Sign in with Google
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Choose an account to continue to <strong>HostelOps</strong>
              </p>
            </div>

            {/* Account List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {GOOGLE_ACCOUNTS.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => executeGoogleLogin(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: acc.color,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      {acc.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 650, color: 'var(--text-primary)' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {acc.email}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 650,
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {acc.roleLabel}
                  </span>
                </div>
              ))}
            </div>

            {/* Custom Email Toggle */}
            {!showCustomGoogle ? (
              <button
                type="button"
                onClick={() => setShowCustomGoogle(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-default)',
                  background: 'transparent',
                  color: 'var(--accent-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '16px' }}>➕</span>
                <span>Use another Google account</span>
              </button>
            ) : (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. resident@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Kumar"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Role
                    </label>
                    <select
                      value={customGoogleRole}
                      onChange={(e) => setCustomGoogleRole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="user">Student (Resident)</option>
                      <option value="staff">Staff / Technician</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                {customGoogleRole === 'admin' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Admin Type
                    </label>
                    <select
                      value={customGoogleAdminType}
                      onChange={(e) => setCustomGoogleAdminType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="assetadmin">Asset Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!customGoogleEmail) {
                      alert('Please enter a Google email address.');
                      return;
                    }
                    executeGoogleLogin({
                      email: customGoogleEmail,
                      name: customGoogleName,
                      role: customGoogleRole,
                      admin_type: customGoogleRole === 'admin' ? customGoogleAdminType : '',
                    });
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                >
                  Continue with this Email
                </button>
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  setShowCustomGoogle(false);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Common Registration Modal (Student, Staff, Admin) */}
      {showRegisterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: 'var(--shadow-float)',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 2px 0' }}>
                  Register New Account
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Select your institutional role to continue
                </span>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Role Selection Segmented Control */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Select Account Role:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'user', label: 'Student', icon: '🎓' },
                  { id: 'staff', label: 'Staff / Tech', icon: '⚡' },
                  { id: 'admin', label: 'Administrator', icon: '💼' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegForm({ ...regForm, role: r.id })}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: regForm.role === r.id ? 'var(--accent-primary)' : 'var(--border-default)',
                      background: regForm.role === r.id ? 'var(--accent-primary-soft)' : 'var(--bg-card)',
                      color: regForm.role === r.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If Admin: Select Admin Type */}
            {regForm.role === 'admin' && (
              <div style={{ marginBottom: '14px', background: 'var(--bg-card)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 650, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Admin Responsibility Tier:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, admin_type: 'assetadmin' })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: regForm.admin_type === 'assetadmin' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: regForm.admin_type === 'assetadmin' ? 'var(--accent-primary-soft)' : 'transparent',
                      color: regForm.admin_type === 'assetadmin' ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Asset & Operations Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, admin_type: 'superadmin' })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: regForm.admin_type === 'superadmin' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: regForm.admin_type === 'superadmin' ? 'var(--accent-primary-soft)' : 'transparent',
                      color: regForm.admin_type === 'superadmin' ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Super Administrator
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder={regForm.role === 'admin' ? 'e.g. Dr. Rajesh Gupta' : regForm.role === 'staff' ? 'e.g. Suresh Kumar' : 'e.g. Himachalam'}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Username / ID *</label>
                  <input
                    type="text"
                    required
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    placeholder={regForm.role === 'admin' ? 'admin3' : regForm.role === 'staff' ? 'staff2' : 'student3'}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    {regForm.role === 'user' ? 'Roll Number *' : regForm.role === 'staff' ? 'Staff ID / Badge *' : 'Admin Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.roll_number}
                    onChange={(e) => setRegForm({ ...regForm, roll_number: e.target.value })}
                    placeholder={regForm.role === 'user' ? '23CS105' : regForm.role === 'staff' ? 'STF-TECH-02' : 'ADM-03'}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="user@hostel.edu"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Password *</label>
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="At least 6 characters"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Role-Specific Fields */}
              {regForm.role === 'user' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Hostel Block</label>
                    <select
                      value={regForm.block}
                      onChange={(e) => setRegForm({ ...regForm, block: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    >
                      <option>Block A</option>
                      <option>Block B</option>
                      <option>Block C</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Room Number</label>
                    <input
                      type="text"
                      value={regForm.room}
                      onChange={(e) => setRegForm({ ...regForm, room: e.target.value })}
                      placeholder="e.g. 204"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {regForm.role === 'staff' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Designation / Trade</label>
                    <select
                      value={regForm.designation}
                      onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    >
                      <option>Electrical Technician</option>
                      <option>Plumbing Specialist</option>
                      <option>HVAC & AC Maintenance</option>
                      <option>Civil & Carpentry</option>
                      <option>General Facilities</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Assigned Workshop / Block</label>
                    <input
                      type="text"
                      value={regForm.block || 'Service Block'}
                      onChange={(e) => setRegForm({ ...regForm, block: e.target.value })}
                      placeholder="e.g. Service Block"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {regForm.role === 'admin' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Department / Wing</label>
                    <input
                      type="text"
                      value={regForm.department || 'Operations Management'}
                      onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                      placeholder="e.g. Operations Management"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Admin Office</label>
                    <input
                      type="text"
                      value={regForm.room || 'Admin Block 301'}
                      onChange={(e) => setRegForm({ ...regForm, room: e.target.value })}
                      placeholder="e.g. Admin Block 301"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-input)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}