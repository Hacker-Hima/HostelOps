import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRole, setViewMode } from './redux/ticketSlice';
import { useTranslation } from './utils/translations';

import LoginPage      from './components/LoginPage';
import StudentView    from './components/StudentView';
import StaffView      from './components/StaffView';
import WardenView     from './components/WardenView';
import ResWardenView  from './components/ResWardenView';
import TechnicianView from './components/TechnicianView';
import AssetView      from './components/AssetView';
import PrincipalView  from './components/PrincipalView';
import CustomizeModal from './components/CustomizeModal';

/* Global Systems */
import ToastHost               from './components/ToastHost';
import CommandPalette          from './components/CommandPalette';
import TicketDrawer            from './components/TicketDrawer';
import KeyboardShortcutsModal  from './components/KeyboardShortcutsModal';

import './index.css';

const ROLE_CONFIG = [
  { id: 'login',       key: 'role_login',        defaultLabel: 'Login',        icon: '🔐', color: '#7c3aed' },
  { id: 'student',     key: 'role_student',      defaultLabel: 'Student',      icon: '🎓', color: '#06b6d4' },
  { id: 'staff',       key: 'role_staff',        defaultLabel: 'Staff',        icon: '👨‍🍳', color: '#f97316' },
  { id: 'asst-warden', key: 'role_asst_warden',  defaultLabel: 'Asst. Warden', icon: '🏫', color: '#8b5cf6' },
  { id: 'res-warden',  key: 'role_res_warden',   defaultLabel: 'Res. Warden',  icon: '🏛️', color: '#ec4899' },
  { id: 'technician',  key: 'role_technician',   defaultLabel: 'Technician',   icon: '⚡', color: '#f59e0b' },
  { id: 'assets',      key: 'role_assets',       defaultLabel: 'Assets',       icon: '🏁', color: '#10b981' },
  { id: 'principal',   key: 'role_principal',    defaultLabel: 'Principal',    icon: '👑', color: '#ef4444' },
];

const COLOR_GRADS = {
  purple: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
  cyan:   'linear-gradient(135deg,#06b6d4,#3b82f6)',
  green:  'linear-gradient(135deg,#10b981,#06b6d4)',
  orange: 'linear-gradient(135deg,#f97316,#eab308)',
  red:    'linear-gradient(135deg,#ef4444,#ec4899)',
  pink:   'linear-gradient(135deg,#ec4899,#8b5cf6)',
};

