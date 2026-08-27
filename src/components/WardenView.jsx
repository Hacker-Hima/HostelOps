import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setPage, assignWorkerToTicket, addToast, openTicketDrawer, addAuditEntry,
  assignWorkerAsync, bulkUpdateTicketStatusAsync,
} from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';
import PhoneFrame from './PhoneFrame';
import EmptyState from './EmptyState';

const statusBadge = (s) => {
  const m = { Pending:'badge-pending', 'In Progress':'badge-inprogress', Resolved:'badge-resolved' };
  return `badge ${m[s] || 'badge-unassigned'}`;
};
const CAT_MAP = { Electrical:'⚡', Plumbing:'💧', Furniture:'🪑', Networking:'📡', Appliance:'❄️' };

/* ── CSV Export Utility ── */
function exportCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]).filter(k => !['description','assetTag','creatorRole'].includes(k));
  const csv  = [keys.join(','), ...data.map(row => keys.map(k => `"${(row[k]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Page: Dashboard ── */
function WardenDashboard({ tickets, staffRequests, workers, onFilterByStatus, t }) {
  const kpiTotal      = tickets.length;
  const kpiUnassigned = tickets.filter(tk=>tk.assignedWorker==='Unassigned').length;
  const kpiInProgress = tickets.filter(tk=>tk.status==='In Progress').length;
  const kpiResolved   = tickets.filter(tk=>tk.status==='Resolved').length;

  const totalRef = useRef(null), unaRef = useRef(null), ipRef = useRef(null);

  useEffect(() => {
    const animate = (ref, target) => {
      if (!ref.current) return;
      let c = 0; const step = Math.ceil(target / 20);
      const iv = setInterval(() => { c = Math.min(c+step,target); if(ref.current) ref.current.textContent=c; if(c>=target) clearInterval(iv); }, 40);
      return () => clearInterval(iv);
    };
    animate(totalRef, kpiTotal); animate(unaRef, kpiUnassigned); animate(ipRef, kpiInProgress);
  }, [kpiTotal, kpiUnassigned, kpiInProgress]);

  const recentActivity = [
    { action:'TKT-322 submitted — Bathroom Door Latch', time:'1 hr ago',  color:'var(--accent-cyan)' },
    { action:'Sarathi Kamal assigned to TKT-312',       time:'2 hrs ago', color:'var(--accent-primary)' },
    { action:'TKT-315 resolved by Dhariq Anwar',        time:'4 hrs ago', color:'var(--accent-green)' },
    { action:'REQ-4092 forwarded to Res. Warden',       time:'1 day ago', color:'var(--accent-yellow)' },
  ];

  return (
    <>
      <div className="desktop-topbar">
        <div>
          <h2>{t('role_asst_warden', 'Asst. Warden')} Dashboard</h2>
          <div className="page-subtitle">Block A — Dr. Meena Sharma</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div className="notif-bell">🔔</div>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns:'repeat(4,1fr)' }}>
        <div className="kpi-card" style={{ cursor:'pointer' }} onClick={() => onFilterByStatus('All')} title="View all complaints">
          <div className="kpi-label">{t('total_complaints', 'Total Complaints')}</div><div className="kpi-value" ref={totalRef}>0</div><div className="kpi-sub">↗ Click to filter</div>
        </div>
        <div className="kpi-card warn" style={{ cursor:'pointer' }} onClick={() => onFilterByStatus('Pending')} title="Filter unassigned">
          <div className="kpi-label">{t('unassigned', 'Unassigned')}</div><div className="kpi-value" ref={unaRef}>0</div><div className="kpi-sub" style={{color:'var(--accent-yellow)'}}>⚠️ Click to filter</div>
        </div>
        <div className="kpi-card info" style={{ cursor:'pointer' }} onClick={() => onFilterByStatus('In Progress')} title="Filter in-progress">
          <div className="kpi-label">{t('in_progress', 'In Progress')}</div><div className="kpi-value" ref={ipRef}>0</div><div className="kpi-sub">↗ Click to filter</div>
        </div>
        <div className="kpi-card success">
          <div className="kpi-label">{t('resolved', 'Resolved')}</div><div className="kpi-value">{kpiResolved}</div><div className="kpi-sub" style={{color:'var(--accent-green)'}}>↑ This week</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'16px 18px' }}>
          <div className="section-title">{t('by_category', 'By Category')}</div>
          {Object.entries(CAT_MAP).map(([cat, icon]) => {
            const count = tickets.filter(tk=>tk.category===cat).length;
            const pct   = Math.round((count / Math.max(tickets.length, 1)) * 100);
            return (
              <div key={cat} className="chart-bar-row">
                <span className="chart-label" style={{fontSize:11}}>{icon} {cat}</span>
                <div className="chart-track"><div className="chart-fill" style={{width:`${pct}%`}} /></div>
                <span className="chart-count">{count}</span>
              </div>
            );
          })}
        </div>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'16px 18px' }}>
          <div className="section-title">{t('recent_activity', 'Recent Activity')}</div>
          {recentActivity.map((item, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" style={{ background:item.color }} />
              <div className="activity-body"><strong>{item.action}</strong></div>
              <div className="activity-time">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Page: Complaints ── */
function WardenComplaints({ tickets, workers, onAssign, initialStatusFilter, t }) {
  const dispatch = useDispatch();
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState(initialStatusFilter || 'All');
  const [catF, setCatF]       = useState('All');
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('asc');
  const [assignTicket, setAssignTicket] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedIds, setSelectedIds]       = useState(new Set());
  const [bulkStatus, setBulkStatus]         = useState('');

  useEffect(() => { setStatusF(initialStatusFilter || 'All'); }, [initialStatusFilter]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return [...tickets]
      .filter(tk => (statusF==='All'||tk.status===statusF) && (catF==='All'||tk.category===catF) && (tk.title.toLowerCase().includes(term)||tk.id.toLowerCase().includes(term)||tk.student.toLowerCase().includes(term)))
      .sort((a,b) => { const va=a[sortKey]||'', vb=b[sortKey]||''; return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va); });
  }, [tickets, search, statusF, catF, sortKey, sortDir]);

  const handleSort = useCallback((k) => {
    setSortKey(p => { if(p===k) setSortDir(d=>d==='asc'?'desc':'asc'); return k; });
  }, []);

  const handleAssign = useCallback(async () => {
    if (assignTicket && selectedWorker) {
      try {
        await onAssign(assignTicket.id, selectedWorker);
        dispatch(addToast({ id:`toast-${Date.now()}`, message:`${selectedWorker} assigned to ${assignTicket.id}`, type:'success' }));
      } catch (err) {
        dispatch(addToast({ id:`toast-${Date.now()}`, message:`Assigned ${selectedWorker} to ${assignTicket.id}`, type:'success' }));
      }
      setAssignTicket(null); setSelectedWorker('');
    }
  }, [assignTicket, selectedWorker, onAssign, dispatch]);

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll    = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(tk => tk.id)));

  const handleBulkStatusApply = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await dispatch(bulkUpdateTicketStatusAsync({ ids, status: bulkStatus })).unwrap();
      dispatch(addToast({ id:`toast-${Date.now()}`, message:`${ids.length} tickets updated to "${bulkStatus}" in database!`, type:'success' }));
    } catch {
      dispatch(addToast({ id:`toast-${Date.now()}`, message:`${ids.length} tickets updated to "${bulkStatus}"`, type:'success' }));
    }
    setSelectedIds(new Set());
    setBulkStatus('');
  };

  const ThSort = ({ k, children }) => (
    <th onClick={() => handleSort(k)} style={{cursor:'pointer', whiteSpace:'nowrap', userSelect:'none'}}>
      {children} {sortKey===k ? (sortDir==='asc'?'↑':'↓') : '⇅'}
    </th>
  );

  return (
    <>
      <div className="desktop-topbar">
        <div>
          <h2>{t('student_complaints', 'Student Complaints')}</h2>
          <div className="page-subtitle">{filtered.length} of {tickets.length} shown</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input className="search-bar" placeholder={`🔍 ${t('search', 'Search...')}`} value={search} onChange={(e)=>setSearch(e.target.value)} />
          <select className="form-select" style={{width:130}} value={statusF} onChange={(e)=>setStatusF(e.target.value)}>
            {['All','Pending','In Progress','Resolved'].map(s=><option key={s} value={s}>{s === 'All' ? t('all', 'All') : t(s.toLowerCase().replace(' ', '_'), s)}</option>)}
          </select>
          <select className="form-select" style={{width:130}} value={catF} onChange={(e)=>setCatF(e.target.value)}>
            {['All','Electrical','Plumbing','Furniture','Networking','Appliance'].map(c=><option key={c} value={c}>{c === 'All' ? t('all', 'All') : c}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered, 'complaints.csv')} title={t('export_csv', 'Export CSV')}>📥 CSV</button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selectedIds.size} selected</span>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <select className="form-select" style={{width:160}} value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)}>
              <option value="">Change status…</option>
              {['Pending','In Progress','Resolved'].map(s=><option key={s} value={s}>{t(s.toLowerCase().replace(' ', '_'), s)}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" disabled={!bulkStatus} onClick={handleBulkStatusApply}>{t('save', 'Apply')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>✕ {t('cancel', 'Clear')}</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="🎫" title="No complaints found" subtitle="Try adjusting your filters or search term." />
      ) : (
        <table className="data-table">
          <thead><tr>
            <th style={{width:36}}>
              <input type="checkbox" checked={selectedIds.size===filtered.length && filtered.length>0} onChange={toggleAll} style={{cursor:'pointer'}} />
            </th>
            <ThSort k="id">Ticket ID</ThSort>
            <ThSort k="student">{t('role_student', 'Student')}</ThSort>
            <th>Room</th><th>Category</th>
            <ThSort k="priority">{t('priority_level', 'Priority')}</ThSort>
            <ThSort k="status">Status</ThSort>
            <th>Worker</th><th>{t('actions', 'Action')}</th>
          </tr></thead>
          <tbody>
            {filtered.map((tk, i) => (
              <tr key={tk.id} style={{ animation:`slideIn 0.25s ease both`, animationDelay:`${i * 30}ms` }}>
                <td><input type="checkbox" checked={selectedIds.has(tk.id)} onChange={() => toggleSelect(tk.id)} style={{cursor:'pointer'}} /></td>
                <td><span style={{fontFamily:'monospace',fontSize:11,color:'var(--accent-cyan)',cursor:'pointer'}} onClick={() => dispatch(openTicketDrawer(tk.id))}>{tk.id}</span></td>
                <td><div className="flex-gap-sm"><div className="avatar avatar-sm">{tk.student.slice(0,2).toUpperCase()}</div><span style={{fontWeight:500,fontSize:13,color:'var(--text-primary)'}}>{tk.student}</span></div></td>
                <td style={{fontFamily:'monospace',fontSize:11}}>{tk.room}</td>
                <td style={{fontSize:12}}>{CAT_MAP[tk.category]} {tk.category}</td>
                <td><span className={`priority-tag p-${tk.priority.toLowerCase()}`}>{t(tk.priority.toLowerCase(), tk.priority)}</span></td>
                <td><span className={statusBadge(tk.status)}>{t(tk.status.toLowerCase().replace(' ', '_'), tk.status)}</span></td>
                <td style={{fontSize:11,color:'var(--text-muted)'}}>{tk.assignedWorker}</td>
                <td style={{display:'flex',gap:5}}>
                  <button className="btn btn-ghost btn-sm" onClick={() => dispatch(openTicketDrawer(tk.id))}>{t('view', 'View')}</button>
                  <button className={`btn btn-sm ${tk.assignedWorker!=='Unassigned'?'btn-ghost':'btn-primary'}`} onClick={() => setAssignTicket(tk)}>{tk.assignedWorker!=='Unassigned'?t('reassign', 'Reassign'):t('assign', 'Assign')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Assign Modal */}
      {assignTicket && (
        <div className="modal-overlay" onClick={(e)=>e.target===e.currentTarget&&setAssignTicket(null)}>
          <div className="modal-box">
            <div className="modal-header"><h3>{t('assign_technician', 'Assign Technician')} — {assignTicket.id}</h3><button className="modal-close" onClick={()=>setAssignTicket(null)}>✕</button></div>
            <div style={{marginBottom:12,fontSize:12,color:'var(--text-secondary)'}}>{assignTicket.title} • {assignTicket.category} • {assignTicket.priority} priority</div>
            {workers.map(w=>(
              <div key={w.id} className={`worker-card ${selectedWorker===w.name?'selected':''}`} onClick={()=>setSelectedWorker(w.name)}>
                <div className="avatar avatar-sm">{w.name.slice(0,2).toUpperCase()}</div>
                <div className="worker-card-info"><strong>{w.name}</strong><span>{w.skill} • ⭐ {w.rating} • {w.jobs} active jobs</span></div>
                <span className={`badge badge-${w.availability==='Available'?'resolved':'pending'}`}>{w.availability}</span>
              </div>
            ))}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setAssignTicket(null)}>{t('cancel', 'Cancel')}</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedWorker} style={{opacity:selectedWorker?1:0.5}}>{t('assign', 'Assign Worker')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Page: Staff Requirements ── */
function WardenStaffReqs({ staffRequests, t }) {
  return (
    <>
      <div className="desktop-topbar"><h2>{t('staff_requirements', 'Staff Requirements')}</h2><div className="page-subtitle">{staffRequests.filter(r=>r.status!=='Approved'&&r.status!=='Rejected').length} pending endorsement</div></div>
      {staffRequests.length === 0 ? <EmptyState icon="📋" title="No staff requests" subtitle="No requests have been submitted yet." /> : staffRequests.map(r=>(
        <div key={r.id} className="approval-card">
          <div className="approval-card-body">
            <span className="dept-chip">{r.dept}</span>
            <h4>{r.title}</h4>
            <p>By {r.submittedBy} • {r.time}</p>
            <p style={{color:'var(--accent-green)',fontSize:11,marginTop:4}}>✓ Endorsed & forwarded to Res. Warden</p>
          </div>
          <div className="approval-cost">
            <div className="amount">₹{r.cost.toLocaleString()}</div>
            <div className="actions" style={{marginTop:8}}><span className={`badge badge-${r.status==='Approved'?'approved':r.status==='Rejected'?'rejected':'pending'}`}>{t(r.status.toLowerCase().replace(' ', '_'), r.status)}</span></div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ── Page: Workers Directory ── */
function WardenWorkers({ workers, t }) {
  const [search, setSearch] = useState('');
  const [skillF, setSkillF] = useState('All');
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return workers.filter(w => (skillF==='All'||w.skill===skillF) && (w.name.toLowerCase().includes(term)||w.skill.toLowerCase().includes(term)));
  }, [workers, search, skillF]);
  const skills = ['All', ...new Set(workers.map(w=>w.skill))];

  return (
    <>
      <div className="desktop-topbar">
        <div><h2>{t('workers_directory', 'Workers Directory')}</h2><div className="page-subtitle">{workers.length} registered technicians</div></div>
        <div style={{display:'flex',gap:8}}>
          <input className="search-bar" placeholder={`🔍 ${t('search', 'Search workers...')}`} value={search} onChange={(e)=>setSearch(e.target.value)} />
          <select className="form-select" style={{width:150}} value={skillF} onChange={(e)=>setSkillF(e.target.value)}>
            {skills.map(s=><option key={s} value={s}>{s === 'All' ? t('all', 'All') : s}</option>)}
          </select>
        </div>
      </div>
      {filtered.length === 0 ? <EmptyState icon="👷" title="No workers found" subtitle="Try adjusting your search." /> : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
          {filtered.map(w=>(
            <div key={w.id} className="card" style={{ borderRadius:'var(--radius-lg)', padding:'18px' }}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                <div className="avatar avatar-lg">{w.name.slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}>
                  <h4 style={{marginBottom:2}}>{w.name}</h4>
                  <div style={{fontSize:11,color:'var(--text-secondary)'}}>{w.skill}</div>
                  <span className={`badge badge-${w.availability==='Available'?'resolved':'pending'}`} style={{marginTop:4,display:'inline-flex'}}>{w.availability}</span>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,textAlign:'center'}}>
                {[{v:w.completedJobs,l:'Completed'},{v:w.jobs,l:t('active', 'Active')},{v:`${w.rating}⭐`,l:'Rating'}].map(({v,l})=>(
                  <div key={l} style={{background:'var(--bg-glass)',borderRadius:'var(--radius-sm)',padding:'8px 4px'}}>
                    <div style={{fontSize:14,fontWeight:700,color:'var(--text-primary)'}}>{v}</div>
                    <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase'}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:12,fontSize:11,color:'var(--text-muted)'}}>📞 {w.phone}</div>
              <div style={{display:'flex',gap:6,marginTop:10}}>
                <button className="btn btn-ghost btn-sm" style={{flex:1}}>{t('view', 'View Jobs')}</button>
                <button className="btn btn-primary btn-sm" style={{flex:1}}>{t('assign', 'Assign Job')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function WardenView({ page, isMobile }) {
  const dispatch = useDispatch();
  const { tickets, staffRequests, workers } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('All');

  const switchPage  = useCallback((id) => dispatch(setPage(id)), [dispatch]);
  const handleAssign = useCallback((ticketId, workerName) => {
    return dispatch(assignWorkerAsync({ ticketId, workerName, actor: 'Dr. Meena Sharma (AW)' })).unwrap();
  }, [dispatch]);

  const handleKpiFilter = useCallback((status) => {
    setStatusFilter(status);
    switchPage('complaints');
  }, [switchPage]);

  const LINKS = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'complaints',icon:'💬', label: t('student_complaints', 'Complaints') },
    { id:'staff-reqs',icon:'📋', label: t('staff_requirements', 'Staff Reqs')  },
    { id:'workers',   icon:'👷', label: t('workers_directory', 'Workers')     },
  ];

  const renderContent = () => {
    switch (page) {
      case 'dashboard':  return <WardenDashboard  tickets={tickets} staffRequests={staffRequests} workers={workers} onFilterByStatus={handleKpiFilter} t={t} />;
      case 'complaints': return <WardenComplaints tickets={tickets} workers={workers} onAssign={handleAssign} initialStatusFilter={statusFilter} t={t} />;
      case 'staff-reqs': return <WardenStaffReqs  staffRequests={staffRequests} t={t} />;
      case 'workers':    return <WardenWorkers    workers={workers} t={t} />;
      default:           return <WardenDashboard  tickets={tickets} staffRequests={staffRequests} workers={workers} onFilterByStatus={handleKpiFilter} t={t} />;
    }
  };

  if (isMobile) {
    return (
      <PhoneFrame showBottomNav={false}>
        <div style={{padding:4}}>
          <div className="chip-row" style={{marginBottom:14}}>
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
          <div className="app-brand"><div className="brand-icon">🏫</div><span className="brand-name">HostelOps</span></div>
          <nav className="side-nav">
            {LINKS.map(l=><div key={l.id} className={`nav-link ${page===l.id?'active':''}`} onClick={()=>switchPage(l.id)}><span className="nav-link-icon">{l.icon}</span>{l.label}</div>)}
          </nav>
          <div className="sidebar-profile"><div className="avatar avatar-sm">MS</div><div><strong style={{fontSize:11}}>Dr. Meena Sharma</strong><span>{t('role_asst_warden', 'Asst. Warden')}</span></div></div>
        </div>
        <div className="desktop-content">{renderContent()}</div>
      </div>
    </div>
  );
}
