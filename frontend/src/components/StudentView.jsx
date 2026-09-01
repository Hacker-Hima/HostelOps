import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addTicket, resolveTicket, setPage, selectTicket, addToast, openTicketDrawer,
  createTicketAsync, resolveTicketAsync, updateUserProfile, setProfileModalOpen,
} from '../redux/ticketSlice';
import api from '../services/api';
import { useTranslation } from '../utils/translations';
import PhoneFrame from './PhoneFrame';
import EmptyState from './EmptyState';

const CAT_MAP = { Electrical:'⚡', Plumbing:'💧', Furniture:'🪑', Networking:'📡', Appliance:'❄️', Default:'🔧' };
const CATS = [
  { id:'Electrical', icon:'⚡' }, { id:'Plumbing',  icon:'💧' },
  { id:'Furniture',  icon:'🪑' }, { id:'Networking', icon:'📡' }, { id:'Appliance', icon:'❄️' },
];

const statusBadge = (s) => {
  const m = { Pending:'badge-pending', 'In Progress':'badge-inprogress', Resolved:'badge-resolved' };
  return `badge ${m[s] || 'badge-unassigned'}`;
};

/* ── Mobile Bottom Nav ── */
function StudentBottomNav({ active, onSwitch, t }) {
  const tabs = [
    { id:'home',    icon:'🏠', label: t('role_student', 'Home') },
    { id:'tickets', icon:'📄', label: t('my_tickets', 'Tickets') },
    { id:'scan-qr', icon:'📷', label: t('scan_qr_asset', 'Scan QR') },
    { id:'profile', icon:'👤', label: t('profile', 'Profile') },
  ];
  return tabs.map((tab) => (
    <div key={tab.id} className={`phone-nav-item ${active === tab.id ? 'active' : ''}`} onClick={() => onSwitch(tab.id)}>
      <span className="nav-ico">{tab.icon}</span>
      <span className="nav-lbl">{tab.label}</span>
    </div>
  ));
}

