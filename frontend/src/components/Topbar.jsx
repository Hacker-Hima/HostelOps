import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  markAllNotificationsRead, markNotificationRead,
  markAllNotificationsReadAsync, markNotificationReadAsync,
} from '../redux/ticketSlice';

/**
 * Topbar — Desktop topbar with search, notifications dropdown.
 *
 * Props:
 *   title    : string  — page heading
 *   subtitle : string  — page subtitle
 *   showSearch: bool
 */
export default function Topbar({ title = 'Dashboard', subtitle = '', showSearch = true }) {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state) => state.ticketStore);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Press "/" to focus search
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setNotifOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllNotificationsReadAsync());
  }, [dispatch]);

  const handleNotifClick = useCallback(
    (id) => {
      dispatch(markNotificationReadAsync(id));
    },
    [dispatch]
  );

  const notifTypeIcon = (type) => {
    if (type === 'success') return '✅';
    if (type === 'warn') return '⚠️';
    return 'ℹ️';
  };

  return (
    <div className="desktop-topbar">
      {/* Left — Title */}
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {/* Right — Search + Notifications */}
      <div className="flex-gap-sm" style={{ position: 'relative' }}>
        {showSearch && (
          <input
            ref={searchRef}
            className="search-bar"
            placeholder="🔍  Search... (press /)"
          />
        )}

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="notif-bell"
            onClick={() => setNotifOpen((v) => !v)}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotifClick(n.id)}
                  >
                    <div className="notif-message">
                      {notifTypeIcon(n.type)} {n.message}
                    </div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
