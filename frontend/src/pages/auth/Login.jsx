import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft, Home, Globe } from 'lucide-react';
import GoogleAuthButton from '../../components/GoogleAuthButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (res.user.role === 'technician' || res.user.role === 'staff') {
        navigate('/technician/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* Top Navigation Bar: Back to Home & Language Selection */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          right: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '900px',
          margin: '0 auto',
          width: 'calc(100% - 2rem)',
        }}
      >
        <Link
          to="/"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, background: '#ffffff' }}
          id="btn-login-top-back-home"
        >
          <Home size={15} />
          <span>BACK TO HOME</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <Globe size={15} color="#2563eb" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="form-control"
            style={{
              padding: '0.2rem 0.4rem',
              fontSize: '0.8rem',
              height: 'auto',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            id="login-language-select"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
      </div>

      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          padding: '2.25rem',
          borderRadius: 'var(--radius-lg)',
          marginTop: '2.5rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }} title="Back to Home Portal">
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: '#eff6ff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                marginBottom: '0.75rem',
                cursor: 'pointer',
              }}
            >
              <Building2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
              {t('signIn')}
            </h2>
          </Link>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {t('systemName')} (HAMS)
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" id="login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              {t('emailAddress')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email-input"
                type="email"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="name@hostel.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : t('signInBtn')}
            <ArrowRight size={18} />
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0 1rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Continue with Google OAuth Button */}
          <GoogleAuthButton onError={(msg) => setError(msg)} />

          <Link
            to="/"
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.7rem',
              fontSize: '0.9rem',
              marginTop: '0.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600,
            }}
            id="btn-login-direct-home"
          >
            <Home size={16} />
            <span>BACK TO HOME</span>
          </Link>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            {t('newResident')}{' '}
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
              {t('register')}
            </Link>
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              color: '#64748b',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              marginTop: '0.25rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO HOME</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
