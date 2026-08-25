import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setThemeMode, setColorTheme, setLanguage, setViewMode, addToast } from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';

const COLOR_THEMES = [
  { id: 'purple', label: 'Cyber Purple',  grad: 'linear-gradient(135deg, #7c3aed, #06b6d4)', dot: '#7c3aed' },
  { id: 'cyan',   label: 'Neon Cyan',     grad: 'linear-gradient(135deg, #06b6d4, #3b82f6)', dot: '#06b6d4' },
  { id: 'green',  label: 'Emerald',       grad: 'linear-gradient(135deg, #10b981, #06b6d4)', dot: '#10b981' },
  { id: 'orange', label: 'Sunset',        grad: 'linear-gradient(135deg, #f97316, #eab308)', dot: '#f97316' },
  { id: 'red',    label: 'Crimson',       grad: 'linear-gradient(135deg, #ef4444, #ec4899)', dot: '#ef4444' },
  { id: 'pink',   label: 'Electric Pink', grad: 'linear-gradient(135deg, #ec4899, #8b5cf6)', dot: '#ec4899' },
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
  const { themeMode, colorTheme, language, viewMode } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const handleThemeMode  = useCallback((m)  => {
    dispatch(setThemeMode(m));
  }, [dispatch]);

  const handleColorTheme = useCallback((tId)  => {
    dispatch(setColorTheme(tId));
  }, [dispatch]);

  const handleLanguage   = useCallback((l)  => {
    dispatch(setLanguage(l));
    const langObj = LANGUAGES.find(item => item.code === l);
    dispatch(addToast({
      id: `toast-lang-${Date.now()}`,
      message: `Language updated to ${langObj?.label} (${langObj?.native})`,
      type: 'success',
    }));
  }, [dispatch]);

  const handleViewMode   = useCallback((vm) => {
    dispatch(setViewMode(vm));
  }, [dispatch]);

  if (!isOpen) return null;

  const isLight = themeMode === 'light';

  return (
    <>
      {/* Backdrop */}
      <div className="customize-overlay" onClick={onClose} />

      {/* Slide-in Drawer */}
      <div className={`customize-drawer ${isLight ? 'light' : ''}`}>
        {/* Header */}
        <div className="customize-drawer-header">
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>🎨 {t('customise', 'Customise')}</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Personalise your HostelOps experience</p>
          </div>
          <button
            className="modal-close"
            style={{ width: 32, height: 32, fontSize: 15 }}
            onClick={onClose}
          >✕</button>
        </div>

        {/* Body */}
        <div className="customize-drawer-body">

          {/* ── 1. Appearance ── */}
          <div className="customize-section">
            <div className="customize-section-title">Appearance</div>
            <div className="theme-mode-grid">

              {/* Dark Mode */}
              <div
                className={`theme-mode-tile ${themeMode === 'dark' ? 'selected' : ''}`}
                onClick={() => handleThemeMode('dark')}
              >
                {themeMode === 'dark' && <div className="theme-check">✓</div>}
                <div className="theme-mode-preview dark-preview">
                  <div className="preview-bar" />
                  <div className="preview-dots">
                    <div className="preview-dot" style={{ background: 'rgba(255,255,255,0.08)', width: 32, height: 6 }} />
                    <div className="preview-dot" style={{ background: 'rgba(255,255,255,0.05)', width: 20, height: 6 }} />
                  </div>
                  {/* Mini cards */}
                  <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8, display: 'flex', gap: 3 }}>
                    <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }} />
                  </div>
                </div>
                <div className="theme-mode-label">🌙 Dark Mode</div>
                <div className="theme-mode-sublabel">Deep space feel</div>
              </div>

              {/* Light Mode */}
              <div
                className={`theme-mode-tile ${themeMode === 'light' ? 'selected' : ''}`}
                onClick={() => handleThemeMode('light')}
              >
                {themeMode === 'light' && <div className="theme-check">✓</div>}
                <div className="theme-mode-preview light-preview">
                  <div className="preview-bar" />
                  <div className="preview-dots">
                    <div className="preview-dot" style={{ background: 'rgba(0,0,0,0.08)', width: 32, height: 6 }} />
                    <div className="preview-dot" style={{ background: 'rgba(0,0,0,0.05)', width: 20, height: 6 }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 6, left: 8, right: 8, display: 'flex', gap: 3 }}>
                    <div style={{ flex: 1, height: 12, background: 'rgba(0,0,0,0.06)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }} />
                    <div style={{ flex: 1, height: 12, background: 'rgba(0,0,0,0.06)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }} />
                    <div style={{ flex: 1, height: 12, background: 'rgba(0,0,0,0.06)', borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }} />
                  </div>
                </div>
                <div className="theme-mode-label">☀️ Light Mode</div>
                <div className="theme-mode-sublabel">Clean & airy</div>
              </div>

            </div>
          </div>

          {/* ── 2. Accent Color ── */}
          <div className="customize-section">
            <div className="customize-section-title">Accent Color</div>
            <div className="color-palette">
              {COLOR_THEMES.map((t) => (
                <div
                  key={t.id}
                  className={`color-swatch ${colorTheme === t.id ? 'selected' : ''}`}
                  style={colorTheme === t.id ? { '--accent-primary': t.dot, '--accent-primary-soft': `${t.dot}22`, '--border-strong': `${t.dot}80`, '--text-accent': t.dot } : {}}
                  onClick={() => handleColorTheme(t.id)}
                >
                  <div className="swatch-dot" style={{ background: t.grad }} />
                  <span style={{ fontSize: 11 }}>{t.label}</span>
                  {colorTheme === t.id && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: t.dot }}>✓</span>
                  )}
                </div>
              ))}
            </div>

            {/* Color preview strip */}
            <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: COLOR_THEMES.find(t => t.id === colorTheme)?.grad, boxShadow: `0 0 14px ${COLOR_THEMES.find(t => t.id === colorTheme)?.dot}60`, transition: 'all 0.3s' }} />
          </div>

          {/* ── 3. Device View ── */}
          <div className="customize-section">
            <div className="customize-section-title">Device Layout</div>
            <div className="view-mode-grid">
              <div
                className={`view-mode-card ${viewMode === 'desktop' ? 'selected' : ''}`}
                onClick={() => handleViewMode('desktop')}
              >
                <span className="view-mode-icon">🖥️</span>
                <div className="view-mode-label">{t('desktop_view', 'Desktop')}</div>
                <div className="view-mode-desc">Wide dashboard layout</div>
                {viewMode === 'desktop' && (
                  <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-accent)', fontWeight: 700 }}>● Active</div>
                )}
              </div>
              <div
                className={`view-mode-card ${viewMode === 'mobile' ? 'selected' : ''}`}
                onClick={() => handleViewMode('mobile')}
              >
                <span className="view-mode-icon">📱</span>
                <div className="view-mode-label">{t('mobile_view', 'Mobile')}</div>
                <div className="view-mode-desc">iPhone frame mockup</div>
                {viewMode === 'mobile' && (
                  <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-accent)', fontWeight: 700 }}>● Active</div>
                )}
              </div>
            </div>
          </div>

          {/* ── 4. Language ── */}
          <div className="customize-section">
            <div className="customize-section-title">Interface Language (भाषा / மொழி / భాష)</div>
            <div className="language-grid">
              {LANGUAGES.map((l) => (
                <div
                  key={l.code}
                  className={`lang-option ${language === l.code ? 'selected' : ''}`}
                  onClick={() => handleLanguage(l.code)}
                >
                  <span className="lang-flag">{l.flag}</span>
                  <div className="lang-info">
                    <strong>{l.label}</strong>
                    <span>{l.native}</span>
                  </div>
                  {language === l.code && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-accent)' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. Active Settings Summary ── */}
          <div style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 700 }}>
              Current Settings
            </div>
            {[
              { label: 'Theme',    value: themeMode === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode' },
              { label: 'Color',    value: `● ${COLOR_THEMES.find(t => t.id === colorTheme)?.label || 'Purple'}` },
              { label: 'Layout',   value: viewMode === 'mobile' ? `📱 ${t('mobile_view', 'Mobile')}` : `🖥️ ${t('desktop_view', 'Desktop')}` },
              { label: 'Language', value: `${LANGUAGES.find(l => l.code === language)?.flag} ${LANGUAGES.find(l => l.code === language)?.label || 'English'} (${LANGUAGES.find(l => l.code === language)?.native})` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <button className="btn btn-primary btn-full btn-lg" onClick={onClose}>
            ✓ {t('done', 'Done')}
          </button>
        </div>
      </div>
    </>
  );
}
