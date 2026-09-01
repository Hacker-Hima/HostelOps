import React, { useState } from 'react';
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
  setRole,
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
  { id: 'bento',  icon: '🍱', label: 'Bento Grid', desc: 'Apple-style card clusters' },
  { id: 'cyber',  icon: '⚡', label: 'Cyber HUD',  desc: 'Sci-fi holographic display' },
  { id: 'studio', icon: '🏛️', label: 'Exec Studio',desc: 'Multi-column command room' },
  { id: 'dual',   icon: '📱', label: 'Dual View',  desc: 'Side-by-side mobile+desktop' },
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
  { id: 'Appearance',   icon: '🎨' },
  { id: 'Layout',       icon: '🍱' },
  { id: 'Background',   icon: '✨' },
  { id: 'Accessibility',icon: '♿' },
  { id: 'Language',     icon: '🌐' },
  { id: 'Account',      icon: '👤' },
  { id: 'About',        icon: 'ℹ️' },
];

/* ─── Sub-components ─── */
function Toggle({ on, onToggle }) {
  return (
    <button
      className={`settings-toggle${on ? ' on' : ''}`}
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
    currentUser,
    currentRole,
    isBackendConnected,
  } = useSelector((s) => s.ticketStore);

  const [activeTab, setActiveTab] = useState('Appearance');
  const { t } = useTranslation();

  if (!isOpen) return null;

  const toast = (message, type = 'success') =>
    dispatch(addToast({ id: Date.now().toString(), message, type }));

  const click = () => audioFx.playClick?.();

  /* ── APPEARANCE TAB ── */
  const renderAppearance = () => (
    <>
      <div className="settings-section">
        <SectionTitle>Theme</SectionTitle>
        <div className="settings-grid-2">
          {[
            { id: 'light', icon: '☀️', label: 'Light', desc: 'Clean & bright' },
            { id: 'dark',  icon: '🌙', label: 'Dark',  desc: 'Easy on eyes' },
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
    <div className="settings-section">
      <SectionTitle>Dashboard Layout</SectionTitle>
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
  );

  /* ── BACKGROUND TAB ── */
  const renderBackground = () => (
    <div className="settings-section">
      <SectionTitle>Background Effect</SectionTitle>
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
  );

  /* ── ACCESSIBILITY TAB ── */
  const renderAccessibility = () => (
    <>
      <div className="settings-section">
        <SectionTitle>Interaction</SectionTitle>
        <OptionRow
          label="Sound Effects"
          desc="UI feedback sounds via Web Audio API"
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
          label="Compact Mode"
          desc="Reduce padding and card spacing"
          right={<Toggle on={false} onToggle={() => toast('Coming soon', 'info')} />}
        />
        <OptionRow
          label="Reduce Motion"
          desc="Minimize animations and transitions"
          right={<Toggle on={false} onToggle={() => toast('Coming soon', 'info')} />}
        />
      </div>
      <div className="settings-section">
        <SectionTitle>Display</SectionTitle>
        <OptionRow
          label="High Contrast"
          desc="Increase border and text contrast ratios"
          right={<Toggle on={false} onToggle={() => toast('Coming soon', 'info')} />}
        />
        <OptionRow
          label="Large Text"
          desc="Increase base font size by 20%"
          right={<Toggle on={false} onToggle={() => toast('Coming soon', 'info')} />}
        />
        <OptionRow
          label="Focus Indicators"
          desc="Enhanced keyboard focus outlines"
          right={<Toggle on={true} onToggle={() => toast('Coming soon', 'info')} />}
        />
      </div>
      <div className="settings-section">
        <SectionTitle>Notifications</SectionTitle>
        <OptionRow
          label="Push Notifications"
          desc="Browser notification alerts for new tickets"
          right={<Toggle on={false} onToggle={() => toast('Coming soon', 'info')} />}
        />
        <OptionRow
          label="Email Digest"
          desc="Daily summary email of pending actions"
          right={<Toggle on={false} onToggle={() => toast('Coming soon', 'info')} />}
        />
      </div>
    </>
  );

  /* ── LANGUAGE TAB ── */
  const renderLanguage = () => (
    <div className="settings-section">
      <SectionTitle>Interface Language</SectionTitle>
      <div className="language-grid">
        {LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className={`lang-option${language === lang.code ? ' active' : ''}`}
            onClick={() => { dispatch(setLanguage(lang.code)); click(); toast(`Language: ${lang.label}`); }}
          >
            <span className="lang-flag">{lang.flag}</span>
            <div>
              <div className="lang-name">{lang.label}</div>
              <div className="lang-native">{lang.native}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '11px 13px', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        💡 Full translations available for all interface elements. Backend API responses remain in English.
      </div>
    </div>
  );

  /* ── ACCOUNT TAB ── */
  const renderAccount = () => {
    const roleLabel = {
      student: 'Student', staff: 'Working Staff', 'asst-warden': 'Asst. Warden',
      'res-warden': 'Res. Warden', technician: 'Technician', assets: 'Asset Manager', principal: 'Principal',
    }[currentRole] || currentRole;

    return (
      <>
        {currentUser && (
          <>
            <div className="account-profile-card">
              <div className="account-avatar">{currentUser.initials || '??'}</div>
              <div>
                <div className="account-name">{currentUser.name}</div>
                <div className="account-role">{roleLabel} · {currentUser.block}</div>
              </div>
            </div>

            <div className="settings-section">
              <SectionTitle>Profile Details</SectionTitle>
              <div className="account-info-table">
                {[
                  { label: 'Roll No.',  value: currentUser.rollNumber },
                  { label: 'Email',     value: currentUser.email },
                  { label: 'Phone',     value: currentUser.phone },
                  { label: 'Room',      value: `${currentUser.room} · ${currentUser.block}` },
                  { label: 'Floor',     value: currentUser.floor },
                  { label: 'Role',      value: roleLabel },
                ].filter(({ value }) => value).map(({ label, value }) => (
                  <div key={label} className="account-info-row">
                    <span className="account-info-label">{label}</span>
                    <span className="account-info-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="settings-section">
          <SectionTitle>Session</SectionTitle>
          <OptionRow
            label="Current Role"
            desc={`Logged in as ${roleLabel}`}
            right={
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { dispatch(setRole('login')); onClose(); }}
              >
                Switch
              </button>
            }
          />
          <OptionRow
            label="Demo Mode"
            desc="No real credentials — data is pre-seeded"
            right={<span style={{ fontSize: 11, color: 'var(--color-warning)', fontWeight: 600, padding: '2px 8px', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-pill)' }}>Active</span>}
          />
        </div>

        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 4 }}
          onClick={() => { dispatch(setRole('login')); onClose(); }}
        >
          🔐 Return to Role Selector
        </button>
      </>
    );
  };

  /* ── ABOUT TAB ── */
  const renderAbout = () => (
    <>
      <div className="settings-section">
        <SectionTitle>Application</SectionTitle>
        <div className="account-info-table">
          {[
            { label: 'Version',    value: 'HostelOps v4.0' },
            { label: 'Frontend',   value: 'React 19 + Vite 8 + Redux Toolkit' },
            { label: 'Backend',    value: 'Express 5 + node:sqlite' },
            { label: 'Database',   value: 'SQLite · 9 REST API routes' },
            { label: 'Styling',    value: 'Vanilla CSS + CSS Variables' },
            { label: 'Node.js',    value: 'v24 (built-in SQLite)' },
          ].map(({ label, value }) => (
            <div key={label} className="account-info-row">
              <span className="account-info-label">{label}</span>
              <span className="account-info-value">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <SectionTitle>Backend Connection</SectionTitle>
        <OptionRow
          label="API Status"
          desc="http://localhost:5000/api"
          right={
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: isBackendConnected ? 'var(--color-success)' : 'var(--color-danger)',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '2px 8px', borderRadius: 'var(--radius-pill)',
              background: isBackendConnected ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {isBackendConnected ? 'Connected' : 'Offline'}
            </span>
          }
        />
        <div style={{ padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>
          {isBackendConnected
            ? '✅ Live data from SQLite backend. All changes persist across sessions.'
            : '⚠️ Backend offline. Running with seed data. Start with: cd backend && npm start'}
        </div>
      </div>

      <div className="settings-section">
        <SectionTitle>Keyboard Shortcuts</SectionTitle>
        <div className="account-info-table">
          {[
            { key: 'Ctrl + K', action: 'Open Command Palette' },
            { key: '?',        action: 'Show keyboard shortcuts' },
            { key: 'Esc',      action: 'Close any panel or modal' },
          ].map(({ key, action }) => (
            <div key={key} className="account-info-row" style={{ justifyContent: 'space-between' }}>
              <span className="account-info-value">{action}</span>
              <kbd style={{
                fontFamily: 'monospace', fontSize: 11,
                padding: '2px 8px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-default)',
                borderBottom: '2px solid var(--border-default)',
                borderRadius: 4,
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
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
    Background:    renderBackground,
    Accessibility: renderAccessibility,
    Language:      renderLanguage,
    Account:       renderAccount,
    About:         renderAbout,
  };

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel" role="dialog" aria-label="Settings">
        {/* Header */}
        <div className="settings-header">
          <div>
            <div className="settings-title">⚙️ Settings</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              Customize your HostelOps experience
            </div>
          </div>
          <button className="settings-close-btn" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        {/* Tab bar */}
        <div className="settings-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.icon} {tab.id}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="settings-body" role="tabpanel">
          {TAB_RENDERERS[activeTab]?.()}
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <span className="settings-version">
            v4.0 ·{' '}
            <span style={{ color: isBackendConnected ? 'var(--color-success)' : 'var(--color-warning)' }}>
              {isBackendConnected ? '● Live' : '● Offline'}
            </span>
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              dispatch(setThemeMode('light'));
              dispatch(setColorTheme('purple'));
              dispatch(setRadiusMode('smooth'));
              dispatch(setSoundEnabled(true));
              dispatch(setBackgroundEffect('particles'));
              dispatch(setLanguage('en'));
              click();
              toast('Settings reset to defaults');
            }}
          >
            Reset defaults
          </button>
        </div>
      </div>
    </>
  );
}
