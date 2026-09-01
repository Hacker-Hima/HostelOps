import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setRole,
  setViewMode,
  fetchInitialData,
  markAllNotificationsRead,
  markNotificationRead,
  setAiDrawerOpen,
  setFloorplanModalOpen,
  setProfileModalOpen,
} from './redux/ticketSlice';
import { useTranslation } from './utils/translations';

/* ── Role Views ── */
import LoginPage      from './components/LoginPage';
import StudentView    from './components/StudentView';
import StaffView      from './components/StaffView';
import WardenView     from './components/WardenView';
import ResWardenView  from './components/ResWardenView';
import TechnicianView from './components/TechnicianView';
import AssetView      from './components/AssetView';
import PrincipalView  from './components/PrincipalView';

/* ── Settings & Global Overlays ── */
import SettingsModal          from './components/SettingsModal';
import ToastHost              from './components/ToastHost';
import CommandPalette         from './components/CommandPalette';
import TicketDrawer           from './components/TicketDrawer';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import HostelBotAI            from './components/HostelBotAI';
import HostelFloorplan        from './components/HostelFloorplan';
import UserProfileModal       from './components/UserProfileModal';

import './index.css';

const ROLE_CONFIG = [
  { id: 'login',       key: 'role_login',        defaultLabel: 'Login',        icon: '🔐', color: '#7c3aed' },
  { id: 'student',     key: 'role_student',      defaultLabel: 'Student',      icon: '🎓', color: '#06b6d4' },
  { id: 'staff',       key: 'role_staff',        defaultLabel: 'Staff',        icon: '👨‍🍳', color: '#f97316' },
  { id: 'asst-warden', key: 'role_asst_warden',  defaultLabel: 'Asst. Warden', icon: '🏫', color: '#8b5cf6' },
  { id: 'res-warden',  key: 'role_res_warden',   defaultLabel: 'Res. Warden',  icon: '🏛️', color: '#ec4899' },
  { id: 'technician',  key: 'role_technician',   defaultLabel: 'Technician',   icon: '⚡', color: '#f59e0b' },
  { id: 'assets',      key: 'role_assets',       defaultLabel: 'Assets',       icon: '📦', color: '#10b981' },
  { id: 'principal',   key: 'role_principal',    defaultLabel: 'Principal',    icon: '👑', color: '#ef4444' },
];

const COLOR_GRADS = {
  purple: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
  cyan:   'linear-gradient(135deg,#06b6d4,#3b82f6)',
  green:  'linear-gradient(135deg,#10b981,#06b6d4)',
  orange: 'linear-gradient(135deg,#f97316,#eab308)',
  red:    'linear-gradient(135deg,#ef4444,#ec4899)',
  pink:   'linear-gradient(135deg,#ec4899,#8b5cf6)',
  cyber:  'linear-gradient(135deg,#00ffc8,#7928ca)',
  gold:   'linear-gradient(135deg,#f59e0b,#fbbf24)',
  frost:  'linear-gradient(135deg,#38bdf8,#818cf8)',
};

export default function App() {
  const dispatch  = useDispatch();
  const { currentRole, currentPage, currentUser, viewMode, themeMode, colorTheme, notifications, aiDrawerOpen, floorplanModalOpen, fontStyle, fontSize } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const [showSettings,  setShowSettings]  = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showCmd,       setShowCmd]       = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  /* Fetch initial full-stack data from backend on mount */
  useEffect(() => {
    dispatch(fetchInitialData())
      .unwrap()
      .then(() => {
        console.log('✅ Connected to HostelOps SQLite Backend');
      })
      .catch((err) => {
        console.warn('⚠️ Running in offline/fallback mode:', err);
      });
  }, [dispatch]);

  /* Apply theme classes to <body> */
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${themeMode}`);
  }, [themeMode]);

  useEffect(() => {
    const allThemes = ['purple','cyan','green','orange','red','pink','cyber','gold','frost'];
    allThemes.forEach((th) => document.body.classList.remove(`color-${th}`));
    document.body.classList.add(`color-${colorTheme}`);
  }, [colorTheme]);

  useEffect(() => {
    const fonts = ['inter','dm-sans','outfit','nunito'];
    fonts.forEach((f) => document.body.classList.remove(`font-${f}`));
    document.body.classList.add(`font-${fontStyle || 'inter'}`);
  }, [fontStyle]);

  useEffect(() => {
    const sizes = ['compact','normal','comfortable','large'];
    sizes.forEach((s) => document.body.classList.remove(`size-${s}`));
    document.body.classList.add(`size-${fontSize || 'normal'}`);
  }, [fontSize]);

  /* Global Keyboard Shortcuts */
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmd((p) => !p);
      }
      // ? (when not typing in an input/textarea)
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
      // Escape closes panels
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowCmd(false);
        setShowShortcuts(false);
        setShowNotifs(false);
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

        {/* Active Session Identity Badge — 100% Role-Isolated Workspace */}
        {currentRole !== 'login' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              onClick={() => dispatch(setProfileModalOpen(true))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--accent-primary-soft)',
                border: '1px solid var(--border-strong)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="Click to view & edit your identity details"
            >
              <span style={{ fontSize: 14 }}>{ROLE_CONFIG.find(r => r.id === currentRole)?.icon || '👤'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {t(ROLE_CONFIG.find(r => r.id === currentRole)?.key, ROLE_CONFIG.find(r => r.id === currentRole)?.defaultLabel)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 600 }}>
                {currentUser?.name}
              </span>
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--accent-green)',
                display: 'inline-block',
              }} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Right Controls */}
        <div className="nav-controls">

          {/* Controls ONLY available when authenticated */}
          {currentRole !== 'login' && (
            <>
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

              {/* Notification Bell & Dropdown */}
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
                      background: themeMode === 'light' ? '#fff' : 'linear-gradient(145deg, #162035, #0e1424)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-float)',
                      zIndex: 3000,
                      overflow: 'hidden',
                      animation: 'slideUp 0.22s var(--t-spring)',
                    }}
                  >
                    <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{t('notifications', 'Notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => dispatch(markAllNotificationsRead())}
                          style={{ fontSize: 11, color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {t('mark_all_read', 'Mark all read')}
                        </button>
                      )}
                    </div>
                    {notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => dispatch(markNotificationRead(n.id))}
                        style={{
                          padding: '11px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: n.isRead ? 'transparent' : 'var(--accent-primary-soft)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{n.time}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                        No notifications
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Settings Button */}
          <button
            id="settings-btn"
            className="customize-btn"
            onClick={() => setShowSettings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            <span>⚙️</span>
            <span>{t('settings', 'Settings')}</span>
          </button>

          {/* Sign Out Button (Only when authenticated) */}
          {currentRole !== 'login' && (
            <button
              id="logout-nav-btn"
              onClick={() => {
                dispatch(setRole('login'));
                dispatch(addToast({ id: `logout-${Date.now()}`, message: 'Signed out successfully', type: 'info' }));
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 13px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="Sign out of current workspace"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          )}

        </div>
      </header>

      {/* ══ Main Viewport ══ */}
      <main className="main-viewport">
        {ActiveView}
      </main>

      {/* ══ Global Modals & Drawers ══ */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
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
      <HostelBotAI
        isOpen={aiDrawerOpen}
        onClose={() => dispatch(setAiDrawerOpen(false))}
      />
      <HostelFloorplan
        isOpen={floorplanModalOpen}
        onClose={() => dispatch(setFloorplanModalOpen(false))}
      />
      <UserProfileModal />

      {/* ══ Global Toast System ══ */}
      <ToastHost />

    </div>
  );
}