/* ══════════════ PAGE: HOME ══════════════ */
function StudentHome({ tickets, currentUser, onNewTicket, onViewTickets, onViewTicket, t }) {
  const myTickets = tickets.filter((tk) => tk.student === currentUser.name);
  const active    = myTickets.filter((tk) => tk.status !== 'Resolved');
  const resolved  = myTickets.filter((tk) => tk.status === 'Resolved');

  return (
    <>
      <div className="mobile-header">
        <div>
          <h4 style={{ fontSize:16, marginBottom:2 }}>{t('hi', 'Hi')}, {currentUser.name} 👋</h4>
          <p style={{ fontSize:10, color:'var(--text-secondary)' }}>{currentUser.room} • {currentUser.block} • {currentUser.floor}</p>
        </div>
        <div className="avatar">{currentUser.initials}</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
        {[
          { label: t('total', 'Total'),       value:myTickets.length, color:'var(--accent-cyan)',   icon:'📄' },
          { label: t('active', 'Active'),     value:active.length,    color:'var(--accent-yellow)', icon:'⚡' },
          { label: t('resolved', 'Resolved'), value:resolved.length,  color:'var(--accent-green)',  icon:'✅' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card" style={{ padding:'12px 6px', textAlign:'center', cursor:'default' }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
            <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-full btn-lg" style={{ marginBottom:20 }} onClick={onNewTicket}>
        {t('log_new_complaint', '⊕ Log New Complaint')}
      </button>

      {/* Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
        {[
          { icon:'📄', label: t('my_tickets', 'My Tickets'),       desc:`${active.length} ${t('active', 'active')}`, action: onViewTickets },
          { icon:'📷', label: t('scan_qr_asset', 'Scan QR Asset'), desc: t('check_inventory', 'Check room inventory'), action: () => {} },
        ].map(({ icon, label, desc, action }) => (
          <div key={label} onClick={action} className="card" style={{ padding:'14px 12px', cursor:'pointer' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:600 }}>{label}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>{desc}</div>
          </div>
        ))}
      </div>

      <div className="section-title">{t('recent_activity', 'Recent Activity')}</div>
      {myTickets.length === 0 ? (
        <EmptyState icon="📭" title="No tickets yet" subtitle="Submit your first complaint to get started." actionLabel={t('raise_complaint', 'Log a complaint')} onAction={onNewTicket} size="sm" />
      ) : myTickets.slice(0, 3).map((tk, i) => (
        <div key={tk.id} className="ticket-card-mobile" onClick={() => onViewTicket(tk.id)} style={{ animationDelay:`${i * 60}ms` }}>
          <div className="ticket-icon-box">{CAT_MAP[tk.category] || CAT_MAP.Default}</div>
          <div className="ticket-card-body">
            <h5>{tk.title}</h5>
            <p>{tk.room} • {tk.createdAt}</p>
          </div>
          <span className={statusBadge(tk.status)}>{t(tk.status.toLowerCase().replace(' ', '_'), tk.status)}</span>
        </div>
      ))}

      {/* Inventory */}
      <div className="section-title" style={{ marginTop:18 }}>{t('room_inventory', 'Room Inventory')}</div>
      <div className="inventory-grid">
        {[{icon:'🛏️',count:1,label:'Bed'},{icon:'🪑',count:1,label:'Desk'},{icon:'❄️',count:1,label:'AC'},{icon:'📡',count:1,label:'Router'}].map(({ icon,count,label }) => (
          <div key={label} className="inv-item">
            <span className="inv-icon">{icon}</span>
            <div className="inv-count">{count}</div>
            <div className="inv-label">{label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ══════════════ PAGE: MY TICKETS ══════════════ */
function StudentTickets({ tickets, currentUser, onNewTicket, onViewTicket, onResolve, t }) {
  const dispatch = useDispatch();
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const searchRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === '/' && document.activeElement !== searchRef.current) { e.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const myTickets = tickets.filter((tk) => tk.student === currentUser.name);
  const filtered  = useMemo(() => {
    const term = search.toLowerCase();
    return myTickets.filter((tk) => {
      const matchCat  = catFilter === 'All' || tk.category === catFilter;
      const matchTerm = tk.title.toLowerCase().includes(term) || tk.id.toLowerCase().includes(term);
      return matchCat && matchTerm;
    });
  }, [myTickets, search, catFilter]);

  const handleOpenDrawer = useCallback((id) => dispatch(openTicketDrawer(id)), [dispatch]);

  return (
    <>
      <div className="mobile-header">
        <h4>{t('my_tickets', 'My Tickets')} <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:400 }}>({filtered.length})</span></h4>
        <button className="btn btn-primary btn-sm" onClick={onNewTicket}>+ New</button>
      </div>

      <input ref={searchRef} className="form-input" style={{ marginBottom:10 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`🔍 ${t('search', 'Search tickets...')} (press /)`} />

      <div className="chip-row">
        {['All','Electrical','Plumbing','Furniture','Networking','Appliance'].map((c) => (
          <button key={c} className={`chip ${catFilter===c?'chip-active':''}`} onClick={() => setCatFilter(c)}>{c === 'All' ? t('all', 'All') : c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No tickets found" subtitle={search ? `No results for "${search}". Try a different keyword.` : "No tickets in this category."} />
      ) : filtered.map((tk, i) => (
        <div key={tk.id} className="stagger-item" style={{ '--i': i, background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:13, marginBottom:9, animation:'slideUp 0.3s ease both', animationDelay:`${i * 50}ms` }}>
          <div className="flex-between" style={{ marginBottom:7 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:15 }}>{CAT_MAP[tk.category] || '🔧'}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, cursor:'pointer', color:'var(--text-accent)' }} onClick={() => handleOpenDrawer(tk.id)}>{tk.title}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{tk.id} • {tk.createdAt}</div>
              </div>
            </div>
            <span className={statusBadge(tk.status)}>{t(tk.status.toLowerCase().replace(' ', '_'), tk.status)}</span>
          </div>
          <div className="flex-between">
            <div style={{ display:'flex', gap:6 }}>
              <span className={`priority-tag p-${tk.priority.toLowerCase()}`}>{t(tk.priority.toLowerCase(), tk.priority)}</span>
              <span style={{ fontSize:9, color:'var(--text-muted)', alignSelf:'center' }}>👷 {tk.assignedWorker}</span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleOpenDrawer(tk.id)} style={{ fontSize:10 }}>{t('view', 'View')}</button>
              {tk.status !== 'Resolved'
                ? <button className="btn btn-success btn-sm" onClick={() => { onResolve(tk.id); dispatch(addToast({ id:`toast-${Date.now()}`, message:`${tk.id} confirmed resolved!`, type:'success' })); }} style={{ fontSize:10 }}>{t('confirm_done', '✓ Done')}</button>
                : <span style={{ fontSize:11, color:'var(--accent-green)' }}>✓ {t('resolved', 'Closed')}</span>
              }
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ══════════════ PAGE: NEW TICKET ══════════════ */
function StudentNewTicket({ currentUser, onSubmit, onCancel, t }) {
  const dispatch = useDispatch();
  const [step,     setStep]     = useState(1);
  const [category, setCategory] = useState('Electrical');
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [priority, setPriority] = useState('Medium');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ category, title, desc, priority });
    dispatch(addToast({ id:`toast-${Date.now()}`, message:`Complaint "${title}" submitted successfully!`, type:'success' }));
    setTitle(''); setDesc(''); setStep(1);
  }, [category, title, desc, priority, onSubmit, dispatch]);

  return (
    <>
      <div className="mobile-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onCancel} style={{ background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', width:30, height:30, cursor:'pointer', color:'var(--text-secondary)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <h4>{t('raise_complaint', 'Raise a Complaint')}</h4>
        </div>
        <span style={{ fontSize:11, color:'var(--text-muted)' }}>Step {step}/3</span>
      </div>

      {/* Progress */}
      <div style={{ height:3, background:'var(--border-subtle)', borderRadius:999, marginBottom:22 }}>
        <div style={{ height:'100%', width:`${(step/3)*100}%`, background:'var(--grad-primary)', borderRadius:999, transition:'width 0.4s ease' }} />
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">{t('issue_category', 'Issue Category')}</label>
              <div className="cat-grid">
                {CATS.map((c) => (
                  <button type="button" key={c.id} className={`cat-option ${category===c.id?'selected':''}`} onClick={() => setCategory(c.id)}>
                    <span className="cat-icon">{c.icon}</span>{c.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('short_title', 'Short Title')} *</label>
              <input className="form-input" placeholder="e.g. Broken light switch" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary btn-full btn-lg" onClick={() => title.trim() && setStep(2)} disabled={!title.trim()} style={{ opacity:title.trim()?1:0.5 }}>
              Next → Details
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', padding:'12px 14px', marginBottom:14, display:'flex', gap:10 }}>
              <span style={{ fontSize:22 }}>{CAT_MAP[category]}</span>
              <div><div style={{ fontWeight:600, fontSize:13 }}>{title}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{category}</div></div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('detailed_desc', 'Detailed Description')}</label>
              <textarea className="form-textarea" rows={4} placeholder="Describe when it happened, exact location, severity..." value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('link_qr', 'Link Asset QR')}</label>
              <div style={{ display:'flex', gap:8 }}>
                <input className="form-input" placeholder={`QR-${currentUser.room.replace(/-/,'')} (auto-detected)`} readOnly style={{ flex:1, opacity:0.7 }} />
                <button type="button" className="btn btn-ghost" style={{ padding:'10px 14px' }}>📷</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={() => setStep(1)}>← {t('cancel', 'Back')}</button>
              <button type="button" className="btn btn-primary" style={{ flex:2 }} onClick={() => setStep(3)}>Next → Priority →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="form-group">
              <label className="form-label">{t('priority_level', 'Priority Level')}</label>
              <div className="priority-row">
                {['Low','Medium','High'].map((p) => (
                  <button type="button" key={p} className={`priority-btn p-${p.toLowerCase()} ${priority===p?'selected':''}`} onClick={() => setPriority(p)}>
                    {p==='High'?'🔴':p==='Medium'?'🟡':'🟢'} {t(p.toLowerCase(), p)}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Photo Evidence (optional)</label>
              <div className="upload-box">📷 Tap to add "Before" photo</div>
            </div>
            {/* Summary */}
            <div style={{ background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', padding:14, marginBottom:14, fontSize:12 }}>
              <div style={{ color:'var(--text-muted)', marginBottom:6, fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>📋 Review Summary</div>
              <div style={{ fontWeight:600 }}>{category} — {title}</div>
              <div style={{ color:'var(--text-secondary)', marginTop:4 }}>Priority: {priority} • Room: {currentUser.room}</div>
              {desc && <div style={{ color:'var(--text-muted)', marginTop:4, fontSize:11 }}>"{desc.slice(0,60)}{desc.length>60?'...':''}"</div>}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={() => setStep(2)}>← {t('cancel', 'Back')}</button>
              <button type="submit" className="btn btn-primary" style={{ flex:2 }}>{t('submit_complaint', '🚀 Submit Complaint')}</button>
            </div>
          </>
        )}
      </form>
    </>
  );
}

/* ══════════════ PAGE: SCAN QR ══════════════ */
function StudentScanQR({ t }) {
  const dispatch = useDispatch();
  const [scanned, setScanned] = useState(false);
  const [manualTag, setManualTag] = useState('');
  const { assets } = useSelector(s => s.ticketStore);

  const handleScan = useCallback(() => {
    setScanned(true);
    dispatch(addToast({ id:`toast-${Date.now()}`, message:'QR-A204-AC-01 scanned successfully!', type:'success' }));
  }, [dispatch]);

  const handleManualLookup = useCallback(async () => {
    if (!manualTag.trim()) return;
    try {
      const found = await api.assets.getByTag(manualTag.trim());
      if (found) {
        dispatch(addToast({ id:`toast-${Date.now()}`, message:`Found: ${found.name} — ${found.condition} (${found.location})`, type:'info' }));
        return;
      }
    } catch {
      // fallback to store
      const found = assets.find(a => a.tag.toLowerCase() === manualTag.toLowerCase().trim());
      if (found) {
        dispatch(addToast({ id:`toast-${Date.now()}`, message:`Found: ${found.name} — ${found.condition}`, type:'info' }));
      } else {
        dispatch(addToast({ id:`toast-${Date.now()}`, message:`No asset found for tag "${manualTag}"`, type:'error' }));
      }
    }
  }, [manualTag, assets, dispatch]);

  return (
    <>
      <div className="mobile-header"><h4>{t('scan_qr_asset', 'Scan Asset QR')}</h4></div>
      <div style={{ background:'var(--bg-glass)', border:`2px dashed ${scanned?'var(--accent-green)':'var(--border-default)'}`, borderRadius:'var(--radius-xl)', height:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', marginBottom:16, gap:10, position:'relative', overflow:'hidden', transition:'border-color 0.3s' }}>
        {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
          <div key={`${v}${h}`} style={{ position:'absolute', [v]:14, [h]:14, width:22, height:22, borderTop:v==='top'?`3px solid var(--accent-cyan)`:'none', borderBottom:v==='bottom'?`3px solid var(--accent-cyan)`:'none', borderLeft:h==='left'?`3px solid var(--accent-cyan)`:'none', borderRight:h==='right'?`3px solid var(--accent-cyan)`:'none' }} />
        ))}
        {!scanned && <div style={{ position:'absolute', left:20, right:20, height:2, background:'var(--accent-cyan)', opacity:0.6, animation:'gradMove 2s ease-in-out infinite', top:'50%' }} />}
        <div style={{ fontSize:40 }}>{scanned?'✅':'📷'}</div>
        <div style={{ fontSize:12, fontWeight:500, color:scanned?'var(--accent-green)':'var(--text-muted)' }}>{scanned?'Asset scanned!':t('point_qr', 'Point at QR tag')}</div>
      </div>

      <button className="btn btn-primary btn-full" style={{ marginBottom:12 }} onClick={scanned ? () => setScanned(false) : handleScan}>
        {scanned ? t('scan_another', '🔄 Scan Another') : t('simulate_scan', '📷 Simulate QR Scan')}
      </button>

      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input className="form-input" value={manualTag} onChange={e => setManualTag(e.target.value)} placeholder="Or enter tag manually: QR-A302-AC-01" style={{ flex:1 }} />
        <button className="btn btn-ghost" onClick={handleManualLookup} disabled={!manualTag.trim()}>{t('view', 'Look up')}</button>
      </div>

      {scanned && (
        <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'var(--radius-lg)', padding:14, marginBottom:14, animation:'slideUp 0.3s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ fontSize:12, fontWeight:600 }}>Split AC 1.5T</div>
            <span className="badge badge-good">{t('good', 'Good')}</span>
          </div>
          <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace', marginBottom:8 }}>QR-A204-AC-01</div>
          <div style={{ fontSize:11, color:'var(--text-secondary)' }}>Room A-204 • Electrical • Last checked: 12 Aug 2025</div>
          <button className="btn btn-danger btn-sm" style={{ marginTop:10 }}>⚠️ Report Issue</button>
        </div>
      )}

      <div className="section-title">Recently Scanned</div>
      {[{ tag:'QR-A204-AC-01', name:'Split AC 1.5T', condition:'Good' }, { tag:'QR-A204-BED-01', name:'Single Bed', condition:'Good' }].map((a) => (
        <div key={a.tag} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 13px', background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', marginBottom:7 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600 }}>{a.name}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace' }}>{a.tag}</div>
          </div>
          <span className="badge badge-good">{t('good', a.condition)}</span>
        </div>
      ))}
    </>
  );
}

/* ══════════════ PAGE: PROFILE ══════════════ */
function StudentProfile({ currentUser, tickets, t }) {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    room: currentUser.room || '',
    block: currentUser.block || '',
    floor: currentUser.floor || '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    rollNumber: currentUser.rollNumber || '',
  });

  const myTickets = tickets.filter((tk) => tk.student === currentUser.name);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile(formData));
    dispatch(addToast({
      id: `profile-update-${Date.now()}`,
      message: 'Student profile updated successfully!',
      type: 'success',
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser.name || '',
      room: currentUser.room || '',
      block: currentUser.block || '',
      floor: currentUser.floor || '',
      phone: currentUser.phone || '',
      email: currentUser.email || '',
      rollNumber: currentUser.rollNumber || '',
    });
    setIsEditing(false);
  };

  return (
    <>
      <div style={{ background:'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))', border:'1px solid var(--border-default)', borderRadius:'var(--radius-xl)', padding:24, textAlign:'center', marginBottom:14, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(6,182,212,0.1)', pointerEvents:'none' }} />
        <div className="avatar avatar-xl" style={{ margin:'0 auto 12px' }}>{currentUser.initials}</div>
        <h3 style={{ marginBottom:4 }}>{currentUser.name}</h3>
        <p style={{ color:'var(--text-secondary)', fontSize:12 }}>{currentUser.rollNumber}</p>
        <p style={{ color:'var(--accent-cyan)', fontSize:11, marginTop:4 }}>{currentUser.email}</p>
        <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:14 }}>
          {[{v:myTickets.length,l:t('my_tickets', 'Tickets')},{v:myTickets.filter(tk=>tk.status==='Resolved').length,l:t('resolved', 'Resolved')},{v:myTickets.filter(tk=>tk.status==='Pending').length,l:t('pending', 'Pending')}].map(({v,l})=>(
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'var(--text-primary)' }}>{v}</div>
              <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {!isEditing ? (
        <>
          {[
            { icon:'🏠', label:'Room Number',  value:currentUser.room },
            { icon:'🏢', label:'Block',        value:currentUser.block },
            { icon:'🏗️', label:'Floor',        value:currentUser.floor },
            { icon:'📞', label:'Phone',        value:currentUser.phone },
            { icon:'📧', label:'Email',        value:currentUser.email },
            { icon:'🎓', label:'Roll Number',  value:currentUser.rollNumber },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 13px', background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', marginBottom:7 }}>
              <span style={{ fontSize:17 }}>{icon}</span>
              <div>
                <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:600, marginTop:1 }}>{value}</div>
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop:14, fontWeight: 700 }}
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile Details
          </button>
        </>
      ) : (
        <form onSubmit={handleSave} style={{ animation: 'slideUp 0.2s ease' }}>
          <div style={{
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 18px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
              Edit Student Profile
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div className="form-group">
                <label className="form-label">Room</label>
                <input
                  className="form-input"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Block</label>
                <input
                  className="form-input"
                  value={formData.block}
                  onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Floor</label>
                <input
                  className="form-input"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Roll Number</label>
              <input
                className="form-input"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-success"
              style={{ flex: 1.5, fontWeight: 700 }}
            >
              💾 Save Changes
            </button>
          </div>
        </form>
      )}
    </>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function StudentView({ page, isMobile }) {
  const dispatch   = useDispatch();
  const { tickets, currentUser, selectedTicketId } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();
  const [mobileTab, setMobileTab] = useState('home');

  const activePage = isMobile ? mobileTab : page;

  const handleSwitchPage = useCallback((id) => {
    if (isMobile) setMobileTab(id);
    else dispatch(setPage(id));
  }, [isMobile, dispatch]);

  const handleViewTicket = useCallback((id) => {
    dispatch(openTicketDrawer(id));
  }, [dispatch]);

  const handleResolve = useCallback(async (id) => {
    try {
      await dispatch(resolveTicketAsync({ ticketId: id, actor: currentUser.name })).unwrap();
      dispatch(addToast({ id:`toast-${Date.now()}`, message:`${id} confirmed resolved!`, type:'success' }));
    } catch (err) {
      dispatch(resolveTicket(id)); // Fallback
      dispatch(addToast({ id:`toast-${Date.now()}`, message:`${id} marked resolved`, type:'success' }));
    }
  }, [dispatch, currentUser.name]);

  const handleTicketSubmit = useCallback(async (formData) => {
    const { category, title, desc, priority } = formData;
    try {
      await dispatch(createTicketAsync({
        title,
        student: currentUser.name,
        room: currentUser.room,
        category,
        priority,
        description: desc || 'No description provided.',
        assetTag: `QR-${currentUser.room.replace(/-/g,'')}-${category.toUpperCase().slice(0,3)}-01`,
      })).unwrap();
      handleSwitchPage('tickets');
    } catch (err) {
      // Fallback
      dispatch(addTicket({
        id: `TKT-${Math.floor(330 + Math.random() * 70)}`,
        title,
        student: currentUser.name,
        room: currentUser.room,
        category,
        priority,
        status: 'Pending',
        assignedWorker: 'Unassigned',
        assetTag: `QR-${currentUser.room.replace(/-/g,'')}-${category.toUpperCase().slice(0,3)}-01`,
        createdAt: 'Just now',
        creatorRole: 'Student',
        description: desc || 'No description provided.',
      }));
      handleSwitchPage('tickets');
    }
  }, [dispatch, currentUser, handleSwitchPage]);

  const renderPageContent = () => {
    const common = { tickets, currentUser, t };
    switch (activePage) {
      case 'home':       return <StudentHome {...common} onNewTicket={() => handleSwitchPage('new-ticket')} onViewTickets={() => handleSwitchPage('tickets')} onViewTicket={handleViewTicket} />;
      case 'tickets':    return <StudentTickets {...common} onNewTicket={() => handleSwitchPage('new-ticket')} onViewTicket={handleViewTicket} onResolve={handleResolve} />;
      case 'new-ticket': return <StudentNewTicket {...common} onSubmit={handleTicketSubmit} onCancel={() => handleSwitchPage('tickets')} />;
      case 'scan-qr':    return <StudentScanQR t={t} />;
      case 'profile':    return <StudentProfile {...common} />;
      default:           return <StudentHome {...common} onNewTicket={() => handleSwitchPage('new-ticket')} onViewTickets={() => handleSwitchPage('tickets')} onViewTicket={handleViewTicket} />;
    }
  };

  const bottomNav = (
    <StudentBottomNav
      active={activePage === 'new-ticket' ? 'tickets' : activePage}
      onSwitch={handleSwitchPage}
      t={t}
    />
  );

  if (isMobile) {
    return <PhoneFrame bottomNav={bottomNav} showBottomNav>{renderPageContent()}</PhoneFrame>;
  }

  return (
    <div style={{ width:'min(960px,100%)', animation:'slideUp 0.3s ease' }}>
      <div className="desktop-layout">
        <div className="dark-sidebar" style={{ width: 230 }}>
          <div className="app-brand"><div className="brand-icon">🎓</div><span className="brand-name">{t('role_student', 'Student')}</span></div>
          <nav className="side-nav">
            {[{id:'home',icon:'🏠',label:t('role_student', 'Home')},{id:'tickets',icon:'📄',label:t('my_tickets', 'My Tickets')},{id:'new-ticket',icon:'➕',label:t('raise_complaint', 'New Complaint')},{id:'scan-qr',icon:'📷',label:t('scan_qr_asset', 'QR Scanner')},{id:'profile',icon:'👤',label:t('profile', 'Profile')}].map((link) => (
              <div key={link.id} className={`nav-link ${page===link.id?'active':''}`} onClick={() => dispatch(setPage(link.id))}>
                <span className="nav-link-icon">{link.icon}</span>{link.label}
              </div>
            ))}
          </nav>
          <div
            className="sidebar-profile"
            onClick={() => dispatch(setProfileModalOpen(true))}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            title="Click to view & edit profile details"
          >
            <div className="avatar avatar-sm">{currentUser.initials}</div>
            <div><strong style={{ fontSize:11 }}>{currentUser.name}</strong><span>{currentUser.room}</span></div>
          </div>
        </div>
        <div className="desktop-content">
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
}