import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setThemeMode,
  setColorTheme,
  setBackgroundEffect,
  setRadiusMode,
  setSoundEnabled,
  setLayoutMode,
  setLanguage,
  addToast,
} from '../redux/ticketSlice';
import { audioFx } from '../utils/audioFx';
import { useTranslation } from '../utils/translations';

/* ─── Constants ─── */
const COLOR_THEMES = [
  { id: 'purple', label: 'Indigo',   grad: 'linear-gradient(135deg,#7c3aed,#4f46e5)' },
  { id: 'cyan',   label: 'Cyan',     grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  { id: 'green',  label: 'Emerald',  grad: 'linear-gradient(135deg,#10b981,#059669)' },
  { id: 'orange', label: 'Orange',   grad: 'linear-gradient(135deg,#f97316,#eab308)' },
  { id: 'red',    label: 'Red',      grad: 'linear-gradient(135deg,#ef4444,#ec4899)' },
  { id: 'pink',   label: 'Pink',     grad: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  { id: 'cyber',  label: 'Cyber',    grad: 'linear-gradient(135deg,#00ffc8,#7928ca)' },
  { id: 'gold',   label: 'Gold',     grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { id: 'frost',  label: 'Frost',    grad: 'linear-gradient(135deg,#38bdf8,#818cf8)' },
];

const LAYOUT_OPTIONS = [
  { id: 'bento',  icon: '🍱', label: 'Bento Grid', desc: 'Card clusters' },
  { id: 'cyber',  icon: '⚡', label: 'Cyber HUD',  desc: 'Sci-fi holographic display' },
  { id: 'studio', icon: '🏛️', label: 'Exec Studio',desc: 'Multi-column command room' },
  { id: 'dual',   icon: '📱', label: 'Dual View',  desc: 'Mobile + Desktop layout' },
];

const BG_OPTIONS = [
  { id: 'particles', icon: '✨', label: 'Particles', desc: 'Interactive physics nodes' },
  { id: 'grid',      icon: '🌐', label: 'Grid',      desc: 'Geometric tech lattice' },
  { id: 'aura',      icon: '🔮', label: 'Aura',      desc: 'Pulsing radial glow' },
  { id: 'minimal',   icon: '📐', label: 'Minimal',   desc: 'Pure clean background' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English' },
  { code: 'hi', label: 'Hindi',   flag: '🇮🇳', native: 'हिंदी' },
  { code: 'ta', label: 'Tamil',   flag: '🇮🇳', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu',  flag: '🇮🇳', native: 'తెలుగు' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'fr', label: 'French',  flag: '🇫🇷', native: 'Français' },
];

const TABS = [
  { id: 'Appearance',    icon: '🎨' },
  { id: 'Layout',        icon: '🍱' },
  { id: 'Notifications', icon: '🔔' },
  { id: 'Accessibility', icon: '♿' },
  { id: 'Language',      icon: '🌐' },
  { id: 'Account',       icon: '👤' },
  { id: 'About',         icon: 'ℹ️' },
];

/* ─── Sub-components ─── */
function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      className={`toggle-switch ${on ? 'on' : ''}`}
      onClick={onToggle}
      aria-label={on ? 'Enabled' : 'Disabled'}
    />
  );
}

function SectionTitle({ children }) {
  return <div className="settings-section-title">{children}</div>;
}

function OptionRow({ label, desc, right }) {
  return (
    <div className="settings-option-row">
      <div>
        <div className="settings-option-label">{label}</div>
        {desc && <div className="settings-option-desc">{desc}</div>}
      </div>
      {right}
    </div>
  );
}

/* ── Live Preview Sample Card ── */
function LivePreviewCard({ themeMode, colorTheme, radiusMode, density }) {
  return (
    <div className="settings-preview-panel">
      <div className="settings-preview-title">Live Preview</div>
      <div className="preview-card-sample">
        <div className="preview-card-header">
          <div className="preview-card-avatar">HO</div>
          <div>
            <div className="preview-card-title">TKT-312 · Water Leakage</div>
            <div className="preview-card-sub">Room A-204 · Sarathi Kamal</div>
          </div>
        </div>

        <div className="preview-badge-row">
          <span className="priority-tag p-high" style={{ fontSize: 9, padding: '2px 6px' }}>🔴 High</span>
          <span className="badge badge-inprogress" style={{ fontSize: 9, padding: '2px 6px' }}>In Progress</span>
        </div>

        <button type="button" className="preview-btn-sample">
          Action Button Example
        </button>
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Theme: <strong>{themeMode}</strong> · Color: <strong>{colorTheme}</strong> · Density: <strong>{density}</strong>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function SettingsPanel({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const {
    themeMode,
    colorTheme,
    backgroundEffect,
    radiusMode,
    soundEnabled,
    layoutMode,
    language,
    isBackendConnected,
    currentUser,
  } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('Appearance');
  const [density, setDensity] = useState(() => localStorage.getItem('hostelops_density') || 'comfortable');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('hostelops_reduce_motion') === 'true');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('hostelops_high_contrast') === 'true');

  // Notification toggles
  const [notifTicketAssign, setNotifTicketAssign] = useState(true);
  const [notifSlaBreach, setNotifSlaBreach] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);

  // Apply density class
  const handleDensityChange = (newDensity) => {
    setDensity(newDensity);
    localStorage.setItem('hostelops_density', newDensity);
    document.body.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    document.body.classList.add(`density-${newDensity}`);
    dispatch(addToast({ id: `den-${Date.now()}`, message: `Density set to ${newDensity}`, type: 'info' }));
  };

  // Apply reduce motion class
  const handleReduceMotionToggle = () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    localStorage.setItem('hostelops_reduce_motion', String(next));
    document.body.classList.toggle('reduce-motion', next);
    dispatch(addToast({ id: `mot-${Date.now()}`, message: `Reduce motion ${next ? 'enabled' : 'disabled'}`, type: 'info' }));
  };

  // Apply high contrast class
  const handleHighContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('hostelops_high_contrast', String(next));
    document.body.classList.toggle('high-contrast', next);
    dispatch(addToast({ id: `hc-${Date.now()}`, message: `High contrast ${next ? 'enabled' : 'disabled'}`, type: 'info' }));
  };

  if (!isOpen) return null;

  const toast = (msg, type = 'success') =>
    dispatch(addToast({ id: `toast-${Date.now()}`, message: msg, type }));

  const click = () => { if (soundEnabled) audioFx.playClick?.(); };

  /* ── APPEARANCE TAB ── */
  const renderAppearance = () => (
    <>
      <div className="settings-section">
        <SectionTitle>Theme Mode</SectionTitle>
        <div className="settings-grid-2">
          {[
            { id: 'light', icon: '☀️', label: 'Light', desc: 'Clean, crisp & bright' },
            { id: 'dark',  icon: '🌙', label: 'Dark',  desc: 'Easy on eyes with deep navy' },
          ].map((m) => (
            <div
              key={m.id}
              className={`settings-option-card${themeMode === m.id ? ' active' : ''}`}
              onClick={() => { dispatch(setThemeMode(m.id)); click(); }}
            >
              <span className="option-icon">{m.icon}</span>
              <div className="option-label">{m.label}</div>
              <div className="option-desc">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <SectionTitle>Accent Color — {COLOR_THEMES.find(c => c.id === colorTheme)?.label}</SectionTitle>
        <div className="settings-color-grid">
          {COLOR_THEMES.map((ct) => (
            <div key={ct.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div
                className={`color-swatch${colorTheme === ct.id ? ' active' : ''}`}
                style={{ background: ct.grad }}
                onClick={() => { dispatch(setColorTheme(ct.id)); click(); }}
                title={ct.label}
              />
              <span style={{ fontSize: 9.5, color: 'var(--text-muted)', textAlign: 'center' }}>{ct.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <SectionTitle>Border Radius</SectionTitle>
        <div className="settings-grid-3">
          {[
            { id: 'sharp',  icon: '⬛', label: 'Sharp' },
            { id: 'smooth', icon: '🔲', label: 'Smooth' },
            { id: 'round',  icon: '⬜', label: 'Round' },
          ].map((r) => (
            <div
              key={r.id}
              className={`settings-option-card${radiusMode === r.id ? ' active' : ''}`}
              onClick={() => { dispatch(setRadiusMode(r.id)); click(); }}
            >
              <span className="option-icon">{r.icon}</span>
              <div className="option-label">{r.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  /* ── LAYOUT TAB ── */
  const renderLayout = () => (
    <>
      <div className="settings-section">
        <SectionTitle>Layout Density</SectionTitle>
        <div className="density-option-row">
          {[
            { id: 'compact',     icon: '🔬', label: 'Compact',     sub: 'Tight padding, dense rows' },
            { id: 'comfortable', icon: '🛋️', label: 'Comfortable', sub: 'Balanced modern SaaS spacing' },
            { id: 'spacious',    icon: '🌿', label: 'Spacious',    sub: 'Generous padding & gaps' },
          ].map((d) => (
            <div
              key={d.id}
              className={`density-option ${density === d.id ? 'selected' : ''}`}
              onClick={() => handleDensityChange(d.id)}
            >
              <span className="density-option-icon">{d.icon}</span>
              <div className="density-option-label">{d.label}</div>
              <div className="density-option-sub">{d.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <SectionTitle>Dashboard Style</SectionTitle>
        <div className="settings-grid-2">
          {LAYOUT_OPTIONS.map((lo) => (
            <div
              key={lo.id}
              className={`settings-option-card${layoutMode === lo.id ? ' active' : ''}`}
              onClick={() => { dispatch(setLayoutMode(lo.id)); toast(`Layout: ${lo.label}`); click(); }}
            >
              <span className="option-icon">{lo.icon}</span>
              <div className="option-label">{lo.label}</div>
              <div className="option-desc">{lo.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <SectionTitle>Background Animation</SectionTitle>
        <div className="settings-grid-2">
          {BG_OPTIONS.map((bg) => (
            <div
              key={bg.id}
              className={`settings-option-card${backgroundEffect === bg.id ? ' active' : ''}`}
              onClick={() => { dispatch(setBackgroundEffect(bg.id)); click(); }}
            >
              <span className="option-icon">{bg.icon}</span>
              <div className="option-label">{bg.label}</div>
              <div className="option-desc">{bg.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  /* ── NOTIFICATIONS TAB ── */
  const renderNotifications = () => (
    <div className="settings-section">
      <SectionTitle>Notification Preferences</SectionTitle>

      <div className="notif-toggle-row">
        <div className="notif-toggle-info">
          <span className="notif-toggle-label">Ticket Assignment Pings</span>
          <span className="notif-toggle-desc">Instant notification when a ticket is assigned to you</span>
        </div>
        <Toggle on={notifTicketAssign} onToggle={() => setNotifTicketAssign(p => !p)} />
      </div>

      <div className="notif-toggle-row">
        <div className="notif-toggle-info">
          <span className="notif-toggle-label">SLA Breach Warning Sound</span>
          <span className="notif-toggle-desc">Audio alert when an urgent complaint exceeds 4 hours</span>
        </div>
        <Toggle on={notifSlaBreach} onToggle={() => setNotifSlaBreach(p => !p)} />
      </div>

      <div className="notif-toggle-row">
        <div className="notif-toggle-info">
          <span className="notif-toggle-label">Daily Email Operations Digest</span>
          <span className="notif-toggle-desc">Morning summary report of pending and resolved items</span>
        </div>
        <Toggle on={notifDigest} onToggle={() => setNotifDigest(p => !p)} />
      </div>
    </div>
  );

  /* ── ACCESSIBILITY TAB ── */
  const renderAccessibility = () => (
    <div className="settings-section">
      <SectionTitle>Accessibility & Motion</SectionTitle>
      <OptionRow
        label="Sound Effects"
        desc="UI feedback clicks and success chime via Web Audio"
        right={
          <Toggle
            on={soundEnabled}
            onToggle={() => {
              dispatch(setSoundEnabled(!soundEnabled));
              if (!soundEnabled) audioFx.playSuccess?.();
            }}
          />
        }
      />
      <OptionRow
        label="Reduce Motion"
        desc="Completely stop CSS animations and continuous transitions"
        right={<Toggle on={reduceMotion} onToggle={handleReduceMotionToggle} />}
      />
      <OptionRow
        label="High Contrast Mode"
        desc="Enhance borders and text contrast for better readability"
        right={<Toggle on={highContrast} onToggle={handleHighContrastToggle} />}
      />
    </div>
  );

  /* ── LANGUAGE TAB ── */
  const renderLanguage = () => (
    <div className="settings-section">
      <SectionTitle>Language / भाषा / மொழி / భాష</SectionTitle>
      <div className="settings-grid-2">
        {LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className={`settings-option-card${language === lang.code ? ' active' : ''}`}
            onClick={() => { dispatch(setLanguage(lang.code)); click(); toast(`Language: ${lang.label}`); }}
          >
            <span className="option-icon">{lang.flag}</span>
            <div className="option-label">{lang.label}</div>
            <div className="option-desc">{lang.native}</div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── ACCOUNT TAB ── */
  const renderAccount = () => (
    <div className="settings-section">
      <SectionTitle>Session Info</SectionTitle>
      <div className="account-info-table">
        {[
          { label: 'Name',        val: currentUser?.name || 'User' },
          { label: 'Role',        val: currentUser?.role || 'Guest' },
          { label: 'Email',       val: currentUser?.email || 'user@hostel.edu' },
          { label: 'Room / Dept', val: currentUser?.room || 'Campus General' },
        ].map(({ label, val }) => (
          <div key={label} className="account-info-row">
            <span className="account-info-label">{label}</span>
            <span className="account-info-value">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── ABOUT TAB ── */
  const renderAbout = () => (
    <>
      <div className="settings-section">
        <SectionTitle>System Telemetry</SectionTitle>
        <OptionRow
          label="MongoDB Backend"
          desc="http://localhost:5000/api"
          right={
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: isBackendConnected ? 'var(--color-success)' : 'var(--color-danger)',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', borderRadius: 'var(--radius-pill)',
              background: isBackendConnected ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {isBackendConnected ? 'Live Connection' : 'Offline / Seed State'}
            </span>
          }
        />
      </div>

      <div className="settings-section">
        <SectionTitle>Keyboard Shortcuts</SectionTitle>
        <div className="account-info-table">
          {[
            { key: 'Ctrl + K', action: 'Open Command Palette' },
            { key: '?',        action: 'Show keyboard shortcuts' },
            { key: 'Esc',      action: 'Close any drawer or panel' },
          ].map(({ key, action }) => (
            <div key={key} className="account-info-row" style={{ justifyContent: 'space-between' }}>
              <span className="account-info-value">{action}</span>
              <kbd style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                padding: '2px 8px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-default)',
                borderRadius: 4,
                color: 'var(--text-secondary)',
              }}>{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const TAB_RENDERERS = {
    Appearance:    renderAppearance,
    Layout:        renderLayout,
    Notifications: renderNotifications,
    Accessibility: renderAccessibility,
    Language:      renderLanguage,
    Account:       renderAccount,
    About:         renderAbout,
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-modal-wide" role="dialog" aria-modal="true" aria-label="HostelOps Preferences & Settings">

        {/* ── Left Tab Rail ── */}
        <div className="settings-tab-rail">
          <div className="settings-tab-rail-title">Preferences</div>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="settings-tab-icon">{tab.icon}</span>
              <span>{tab.id}</span>
            </button>
          ))}
        </div>

        {/* ── Center Content Area ── */}
        <div className="settings-content-area">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 className="settings-section-head">{activeTab}</h2>
              <p className="settings-section-sub">Configure your workspace settings</p>
            </div>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          {TAB_RENDERERS[activeTab]?.()}
        </div>

        {/* ── Right Live Preview Pane ── */}
        <LivePreviewCard
          themeMode={themeMode}
          colorTheme={colorTheme}
          radiusMode={radiusMode}
          density={density}
        />

      </div>
    </>
  );
}
