import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, User, ShieldCheck, Building2, Settings, Globe, Home as HomeIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToSettings = () => {
    if (user?.role === 'admin') {
      navigate('/admin/settings');
    } else {
      navigate('/settings');
    }
  };

  return (
    <header className="top-navbar">
      <Link
        to="/"
        className="nav-brand"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
        title={t('backToHome')}
      >
        <Building2 size={24} color="var(--primary)" />
        <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>HAMS</span>
      </Link>

      <div className="nav-actions">
        {/* Global Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginRight: '0.5rem' }}>
          <Globe size={16} color="var(--primary)" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="form-control"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              height: 'auto',
              cursor: 'pointer',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              borderColor: 'var(--border)',
            }}
            title="Switch Language"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        <Link
          to="/"
          className="btn btn-secondary btn-sm"
          title={t('backToHome')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <HomeIcon size={16} />
          <span>{t('homeAndGame')}</span>
        </Link>

        {user && (
          <>
            <div className="user-pill">
              <div className="user-avatar">
                {user.role === 'admin' ? (
                  <ShieldCheck size={18} />
                ) : (
                  <User size={18} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  {user.role === 'admin' ? t('adminRole') : `${user.hostelBlock} • Rm ${user.roomNumber}`}
                </span>
              </div>
            </div>

            <button
              id="btn-settings"
              onClick={handleGoToSettings}
              className="btn btn-secondary btn-sm"
              title={t('settings')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Settings size={16} />
              <span>{t('settings')}</span>
            </button>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title={t('logout')}
            >
              <LogOut size={16} />
              <span>{t('logout')}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
