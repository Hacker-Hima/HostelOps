import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setRole,
  logout,
  setViewMode,
  setThemeMode,
  fetchInitialData,
  markAllNotificationsRead,
  markNotificationRead,
  markAllNotificationsReadAsync,
  markNotificationReadAsync,
  setSettingsModalOpen,
  addToast,
} from './redux/ticketSlice';

/* ── Role Views ── */
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

/* ── Lifecycle Modals & Global Overlays ── */
import AddAssetModal from './components/AddAssetModal';
import AllocateAssetModal from './components/AllocateAssetModal';
import TransferAssetModal from './components/TransferAssetModal';
import ReturnAssetModal from './components/ReturnAssetModal';
import MaintenanceModal from './components/MaintenanceModal';
import AuditModal from './components/AuditModal';
import DisposalModal from './components/DisposalModal';
import RequestAssetModal from './components/RequestAssetModal';
import QrPreviewModal from './components/QrPreviewModal';
import QrScannerModal from './components/QrScannerModal';
import SettingsModal from './components/SettingsModal';
import ToastHost from './components/ToastHost';

import './index.css';

export default function App() {
  const dispatch = useDispatch();
  const {
    currentRole,
    adminType,
    currentUser,
    viewMode,
    themeMode,
    colorTheme,
    notifications,
    fontStyle,
    fontSize,
    isBackendConnected,
    dbStatus,
    connectionError,
  } = useSelector((s) => s.ticketStore);

  const [showSettings, setShowSettings] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead && !n.is_read).length;

  /* Listen for session expired events from API client */
  useEffect(() => {
    const handleSessionExpired = (e) => {
      dispatch(logout());
      dispatch(
        addToast({
          id: `sess-exp-${Date.now()}`,
          message: e.detail?.message || 'Session expired. Please log in again.',
          type: 'warn',
        })
      );
    };
    window.addEventListener('hostelops:session-expired', handleSessionExpired);
    return () => window.removeEventListener('hostelops:session-expired', handleSessionExpired);
  }, [dispatch]);

  /* Fetch initial full-stack data from MongoDB Backend */
  useEffect(() => {
    dispatch(fetchInitialData())
      .unwrap()
      .then(() => {
        console.log('✅ Connected to MongoDB Backend');
      })
      .catch((err) => {
        console.warn('⚠️ Backend connection notice:', err);
      });
  }, [dispatch]);

  /* Apply theme classes to <body> */
  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${themeMode}`);
  }, [themeMode]);

  useEffect(() => {
    const allThemes = ['purple', 'cyan', 'green', 'orange', 'red', 'pink', 'cyber', 'gold', 'frost'];
    allThemes.forEach((th) => document.body.classList.remove(`color-${th}`));
    document.body.classList.add(`color-${colorTheme}`);
  }, [colorTheme]);

  useEffect(() => {
    const fonts = ['inter', 'dm-sans', 'outfit', 'nunito'];
    fonts.forEach((f) => document.body.classList.remove(`font-${f}`));
    document.body.classList.add(`font-${fontStyle || 'inter'}`);
  }, [fontStyle]);

  useEffect(() => {
    const sizes = ['compact', 'normal', 'comfortable', 'large'];
    sizes.forEach((s) => document.body.classList.remove(`size-${s}`));
    document.body.classList.add(`size-${fontSize || 'normal'}`);
  }, [fontSize]);

  const handleRoleSwitch = useCallback((id) => dispatch(setRole(id)), [dispatch]);

  const ActiveView = useMemo(() => {
    switch (currentRole) {
      case 'login':
        return <LoginPage />;
      case 'admin':
      case 'staff':
      case 'technician':
        return <AdminDashboard isMobile={false} />;
      case 'user':
      case 'student':
        return <StudentDashboard isMobile={false} />;
      default:
        return <LoginPage />;
    }
  }, [currentRole]);

  return (
    <div className="hostelops-root" style={{ minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden', background: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      
      {/* ══ Top Navigation Bar ══ */}
      <header
        className="role-nav-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'var(--bg-surface-glass)',
          borderBottom: '1px solid var(--border-default)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Brand */}
        <div
          className="nav-brand"
          onClick={() => handleRoleSwitch('login')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            }}
          >
            🏢
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
              Hostel Asset Management
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-accent)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Lifecycle & Audit System
            </div>
          </div>
        </div>

        {/* Active Session Identity Badge */}
        {currentRole !== 'login' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '50px',
                background: 'var(--accent-primary-soft)',
                border: '1px solid var(--border-strong)',
              }}
            >
              <span style={{ fontSize: '14px' }}>
                {currentRole === 'admin'
                  ? (adminType === 'superadmin' ? '👑' : '🛡️')
                  : (currentRole === 'staff' || currentRole === 'technician')
                  ? '⚡'
                  : '🎓'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentRole === 'admin'
                  ? adminType === 'superadmin'
                    ? 'Super Admin (Admin 1)'
                    : 'Asset Admin (Admin 2)'
                  : (currentRole === 'staff' || currentRole === 'technician')
                  ? `Staff (${currentUser?.name || 'Technician'})`
                  : `Student (${currentUser?.name || 'Student'})`}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-accent)', fontWeight: 600 }}>
                {currentUser?.room ? `Room ${currentUser.room}` : currentUser?.name}
              </span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                }}
              />
            </div>
          </div>
        )}

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Controls when authenticated */}
          {currentRole !== 'login' && (
            <>
              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    position: 'relative',
                  }}
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--bg-root)',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      width: '320px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '16px',
                      boxShadow: 'var(--shadow-float)',
                      zIndex: 3000,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            dispatch(markAllNotificationsRead());
                            dispatch(markAllNotificationsReadAsync());
                          }}
                          style={{ fontSize: '11px', color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          dispatch(markNotificationRead(n.id));
                          dispatch(markNotificationReadAsync(n.id));
                        }}
                        style={{
                          padding: '11px 16px',
                          borderBottom: '1px solid var(--border-subtle)',
                          background: (n.isRead || n.is_read) ? 'transparent' : 'var(--accent-primary-soft)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time || 'Recently'}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                        No notifications
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Settings Button (Only visible when logged in) */}
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>

              {/* Sign Out Button */}
              <button
                onClick={() => {
                  dispatch(logout());
                  dispatch(addToast({ id: `logout-${Date.now()}`, message: 'Signed out successfully', type: 'info' }));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </>
          )}

          {/* Theme Mode Toggle (Dark / Light) */}
          <button
            onClick={() => dispatch(setThemeMode(themeMode === 'dark' ? 'light' : 'dark'))}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
            title="Toggle Dark/Light Mode"
          >
            {themeMode === 'dark' ? '🌙' : '☀️'}
          </button>

        </div>
      </header>

      {/* ══ Connection Status Banner (Requirement 9) ══ */}
      {!isBackendConnected && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
            borderBottom: '1px solid rgba(239,68,68,0.3)',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#ef4444',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>
              <strong>Backend Service Disconnected:</strong> {connectionError || 'Unable to connect to Node.js backend at http://localhost:5000'}
            </span>
          </div>
          <button
            onClick={() => dispatch(fetchInitialData())}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry Connection
          </button>
        </div>
      )}
      {isBackendConnected && dbStatus === 'disconnected' && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(245,158,11,0.15), rgba(234,179,8,0.15))',
            borderBottom: '1px solid rgba(245,158,11,0.3)',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#f59e0b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>
              <strong>Database Notice:</strong> Backend is online, but MongoDB connection is currently unavailable.
            </span>
          </div>
          <button
            onClick={() => dispatch(fetchInitialData())}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reconnect
          </button>
        </div>
      )}

      {/* ══ Main Viewport ══ */}
      <main className="main-viewport" style={{ paddingBottom: '60px' }}>
        {ActiveView}
      </main>

      {/* ══ Global Lifecycle Modals ══ */}
      <AddAssetModal />
      <AllocateAssetModal />
      <TransferAssetModal />
      <ReturnAssetModal />
      <MaintenanceModal />
      <AuditModal />
      <DisposalModal />
      <RequestAssetModal />
      <QrPreviewModal />
      <QrScannerModal />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* ══ Global Toast Alerts ══ */}
      <ToastHost />

    </div>
  );
}
