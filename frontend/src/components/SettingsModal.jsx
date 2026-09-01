import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setThemeMode, setColorTheme, setRadiusMode,
  setLayoutMode, setLanguage, setViewMode,
  setFontStyle, setFontSize,
  setRole, addToast, updateUserProfile,
} from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';

const COLOR_THEMES = [
  { id: 'purple', label: 'Indigo',  grad: 'linear-gradient(135deg,#7c3aed,#4f46e5)', dot: '#7c3aed' },
  { id: 'cyan',   label: 'Aqua',   grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)', dot: '#06b6d4' },
  { id: 'green',  label: 'Emerald',grad: 'linear-gradient(135deg,#10b981,#059669)', dot: '#10b981' },
  { id: 'orange', label: 'Amber',  grad: 'linear-gradient(135deg,#f97316,#eab308)', dot: '#f97316' },
  { id: 'red',    label: 'Rose',   grad: 'linear-gradient(135deg,#ef4444,#ec4899)', dot: '#ef4444' },
  { id: 'pink',   label: 'Blush',  grad: 'linear-gradient(135deg,#ec4899,#8b5cf6)', dot: '#ec4899' },
  { id: 'cyber',  label: 'Matrix', grad: 'linear-gradient(135deg,#00ffc8,#7928ca)', dot: '#00ffc8' },
  { id: 'gold',   label: 'Gold',   grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)', dot: '#f59e0b' },
  { id: 'frost',  label: 'Frost',  grad: 'linear-gradient(135deg,#38bdf8,#818cf8)', dot: '#38bdf8' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', native: 'English'  },
  { code: 'hi', label: 'Hindi',   flag: '🇮🇳', native: 'हिंदी'     },
  { code: 'ta', label: 'Tamil',   flag: '🇮🇳', native: 'தமிழ்'     },
  { code: 'te', label: 'Telugu',  flag: '🇮🇳', native: 'తెలుగు'    },
  { code: 'es', label: 'Spanish', flag: '🇪🇸', native: 'Español'  },
  { code: 'fr', label: 'French',  flag: '🇫🇷', native: 'Français' },
];

const FONT_STYLES = [
  { id: 'inter',   label: 'Inter',    desc: 'Clean & precise',    sample: 'Aa', family: 'Inter, sans-serif' },
  { id: 'dm-sans', label: 'DM Sans',  desc: 'Geometric & modern', sample: 'Aa', family: '"DM Sans", sans-serif' },
  { id: 'outfit',  label: 'Outfit',   desc: 'Friendly & rounded', sample: 'Aa', family: '"Outfit", sans-serif' },
  { id: 'nunito',  label: 'Nunito',   desc: 'Soft & approachable',sample: 'Aa', family: '"Nunito", sans-serif' },
];

const FONT_SIZES = [
  { id: 'compact',     label: 'Compact',     desc: '12px base — Dense layout'    },
  { id: 'normal',      label: 'Normal',      desc: '13px base — Default'         },
  { id: 'comfortable', label: 'Comfortable', desc: '14px base — Relaxed spacing' },
  { id: 'large',       label: 'Large',       desc: '15px base — Accessibility'   },
];

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'typography', label: 'Typography', icon: '✏️' },
  { id: 'language',   label: 'Language',   icon: '🌐' },
  { id: 'account',    label: 'Account',    icon: '👤' },
];

const SectionLabel = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em',
    color:'var(--text-muted)', marginBottom:12, marginTop:4 }}>
    {children}
  </div>
);

const OptionCard = ({ selected, onClick, children, style }) => (
  <div onClick={onClick} style={{
    padding:'11px 14px', borderRadius:'var(--radius-md)',
    border:'1.5px solid', borderColor: selected ? 'var(--accent-primary)' : 'var(--border-default)',
    background: selected ? 'var(--accent-primary-soft)' : 'var(--bg-card)',
    cursor:'pointer', transition:'all 0.15s ease', ...style,
  }}>{children}</div>
);

