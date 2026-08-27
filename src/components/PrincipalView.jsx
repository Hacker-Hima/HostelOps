import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setPage, approveStaffReq, rejectStaffReq, addToast, addAuditEntry,
  approveStaffRequestAsync, rejectStaffRequestAsync,
} from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';
import PhoneFrame from './PhoneFrame';
import EmptyState from './EmptyState';
import MiniTrendChart from './MiniTrendChart';

/* ── Page: Dashboard ── */
function PrincipalDashboard({ tickets, staffRequests, budget, ticketVolume7d, ticketVolume30d, budgetBurn7d, t }) {
  const [timeRange, setTimeRange] = useState('7d');
  const totalBudget  = budget.total;
  const spent        = budget.spent;
  const pendingReqs  = staffRequests.filter(r => r.status === 'Pending Principal');
  const totalPending = pendingReqs.reduce((acc, r) => acc + r.cost, 0);
  const utilizationPct = Math.round((spent / totalBudget) * 100);
  const radius = 50, circ = 2 * Math.PI * radius;

  const overallStats = [
    { label: t('role_assets', 'Total Assets'),           value:'147',   icon:'🏁', color:'var(--accent-cyan)'   },
    { label: t('my_tickets', 'Total Tickets'),           value:tickets.length, icon:'📄', color:'var(--accent-primary)' },
    { label: t('pending_release', 'Pending Approvals'),  value:pendingReqs.length, icon:'⏳', color:'var(--accent-yellow)' },
    { label: t('resolved', 'Resolved Issues'),           value:tickets.filter(tk=>tk.status==='Resolved').length, icon:'✅', color:'var(--accent-green)' },
  ];

  return (
    <>
      <div className="desktop-topbar">
        <div>
          <h2>{t('role_principal', 'Principal')} Dashboard</h2>
          <div className="page-subtitle">Supreme overview — Dr. A. Krishnamurthy</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>Academic Year 2025-26</div>
          <div className="avatar" style={{background:'linear-gradient(135deg,#ef4444,#ec4899)',width:38,height:38,fontSize:16}}>👑</div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="kpi-row" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:22 }}>
        {overallStats.map(({ label, value, icon, color }) => (
          <div key={label} className="kpi-card" style={{ borderTop:`3px solid ${color}20` }}>
            <div className="kpi-label">{label}</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, margin:'6px 0' }}>
              <div className="kpi-value" style={{ color }}>{value}</div>
              <span style={{ fontSize:20 }}>{icon}</span>
            </div>
            <div className="kpi-sub">Hostel-wide</div>
          </div>
        ))}
      </div>

      {/* Mini Trend Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
          <div className="flex-between" style={{marginBottom:10}}>
            <div className="section-title" style={{marginBottom:0}}>{t('ticket_trend', 'Ticket Volume Trend')}</div>
            <div className="tabs-header" style={{marginBottom:0,padding:2}}>
              <button className={`tab-btn ${timeRange==='7d'?'active':''}`} onClick={()=>setTimeRange('7d')} style={{padding:'3px 8px',fontSize:10}}>7 Days</button>
              <button className={`tab-btn ${timeRange==='30d'?'active':''}`} onClick={()=>setTimeRange('30d')} style={{padding:'3px 8px',fontSize:10}}>30 Days</button>
            </div>
          </div>
          <MiniTrendChart
            data={timeRange==='7d' ? (ticketVolume7d || [3, 5, 2, 8, 4, 6, 7]) : (ticketVolume30d || [12, 9, 15, 8, 11, 14, 10, 7, 9, 13, 11, 8, 6, 10, 12, 15, 9, 8, 11, 14, 10, 7, 9, 13, 11, 8, 6, 10, 12, 15])}
            width={380}
            height={80}
            color="var(--accent-red)"
            gradient={['#ef4444', '#ec4899']}
            showDots={timeRange==='7d'}
          />
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
          <div className="flex-between" style={{marginBottom:10}}>
            <div className="section-title" style={{marginBottom:0}}>{t('budget_trend', 'Budget Burn-Down Trajectory')}</div>
            <span style={{fontSize:11,color:'var(--accent-green)',fontWeight:700}}>On Track (-4% vs cap)</span>
          </div>
          <MiniTrendChart
            data={budgetBurn7d || [310000, 318000, 322000, 328000, 332000, 337000, 340000]}
            width={380}
            height={80}
            color="var(--accent-cyan)"
            gradient={['#06b6d4', '#3b82f6']}
            showDots
          />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:14 }}>
        {/* Budget Ring */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'22px', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div className="section-title" style={{ alignSelf:'flex-start' }}>{t('budget_used', 'Budget Overview')}</div>
          <svg width={130} height={130} viewBox="0 0 130 130" style={{ margin:'10px 0' }}>
            <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12}/>
            <circle cx={65} cy={65} r={radius} fill="none" stroke="url(#pg1)" strokeWidth={12} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-utilizationPct/100)} transform="rotate(-90 65 65)" style={{transition:'stroke-dashoffset 1.5s ease'}}/>
            <defs><linearGradient id="pg1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ef4444"/><stop offset="100%" stopColor="#ec4899"/></linearGradient></defs>
            <text x={65} y={60} textAnchor="middle" fill="#f0f4ff" fontSize={20} fontWeight={800} fontFamily="Inter,sans-serif">{utilizationPct}%</text>
            <text x={65} y={78} textAnchor="middle" fill="#94a3b8" fontSize={10} fontFamily="Inter,sans-serif">{t('budget_used', 'Utilized')}</text>
          </svg>
          <div style={{ width:'100%' }}>
            {[{l:t('total', 'Total'),v:`₹${totalBudget.toLocaleString()}`,c:'var(--text-primary)'},{l:t('approved_spend', 'Spent'),v:`₹${spent.toLocaleString()}`,c:'var(--accent-red)'},{l:t('pending_release', 'Remaining'),v:`₹${(totalBudget-spent).toLocaleString()}`,c:'var(--accent-green)'},{l:t('pending_release', 'Pending Release'),v:`₹${totalPending.toLocaleString()}`,c:'var(--accent-yellow)'}].map(({l,v,c})=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <span style={{fontSize:12,color:'var(--text-secondary)'}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Escalations */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
          <div className="section-title">{t('pending_signoff', 'Pending Principal Sign-off')}</div>
          {pendingReqs.length === 0
            ? <EmptyState icon="✅" title="All sign-offs completed" subtitle="No departmental requests are currently awaiting Principal approval." />
            : pendingReqs.map(r=>(
              <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'13px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <div>
                  <span className="dept-chip">{r.dept}</span>
                  <div style={{fontWeight:600,fontSize:13,marginTop:4}}>{r.title}</div>
                  <div style={{fontSize:11,color:'var(--text-secondary)',marginTop:2}}>By {r.submittedBy} • {r.time}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:17,fontWeight:800,marginBottom:6}}>₹{r.cost.toLocaleString()}</div>
                  <span className="badge badge-pending">{t('pending', 'Awaiting You')}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Hostel Performance */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px', marginTop:14 }}>
        <div className="section-title">{t('hostel_wing_perf', 'Hostel Wing Performance')}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[{block:'Block A',score:94,desc:'Excellent',color:'var(--accent-green)'},{block:'Block B',score:82,desc:'Good',color:'var(--accent-cyan)'},{block:'Block C',score:71,desc:'Average',color:'var(--accent-yellow)'},{block:'Block D',score:58,desc:'Needs Attention',color:'var(--accent-red)'}].map(({block,score,desc,color})=>(
            <div key={block} style={{background:'var(--bg-glass)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',padding:14,textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:700,color:'var(--text-secondary)',marginBottom:6}}>{block}</div>
              <div style={{fontSize:26,fontWeight:900,color}}>{score}</div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Page: Final Approvals ── */
function PrincipalApprovals({ staffRequests, onApprove, onReject, t }) {
  const pendingPrincipal = staffRequests.filter(r => r.status === 'Pending Principal');
  const alreadyHandled   = staffRequests.filter(r => r.status === 'Approved' || r.status === 'Rejected');

  return (
    <>
      <div className="desktop-topbar">
        <div><h2>{t('final_approvals', 'Final Approval Authority')}</h2><div className="page-subtitle">High-value requests requiring Principal sign-off</div></div>
      </div>

      {/* Approval Header Stats */}
      <div style={{ display:'flex', gap:12, marginBottom:22 }}>
        {[{l:'Total Reviewed',v:alreadyHandled.length,c:'var(--accent-cyan)'},{l:t('pending', 'Pending Decision'),v:pendingPrincipal.length,c:'var(--accent-yellow)'},{l:t('approved_spend', 'Approved Value'),v:`₹${staffRequests.filter(r=>r.status==='Approved').reduce((a,r)=>a+r.cost,0).toLocaleString()}`,c:'var(--accent-green)'}].map(({l,v,c})=>(
          <div key={l} style={{flex:1,background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:'14px 18px'}}>
            <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{l}</div>
            <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div className="section-title">{t('pending_signoff', 'Requests Awaiting Principal Sign-off')}</div>
      {pendingPrincipal.length === 0 ? (
        <EmptyState icon="✅" title="Inbox clear!" subtitle="All escalated requests have been reviewed." />
      ) : (
        pendingPrincipal.map(r => (
          <div key={r.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-xl)', padding:22, marginBottom:14, transition:'all 0.3s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                  <span className="dept-chip">{r.dept}</span>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>Submitted {r.time}</span>
                </div>
                <h3 style={{ fontSize:16, marginBottom:4 }}>{r.title}</h3>
                <p style={{ color:'var(--text-secondary)', fontSize:12 }}>Submitted by <strong>{r.submittedBy}</strong></p>
                <p style={{ color:'var(--accent-green)', fontSize:11, marginTop:4 }}>✓ Asst. Warden endorsed → ✓ Res. Warden budget-approved</p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:28, fontWeight:900, color:'var(--text-primary)' }}>₹{r.cost.toLocaleString()}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Requested Amount</div>
              </div>
            </div>

            {/* 3-Tier Sign-off Track */}
            <div style={{ display:'flex', gap:0, marginBottom:18 }}>
              {[{l:'Staff',icon:'✓',c:'var(--accent-green)'},{l:'Asst. Warden',icon:'✓',c:'var(--accent-green)'},{l:'Res. Warden',icon:'✓',c:'var(--accent-green)'},{l:'Principal',icon:'⏳',c:'var(--accent-yellow)'}].map(({l,icon,c},i,arr)=>(
                <React.Fragment key={l}>
                  <div style={{flex:1,background:'var(--bg-glass)',borderRadius:i===0?'8px 0 0 8px':i===arr.length-1?'0 8px 8px 0':'0',border:'1px solid var(--border-subtle)',padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:14,fontWeight:700,color:c}}>{icon}</div>
                    <div style={{fontSize:9,color:'var(--text-muted)',marginTop:2,textTransform:'uppercase',letterSpacing:'0.04em'}}>{l}</div>
                  </div>
                  {i<arr.length-1&&<div style={{width:1,background:'var(--border-subtle)'}}/>}
                </React.Fragment>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-danger" style={{ flex:1 }} onClick={()=>onReject(r.id)}>✕ {t('rejected', 'Reject Request')}</button>
              <button className="btn btn-ghost btn-sm">📋 Full Details</button>
              <button className="btn btn-success" style={{ flex:2 }} onClick={()=>onApprove(r.id, r.cost)}>✓ {t('approved', 'Approve & Release')} ₹{r.cost.toLocaleString()}</button>
            </div>
          </div>
        ))
      )}

      {/* Previously handled */}
      {alreadyHandled.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop:16 }}>Previously Processed</div>
          {alreadyHandled.map(r=>(
            <div key={r.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',marginBottom:9,opacity:0.75}}>
              <div><span className="dept-chip">{r.dept}</span><h4 style={{fontSize:13,marginTop:4}}>{r.title}</h4></div>
              <div style={{textAlign:'right'}}><div style={{fontWeight:800,fontSize:14}}>₹{r.cost.toLocaleString()}</div><span className={`badge badge-${r.status==='Approved'?'approved':'rejected'}`} style={{marginTop:6,display:'inline-flex'}}>{t(r.status.toLowerCase().replace(' ', '_'), r.status)}</span></div>
            </div>
          ))}
        </>
      )}
    </>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function PrincipalView({ page, isMobile }) {
  const dispatch = useDispatch();
  const { tickets, staffRequests, budget, ticketVolume7d, ticketVolume30d, budgetBurn7d } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const switchPage = useCallback((id) => dispatch(setPage(id)), [dispatch]);

  const handleApprove = useCallback(async (id, cost) => {
    try {
      await dispatch(approveStaffRequestAsync({ id, actor: 'Dr. A. Krishnamurthy (Principal)', cost })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Principal signed off ${id} — ₹${cost?.toLocaleString() || ''} released to department!`, type: 'success' }));
    } catch {
      dispatch(approveStaffReq(id));
      dispatch(addAuditEntry({ id: `AL-${Date.now()}`, action: 'Principal Signed Off', actor: 'Dr. A. Krishnamurthy (Principal)', target: id, timestamp: new Date().toLocaleString(), category: 'Approval' }));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Principal signed off ${id} — ₹${cost?.toLocaleString() || ''} released!`, type: 'success' }));
    }
  }, [dispatch]);

  const handleReject = useCallback(async (id) => {
    try {
      await dispatch(rejectStaffRequestAsync({ id, actor: 'Dr. A. Krishnamurthy (Principal)' })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Request ${id} rejected in database.`, type: 'warn' }));
    } catch {
      dispatch(rejectStaffReq(id));
      dispatch(addAuditEntry({ id: `AL-${Date.now()}`, action: 'Principal Rejected', actor: 'Dr. A. Krishnamurthy (Principal)', target: id, timestamp: new Date().toLocaleString(), category: 'Approval' }));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Request ${id} rejected by Principal`, type: 'warn' }));
    }
  }, [dispatch]);

  const LINKS = [
    { id:'dashboard',       icon:'📊', label:'Dashboard'       },
    { id:'final-approvals', icon:'✅', label: t('final_approvals', 'Final Approvals')  },
  ];

  const renderContent = () => {
    switch (page) {
      case 'dashboard':       return <PrincipalDashboard tickets={tickets} staffRequests={staffRequests} budget={budget} ticketVolume7d={ticketVolume7d} ticketVolume30d={ticketVolume30d} budgetBurn7d={budgetBurn7d} t={t} />;
      case 'final-approvals': return <PrincipalApprovals staffRequests={staffRequests} onApprove={handleApprove} onReject={handleReject} t={t} />;
      default:                return <PrincipalDashboard tickets={tickets} staffRequests={staffRequests} budget={budget} ticketVolume7d={ticketVolume7d} ticketVolume30d={ticketVolume30d} budgetBurn7d={budgetBurn7d} t={t} />;
    }
  };

  if (isMobile) {
    return (
      <PhoneFrame showBottomNav={false}>
        <div>
          <div className="chip-row" style={{ marginBottom:12 }}>
            {LINKS.map(l=><button key={l.id} className={`chip ${page===l.id?'chip-active':''}`} onClick={()=>switchPage(l.id)}>{l.icon} {l.label}</button>)}
          </div>
          {renderContent()}
        </div>
      </PhoneFrame>
    );
  }

  return (
    <div style={{ width:'min(1100px,100%)', animation:'slideUp 0.3s ease' }}>
      <div className="desktop-layout">
        <div className="dark-sidebar">
          <div className="app-brand"><div className="brand-icon">👑</div><span className="brand-name">HostelOps</span></div>
          <nav className="side-nav">
            {LINKS.map(l=>(
              <div key={l.id} className={`nav-link ${page===l.id?'active':''}`} onClick={()=>switchPage(l.id)}>
                <span className="nav-link-icon">{l.icon}</span>{l.label}
              </div>
            ))}
          </nav>
          <div style={{ marginTop:'auto', padding:'10px', background:'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(236,72,153,0.1))', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'var(--radius-md)' }}>
            <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Signed in as</div>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>Dr. A. Krishnamurthy</div>
            <div style={{ fontSize:10, color:'var(--accent-red)', marginTop:2 }}>{t('role_principal', 'Principal')}</div>
          </div>
        </div>
        <div className="desktop-content">{renderContent()}</div>
      </div>
    </div>
  );
}
