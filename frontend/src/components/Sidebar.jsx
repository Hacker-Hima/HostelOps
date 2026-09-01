import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setProfileModalOpen } from '../redux/ticketSlice';

/**
 * Sidebar — Reusable dark glassmorphism sidebar for desktop views.
 *
 * Props:
 *   navLinks  : [{ id, icon, label }]
 *   activeLink: string (id of active link)
 *   onNavClick: (id) => void
 *   user      : { name, role, initials }
 *   brandName : string
 */
export default function Sidebar({ navLinks = [], activeLink, onNavClick, user = {}, brandName = 'HostelOps' }) {
  const dispatch = useDispatch();
  const [hoveredLink, setHoveredLink] = useState(null);

  const handleClick = useCallback(
    (id) => {
      if (onNavClick) onNavClick(id);
    },
    [onNavClick]
  );

  return (
    <aside className="dark-sidebar">
      {/* Brand */}
      <div className="app-brand">
        <div className="brand-icon">🏫</div>
        <span className="brand-name">{brandName}</span>
      </div>

      {/* Navigation */}
      <nav className="side-nav">
        {navLinks.map((link) => (
          <div
            key={link.id}
            className={`nav-link ${activeLink === link.id ? 'active' : ''}`}
            onClick={() => handleClick(link.id)}
            onMouseEnter={() => setHoveredLink(link.id)}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              transform: hoveredLink === link.id && activeLink !== link.id ? 'translateX(3px)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <span className="nav-link-icon">{link.icon}</span>
            <span>{link.label}</span>
            {activeLink === link.id && (
              <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
            )}
          </div>
        ))}
      </nav>

      {/* Profile Footer */}
      <div
        className="sidebar-profile"
        onClick={() => dispatch(setProfileModalOpen(true))}
        style={{ cursor: 'pointer', transition: 'all 0.15s' }}
        title="Click to view & edit profile details"
      >
        <div className="avatar avatar-sm">{user.initials || '??'}</div>
        <div style={{ minWidth: 0 }}>
          <strong className="truncate" style={{ fontSize: 12, fontWeight: 600, display: 'block' }}>
            {user.name || 'Unknown User'}
          </strong>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user.role || 'Admin'}</span>
        </div>
      </div>
    </aside>
  );
}