export default function App() {
  const dispatch  = useDispatch();
  const { currentRole, currentPage, viewMode, themeMode, colorTheme, notifications } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const [showCustomize, setShowCustomize] = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showCmd,       setShowCmd]       = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* Apply theme classes to <body> */
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${themeMode}`);
  }, [themeMode]);

  useEffect(() => {
    document.body.classList.remove('color-purple','color-cyan','color-green','color-orange','color-red','color-pink');
    document.body.classList.add(`color-${colorTheme}`);
  }, [colorTheme]);

  /* Global Keyboard Shortcuts */
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCmd((p) => !p);
      }
      // ? (when not typing in an input/textarea)
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* Close notifs on outside click */
  useEffect(() => {
    if (!showNotifs) return;
    const handler = () => setShowNotifs(false);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [showNotifs]);

  const handleRoleSwitch = useCallback((id) => dispatch(setRole(id)), [dispatch]);
  const handleViewMode   = useCallback((m)  => dispatch(setViewMode(m)), [dispatch]);

  const ActiveView = useMemo(() => {
    const isMobile = viewMode === 'mobile';
    switch (currentRole) {
      case 'login':       return <LoginPage />;
      case 'student':     return <StudentView     page={currentPage} isMobile={isMobile} />;
      case 'staff':       return <StaffView       page={currentPage} isMobile={isMobile} />;
      case 'asst-warden': return <WardenView      page={currentPage} isMobile={isMobile} />;
      case 'res-warden':  return <ResWardenView   page={currentPage} isMobile={isMobile} />;
      case 'technician':  return <TechnicianView  page={currentPage} isMobile={isMobile} />;
      case 'assets':      return <AssetView       page={currentPage} isMobile={isMobile} />;
      case 'principal':   return <PrincipalView   page={currentPage} isMobile={isMobile} />;
      default:            return <LoginPage />;
    }
  }, [currentRole, currentPage, viewMode]);

  const activeGrad = COLOR_GRADS[colorTheme] || COLOR_GRADS.purple;

  return (
    <div className="hostelops-root">

      {/* ══ Top Navigation Bar ══ */}
      <header className="role-nav-bar">

        {/* Brand */}
        <div className="nav-brand" onClick={() => handleRoleSwitch('login')}>
          <div className="nav-brand-icon" style={{ background: activeGrad }}>🏫</div>
          <span className="nav-brand-name" style={{ backgroundImage: activeGrad }}>{t('app_title', 'HostelOps')}</span>
        </div>

        {/* Role Switcher Pills */}
        <div className="role-pills-scroll">
          {ROLE_CONFIG.map((role) => (
            <button
              key={role.id}
              id={`role-btn-${role.id}`}
              className={`role-pill ${currentRole === role.id ? 'active' : ''}`}
              onClick={() => handleRoleSwitch(role.id)}
              style={{ '--role-color': role.color }}
            >
              <span className="role-pill-icon">{role.icon}</span>
              <span className="role-pill-label">{t(role.key, role.defaultLabel)}</span>
            </button>
          ))}
        </div>

        {/* Right Controls */}
        <div className="nav-controls">

          {/* Quick Search / Command Palette Button */}
          <button
            className="btn-icon"
            onClick={() => setShowCmd(true)}
            title={t('cmd_palette_hint', 'Command Palette (Ctrl+K)')}
            aria-label="Command palette"
            style={{ display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            🔍
          </button>

          {/* Keyboard Shortcuts Help */}
          <button
            className="btn-icon"
            onClick={() => setShowShortcuts(true)}
            title={t('shortcuts_hint', 'Keyboard Shortcuts (?)')}
            aria-label="Shortcuts"
            style={{ fontWeight:700, fontSize:13 }}
          >
            ?
          </button>

          {/* View Mode Toggle */}
          <div className="viewmode-toggle">
            <button
              id="toggle-mobile"
              className={`vm-btn ${viewMode === 'mobile' ? 'vm-active' : ''}`}
              onClick={() => handleViewMode('mobile')}
              title={t('mobile_view', 'Mobile View')}
            >
              📱
            </button>
            <button
              id="toggle-desktop"
              className={`vm-btn ${viewMode === 'desktop' ? 'vm-active' : ''}`}
              onClick={() => handleViewMode('desktop')}
              title={t('desktop_view', 'Desktop View')}
            >
              🖥️
            </button>
          </div>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setShowNotifs((p) => !p); }}>
            <button className="btn-icon" id="notif-bell" title={t('notifications', 'Notifications')}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, width: 17, height: 17, background: 'var(--accent-red)', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-root)' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 320,
                  background: themeMode === 'light' ? '#fff' : 'linear-gradient(145deg, #0c1829, #060e1e)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-float)',
                  zIndex: 3000,
                  overflow: 'hidden',
                  animation: 'slideUp 0.22s var(--t-spring)',
                }}
              >
                <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{t('notifications', 'Notifications')}</span>
                  {unreadCount > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{unreadCount} {t('unread', 'unread')}</span>}
                </div>
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border-subtle)', background: n.isRead ? 'transparent' : 'var(--accent-primary-soft)', cursor: 'pointer', transition: 'background 0.15s' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{n.time}</div>
                  </div>
                ))}
                <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, color: 'var(--text-accent)', cursor: 'pointer', fontWeight: 650 }}>
                  {t('view_all_notifs', 'View all notifications →')}
                </div>
              </div>
            )}
          </div>

          {/* Customise Button */}
          <button
            id="customise-btn"
            className="customize-btn"
            onClick={() => setShowCustomize(true)}
          >
            {/* Live color dot */}
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeGrad, display: 'inline-block', flexShrink: 0 }} />
            {t('customise', 'Customise')}
          </button>

        </div>
      </header>

      {/* ══ Main Viewport ══ */}
      <main className="main-viewport">
        {ActiveView}
      </main>

      {/* ══ Global Overlays ══ */}
      <CustomizeModal
        isOpen={showCustomize}
        onClose={() => setShowCustomize(false)}
      />

      <CommandPalette
        isOpen={showCmd}
        onClose={() => setShowCmd(false)}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      <TicketDrawer />

      {/* ══ Global Toast System ══ */}
      <ToastHost />

    </div>
  );
}

