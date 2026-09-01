import React from 'react';
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

const COLOR_THEMES = [
  { id: 'purple', label: 'Cyber Purple',  grad: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', dot: '#8b5cf6' },
  { id: 'cyan',   label: 'Neon Aqua',     grad: 'linear-gradient(135deg, #06b6d4, #3b82f6)', dot: '#06b6d4' },
  { id: 'green',  label: 'Emerald Matrix',grad: 'linear-gradient(135deg, #10b981, #06b6d4)', dot: '#10b981' },
  { id: 'orange', label: 'Tokyo Sunset',  grad: 'linear-gradient(135deg, #f97316, #eab308)', dot: '#f97316' },
  { id: 'red',    label: 'Crimson Ruby',  grad: 'linear-gradient(135deg, #ef4444, #ec4899)', dot: '#ef4444' },
  { id: 'pink',   label: 'Electric Sakura',grad: 'linear-gradient(135deg, #ec4899, #8b5cf6)', dot: '#ec4899' },
  { id: 'cyber',  label: 'Matrix Neon',   grad: 'linear-gradient(135deg, #00ffc8, #7928ca)', dot: '#00ffc8' },
  { id: 'gold',   label: 'Obsidian Gold', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', dot: '#f59e0b' },
  { id: 'frost',  label: 'Arctic Frost',  grad: 'linear-gradient(135deg, #38bdf8, #818cf8)', dot: '#38bdf8' },
];

const LAYOUT_OPTIONS = [
  { id: 'bento',  icon: '🍱', label: 'Bento Grid',    desc: 'Apple Vision floating bento dock & card clusters' },
  { id: 'cyber',  icon: '⚡', label: 'Cyber HUD',     desc: 'Sci-Fi holographic telemetry & digital scanlines' },
  { id: 'studio', icon: '🏛️', label: 'Exec Studio',   desc: 'Clean split-pane multi-column command room' },
  { id: 'dual',   icon: '📱', label: 'Dual View',     desc: 'Live side-by-side Mobile Simulator + Desktop' },
];

const BG_EFFECTS = [
  { id: 'particles', icon: '✨', label: 'Particle Starfield', desc: 'Interactive physics nodes' },
  { id: 'grid',      icon: '🌐', label: 'Cyber Grid',        desc: 'Geometric tech lattice' },
  { id: 'aura',      icon: '🔮', label: 'Ambient Aura',      desc: 'Pulsing radial glow' },
  { id: 'minimal',   icon: '📐', label: 'Minimal Glass',     desc: 'Pure crisp simplicity' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English'  },
  { code: 'hi', label: 'Hindi',   flag: '🇮🇳', native: 'हिंदी'   },
  { code: 'ta', label: 'Tamil',   flag: '🇮🇳', native: 'தமிழ்'  },
  { code: 'te', label: 'Telugu',  flag: '🇮🇳', native: 'తెలుగు' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'fr', label: 'French',  flag: '🇫🇷', native: 'Français' },
];

export default function CustomizeModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const {
    themeMode,
    colorTheme,
    backgroundEffect,
    radiusMode,
    soundEnabled,
    layoutMode,
    language,
  } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSelectLayout = (id, label) => {
    dispatch(setLayoutMode(id));
    audioFx.playPop(520);
    dispatch(addToast({
      id: `toast-lay-${Date.now()}`,
      message: `Layout switched to ${label} Mode`,
      type: 'info',
    }));
  };

  const handleSelectTheme = (id, label) => {
    dispatch(setColorTheme(id));
    audioFx.playChime();
    dispatch(addToast({
      id: `toast-theme-${Date.now()}`,
      message: `Theme updated: ${label}`,
      type: 'success',
    }));
  };

  const handleSelectBg = (id) => {
    dispatch(setBackgroundEffect(id));
    audioFx.playClick();
  };

  const handleSelectRadius = (mode) => {
    dispatch(setRadiusMode(mode));
    audioFx.playClick();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    dispatch(setSoundEnabled(next));
    audioFx.setEnabled(next);
    if (next) audioFx.playSuccess();
  };

  return (
    <>
      <div className="customize-overlay" onClick={onClose} />
      <div className="customize-drawer">

        {/* Header */}
        <div className="customize-drawer-header">
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>🎨 Theme & Layout Studio</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Customize layouts, 9 dynamic themes, sound FX & atmosphere
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="customize-drawer-body">

          {/* 1. Layout Mode Architecture */}
          <div>
            <div className="customize-section-title">1. UI Layout Architecture</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {LAYOUT_OPTIONS.map((lay) => {
                const isSelected = layoutMode === lay.id;
                return (
                  <div
                    key={lay.id}
                    className={`card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectLayout(lay.id, lay.label)}
                    style={{
                      padding: 12,
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: isSelected ? 'var(--accent-primary-soft)' : 'var(--bg-glass)',
                      transition: 'all var(--t-fast)',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{lay.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{lay.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                      {lay.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Color Theme Matrix (9 Themes) */}
          <div>
            <div className="customize-section-title">2. Color Matrix (9 Vivid Palettes)</div>
            <div className="color-palette-grid">
              {COLOR_THEMES.map((theme) => {
                const isSelected = colorTheme === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`color-swatch-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTheme(theme.id, theme.label)}
                  >
                    <div
                      className="swatch-glow-dot"
                      style={{ background: theme.grad, color: theme.dot }}
                    />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {theme.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Light / Dark Appearance */}
          <div>
            <div className="customize-section-title">3. Day / Night Mode</div>
            <div className="theme-mode-grid">
              <div
                className={`theme-mode-tile ${themeMode === 'dark' ? 'selected' : ''}`}
                onClick={() => { dispatch(setThemeMode('dark')); audioFx.playClick(); }}
              >
                <span style={{ fontSize: 22 }}>🌙</span>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Deep Dark Mode</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Atmospheric neon glow</div>
              </div>
              <div
                className={`theme-mode-tile ${themeMode === 'light' ? 'selected' : ''}`}
                onClick={() => { dispatch(setThemeMode('light')); audioFx.playClick(); }}
              >
                <span style={{ fontSize: 22 }}>☀️</span>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>Airy Light Mode</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Crisp daylight glass</div>
              </div>
            </div>
          </div>

          {/* 4. Background Effects / Atmosphere */}
          <div>
            <div className="customize-section-title">4. Background Atmosphere</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {BG_EFFECTS.map((bg) => {
                const isSelected = backgroundEffect === bg.id;
                return (
                  <div
                    key={bg.id}
                    className={`card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectBg(bg.id)}
                    style={{
                      padding: 10,
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: isSelected ? 'var(--accent-primary-soft)' : 'var(--bg-glass)',
                    }}
                  >
                    <div style={{ fontSize: 16 }}>{bg.icon} {bg.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{bg.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Audio Synthesizer Haptics */}
          <div>
            <div className="customize-section-title">5. Interactive Audio Haptics</div>
            <div
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
              }}
              onClick={handleToggleSound}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{soundEnabled ? '🔊' : '🔇'}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    {soundEnabled ? 'Synthesizer Audio Enabled' : 'Audio Muted'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Tactile clicks, pops & chords via Web Audio API
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); audioFx.playSuccess(); }}>
                Test Sound 🎵
              </button>
            </div>
          </div>

          {/* 6. Corner Radius */}
          <div>
            <div className="customize-section-title">6. Corner Curvature</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'sharp',  label: 'Sharp (4px)' },
                { id: 'smooth', label: 'Smooth (12px)' },
                { id: 'round',  label: 'Pill (24px)' },
              ].map((r) => (
                <button
                  key={r.id}
                  className={`btn ${radiusMode === r.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                  onClick={() => handleSelectRadius(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Language */}
          <div>
            <div className="customize-section-title">7. Internationalization</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`btn ${language === lang.code ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                  onClick={() => { dispatch(setLanguage(lang.code)); audioFx.playClick(); }}
                >
                  {lang.flag} {lang.native}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
