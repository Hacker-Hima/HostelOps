import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setPage, approveStaffReq, rejectStaffReq, addToast, addAuditEntry, openTicketDrawer,
  approveStaffRequestAsync, rejectStaffRequestAsync, bulkApproveStaffRequestsAsync, setProfileModalOpen,
} from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';
import PhoneFrame from './PhoneFrame';
import EmptyState from './EmptyState';
import MiniTrendChart from './MiniTrendChart';

const BLOCK_DATA = [
  { name:'Block A', count:42, pct:85, color:'#7c3aed' },
  { name:'Block B', count:38, pct:75, color:'#06b6d4' },
  { name:'Block C', count:27, pct:55, color:'#10b981' },
  { name:'Block D', count:19, pct:40, color:'#ec4899' },
];

function exportCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv  = [keys.join(','), ...data.map(row => keys.map(k => `"${(row[k]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Page: Dashboard ── */
function ResWardenDashboard({ tickets, budget, ticketVolume7d, budgetBurn7d, t }) {
  const [animated, setAnimated] = useState(false);
  const budgetRef = useRef(null);
  const spentRef  = useRef(null);
  const pendRef   = useRef(null);

  useEffect(() => {
    const timeOut = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timeOut);
  }, []);

  useEffect(() => {
    const animate = (ref, target, prefix='₹') => {
      if (!ref.current) return;
      let c=0; const step=Math.ceil(target/30);
      const iv = setInterval(()=>{ c=Math.min(c+step,target); if(ref.current) ref.current.textContent=`${prefix}${c.toLocaleString()}`; if(c>=target) clearInterval(iv); },30);
      return ()=>clearInterval(iv);
    };
    animate(budgetRef, budget.total);
    animate(spentRef,  budget.spent);
    animate(pendRef,   budget.pending);
  }, [budget]);

  const utilizationPct = Math.round((budget.spent / budget.total) * 100);
  const radius = 36, circ = 2 * Math.PI * radius;

  return (
    <>
      <div className="desktop-topbar">
        <div><h2>{t('role_res_warden', 'Residential Warden')} Dashboard</h2><div className="page-subtitle">Prof. R. Iyer — All Blocks Overview</div></div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        {/* Budget Ring */}
        <div className="kpi-card" style={{display:'flex',alignItems:'center',gap:12}}>
          <svg width={88} height={88} viewBox="0 0 88 88">
            <circle cx={44} cy={44} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8}/>
            <circle cx={44} cy={44} r={radius} fill="none" stroke="url(#rg1)" strokeWidth={8} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-utilizationPct/100)} transform="rotate(-90 44 44)" style={{transition:'stroke-dashoffset 1.4s ease'}}/>
            <defs><linearGradient id="rg1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#06b6d4"/></linearGradient></defs>
            <text x={44} y={44} textAnchor="middle" dominantBaseline="middle" fill="#f0f4ff" fontSize={13} fontWeight={700} fontFamily="Inter,sans-serif">{utilizationPct}%</text>
          </svg>
          <div><div className="kpi-label">{t('budget_used', 'Budget Used')}</div><div className="kpi-value" ref={budgetRef}>₹0</div><div className="kpi-sub">Monthly allocation</div></div>
        </div>
        <div className="kpi-card success"><div className="kpi-label">{t('approved_spend', 'Approved Spend')}</div><div className="kpi-value" ref={spentRef}>₹0</div><div className="kpi-sub" style={{color:'var(--accent-green)'}}>↑ 12% vs last month</div></div>
        <div className="kpi-card warn"><div className="kpi-label">{t('pending_release', 'Pending Release')}</div><div className="kpi-value" ref={pendRef}>₹0</div><div className="kpi-sub" style={{color:'var(--accent-yellow)'}}>Awaiting sign-off</div></div>
        <div className="kpi-card info"><div className="kpi-label">{t('total_complaints', 'Total Complaints')}</div><div className="kpi-value">{tickets.length}</div><div className="kpi-sub">All blocks combined</div></div>
      </div>

      {/* SVG Trend Charts Section */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
          <div className="flex-between" style={{marginBottom:10}}>
            <div className="section-title" style={{marginBottom:0}}>{t('ticket_trend', '7-Day Ticket Intake Trend')}</div>
            <span style={{fontSize:11,color:'var(--accent-cyan)',fontWeight:700}}>+14% week-on-week</span>
          </div>
          <MiniTrendChart data={ticketVolume7d || [3, 5, 2, 8, 4, 6, 7]} width={360} height={76} color="var(--accent-cyan)" gradient={['#06b6d4', '#7c3aed']} showDots />
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
          <div className="flex-between" style={{marginBottom:10}}>
            <div className="section-title" style={{marginBottom:0}}>{t('budget_trend', 'Cumulative Budget Burn-down')}</div>
            <span style={{fontSize:11,color:'var(--accent-primary)',fontWeight:700}}>₹3.40L / ₹5.00L</span>
          </div>
          <MiniTrendChart data={budgetBurn7d || [310000, 318000, 322000, 328000, 332000, 337000, 340000]} width={360} height={76} color="var(--accent-primary)" gradient={['#7c3aed', '#ec4899']} showDots />
        </div>
      </div>

      {/* Block Volume & Breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'16px 18px' }}>
          <div className="section-title">{t('hostel_wing_perf', 'Block-wise Complaint Volume')}</div>
          {BLOCK_DATA.map(b=>(
            <div key={b.name} className="chart-bar-row">
              <span className="chart-label">{b.name}</span>
              <div className="chart-track"><div className="chart-fill" style={{width:animated?`${b.pct}%`:'0%', background:`linear-gradient(90deg,${b.color},${b.color}80)`}}/></div>
              <span className="chart-count">{b.count}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'16px 18px' }}>
          <div className="section-title">Ticket Status Breakdown</div>
          {[
            { label: t('pending', 'Pending'),         count:tickets.filter(tk=>tk.status==='Pending').length,    color:'var(--accent-yellow)' },
            { label: t('in_progress', 'In Progress'), count:tickets.filter(tk=>tk.status==='In Progress').length, color:'var(--accent-blue)'   },
            { label: t('resolved', 'Resolved'),       count:tickets.filter(tk=>tk.status==='Resolved').length,   color:'var(--accent-green)'  },
          ].map(({label,count,color})=>{
            const pct = Math.round((count/Math.max(tickets.length,1))*100);
            return (
              <div key={label} className="chart-bar-row">
                <span className="chart-label" style={{color}}>{label}</span>
                <div className="chart-track"><div className="chart-fill" style={{width:animated?`${pct}%`:'0%', background:`linear-gradient(90deg,${color},${color}80)`}}/></div>
                <span className="chart-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Page: Approvals ── */
function ResWardenApprovals({ staffRequests, onApprove, onReject, t }) {
  const dispatch = useDispatch();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const pending  = staffRequests.filter(r=>r.status!=='Approved'&&r.status!=='Rejected');
  const approved = staffRequests.filter(r=>r.status==='Approved');
  const rejected = staffRequests.filter(r=>r.status==='Rejected');

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => setSelectedIds(prev => prev.size === pending.length ? new Set() : new Set(pending.map(r=>r.id)));

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    try {
      await dispatch(bulkApproveStaffRequestsAsync({ ids, actor: 'Prof. R. Iyer (RW)' })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Approved ${ids.length} staff requests in database!`, type: 'success' }));
    } catch {
      ids.forEach(id => onApprove(id));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Approved ${ids.length} staff requests!`, type: 'success' }));
    }
    setSelectedIds(new Set());
  };

  return (
    <>
      <div className="desktop-topbar">
        <div><h2>{t('approval_queue', 'Approval Queue')}</h2><div className="page-subtitle">{pending.length} pending sign-off</div></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(staffRequests, 'staff_requests.csv')}>📥 {t('export_csv', 'Export CSV')}</button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bulk-bar" style={{marginBottom:14}}>
          <span className="bulk-count">{selectedIds.size} requests selected</span>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-success btn-sm" onClick={handleBulkApprove}>✓ Approve All Selected</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>✕ {t('cancel', 'Clear')}</button>
          </div>
        </div>
      )}

      {pending.length === 0 ? (
        <EmptyState icon="✅" title="Inbox clear!" subtitle="All departmental requests have been reviewed." />
      ) : (
        <>
          <div className="flex-between" style={{marginBottom:10}}>
            <div className="section-title" style={{marginBottom:0}}>{t('pending', 'Pending')} ({pending.length})</div>
            <button className="btn btn-ghost btn-sm" onClick={toggleAll} style={{fontSize:11}}>
              {selectedIds.size === pending.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {pending.map(r=>(
            <div key={r.id} className="approval-card" style={{border:selectedIds.has(r.id)?'1px solid var(--accent-primary)':undefined}}>
              <input type="checkbox" checked={selectedIds.has(r.id)} onChange={()=>toggleSelect(r.id)} style={{marginRight:8,cursor:'pointer'}} />
              <div className="approval-card-body">
                <span className="dept-chip">{r.dept}</span>
                <h4>{r.title}</h4>
                <p>By <strong>{r.submittedBy}</strong> • {r.time}</p>
                <p style={{color:'var(--accent-green)',fontSize:11,marginTop:4}}>✓ Asst. Warden endorsed — your sign-off required</p>
              </div>
              <div className="approval-cost">
                <div className="amount">₹{r.cost.toLocaleString()}</div>
                <div className="actions"><button className="btn btn-success btn-sm" onClick={()=>onApprove(r.id)}>✓ {t('approved', 'Approve')}</button><button className="btn btn-danger btn-sm" onClick={()=>onReject(r.id)}>✕ {t('rejected', 'Reject')}</button></div>
              </div>
            </div>
          ))}
        </>
      )}

      {approved.length > 0 && (
        <>
          <div className="section-title" style={{marginTop:20}}>{t('approved', 'Recently Approved')}</div>
          {approved.map(r=>(
            <div key={r.id} className="approval-card" style={{opacity:0.75}}>
              <div className="approval-card-body"><span className="dept-chip">{r.dept}</span><h4>{r.title}</h4><p>{r.time} • {r.submittedBy}</p></div>
              <div className="approval-cost"><div className="amount">₹{r.cost.toLocaleString()}</div><div><span className="badge badge-approved" style={{marginTop:8,display:'inline-flex'}}>{t('approved', 'Approved')}</span></div></div>
            </div>
          ))}
        </>
      )}
      {rejected.length > 0 && (
        <>
          <div className="section-title" style={{marginTop:20}}>{t('rejected', 'Rejected')}</div>
          {rejected.map(r=>(
            <div key={r.id} className="approval-card" style={{opacity:0.6}}>
              <div className="approval-card-body"><span className="dept-chip">{r.dept}</span><h4>{r.title}</h4><p>{r.time}</p></div>
              <div className="approval-cost"><div className="amount">₹{r.cost.toLocaleString()}</div><div><span className="badge badge-rejected" style={{marginTop:8,display:'inline-flex'}}>{t('rejected', 'Rejected')}</span></div></div>
            </div>
          ))}
        </>
      )}
    </>
  );
}

/* ── Page: Budget Analytics ── */
function ResWardenBudget({ budget, t }) {
  const [animated, setAnimated] = useState(false);
  useEffect(()=>{ const tm=setTimeout(()=>setAnimated(true),300); return()=>clearTimeout(tm); },[]);

  const remaining = budget.total - budget.spent;
  const COLORS    = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ec4899'];

  return (
    <>
      <div className="desktop-topbar"><div><h2>{t('budget_analytics', 'Budget Analytics')}</h2><div className="page-subtitle">FY 2025-26 Q2 Allocation</div></div></div>

      <div className="kpi-row" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:24 }}>
        {[{l:t('budget_used', 'Total Budget'),v:`₹${budget.total.toLocaleString()}`,c:'var(--accent-cyan)'},{l:t('approved_spend', 'Spent'),v:`₹${budget.spent.toLocaleString()}`,c:'var(--accent-primary)'},{l:t('pending_release', 'Remaining'),v:`₹${remaining.toLocaleString()}`,c:'var(--accent-green)'}].map(({l,v,c})=>(
          <div key={l} className="kpi-card"><div className="kpi-label">{l}</div><div className="kpi-value" style={{color:c}}>{v}</div><div className="kpi-sub">This quarter</div></div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Category Breakdown */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
          <div className="section-title">Spending by Category</div>
          {budget.categories.map((cat, i) => {
            const pct = Math.round((cat.spent / cat.budget) * 100);
            return (
              <div key={cat.name} className="budget-cat-row">
                <span className="budget-cat-name">{cat.name}</span>
                <div className="budget-track">
                  <div className="budget-fill" style={{ width:animated?`${pct}%`:'0%', background:`linear-gradient(90deg,${COLORS[i]},${COLORS[i]}99)` }} />
                </div>
                <span className="budget-text">₹{cat.spent.toLocaleString()} / ₹{cat.budget.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        {/* Utilization summary cards */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'18px' }}>
          <div className="section-title">Utilization Summary</div>
          {budget.categories.map((cat) => {
            const pct = Math.round((cat.spent / cat.budget) * 100);
            return (
              <div key={cat.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border-subtle)'}}>
                <div style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{cat.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:11,color:'var(--text-muted)'}}>₹{(cat.budget-cat.spent).toLocaleString()} left</span>
                  <span style={{fontSize:12,fontWeight:700,color:pct>80?'var(--accent-red)':pct>60?'var(--accent-yellow)':'var(--accent-green)'}}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Page: Audit Log ── */
function ResWardenAuditLog({ auditLog, t }) {
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch]       = useState('');

  const cats = ['All', 'Ticket','Assignment','Request','Approval','Asset','System'];
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return auditLog.filter(l => (catFilter==='All'||l.category===catFilter) && (l.action.toLowerCase().includes(term)||l.actor.toLowerCase().includes(term)||l.target.toLowerCase().includes(term)));
  }, [auditLog, catFilter, search]);

  const catClass = (cat) => {
    const m = { Ticket:'cat-ticket', Assignment:'cat-assignment', Request:'cat-request', Approval:'cat-approval', Asset:'cat-asset', System:'cat-system' };
    return `audit-cat-badge ${m[cat]||'cat-system'}`;
  };

  return (
    <>
      <div className="desktop-topbar">
        <div><h2>{t('audit_log', 'Audit Log')}</h2><div className="page-subtitle">{auditLog.length} entries recorded</div></div>
        <div style={{display:'flex',gap:8}}>
          <input className="search-bar" placeholder={`🔍 ${t('search', 'Search log...')}`} value={search} onChange={(e)=>setSearch(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered, 'audit_log.csv')}>📥 {t('export_csv', 'Export CSV')}</button>
        </div>
      </div>

      <div className="chip-row" style={{marginBottom:14}}>
        {cats.map(c=><button key={c} className={`chip ${catFilter===c?'chip-active':''}`} onClick={()=>setCatFilter(c)}>{c === 'All' ? t('all', 'All') : c}</button>)}
      </div>

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        <div style={{padding:'12px 14px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border-subtle)', display:'flex',gap:16}}>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.07em',width:90}}>Time</span>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.07em',flex:1}}>Action</span>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.07em',width:80}}>Category</span>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.07em',width:160}}>Actor</span>
          <span style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.07em',width:100}}>Target</span>
        </div>
        {filtered.map(log=>(
          <div key={log.id} className="audit-row">
            <span style={{fontSize:10,color:'var(--text-muted)',width:90,flexShrink:0}}>{log.timestamp.split(' ')[1] || log.timestamp}<br/><span style={{opacity:0.6,fontSize:9}}>{log.timestamp.split(' ')[0]}</span></span>
            <span style={{flex:1,fontSize:12,fontWeight:500,color:'var(--text-primary)'}}>{log.action}</span>
            <span style={{width:80,flexShrink:0}}><span className={catClass(log.category)}>{log.category}</span></span>
            <span style={{width:160,fontSize:11,color:'var(--text-secondary)',flexShrink:0}}>{log.actor}</span>
            <span style={{width:100,fontSize:11,color:'var(--accent-cyan)',fontFamily:'monospace',flexShrink:0}}>{log.target}</span>
          </div>
        ))}
        {filtered.length===0 && <EmptyState icon="📜" title="No audit entries" subtitle="No actions logged matching your filter." />}
      </div>
    </>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function ResWardenView({ page, isMobile }) {
  const dispatch = useDispatch();
  const { tickets, staffRequests, budget, auditLog, ticketVolume7d, budgetBurn7d } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const onApprove = useCallback(async (id) => {
    try {
      await dispatch(approveStaffRequestAsync({ id, actor: 'Prof. R. Iyer (RW)' })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${id} signed off and approved in database!`, type: 'success' }));
    } catch {
      dispatch(approveStaffReq(id));
      dispatch(addAuditEntry({ id: `AL-${Date.now()}`, action: 'Request Approved', actor: 'Prof. R. Iyer (RW)', target: id, timestamp: new Date().toLocaleString(), category: 'Approval' }));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${id} signed off and approved!`, type: 'success' }));
    }
  }, [dispatch]);

  const onReject = useCallback(async (id) => {
    try {
      await dispatch(rejectStaffRequestAsync({ id, actor: 'Prof. R. Iyer (RW)' })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${id} rejected in database.`, type: 'warn' }));
    } catch {
      dispatch(rejectStaffReq(id));
      dispatch(addAuditEntry({ id: `AL-${Date.now()}`, action: 'Request Rejected', actor: 'Prof. R. Iyer (RW)', target: id, timestamp: new Date().toLocaleString(), category: 'Approval' }));
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `${id} rejected.`, type: 'warn' }));
    }
  }, [dispatch]);

  const switchPage = useCallback((id)=>dispatch(setPage(id)),[dispatch]);

  const LINKS = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'approvals', icon:'✅', label: t('approval_queue', 'Approvals')  },
    { id:'budget',    icon:'💰', label: t('budget_analytics', 'Budget')     },
    { id:'audit-log', icon:'📜', label: t('audit_log', 'Audit Log')  },
  ];

  const renderContent = () => {
    switch (page) {
      case 'dashboard': return <ResWardenDashboard tickets={tickets} budget={budget} ticketVolume7d={ticketVolume7d} budgetBurn7d={budgetBurn7d} t={t} />;
      case 'approvals': return <ResWardenApprovals staffRequests={staffRequests} onApprove={onApprove} onReject={onReject} t={t} />;
      case 'budget':    return <ResWardenBudget budget={budget} t={t} />;
      case 'audit-log': return <ResWardenAuditLog auditLog={auditLog} t={t} />;
      default:          return <ResWardenDashboard tickets={tickets} budget={budget} ticketVolume7d={ticketVolume7d} budgetBurn7d={budgetBurn7d} t={t} />;
    }
  };

  if (isMobile) {
    return (
      <PhoneFrame showBottomNav={false}>
        <div>
          <div className="chip-row" style={{marginBottom:12}}>
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
          <div className="app-brand"><div className="brand-icon">🏛️</div><span className="brand-name">HostelOps</span></div>
          <nav className="side-nav">
            {LINKS.map(l=><div key={l.id} className={`nav-link ${page===l.id?'active':''}`} onClick={()=>switchPage(l.id)}><span className="nav-link-icon">{l.icon}</span>{l.label}</div>)}
          </nav>
          <div
            className="sidebar-profile"
            onClick={() => dispatch(setProfileModalOpen(true))}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            title="Click to view & edit profile details"
          >
            <div className="avatar avatar-sm">RI</div>
            <div>
              <strong style={{fontSize:11}}>Prof. R. Iyer</strong>
              <span>{t('role_res_warden', 'Res. Warden')}</span>
            </div>
          </div>
        </div>
        <div className="desktop-content">{renderContent()}</div>
      </div>
    </div>
  );
}
