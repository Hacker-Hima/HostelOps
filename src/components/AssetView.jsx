import React, { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setPage, updateAssetCondition, addAssetMaintenanceRecord, addToast, addAuditEntry } from '../redux/ticketSlice';
import { useTranslation } from '../utils/translations';
import PhoneFrame from './PhoneFrame';
import EmptyState from './EmptyState';

const CONDITION_COLORS = { Good:'#10b981','Needs Repair':'#f59e0b', Damaged:'#ef4444','Under Maintenance':'#8b5cf6' };
const CONDITION_OPTIONS = ['Good','Needs Repair','Damaged','Under Maintenance'];

const condBadge = (c) => {
  const m = { Good:'badge-good','Needs Repair':'badge-needsrepair', Damaged:'badge-damaged','Under Maintenance':'badge-undermaintenance' };
  return `badge ${m[c]||'badge-unassigned'}`;
};

function exportCSV(data, filename) {
  if (!data.length) return;
  const keys = ['tag', 'name', 'category', 'location', 'condition', 'lastChecked', 'value'];
  const csv  = [keys.join(','), ...data.map(row => keys.map(k => `"${(row[k]||'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── Page: Asset Registry ── */
function AssetRegistry({ assets, onViewDetail, onScanClick, t }) {
  const [search,   setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [condFilter, setCondFilter] = useState('All');

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return assets.filter(a =>
      (catFilter==='All'||a.category===catFilter) &&
      (condFilter==='All'||a.condition===condFilter) &&
      (a.name.toLowerCase().includes(term)||a.tag.toLowerCase().includes(term)||a.location.toLowerCase().includes(term))
    );
  }, [assets, search, catFilter, condFilter]);

  const cats  = ['All',...new Set(assets.map(a=>a.category))];
  const conds = ['All','Good','Needs Repair','Damaged','Under Maintenance'];

  const condSummary = useMemo(() => {
    const r = {};
    CONDITION_OPTIONS.forEach(c => r[c] = assets.filter(a=>a.condition===c).length);
    return r;
  }, [assets]);

  return (
    <>
      <div className="desktop-topbar">
        <div><h2>{t('role_assets', 'Asset Registry')}</h2><div className="page-subtitle">{assets.length} physical assets mapped across blocks</div></div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={onScanClick}>📷 {t('scan_qr_asset', 'QR Scanner')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(filtered, 'assets_inventory.csv')}>📥 {t('export_csv', 'Export CSV')}</button>
          <button className="btn btn-primary btn-sm">+ Add Asset</button>
        </div>
      </div>

      {/* Condition KPI Cards */}
      <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        {CONDITION_OPTIONS.map(c=>(
          <div key={c} className="kpi-card" style={{borderTop:`3px solid ${CONDITION_COLORS[c]}`,cursor:'pointer'}} onClick={()=>setCondFilter(f=>f===c?'All':c)}>
            <div className="kpi-label">{t(c.toLowerCase().replace(' ', '_'), c)}</div>
            <div className="kpi-value" style={{color:CONDITION_COLORS[c]}}>{condSummary[c]}</div>
            <div className="kpi-sub">assets (click to filter)</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
        <input className="search-bar" style={{width:260}} placeholder={`🔍 ${t('search', 'Search by name, QR ID, location...')}`} value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select className="form-select" style={{width:140}} value={catFilter} onChange={(e)=>setCatFilter(e.target.value)}>
          {cats.map(c=><option key={c} value={c}>{c === 'All' ? t('all', 'All') : c}</option>)}
        </select>
        <select className="form-select" style={{width:170}} value={condFilter} onChange={(e)=>setCondFilter(e.target.value)}>
          {conds.map(c=><option key={c} value={c}>{c === 'All' ? t('all', 'All') : t(c.toLowerCase().replace(' ', '_'), c)}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title="No assets found" subtitle="Try changing your search keywords or condition filter." />
      ) : (
        <table className="data-table">
          <thead><tr>
            <th>QR Tag ID</th><th>Asset Name</th><th>Category</th><th>Location</th><th>Condition</th><th>Last Checked</th><th>Value</th><th>{t('actions', 'Action')}</th>
          </tr></thead>
          <tbody>
            {filtered.map((a, idx)=>(
              <tr key={a.tag} style={{cursor:'pointer',animation:`slideIn 0.2s ease both`,animationDelay:`${idx * 25}ms`}} onClick={()=>onViewDetail(a.tag)}>
                <td><code style={{fontSize:10,color:'var(--accent-cyan)',background:'rgba(6,182,212,0.08)',padding:'2px 6px',borderRadius:4,fontFamily:'monospace'}}>{a.tag}</code></td>
                <td><span style={{fontWeight:600,color:'var(--text-primary)',fontSize:13}}>{a.name}</span></td>
                <td style={{fontSize:12}}>{a.category}</td>
                <td style={{fontSize:12,color:'var(--text-secondary)'}}>{a.location}</td>
                <td><span className={condBadge(a.condition)}>{t(a.condition.toLowerCase().replace(' ', '_'), a.condition)}</span></td>
                <td style={{fontSize:11,color:'var(--text-muted)'}}>{a.lastChecked}</td>
                <td style={{fontSize:12,fontWeight:600,color:'var(--text-primary)'}}>₹{a.value.toLocaleString()}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={(e)=>{e.stopPropagation();onViewDetail(a.tag);}}>{t('view', 'View')} →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

/* ── Page: QR Scan Simulation ── */
function AssetScanSimulation({ assets, onSelectAsset, onBack, t }) {
  const dispatch = useDispatch();
  const [tagInput, setTagInput] = useState('');

  const handleSimulate = (tag) => {
    const asset = assets.find(a => a.tag === tag);
    if (asset) {
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `Scanned ${tag}: ${asset.name}`, type: 'success' }));
      onSelectAsset(tag);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    const asset = assets.find(a => a.tag.toLowerCase().includes(tagInput.toLowerCase().trim()));
    if (asset) {
      handleSimulate(asset.tag);
    } else {
      dispatch(addToast({ id: `toast-${Date.now()}`, message: `No asset found with tag "${tagInput}"`, type: 'error' }));
    }
  };

  return (
    <>
      <div className="desktop-topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← {t('cancel', 'Back')}</button>
          <div><h2>{t('scan_qr_asset', 'QR Tag Scanner Simulation')}</h2><div className="page-subtitle">Scan camera simulation & lookup</div></div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:24,textAlign:'center'}}>
          <div style={{position:'relative',background:'rgba(0,0,0,0.5)',borderRadius:'var(--radius-lg)',padding:32,marginBottom:16,border:'2px dashed var(--accent-cyan)',minHeight:220,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:48,marginBottom:8}}>📷</div>
            <div style={{fontSize:13,fontWeight:600}}>Camera Viewfinder Active</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{t('point_qr', 'Point at any asset sticker or choose below')}</div>
          </div>

          <form onSubmit={handleManualSearch} style={{display:'flex',gap:8,marginBottom:12}}>
            <input className="form-input" placeholder="Type tag (e.g. QR-A302-BED-01)..." value={tagInput} onChange={e=>setTagInput(e.target.value)} />
            <button type="submit" className="btn btn-primary">{t('scan_qr_asset', 'Scan Tag')}</button>
          </form>
        </div>

        <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:20}}>
          <div className="section-title">Quick Simulate Existing Tags</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {assets.slice(0, 5).map(a => (
              <div key={a.tag} className="card" style={{padding:12,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}} onClick={()=>handleSimulate(a.tag)}>
                <div>
                  <div style={{fontWeight:600,fontSize:12}}>{a.name}</div>
                  <div style={{fontFamily:'monospace',fontSize:10,color:'var(--accent-cyan)'}}>{a.tag} • {a.location}</div>
                </div>
                <span className={condBadge(a.condition)}>{t(a.condition.toLowerCase().replace(' ', '_'), a.condition)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Page: Asset Detail ── */
function AssetDetail({ assets, selectedTag, onBack, onConditionChange, onAddHistoryRecord, t }) {
  const asset = assets.find(a=>a.tag===selectedTag) || assets[0];
  const [condition, setCondition] = useState(asset?.condition || 'Good');
  const [editMode, setEditMode]   = useState(false);
  const [historyNote, setHistoryNote] = useState('');
  const [showAddHistory, setShowAddHistory] = useState(false);

  const handleSave = useCallback(() => {
    onConditionChange(asset.tag, condition);
    setEditMode(false);
  }, [asset, condition, onConditionChange]);

  const handleAddRecord = () => {
    if (!historyNote.trim()) return;
    onAddHistoryRecord(asset.tag, {
      date: 'Today',
      action: historyNote.trim(),
      actor: 'Dr. Meena Sharma (Asset Mgr)',
      color: 'var(--accent-primary)',
    });
    setHistoryNote('');
    setShowAddHistory(false);
  };

  if (!asset) return <EmptyState icon="📦" title="Asset not found" subtitle="Select an asset from the registry." onAction={onBack} actionLabel="Back to Registry" />;

  const history = asset.maintenanceHistory || [
    {date:'12 Aug 2025',action:'Condition verified — Good',actor:'Dr. Meena Sharma',color:'var(--accent-green)'},
    {date:'28 Jul 2025',action:'Minor servicing done',actor:'Sarathi Kamal',color:'var(--accent-cyan)'},
    {date:'01 Jun 2025',action:'Annual check completed',actor:'Rajan Kumar',color:'var(--accent-primary)'},
  ];

  return (
    <>
      <div className="desktop-topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← {t('role_assets', 'Registry')}</button>
          <div><h2>{asset.name}</h2><div className="page-subtitle">{asset.tag}</div></div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {editMode
            ? <><button className="btn btn-secondary btn-sm" onClick={()=>setEditMode(false)}>{t('cancel', 'Cancel')}</button><button className="btn btn-success btn-sm" onClick={handleSave}>{t('save', 'Save Changes')}</button></>
            : <button className="btn btn-primary btn-sm" onClick={()=>setEditMode(true)}>✏️ Edit Condition</button>
          }
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16}}>
        {/* QR Card */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:20}}>
            <div className="qr-display" style={{marginBottom:12}}>
              <div>█▀▀▀▀▀▀▀█ ▄ █▀▀▀▀▀▀▀█</div>
              <div>█ ▀▀▀▀▀ █ ▀▄ █ ▀▀▀▀▀ █</div>
              <div>█ █▀▀▀█ █ ▀▄ █ █▀▀▀█ █</div>
              <div>█ █   █ █ ▀▄ █ █   █ █</div>
              <div>█▄▄▄▄▄▄▄█ ▄ █▄▄▄▄▄▄▄█</div>
              <div>▀▄▄▀▄▄▀▀▄▀▀▄▄▀▄▄▀▄▄▀</div>
              <div>█▀▀▀▀▀▀▀█ ▄ █▀▀▀▀▀▀▀█</div>
              <div>█ ▀▀▀▀▀ █ ▀▄▀▄▀▄▀▄▀▄</div>
              <div style={{marginTop:8,fontSize:7,color:'#333'}}>{asset.tag}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <button className="btn btn-ghost btn-sm btn-full">📥 Export QR Sticker PNG</button>
            </div>
          </div>

          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:16}}>
            <div className="section-title">Current Condition</div>
            <span className={condBadge(condition)}>{t(condition.toLowerCase().replace(' ', '_'), condition)}</span>
            {editMode && (
              <div style={{marginTop:12}}>
                {CONDITION_OPTIONS.map(c=>(
                  <button key={c} className="btn btn-ghost btn-sm btn-full" style={{marginBottom:5,justifyContent:'flex-start',border:condition===c?`1px solid ${CONDITION_COLORS[c]}`:'1px solid var(--border-subtle)',color:condition===c?CONDITION_COLORS[c]:'var(--text-secondary)',background:condition===c?`${CONDITION_COLORS[c]}15`:'transparent'}} onClick={()=>setCondition(c)}>{t(c.toLowerCase().replace(' ', '_'), c)}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Details & Maintenance */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:20}}>
            <div className="section-title">Asset Information</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
              {[{l:'Asset Name',v:asset.name},{l:'Category',v:asset.category},{l:'Location',v:asset.location},{l:'Market Value',v:`₹${asset.value.toLocaleString()}`},{l:'Last Checked',v:asset.lastChecked},{l:'QR Tag ID',v:asset.tag}].map(({l,v})=>(
                <div key={l} style={{padding:'12px 14px',borderBottom:'1px solid var(--border-subtle)'}}>
                  <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>{l}</div>
                  <div style={{fontSize:13,fontWeight:600,fontFamily:l==='QR Tag ID'?'monospace':'inherit',color:l==='QR Tag ID'?'var(--accent-cyan)':'var(--text-primary)'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance History */}
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-lg)',padding:20}}>
            <div className="flex-between" style={{marginBottom:12}}>
              <div className="section-title" style={{marginBottom:0}}>Maintenance & Audit Log</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowAddHistory(p=>!p)}>+ Add Record</button>
            </div>

            {showAddHistory && (
              <div style={{padding:12,background:'var(--bg-glass)',borderRadius:'var(--radius-md)',marginBottom:14,border:'1px solid var(--border-subtle)'}}>
                <input className="form-input" style={{marginBottom:8}} placeholder="Maintenance record description (e.g. Replaced switchboard, tested ok)..." value={historyNote} onChange={e=>setHistoryNote(e.target.value)} />
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowAddHistory(false)}>{t('cancel', 'Cancel')}</button>
                  <button className="btn btn-primary btn-sm" onClick={handleAddRecord} disabled={!historyNote.trim()}>{t('save', 'Save Record')}</button>
                </div>
              </div>
            )}

            {history.map((item,i)=>(
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{background:item.color || 'var(--accent-primary)'}}/>
                <div className="activity-body"><strong>{item.action}</strong><span>{item.actor}</span></div>
                <div className="activity-time">{item.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function AssetView({ page, isMobile }) {
  const dispatch = useDispatch();
  const { assets } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();
  const [selectedTag, setSelectedTag] = useState(null);

  const switchPage = useCallback((id) => dispatch(setPage(id)), [dispatch]);

  const handleViewDetail = useCallback((tag) => {
    setSelectedTag(tag);
    switchPage('asset-detail');
  }, [switchPage]);

  const handleConditionChange = useCallback((tag, cond) => {
    dispatch(updateAssetCondition({ tag, condition:cond }));
    dispatch(addAuditEntry({ id:`AL-${Date.now()}`, action:'Asset Condition Updated', actor:'Dr. Meena Sharma (Asset Mgr)', target:tag, timestamp:new Date().toLocaleString(), category:'Asset' }));
    dispatch(addToast({ id:`toast-${Date.now()}`, message:`${tag} condition set to "${cond}"`, type:'success' }));
  }, [dispatch]);

  const handleAddHistory = useCallback((tag, record) => {
    dispatch(addAssetMaintenanceRecord({ tag, record }));
    dispatch(addToast({ id:`toast-${Date.now()}`, message:'Maintenance record logged', type:'success' }));
  }, [dispatch]);

  const LINKS = [
    { id:'registry',     icon:'📦', label: t('role_assets', 'Registry')     },
    { id:'scan-sim',     icon:'📷', label: t('scan_qr_asset', 'QR Scanner')   },
    { id:'asset-detail', icon:'🔍', label: t('view', 'Asset Detail')  },
  ];

  const renderContent = () => {
    switch (page) {
      case 'registry':     return <AssetRegistry assets={assets} onViewDetail={handleViewDetail} onScanClick={()=>switchPage('scan-sim')} t={t} />;
      case 'scan-sim':     return <AssetScanSimulation assets={assets} onSelectAsset={handleViewDetail} onBack={()=>switchPage('registry')} t={t} />;
      case 'asset-detail': return <AssetDetail assets={assets} selectedTag={selectedTag} onBack={()=>switchPage('registry')} onConditionChange={handleConditionChange} onAddHistoryRecord={handleAddHistory} t={t} />;
      default:             return <AssetRegistry assets={assets} onViewDetail={handleViewDetail} onScanClick={()=>switchPage('scan-sim')} t={t} />;
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
    <div style={{width:'min(1100px,100%)',animation:'slideUp 0.3s ease'}}>
      <div className="desktop-layout">
        <div className="dark-sidebar">
          <div className="app-brand"><div className="brand-icon">🏁</div><span className="brand-name">HostelOps</span></div>
          <nav className="side-nav">
            {LINKS.map(l=><div key={l.id} className={`nav-link ${page===l.id?'active':''}`} onClick={()=>switchPage(l.id)}><span className="nav-link-icon">{l.icon}</span>{l.label}</div>)}
          </nav>
          <div className="sidebar-profile"><div className="avatar avatar-sm">MS</div><div><strong style={{fontSize:11}}>Dr. Meena Sharma</strong><span>{t('role_assets', 'Asset Manager')}</span></div></div>
        </div>
        <div className="desktop-content">{renderContent()}</div>
      </div>
    </div>
  );
}
