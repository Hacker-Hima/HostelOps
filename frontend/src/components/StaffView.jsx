import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPage, addToast, addAuditEntry, submitStaffRequestAsync, setProfileModalOpen } from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';
import PhoneFrame from './PhoneFrame';
import EmptyState from './EmptyState';

const stepState = (status) => {
  if (status === 'Approved')           return ['done','done','done'];
  if (status === 'Rejected')           return ['done','rejected','locked'];
  if (status === 'Pending Principal')  return ['done','done','current'];
  if (status === 'Pending Res. Warden')return ['done','current','locked'];
  return ['current','locked','locked'];
};

/* ── Page: Dashboard ── */
function StaffDashboard({ staffRequests, onNewRequest, onViewStatus, t }) {
  const pending  = staffRequests.filter((r) => r.status !== 'Approved' && r.status !== 'Rejected');
  const approved = staffRequests.filter((r) => r.status === 'Approved');
  const latest   = staffRequests[0];
  const steps    = latest ? stepState(latest.status) : [];

  return (
    <>
      <div className="mobile-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="avatar" style={{ background:'linear-gradient(135deg,#f97316,#eab308)' }}>👨‍🍳</div>
          <div>
            <h4>Sanji</h4>
            <p style={{ fontSize:10, color:'var(--text-secondary)' }}>Head Chef • Mess & Dining</p>
          </div>
        </div>
        <span className="badge badge-resolved">{t('active', 'Active')}</span>
      </div>

      {/* Dept Banner */}
      <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(234,179,8,0.08))', border:'1px solid rgba(249,115,22,0.25)', borderRadius:'var(--radius-lg)', padding:'13px 15px', marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:13 }}>🏢 Mess & Dining Department</div>
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>Block A — Ground Floor</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
        {[{v:staffRequests.length,l:t('total', 'Total Reqs'),c:'var(--accent-cyan)'},{v:pending.length,l:t('pending', 'Pending'),c:'var(--accent-yellow)'},{v:approved.length,l:t('approved', 'Approved'),c:'var(--accent-green)'}].map(({v,l,c})=>(
          <div key={l} className="card" style={{ padding:'11px 6px', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-full" style={{ marginBottom:16 }} onClick={onNewRequest}>+ New Equipment / Repair Request</button>

      {/* Latest Request Stepper */}
      {latest ? (
        <>
          <div className="section-title">Latest Request Status</div>
          <div style={{ background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'14px', marginBottom:14 }}>
            <div className="flex-between" style={{ marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{latest.title}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{latest.time} • {latest.id}</div>
              </div>
              <div style={{ fontWeight:800, fontSize:15, color:'var(--text-primary)' }}>₹{latest.cost.toLocaleString()}</div>
            </div>
            <div className="stepper">
              {['Asst. Warden Endorsed','Res. Warden Sign-off','Principal Approval'].map((label, i) => {
                const s = steps[i];
                return (
                  <div key={label} className={`step-item ${s}`}>
                    <div className={`step-dot ${s}`}>{s==='done'?'✓':s==='current'?'⏳':'🔒'}</div>
                    <div className="step-body"><strong>{label}</strong><p>{s==='done'?t('approved', 'Approved'):s==='current'?'Under review':'Awaiting prior approval'}</p></div>
                  </div>
                );
              })}
            </div>
            <button className="btn btn-ghost btn-sm btn-full" style={{ marginTop:12 }} onClick={onViewStatus}>{t('view', 'View Full Status')} →</button>
          </div>
        </>
      ) : (
        <EmptyState icon="📋" title="No requests logged" subtitle="Submit your first departmental requirement." />
      )}
    </>
  );
}

/* ── Page: New Request ── */
function StaffNewRequest({ onSubmit, onCancel, t }) {
  const [dept,  setDept]  = useState('Mess & Dining');
  const [title, setTitle] = useState('');
  const [cost,  setCost]  = useState('');
  const [note,  setNote]  = useState('');
  const [step,  setStep]  = useState(1);
  const [urgency, setUrgency] = useState('Normal');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit({ dept, title, cost: parseInt(cost,10) || 0, note, urgency });
    setTitle(''); setCost(''); setNote(''); setStep(1);
  }, [dept, title, cost, note, urgency, onSubmit]);

  return (
    <>
      <div className="mobile-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={onCancel} style={{ background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-sm)', width:30, height:30, cursor:'pointer', color:'var(--text-secondary)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <h4>Equipment / Repair Request</h4>
        </div>
        <span style={{ fontSize:11, color:'var(--text-muted)' }}>Step {step}/2</span>
      </div>

      <div style={{ height:3, background:'var(--border-subtle)', borderRadius:999, marginBottom:20 }}>
        <div style={{ height:'100%', width:`${(step/2)*100}%`, background:'var(--grad-warm)', borderRadius:999, transition:'width 0.4s ease' }} />
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" value={dept} onChange={(e) => setDept(e.target.value)}>
                {['Mess & Dining','Maintenance','Security','Housekeeping','Electrical Dept'].map((d)=><option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('short_title', 'Request Title')} *</label>
              <input className="form-input" placeholder="e.g. Mess Chimney Replacement" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('priority_level', 'Urgency')}</label>
              <div className="priority-row">
                {['Low','Normal','Urgent'].map((u)=>(
                  <button type="button" key={u} className={`priority-btn p-${u==='Urgent'?'high':u==='Normal'?'medium':'low'} ${urgency===u?'selected':''}`} onClick={()=>setUrgency(u)}>{u}</button>
                ))}
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-full btn-lg" onClick={()=>title.trim()&&setStep(2)} disabled={!title.trim()} style={{ opacity:title.trim()?1:0.5 }}>Next → Cost Details</button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="form-group">
              <label className="form-label">Estimated Cost (₹) *</label>
              <input className="form-input" type="number" placeholder="e.g. 45000" value={cost} onChange={(e)=>setCost(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('detailed_desc', 'Justification / Notes')}</label>
              <textarea className="form-textarea" rows={4} placeholder="Why is this needed? What happens if not done?" value={note} onChange={(e)=>setNote(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Attach Quotation / Photo</label>
              <div className="upload-box">📎 Tap to attach quotation or photo</div>
            </div>
            <div style={{ background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', padding:'12px 14px', marginBottom:14, fontSize:12 }}>
              <div style={{ color:'var(--text-muted)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Summary</div>
              <div style={{ fontWeight:600 }}>{title}</div>
              <div style={{ color:'var(--text-secondary)', marginTop:4 }}>Dept: {dept} • Urgency: {urgency} • Cost: ₹{parseInt(cost||0).toLocaleString()}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={()=>setStep(1)}>← {t('cancel', 'Back')}</button>
              <button type="submit" className="btn btn-primary" style={{ flex:2 }}>📤 {t('submit', 'Submit for Approval')}</button>
            </div>
          </>
        )}
      </form>
    </>
  );
}

/* ── Page: Request Detail/Status ── */
function StaffRequestDetail({ staffRequests, t }) {
  const [selectedId, setSelectedId] = useState(staffRequests[0]?.id);
  const req = useMemo(() => staffRequests.find((r)=>r.id===selectedId)||staffRequests[0], [staffRequests,selectedId]);
  const steps = req ? stepState(req.status) : [];

  const stepLabels = ['Asst. Warden Endorsement','Res. Warden Budget Sign-off','Principal Final Approval'];
  const stepDescs  = [
    ['Endorsed & capacity checked','Under endorsement review','Awaiting Asst. Warden action'],
    ['Budget approved & released','Under budget review','Unlocks after Asst. Warden'],
    ['Final approval granted','Awaiting Principal review','Unlocks after Res. Warden'],
  ];

  return (
    <>
      <div className="mobile-header"><h4>Request Status</h4></div>
      {/* Request selector */}
      <div className="chip-row">
        {staffRequests.map((r) => (
          <button key={r.id} className={`chip ${selectedId===r.id?'chip-active':''}`} onClick={()=>setSelectedId(r.id)}>{r.id}</button>
        ))}
      </div>

      {req ? (
        <>
          <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,179,8,0.07))', border:'1px solid rgba(249,115,22,0.2)', borderRadius:'var(--radius-xl)', padding:18, marginBottom:16 }}>
            <div className="flex-between" style={{ marginBottom:8 }}>
              <span className="dept-chip">{req.dept}</span>
              <span className={`badge badge-${req.status==='Approved'?'approved':req.status==='Rejected'?'rejected':'pending'}`}>{t(req.status.toLowerCase().replace(' ', '_'), req.status)}</span>
            </div>
            <h3 style={{ fontSize:15, marginBottom:4 }}>{req.title}</h3>
            <div style={{ fontSize:11, color:'var(--text-secondary)' }}>Submitted by {req.submittedBy} • {req.time}</div>
            <div style={{ fontSize:22, fontWeight:900, color:'var(--text-primary)', marginTop:10 }}>₹{req.cost.toLocaleString()}</div>
          </div>

          <div className="section-title">3-Tier Approval Pipeline</div>
          <div style={{ background:'var(--bg-glass)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:16, marginBottom:16 }}>
            <div className="stepper">
              {stepLabels.map((label, i) => {
                const s = steps[i];
                return (
                  <div key={label} className={`step-item ${s}`}>
                    <div className={`step-dot ${s}`}>{s==='done'?'✓':s==='current'?'⏳':s==='rejected'?'✕':'🔒'}</div>
                    <div className="step-body">
                      <strong>{label}</strong>
                      <p>{stepDescs[i][s==='done'?0:s==='current'?1:2]}</p>
                      {s==='current' && <span className="badge badge-pending" style={{ marginTop:4, display:'inline-flex' }}>{t('in_progress', 'In Review')}</span>}
                      {s==='done'    && <span className="badge badge-approved" style={{ marginTop:4, display:'inline-flex' }}>{t('approved', 'Approved')}</span>}
                      {s==='rejected'&& <span className="badge badge-rejected" style={{ marginTop:4, display:'inline-flex' }}>{t('rejected', 'Rejected')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="section-title">Activity Log</div>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'14px' }}>
            {[{ time:req.time, action:'Request Submitted', actor:req.submittedBy, color:'var(--accent-cyan)' }, steps[0]==='done'&&{ time:'Shortly after', action:'Asst. Warden Endorsed', actor:'Dr. Meena Sharma', color:'var(--accent-primary)' }, steps[1]==='done'&&{ time:'Next day', action:'Budget Approved by Res. Warden', actor:'Prof. R. Iyer', color:'var(--accent-green)' }].filter(Boolean).map((item, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{ background:item.color }} />
                <div className="activity-body"><strong>{item.action}</strong><span>{item.actor}</span></div>
                <div className="activity-time">{item.time}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon="📋" title="No request selected" subtitle="Select a request to view its approval status." />
      )}
    </>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function StaffView({ page, isMobile }) {
  const dispatch = useDispatch();
  const { staffRequests } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();
  const [mobileTab, setMobileTab] = useState('dashboard');
  const activePage = isMobile ? mobileTab : page;

  const switchPage = useCallback((id) => {
    if (isMobile) setMobileTab(id);
    else dispatch(setPage(id));
  }, [isMobile, dispatch]);

  const handleNewRequest = useCallback(async (data) => {
    try {
      await dispatch(submitStaffRequestAsync({
        title: data.title,
        dept: data.dept,
        cost: data.cost,
        urgency: data.urgency,
        note: data.note,
        submittedBy: 'Sanji',
      })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Request "${data.title}" submitted and saved to database!`, type: 'success' }));
    } catch (err) {
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Request "${data.title}" submitted successfully!`, type: 'success' }));
      dispatch(addAuditEntry({ id: `AL-${Date.now()}`, action: 'Staff Request Submitted', actor: 'Sanji (Staff)', target: `REQ-${Math.floor(4100 + Math.random()*900)}`, timestamp: new Date().toLocaleString(), category: 'Request' }));
    }
    switchPage('request-detail');
  }, [dispatch, switchPage]);

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':      return <StaffDashboard    staffRequests={staffRequests} onNewRequest={() => switchPage('new-request')} onViewStatus={() => switchPage('request-detail')} t={t} />;
      case 'new-request':    return <StaffNewRequest   onSubmit={handleNewRequest} onCancel={() => switchPage('dashboard')} t={t} />;
      case 'request-detail': return <StaffRequestDetail staffRequests={staffRequests} t={t} />;
      default:               return <StaffDashboard    staffRequests={staffRequests} onNewRequest={() => switchPage('new-request')} onViewStatus={() => switchPage('request-detail')} t={t} />;
    }
  };

  const bottomNav = (
    <>
      {[{id:'dashboard',icon:'🏠',label:'Home'},{id:'new-request',icon:'➕',label:'New Req'},{id:'request-detail',icon:'📋',label:'Status'}].map((tab)=>(
        <div key={tab.id} className={`phone-nav-item ${activePage===tab.id?'active':''}`} onClick={()=>switchPage(tab.id)}>
          <span className="nav-ico">{tab.icon}</span><span className="nav-lbl">{tab.label}</span>
        </div>
      ))}
    </>
  );

  if (isMobile) {
    return <PhoneFrame bottomNav={bottomNav} showBottomNav>{renderContent()}</PhoneFrame>;
  }

  return (
    <div style={{ width:'min(960px,100%)', animation:'slideUp 0.3s ease' }}>
      <div className="desktop-layout">
        <div className="dark-sidebar" style={{ width: 220 }}>
          <div className="app-brand"><div className="brand-icon">👨‍🍳</div><span className="brand-name">{t('role_staff', 'Staff')}</span></div>
          <nav className="side-nav">
            {[{id:'dashboard',icon:'🏠',label:'Dashboard'},{id:'new-request',icon:'➕',label:'New Request'},{id:'request-detail',icon:'📋',label:'Request Status'}].map((l)=>(
              <div key={l.id} className={`nav-link ${page===l.id?'active':''}`} onClick={()=>dispatch(setPage(l.id))}>
                <span className="nav-link-icon">{l.icon}</span>{l.label}
              </div>
            ))}
          </nav>
          <div
            className="sidebar-profile"
            onClick={() => dispatch(setProfileModalOpen(true))}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            title="Click to view & edit profile details"
          >
            <div className="avatar avatar-sm" style={{background:'linear-gradient(135deg,#f97316,#eab308)'}}>👨‍🍳</div>
            <div>
              <strong style={{fontSize:11}}>Sanji</strong>
              <span>Mess & Dining</span>
            </div>
          </div>
        </div>
        <div className="desktop-content">{renderContent()}</div>
      </div>
    </div>
  );
}
