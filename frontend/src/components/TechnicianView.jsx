import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setPage, markJobComplete, addToast, addComment, openTicketDrawer, addAuditEntry,
  resolveTicketAsync, toggleWorkerAvailabilityAsync, addCommentAsync, setProfileModalOpen,
} from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';
import PhoneFrame from './PhoneFrame';
import EmptyState from './EmptyState';
import { JobStopwatchTimer, PreventiveMaintenanceSchedule } from './TechnicianFeatures';

const PRIORITY_ICON = { High:'🔴', Medium:'🟡', Low:'🟢' };
const CAT_MAP = { Electrical:'⚡', Plumbing:'💧', Furniture:'🪑', Networking:'📡', Appliance:'❄️', Default:'🔧' };

/* ── Page: Job Feed ── */
function TechnicianFeed({ jobs, onViewJob, completedIds, onOpenDrawer, t }) {
  const dispatch = useDispatch();
  const { workers } = useSelector(s => s.ticketStore);
  const myWorker = workers.find(w => w.name === 'Sarathi Kamal') || { id: 'W1', availability: 'Available' };
  const isAvailable = myWorker.availability === 'Available';

  const handleToggleAvail = () => {
    const next = isAvailable ? 'Not Available' : 'Available';
    dispatch(toggleWorkerAvailabilityAsync({ id: myWorker.id, availability: next }));
  };

  return (
    <>
      <div className="mobile-header">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div className="avatar" style={{background:'linear-gradient(135deg,#f97316,#eab308)'}}>⚡</div>
          <div>
            <h4>Sarathi Kamal</h4>
            <p style={{fontSize:10,color:'var(--text-secondary)'}}>{t('role_technician', 'Electrician')} • Contract #E-041</p>
          </div>
        </div>
        <div style={{textAlign:'center',background:'var(--bg-glass)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',padding:'6px 10px'}}>
          <div style={{fontSize:18,fontWeight:800,color:'var(--accent-cyan)'}}>{jobs.length}</div>
          <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase'}}>Jobs Today</div>
        </div>
      </div>

      {/* Availability Toggle */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:`rgba(${isAvailable?'16,185,129':'239,68,68'},0.08)`,border:`1px solid rgba(${isAvailable?'16,185,129':'239,68,68'},0.2)`,borderRadius:'var(--radius-md)',padding:'10px 14px',marginBottom:18}}>
        <div>
          <div style={{fontSize:13,fontWeight:600}}>{t('availability_status', 'Availability Status')}</div>
          <div style={{fontSize:11,color:isAvailable?'var(--accent-green)':'var(--accent-red)'}}>{isAvailable ? t('currently_available', '● Currently Available') : t('not_available', '● Not Available')}</div>
        </div>
        <div onClick={handleToggleAvail} style={{width:42,height:24,background:isAvailable?'var(--accent-green)':'rgba(100,116,139,0.4)',borderRadius:999,position:'relative',cursor:'pointer',transition:'background 0.3s'}}>
          <div style={{position:'absolute',[isAvailable?'right':'left']:2,top:'50%',transform:'translateY(-50%)',width:20,height:20,background:'white',borderRadius:'50%',transition:'all 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:18}}>
        {[{v:18,l:'This Month',c:'var(--accent-cyan)'},{v:completedIds.length,l:'Today',c:'var(--accent-green)'},{v:'4.8⭐',l:'Rating',c:'var(--accent-yellow)'}].map(({v,l,c})=>(
          <div key={l} className="card" style={{padding:'11px 6px',textAlign:'center'}}>
            <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
            <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      <div className="section-title">{t('job_feed', 'Assigned Jobs')} ({jobs.length})</div>
      {jobs.length===0 ? (
        <EmptyState icon="🎉" title="All clear!" subtitle="No pending jobs assigned right now." />
      ) : (
        jobs.map((j, idx)=>(
          <div key={j.id} className="card" style={{padding:14,marginBottom:9,cursor:'pointer',animation:`slideIn 0.25s ease both`,animationDelay:`${idx * 40}ms`}} onClick={()=>onViewJob(j.id)}>
            <div className="flex-between" style={{marginBottom:7}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>{CAT_MAP[j.category]||CAT_MAP.Default}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>{j.title}</div>
                  <div style={{fontSize:10,color:'var(--text-muted)'}}>{j.room} • {j.createdAt}</div>
                </div>
              </div>
              <span className={`priority-tag p-${j.priority.toLowerCase()}`}>{PRIORITY_ICON[j.priority]} {t(j.priority.toLowerCase(), j.priority)}</span>
            </div>
            <div className="flex-between" style={{fontSize:11,color:'var(--text-muted)'}}>
              <span>{j.id}</span>
              <div style={{display:'flex',gap:8}}>
                <span style={{color:'var(--accent-cyan)'}} onClick={(e)=>{e.stopPropagation();onOpenDrawer(j.id);}}>Timeline ↗</span>
                <span style={{color:'var(--accent-primary)',fontWeight:600}}>Execute →</span>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Completed */}
      {completedIds.length>0 && (
        <>
          <div className="section-title" style={{marginTop:16}}>{t('resolved', 'Completed Today')}</div>
          {completedIds.map(id=>(
            <div key={id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:'var(--radius-md)',marginBottom:7}}>
              <span style={{fontSize:18}}>✅</span>
              <span style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>{id} — Work Completed & Verified</span>
            </div>
          ))}
        </>
      )}

      {/* Earnings Card */}
      <div style={{background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08))',border:'1px solid var(--border-default)',borderRadius:'var(--radius-lg)',padding:'14px 16px',marginTop:14}}>
        <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>{t('earnings', 'Earnings Performance')}</div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <div><div style={{fontSize:20,fontWeight:800,color:'var(--accent-cyan)'}}>18</div><div style={{fontSize:10,color:'var(--text-muted)'}}>Jobs Done</div></div>
          <div><div style={{fontSize:20,fontWeight:800,color:'var(--accent-green)'}}>₹9,200</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{t('earnings', 'Earnings')}</div></div>
          <div><div style={{fontSize:20,fontWeight:800,color:'var(--accent-yellow)'}}>4.8⭐</div><div style={{fontSize:10,color:'var(--text-muted)'}}>Rating</div></div>
        </div>
      </div>
    </>
  );
}

/* ── Page: Schedule View ── */
function TechnicianSchedule({ jobs, onViewJob, t }) {
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  const timeSlots = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'];
  const weekDays  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div className="mobile-header">
        <div>
          <h4>{t('schedule', 'Work Schedule')}</h4>
          <p style={{fontSize:10,color:'var(--text-secondary)'}}>Today's shift: 09:00 AM - 06:00 PM</p>
        </div>
        <div className="tabs-header" style={{marginBottom:0}}>
          <button className={`tab-btn ${viewMode==='day'?'active':''}`} onClick={()=>setViewMode('day')}>Day</button>
          <button className={`tab-btn ${viewMode==='week'?'active':''}`} onClick={()=>setViewMode('week')}>Week</button>
        </div>
      </div>

      {viewMode === 'day' ? (
        <div className="schedule-list">
          {timeSlots.map((slot, i) => {
            const job = jobs[i % jobs.length];
            return (
              <div key={slot} className="schedule-slot-row" style={{display:'flex',gap:12,marginBottom:12}}>
                <div style={{width:68,fontSize:11,fontWeight:700,color:'var(--text-muted)',paddingTop:6}}>{slot}</div>
                <div style={{flex:1}}>
                  {job && i < 3 ? (
                    <div className="schedule-job-card" onClick={()=>onViewJob(job.id)} style={{background:'var(--bg-glass)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',padding:12,cursor:'pointer',borderLeft:`3px solid ${job.priority==='High'?'var(--accent-red)':job.priority==='Medium'?'var(--accent-yellow)':'var(--accent-green)'}`}}>
                      <div className="flex-between">
                        <span style={{fontWeight:600,fontSize:12}}>{job.title}</span>
                        <span className={`priority-tag p-${job.priority.toLowerCase()}`}>{t(job.priority.toLowerCase(), job.priority)}</span>
                      </div>
                      <div style={{fontSize:10,color:'var(--text-muted)',marginTop:4}}>📍 {job.room} • {job.id}</div>
                    </div>
                  ) : (
                    <div style={{background:'rgba(255,255,255,0.02)',border:'1px dashed var(--border-subtle)',borderRadius:'var(--radius-md)',padding:10,fontSize:11,color:'var(--text-muted)',textAlign:'center'}}>
                      ☕ Available / Standby Slot
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="week-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {weekDays.map((day, idx) => (
            <div key={day} style={{background:'var(--bg-glass)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-md)',padding:10}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text-primary)',marginBottom:6}}>{day}</div>
              <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:8}}>{idx === 0 ? 'Today (Active)' : 'Upcoming'}</div>
              <div style={{background:idx === 0 ? 'var(--accent-primary-soft)' : 'rgba(255,255,255,0.03)',borderRadius:4,padding:6,fontSize:11}}>
                {idx === 0 ? `${jobs.length} jobs assigned` : `${Math.floor(2 + (idx%3))} scheduled`}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Page: Job Detail & Proof ── */
function TechnicianJobDetail({ tickets, selectedJobId, onBack, onComplete, completedIds, t }) {
  const job = tickets.find(tk=>tk.id===selectedJobId) || tickets.find(tk=>tk.assignedWorker==='Sarathi Kamal') || tickets[0];
  const [notes, setNotes] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const isCompleted = completedIds.includes(job?.id);

  if (!job) return <EmptyState icon="🔧" title="No job selected" subtitle="Select a job from your feed to view instructions." />;

  return (
    <>
      <div className="mobile-header">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onBack} style={{background:'var(--bg-glass)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',width:30,height:30,cursor:'pointer',color:'var(--text-secondary)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>
          <div><h4 style={{fontSize:13}}>{t('proof_of_work', 'Job Execution & Proof')}</h4><p style={{fontSize:9,color:'var(--text-muted)'}}>{job.id}</p></div>
        </div>
        <span className={`priority-tag p-${job.priority.toLowerCase()}`}>{PRIORITY_ICON[job.priority]} {t(job.priority.toLowerCase(), job.priority)}</span>
      </div>

      <div style={{background:'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,179,8,0.07))',border:'1px solid rgba(249,115,22,0.2)',borderRadius:'var(--radius-xl)',padding:18,marginBottom:14}}>
        <div style={{fontSize:24,marginBottom:8}}>{CAT_MAP[job.category]||CAT_MAP.Default}</div>
        <h3 style={{fontSize:15,marginBottom:6}}>{job.title}</h3>
        <div style={{fontSize:11,color:'var(--text-secondary)',lineHeight:1.6}}>{job.description}</div>
        <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
          <span style={{fontSize:10,background:'rgba(255,255,255,0.06)',borderRadius:'var(--radius-sm)',padding:'3px 8px',color:'var(--text-secondary)'}}>📍 {job.room}</span>
          <span style={{fontSize:10,background:'rgba(255,255,255,0.06)',borderRadius:'var(--radius-sm)',padding:'3px 8px',color:'var(--text-secondary)'}}>🏷️ {job.category}</span>
          <span style={{fontSize:10,background:'rgba(255,255,255,0.06)',borderRadius:'var(--radius-sm)',padding:'3px 8px',color:'var(--text-secondary)'}}>⏰ {job.createdAt}</span>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <button className="btn btn-ghost btn-sm" style={{flex:1}}>📞 Call</button>
        <button className="btn btn-ghost btn-sm" style={{flex:1}}>🧭 Navigate</button>
        <button className="btn btn-ghost btn-sm" style={{flex:1}}>💬 Message</button>
      </div>

      {isCompleted ? (
        <div style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:'var(--radius-lg)',padding:20,textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,color:'var(--accent-green)',fontSize:14}}>Job Completed!</div>
          <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>Completion proof & notes logged into ticket record. Student notified!</div>
        </div>
      ) : (
        <>
          <div className="section-title">{t('proof_of_work', 'Proof of Work & Verification')}</div>
          <div className="upload-box" onClick={()=>setPhotoUploaded(p=>!p)} style={{marginBottom:10,borderColor:photoUploaded?'var(--accent-green)':undefined}}>
            {photoUploaded ? '✅ "After" Photo Attached (IMG_20260824_work.jpg)' : '📸 Tap to capture / upload "After" repair photo'}
          </div>

          {/* Work Duration Logger */}
          <div style={{ marginBottom: 12 }}>
            <JobStopwatchTimer onInsertDuration={(dur) => setNotes(prev => prev ? `${prev}\n${dur}` : dur)} />
          </div>

          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Completion notes (e.g. Capacitor replaced, tested 3× cycles, clean handover)..."
            value={notes}
            onChange={(e)=>setNotes(e.target.value)}
            style={{marginBottom:10}}
          />
          <button className="btn btn-success btn-full btn-lg" onClick={()=>onComplete(job.id, notes)}>
            {t('mark_job_completed', '✓ Submit Proof & Mark Complete')}
          </button>
        </>
      )}
    </>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function TechnicianView({ page, isMobile }) {
  const dispatch = useDispatch();
  const { tickets } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [completedIds,  setCompletedIds]  = useState([]);
  const [mobileTab, setMobileTab]         = useState('feed');

  const myJobs     = tickets.filter(tk => tk.assignedWorker==='Sarathi Kamal' && tk.status!=='Resolved');
  const activePage = isMobile ? mobileTab : page;

  const switchPage = useCallback((id) => {
    if (isMobile) setMobileTab(id);
    else dispatch(setPage(id));
  }, [isMobile, dispatch]);

  const handleViewJob = useCallback((id) => {
    setSelectedJobId(id);
    switchPage('job-detail');
  }, [switchPage]);

  const handleOpenDrawer = useCallback((id) => {
    dispatch(openTicketDrawer(id));
  }, [dispatch]);

  const handleComplete = useCallback(async (id, noteText) => {
    try {
      await dispatch(resolveTicketAsync({
        ticketId: id,
        notes: noteText || 'Work completed by technician.',
        actor: 'Sarathi Kamal (Worker)',
      })).unwrap();
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Job ${id} completed & saved to database!`, type: 'success' }));
    } catch {
      dispatch(markJobComplete(id));
      if (noteText) {
        dispatch(addComment({
          ticketId: id,
          comment: {
            id: `C${Date.now()}`,
            author: 'Sarathi Kamal',
            role: 'Technician',
            text: `Work completed by technician. Notes: ${noteText}`,
            time: 'Just now',
          },
        }));
      }
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Job ${id} completed & closed!`, type: 'success' }));
    }
    setCompletedIds(p=>[...p, id]);
    switchPage('feed');
  }, [dispatch, switchPage]);

  const renderContent = () => {
    switch (activePage) {
      case 'feed':       return <TechnicianFeed jobs={myJobs} onViewJob={handleViewJob} completedIds={completedIds} onOpenDrawer={handleOpenDrawer} t={t} />;
      case 'schedule':   return <TechnicianSchedule jobs={myJobs} onViewJob={handleViewJob} t={t} />;
      case 'preventive': return <PreventiveMaintenanceSchedule />;
      case 'job-detail': return <TechnicianJobDetail tickets={tickets} selectedJobId={selectedJobId} onBack={()=>switchPage('feed')} onComplete={handleComplete} completedIds={completedIds} t={t} />;
      default:           return <TechnicianFeed jobs={myJobs} onViewJob={handleViewJob} completedIds={completedIds} onOpenDrawer={handleOpenDrawer} t={t} />;
    }
  };

  const bottomNav = (
    <>
      {[
        {id:'feed',icon:'📋',label:t('job_feed', 'Feed')},
        {id:'schedule',icon:'📅',label:t('schedule', 'Schedule')},
        {id:'preventive',icon:'🗓️',label:'PM'},
        {id:'job-detail',icon:'🔧',label:t('proof_of_work', 'Proof')}
      ].map(tab=>(
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
    <div style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease' }}>
      <div className="desktop-layout">
        <div className="dark-sidebar">
          {/* Sidebar Hero Card */}
          <div className="sidebar-hero-card">
            <div className="sidebar-hero-icon">⚡</div>
            <div className="sidebar-hero-info">
              <div className="sidebar-hero-title">{t('role_technician', 'Maintenance Desk')}</div>
              <div className="sidebar-hero-badge">
                <span className="sidebar-hero-dot"></span>
                <span>Level 2 • Field Tech</span>
              </div>
            </div>
          </div>

          <div className="nav-section-label">Field Operations</div>

          <nav className="side-nav">
            {[
              { id: 'feed', icon: '📋', label: t('job_feed', 'Job Feed'), desc: 'Assigned active dispatches' },
              { id: 'schedule', icon: '📅', label: t('schedule', 'Schedule'), desc: "Today's maintenance tasks" },
              { id: 'preventive', icon: '🗓️', label: 'Preventive Maint.', desc: 'Quarterly hardware checks' },
              { id: 'job-detail', icon: '🔧', label: t('proof_of_work', 'Job Detail & Proof'), desc: 'Upload resolution proof' }
            ].map((link) => {
              const isActive = page === link.id;
              return (
                <div
                  key={link.id}
                  className={`nav-card-item ${isActive ? 'active' : ''}`}
                  onClick={() => dispatch(setPage(link.id))}
                >
                  <div className="nav-card-icon-box">{link.icon}</div>
                  <div className="nav-card-body">
                    <span className="nav-card-title">{link.label}</span>
                    <span className="nav-card-desc">{link.desc}</span>
                  </div>
                  <span className="nav-card-arrow">→</span>
                </div>
              );
            })}
          </nav>

          {/* Profile Card Footer */}
          <div
            className="sidebar-profile-card"
            onClick={() => dispatch(setProfileModalOpen(true))}
            title="Click to view & edit profile details"
          >
            <div className="sidebar-profile-avatar" style={{ background: 'linear-gradient(135deg,#f97316,#eab308)' }}>⚡</div>
            <div className="sidebar-profile-meta">
              <span className="sidebar-profile-title">Sarathi Kamal</span>
              <span className="sidebar-profile-subtitle">Electrician & MEP Lead</span>
            </div>
            <span className="sidebar-profile-action-btn">⚙️</span>
          </div>
        </div>
        <div className="desktop-content">{renderContent()}</div>
      </div>
    </div>
  );
}