export default function SettingsModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { themeMode, colorTheme, radiusMode, viewMode, language,
    currentUser, isBackendConnected, fontStyle, fontSize } = useSelector((s) => s.ticketStore);
  const [activeTab, setActiveTab] = useState('appearance');

  if (!isOpen) return null;

  const handleReset = () => {
    dispatch(setThemeMode('dark'));
    dispatch(setColorTheme('purple'));
    dispatch(setRadiusMode('smooth'));
    dispatch(setFontStyle('inter'));
    dispatch(setFontSize('normal'));
    dispatch(setViewMode('desktop'));
    dispatch(addToast({ id: `toast-reset-${Date.now()}`, message: 'Settings reset to defaults', type: 'info' }));
  };

  const handleSignOut = () => {
    dispatch(setRole('login'));
    onClose();
    dispatch(addToast({ id: `toast-so-${Date.now()}`, message: 'Signed out successfully', type: 'success' }));
  };

  const iconBtn = { width:30, height:30, border:'1px solid var(--border-default)',
    borderRadius:'var(--radius-sm)', background:'transparent', color:'var(--text-muted)',
    cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center',
    transition:'all 0.15s', fontFamily:'var(--font-main)' };

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
        backdropFilter:'blur(6px)', zIndex:1200, animation:'fadeIn 0.18s ease' }} />

      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'min(680px,96vw)',
        background:'var(--bg-surface)', borderLeft:'1px solid var(--border-default)',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.2)', display:'flex', flexDirection:'column',
        zIndex:1201, animation:'drawerSlideIn 0.28s cubic-bezier(0.32,0.72,0,1)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 24px', borderBottom:'1px solid var(--border-subtle)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'var(--accent-primary-soft)',
              border:'1px solid var(--border-strong)', borderRadius:'var(--radius-md)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚙️</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Settings</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>Personalise your HostelOps workspace</div>
            </div>
          </div>
          <button onClick={onClose} style={iconBtn}
            onMouseEnter={e => { e.currentTarget.style.background='var(--bg-glass)'; e.currentTarget.style.color='var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

          {/* Sidebar */}
          <div style={{ width:188, flexShrink:0, borderRight:'1px solid var(--border-subtle)',
            padding:'16px 12px', display:'flex', flexDirection:'column', gap:2,
            background:'var(--bg-root)' }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                  borderRadius:'var(--radius-md)', border:'none',
                  background: active ? 'var(--accent-primary-soft)' : 'transparent',
                  color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
                  fontFamily:'var(--font-main)', fontSize:12.5, fontWeight: active ? 700 : 500,
                  cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.15s',
                  borderLeft: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                }}>
                  <span style={{ fontSize:15, width:20, textAlign:'center' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
            <div style={{ flex:1 }} />
            <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:10, marginTop:6,
              display:'flex', flexDirection:'column', gap:2 }}>
              {[
                { label:'Reset Defaults', icon:'↺', color:'var(--text-muted)', hoverBg:'var(--bg-glass)', fn: handleReset },
                { label:'Sign Out', icon:'→', color:'#ef4444', hoverBg:'rgba(239,68,68,0.08)', fn: handleSignOut },
              ].map((a) => (
                <button key={a.label} onClick={a.fn} style={{
                  display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                  borderRadius:'var(--radius-md)', border:'none', background:'transparent',
                  color:a.color, fontSize:12, fontWeight: a.label === 'Sign Out' ? 600 : 500,
                  cursor:'pointer', width:'100%', textAlign:'left', fontFamily:'var(--font-main)',
                  transition:'all 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = a.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'24px 26px' }}>

            {activeTab === 'appearance' && (
              <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

                <div>
                  <SectionLabel>Theme Mode</SectionLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[{ id:'dark', icon:'🌙', label:'Dark', desc:'Deep navy slate' },
                      { id:'light', icon:'☀️', label:'Light', desc:'Crisp white surface' }].map((m) => (
                      <OptionCard key={m.id} selected={themeMode === m.id} onClick={() => dispatch(setThemeMode(m.id))}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ fontSize:20 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{m.label}</div>
                            <div style={{ fontSize:10.5, color:'var(--text-muted)', marginTop:1 }}>{m.desc}</div>
                          </div>
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionLabel>Accent Color</SectionLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {COLOR_THEMES.map((theme) => {
                      const selected = colorTheme === theme.id;
                      return (
                        <div key={theme.id} onClick={() => dispatch(setColorTheme(theme.id))} style={{
                          display:'flex', alignItems:'center', gap:9, padding:'9px 12px',
                          borderRadius:'var(--radius-md)', border:'1.5px solid',
                          borderColor: selected ? theme.dot : 'var(--border-default)',
                          background: selected ? `${theme.dot}18` : 'var(--bg-card)',
                          cursor:'pointer', transition:'all 0.15s',
                        }}>
                          <div style={{ width:13, height:13, borderRadius:'50%', background:theme.grad, flexShrink:0 }} />
                          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-primary)', flex:1 }}>{theme.label}</span>
                          {selected && <span style={{ fontSize:11, color:theme.dot }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <SectionLabel>Shape & Geometry</SectionLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                    {[{ id:'sharp', label:'Sharp', r:'2px' }, { id:'smooth', label:'Smooth', r:'10px' }, { id:'round', label:'Pill', r:'999px' }].map((r) => (
                      <OptionCard key={r.id} selected={radiusMode === r.id} onClick={() => dispatch(setRadiusMode(r.id))}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ width:32, height:20, margin:'0 auto 8px', background:'var(--accent-primary-soft)',
                            border:'1.5px solid var(--accent-primary)', borderRadius:r.r }} />
                          <div style={{ fontSize:11.5, fontWeight:700, color:'var(--text-primary)' }}>{r.label}</div>
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                <div>
                  <SectionLabel>Default Viewport</SectionLabel>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[{ id:'desktop', icon:'🖥️', label:'Desktop' }, { id:'mobile', icon:'📱', label:'Mobile' }].map((v) => (
                      <OptionCard key={v.id} selected={viewMode === v.id} onClick={() => dispatch(setViewMode(v.id))}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:18 }}>{v.icon}</span>
                          <span style={{ fontSize:12.5, fontWeight:600, color:'var(--text-primary)' }}>{v.label} View</span>
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'typography' && (
              <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
                <div>
                  <SectionLabel>Font Family</SectionLabel>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {FONT_STYLES.map((f) => {
                      const selected = (fontStyle || 'inter') === f.id;
                      return (
                        <div key={f.id} onClick={() => dispatch(setFontStyle(f.id))} style={{
                          display:'flex', alignItems:'center', gap:14, padding:'12px 14px',
                          borderRadius:'var(--radius-md)', border:'1.5px solid',
                          borderColor: selected ? 'var(--accent-primary)' : 'var(--border-default)',
                          background: selected ? 'var(--accent-primary-soft)' : 'var(--bg-card)',
                          cursor:'pointer', transition:'all 0.15s',
                        }}>
                          <div style={{ fontFamily:f.family, fontSize:26, fontWeight:600,
                            color: selected ? 'var(--accent-primary)' : 'var(--text-muted)', width:38, flexShrink:0 }}>
                            {f.sample}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:f.family }}>{f.label}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{f.desc}</div>
                          </div>
                          {selected && <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--accent-primary)',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700 }}>✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <SectionLabel>Font Size</SectionLabel>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {FONT_SIZES.map((s) => {
                      const selected = (fontSize || 'normal') === s.id;
                      return (
                        <div key={s.id} onClick={() => dispatch(setFontSize(s.id))} style={{
                          display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'11px 14px', borderRadius:'var(--radius-md)', border:'1.5px solid',
                          borderColor: selected ? 'var(--accent-primary)' : 'var(--border-default)',
                          background: selected ? 'var(--accent-primary-soft)' : 'var(--bg-card)',
                          cursor:'pointer', transition:'all 0.15s',
                        }}>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{s.label}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{s.desc}</div>
                          </div>
                          {selected && <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--accent-primary)',
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700 }}>✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div>
                <SectionLabel>Interface Language</SectionLabel>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {LANGUAGES.map((lang) => {
                    const selected = language === lang.code;
                    return (
                      <div key={lang.code} onClick={() => { dispatch(setLanguage(lang.code)); dispatch(addToast({ id:`lang-${Date.now()}`, message:`Language → ${lang.label}`, type:'info' })); }} style={{
                        display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                        borderRadius:'var(--radius-md)', border:'1.5px solid',
                        borderColor: selected ? 'var(--accent-primary)' : 'var(--border-default)',
                        background: selected ? 'var(--accent-primary-soft)' : 'var(--bg-card)',
                        cursor:'pointer', transition:'all 0.15s',
                      }}>
                        <span style={{ fontSize:22 }}>{lang.flag}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-primary)' }}>{lang.label}</div>
                          <div style={{ fontSize:10.5, color:'var(--text-muted)' }}>{lang.native}</div>
                        </div>
                        {selected && <span style={{ fontSize:11, color:'var(--accent-primary)', fontWeight:700 }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {/* Profile Card / Edit Form */}
                <div style={{
                  borderRadius:'var(--radius-lg)', background:'var(--bg-card)',
                  border:'1px solid var(--border-default)', padding: 16,
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--grad-primary)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:16, fontWeight:800, color:'#fff', flexShrink:0 }}>
                        {currentUser?.initials || 'HC'}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{currentUser?.name || 'Himachalam'}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Room {currentUser?.room} · {currentUser?.block} · {currentUser?.rollNumber}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{currentUser?.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Edit Fields */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-accent)', marginBottom: 10 }}>
                      Edit User Profile Details
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>Name</label>
                        <input
                          className="form-input"
                          style={{ height: 36, fontSize: 12 }}
                          defaultValue={currentUser?.name || ''}
                          id="settings-edit-name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>Room Number</label>
                        <input
                          className="form-input"
                          style={{ height: 36, fontSize: 12 }}
                          defaultValue={currentUser?.room || ''}
                          id="settings-edit-room"
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>Email</label>
                        <input
                          className="form-input"
                          style={{ height: 36, fontSize: 12 }}
                          defaultValue={currentUser?.email || ''}
                          id="settings-edit-email"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>Phone</label>
                        <input
                          className="form-input"
                          style={{ height: 36, fontSize: 12 }}
                          defaultValue={currentUser?.phone || ''}
                          id="settings-edit-phone"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-full"
                      onClick={() => {
                        const name = document.getElementById('settings-edit-name')?.value;
                        const room = document.getElementById('settings-edit-room')?.value;
                        const email = document.getElementById('settings-edit-email')?.value;
                        const phone = document.getElementById('settings-edit-phone')?.value;
                        dispatch(updateUserProfile({ name, room, email, phone }));
                        dispatch(addToast({ id: `profile-toast-${Date.now()}`, message: 'User profile updated successfully!', type: 'success' }));
                      }}
                      style={{ fontWeight: 700 }}
                    >
                      💾 Save Profile Changes
                    </button>
                  </div>
                </div>

                <div style={{ padding:'14px 16px', borderRadius:'var(--radius-md)',
                  background:'var(--bg-card)', border:'1px solid var(--border-default)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <span style={{ fontSize:12.5, fontWeight:700, color:'var(--text-primary)' }}>Backend Status</span>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                      color: isBackendConnected ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%',
                        background: isBackendConnected ? 'var(--accent-green)' : 'var(--text-muted)', display:'inline-block' }} />
                      {isBackendConnected ? 'Connected — SQLite' : 'Offline Mode'}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                    Express API at <code style={{ fontSize:10, color:'var(--text-accent)', background:'var(--bg-glass)', padding:'1px 5px', borderRadius:4 }}>http://localhost:5000/api</code>
                  </div>
                </div>

                <div>
                  <SectionLabel>Actions</SectionLabel>
                  {[
                    { label:'Reset to Default Settings', sub:'Restore theme, font and language to defaults', icon:'↺', danger:false, fn: handleReset },
                    { label:'Sign Out', sub:'Return to role selection screen', icon:'→', danger:true, fn: handleSignOut },
                  ].map((a) => (
                    <button key={a.label} onClick={a.fn} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'11px 14px', width:'100%',
                      borderRadius:'var(--radius-md)', textAlign:'left', cursor:'pointer',
                      fontFamily:'var(--font-main)', fontSize:12.5, fontWeight:600, marginBottom:8,
                      border: a.danger ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--border-default)',
                      background: a.danger ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)',
                      color: a.danger ? '#ef4444' : 'var(--text-secondary)',
                      transition:'all 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = a.danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-glass-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = a.danger ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)'}>
                      <span style={{ fontSize:16 }}>{a.icon}</span>
                      <div>
                        <div style={{ color: a.danger ? '#ef4444' : 'var(--text-primary)', fontWeight:700 }}>{a.label}</div>
                        <div style={{ fontSize:10.5, color: a.danger ? 'rgba(239,68,68,0.65)' : 'var(--text-muted)', marginTop:1 }}>{a.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:10.5, color:'var(--text-muted)' }}>HostelOps v4.0 · Real-Time Operations Platform</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
