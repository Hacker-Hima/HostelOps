import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { exportToCSV } from '../../utils/exportCSV';
import {
  Layers,
  CheckCircle2,
  UserCheck,
  AlertOctagon,
  HelpCircle,
  Wrench,
  Users,
  FileQuestion,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Box,
  ClipboardList,
  Building,
  Download,
  RotateCcw,
  UserPlus,
  ShieldCheck,
  CheckCircle,
  Play,
  Clock,
  Send,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Active Workspace Mode: 'admin1' (Asset & Inventory) or 'admin2' (User & Maintenance)
  const isDefaultAdmin2 = user?.email?.toLowerCase().includes('admin2');
  const [activeMode, setActiveMode] = useState(isDefaultAdmin2 ? 'admin2' : 'admin1');

  const [stats, setStats] = useState(null);
  const [techStats, setTechStats] = useState(null);
  const [recentAssets, setRecentAssets] = useState([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Admin 1: Receive Returned Asset Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnAssetId, setReturnAssetId] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnRemarks, setReturnRemarks] = useState('Checked in by Inventory Administrator');

  // Admin 2: Assign Technician Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTaskToAssign, setSelectedTaskToAssign] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignPriority, setAssignPriority] = useState('High');
  const [adminNotes, setAdminNotes] = useState('Immediate repair requested by Warden');

  // Admin 2: Approve Completion Modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedTaskToApprove, setSelectedTaskToApprove] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('Physical inspection verified. Restored to inventory.');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, assetsRes, tasksRes, techStatsRes, usersRes] = await Promise.all([
        api.get('/assets/stats/overview'),
        api.get('/assets?limit=15'),
        api.get('/maintenance/tasks?limit=10'),
        api.get('/maintenance/stats'),
        api.get('/users?role=technician&limit=50'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (assetsRes.data.success) {
        setRecentAssets(assetsRes.data.assets || assetsRes.data.data || []);
      }
      if (tasksRes.data.success) {
        setMaintenanceTasks(tasksRes.data.tasks || []);
      }
      if (techStatsRes.data.success) {
        setTechStats(techStatsRes.data.stats || {});
      }
      if (usersRes.data.success) {
        setTechnicians(usersRes.data.users || usersRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Admin 1 Calculations
  const total = stats?.totalAssets || 0;
  const available = stats?.availableAssets || 0;
  const assigned = stats?.assignedAssets || 0;
  const damaged = stats?.damagedAssets || 0;
  const lost = stats?.lostAssets || 0;
  const maintenance = stats?.maintenanceAssets || 0;
  const pendingReqs = stats?.pendingRequests || 0;
  const getPercent = (count) => (total > 0 ? ((count / total) * 100).toFixed(1) : 0);

  // Admin 2 Calculations
  const totalResidents = stats?.totalUsers || 0;
  const totalTechs = technicians.length || 1;
  const totalTasks = techStats?.totalTasks || maintenanceTasks.length || 0;
  const pendingTasks = techStats?.pendingTasks || 0;
  const inProgressTasks = techStats?.inProgressTasks || 0;
  const completedTasks = techStats?.completedTasks || 0;

  // 1-Click CSV Report Generators
  const handleGenerateInventoryReport = () => {
    const reportData = recentAssets.map((a) => ({
      'Asset Code': a.assetCode,
      'Asset Name': a.assetName,
      Category: a.category,
      'Hostel Block': a.hostelBlock,
      'Room Number': a.roomNumber,
      Condition: a.condition,
      Status: a.status,
      'Assigned Resident': a.assignedTo ? a.assignedTo.name : 'Unassigned',
      'Unit Price (INR)': a.price || 0,
    }));
    exportToCSV(reportData, `Hostel_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleGenerateMaintenanceReport = () => {
    const reportData = maintenanceTasks.map((t) => ({
      'Task Code': t.taskCode,
      'Work Order Title': t.title,
      Category: t.category,
      Location: `${t.hostelBlock} Rm ${t.roomNumber}`,
      Priority: t.priority,
      Status: t.status,
      'Assigned Technician': t.assignedName,
      'Issue Description': t.issueDescription,
      'Technician Remarks': t.remarks || '',
      'Completion Date': t.completionDate || '',
    }));
    exportToCSV(reportData, `Hostel_Maintenance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Admin 1: Handle Return Check-In
  const handleReceiveReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnAssetId) return;

    try {
      const res = await api.put(`/assets/${returnAssetId}/return`, {
        condition: returnCondition,
        returnReason: 'Admin Check-In / Storage Receipt',
        remarks: returnRemarks,
      });

      if (res.data.success) {
        setMessage({ text: 'Asset successfully checked into central store and marked Available!', type: 'success' });
        setIsReturnModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error receiving asset', type: 'danger' });
    }
  };

  // Admin 2: Handle Technician Task Assignment
  const openAssignModal = (task) => {
    setSelectedTaskToAssign(task);
    setSelectedTechId(technicians[0]?._id || '');
    setAssignPriority(task.priority || 'High');
    setAdminNotes(`Immediate dispatch to ${task.hostelBlock} Rm ${task.roomNumber}`);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTaskToAssign || !selectedTechId) return;

    try {
      const res = await api.put(`/maintenance/tasks/${selectedTaskToAssign._id}/assign`, {
        technicianId: selectedTechId,
        priority: assignPriority,
        adminNotes,
      });

      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setIsAssignModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error assigning task', type: 'danger' });
    }
  };

  // Admin 2: Handle Maintenance Completion Sign-Off
  const openApproveModal = (task) => {
    setSelectedTaskToApprove(task);
    setApprovalRemarks('Physical inspection verified. Restored to inventory operational status.');
    setIsApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTaskToApprove) return;

    try {
      const res = await api.put(`/maintenance/tasks/${selectedTaskToApprove._id}/approve-completion`, {
        adminRemarks: approvalRemarks,
      });

      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setIsApproveModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error approving maintenance sign-off', type: 'danger' });
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Role Switcher Header */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '0.25rem', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveMode('admin1')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeMode === 'admin1' ? '#2563eb' : 'transparent',
              color: activeMode === 'admin1' ? '#ffffff' : '#475569',
              transition: 'all 0.2s',
            }}
            id="tab-admin1-mode"
          >
            <Box size={16} />
            <span>Admin 1 – Asset & Inventory</span>
          </button>

          <button
            onClick={() => setActiveMode('admin2')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeMode === 'admin2' ? '#059669' : 'transparent',
              color: activeMode === 'admin2' ? '#ffffff' : '#475569',
              transition: 'all 0.2s',
            }}
            id="tab-admin2-mode"
          >
            <Users size={16} />
            <span>Admin 2 – User & Maintenance</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={fetchDashboardData}
            className="btn btn-secondary btn-sm"
            title="Refresh statistics"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          {activeMode === 'admin1' ? (
            <button
              onClick={handleGenerateInventoryReport}
              className="btn btn-outline-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              id="btn-export-inventory-report"
            >
              <Download size={14} />
              <span>Generate Inventory Report (CSV)</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateMaintenanceReport}
              className="btn btn-outline-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              id="btn-export-maintenance-report"
            >
              <Download size={14} />
              <span>Generate Maintenance Report (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏢 ADMIN 1: ASSET & INVENTORY WORKSPACE                                  */}
      {/* ========================================================================= */}
      {activeMode === 'admin1' && (
        <>
          <div className="page-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="code-badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                  ROLE: ADMIN 1
                </span>
                <h1 className="page-title" style={{ margin: 0 }}>Asset & Inventory Administration</h1>
              </div>
              <p className="page-subtitle">
                Manage stock, approve requisitions, track item condition (Bed, Chair, Table, Fan), receive returns, and audit inventory
              </p>
            </div>

            {/* Admin 1 Quick Actions */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link to="/admin/assets" className="btn btn-primary" id="btn-admin1-add-asset">
                <PlusCircle size={16} />
                <span>+ Add / Manage Assets</span>
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const assignedOne = recentAssets.find((a) => a.status === 'Assigned');
                  setReturnAssetId(assignedOne?._id || '');
                  setIsReturnModalOpen(true);
                }}
                id="btn-admin1-receive-return"
              >
                <RotateCcw size={16} />
                <span>Receive Returned Asset</span>
              </button>
              <Link to="/admin/requests" className="btn btn-secondary" id="btn-admin1-review-requests">
                <FileQuestion size={16} />
                <span>Approve Requests ({pendingReqs})</span>
              </Link>
            </div>
          </div>

          {/* Admin 1 Metric Cards */}
          <div className="stat-grid">
            <StatCard
              title="Total Inventory"
              value={total}
              icon={Layers}
              color="blue"
              subtext="Full Asset Register"
              id="stat-admin1-total"
            />
            <StatCard
              title="Available Stock"
              value={available}
              icon={CheckCircle2}
              color="green"
              subtext={`${getPercent(available)}% ready to allocate`}
              id="stat-admin1-available"
            />
            <StatCard
              title="Assigned in Rooms"
              value={assigned}
              icon={UserCheck}
              color="indigo"
              subtext={`${getPercent(assigned)}% with students`}
              id="stat-admin1-assigned"
            />
            <StatCard
              title="Pending Requests"
              value={pendingReqs}
              icon={FileQuestion}
              color="amber"
              subtext="Awaiting stock approval"
              id="stat-admin1-requests"
            />
            <StatCard
              title="Damaged Items"
              value={damaged}
              icon={AlertOctagon}
              color="red"
              subtext="Needs inspection"
              id="stat-admin1-damaged"
            />
            <StatCard
              title="Lost Property"
              value={lost}
              icon={HelpCircle}
              color="purple"
              subtext="Under investigation"
              id="stat-admin1-lost"
            />
            <StatCard
              title="Under Maintenance"
              value={maintenance}
              icon={Wrench}
              color="purple"
              subtext="In repair depot"
              id="stat-admin1-maintenance"
            />
          </div>

          {/* Admin 1 Example Workflow Notice */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <strong style={{ color: '#1e40af' }}>💡 Requisition Workflow:</strong>
              <span style={{ fontSize: '0.875rem', color: '#1e3a8a', marginLeft: '0.5rem' }}>
                Student requests an asset (e.g. Chair) ➔ Admin 1 checks availability ➔ Approves ➔ Automatically assigns specific asset code to student.
              </span>
            </div>
            <Link to="/admin/requests" className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
              Process Requisitions
            </Link>
          </div>

          {/* Inventory Distribution & Categories Breakdown */}
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <h2 className="card-title">Inventory Allocation Distribution</h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Total Asset Count: <strong>{total}</strong>
              </span>
            </div>

            <div
              style={{
                height: '14px',
                borderRadius: '9999px',
                overflow: 'hidden',
                display: 'flex',
                backgroundColor: '#e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ width: `${getPercent(available)}%`, backgroundColor: '#059669' }} title={`Available: ${available}`} />
              <div style={{ width: `${getPercent(assigned)}%`, backgroundColor: '#2563eb' }} title={`Assigned: ${assigned}`} />
              <div style={{ width: `${getPercent(damaged)}%`, backgroundColor: '#dc2626' }} title={`Damaged: ${damaged}`} />
              <div style={{ width: `${getPercent(lost)}%`, backgroundColor: '#d97706' }} title={`Lost: ${lost}`} />
              <div style={{ width: `${getPercent(maintenance)}%`, backgroundColor: '#7c3aed' }} title={`Maintenance: ${maintenance}`} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#059669' }} />
                <span>Available ({available})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2563eb' }} />
                <span>Assigned ({assigned})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#dc2626' }} />
                <span>Damaged ({damaged})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#d97706' }} />
                <span>Lost ({lost})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#7c3aed' }} />
                <span>Under Maintenance ({maintenance})</span>
              </div>
            </div>
          </div>

          {/* Recent Inventory Snapshot Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Live Inventory Status ({recentAssets.length})</h2>
              <Link to="/admin/assets" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#2563eb', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Manage Full Inventory</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Asset Code</th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.map((asset) => (
                    <tr key={asset._id}>
                      <td>
                        <span className="code-badge">{asset.assetCode}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{asset.assetName}</td>
                      <td>{asset.category}</td>
                      <td>{asset.hostelBlock} • Rm {asset.roomNumber}</td>
                      <td>{asset.condition}</td>
                      <td>
                        <StatusBadge status={asset.status} />
                      </td>
                      <td>
                        {asset.assignedTo ? (
                          <span style={{ color: '#2563eb', fontWeight: 600 }}>
                            {asset.assignedTo.name}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {asset.status === 'Assigned' ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setReturnAssetId(asset._id);
                              setIsReturnModalOpen(true);
                            }}
                            title="Receive return into store"
                          >
                            <RotateCcw size={13} />
                            <span>Check-In Return</span>
                          </button>
                        ) : (
                          <Link to="/admin/assets" className="btn btn-secondary btn-sm">
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 👨‍💼 ADMIN 2: USER & MAINTENANCE WORKSPACE                                */}
      {/* ========================================================================= */}
      {activeMode === 'admin2' && (
        <>
          <div className="page-header" style={{ marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="code-badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 700 }}>
                  ROLE: ADMIN 2
                </span>
                <h1 className="page-title" style={{ margin: 0 }}>User & Maintenance Administration</h1>
              </div>
              <p className="page-subtitle">
                Manage residents, technician staff, dispatch repair work orders, review damage reports & approve completions
              </p>
            </div>

            {/* Admin 2 Quick Actions */}
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link to="/admin/users" className="btn btn-primary" id="btn-admin2-manage-users">
                <Users size={16} />
                <span>Manage Users & Technicians</span>
              </Link>
              <Link to="/admin/damage-reports" className="btn btn-secondary" id="btn-admin2-damage-reports">
                <AlertTriangle size={16} />
                <span>Review Damage Reports ({damaged})</span>
              </Link>
              <Link to="/technician/tasks" className="btn btn-secondary" id="btn-admin2-all-tasks">
                <Wrench size={16} />
                <span>Monitor All Work Orders</span>
              </Link>
            </div>
          </div>

          {/* Admin 2 Metric Cards */}
          <div className="stat-grid">
            <StatCard
              title="Hostel Residents"
              value={totalResidents}
              icon={Users}
              color="blue"
              subtext="Enrolled students"
              id="stat-admin2-residents"
            />
            <StatCard
              title="Technicians & Staff"
              value={totalTechs}
              icon={UserCheck}
              color="indigo"
              subtext="Depot repair personnel"
              id="stat-admin2-techs"
            />
            <StatCard
              title="Total Work Orders"
              value={totalTasks}
              icon={Wrench}
              color="purple"
              subtext="Logged in system"
              id="stat-admin2-tasks"
            />
            <StatCard
              title="Pending Work Orders"
              value={pendingTasks}
              icon={Clock}
              color="amber"
              subtext="Need technician dispatch"
              id="stat-admin2-pending"
            />
            <StatCard
              title="In-Progress Repairs"
              value={inProgressTasks}
              icon={Play}
              color="blue"
              subtext="Active technician work"
              id="stat-admin2-progress"
            />
            <StatCard
              title="Completed Sign-Offs"
              value={completedTasks}
              icon={CheckCircle}
              color="green"
              subtext="Restored assets"
              id="stat-admin2-completed"
            />
            <StatCard
              title="Damage Reports"
              value={damaged}
              icon={AlertOctagon}
              color="red"
              subtext="Awaiting warden review"
              id="stat-admin2-damage"
            />
          </div>

          {/* Hostel Blocks & Rooms Summary */}
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={18} color="var(--primary)" />
                <h2 className="card-title">Hostel Blocks & Room Information</h2>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                4 Residence Blocks Active
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                { block: 'Block A', rooms: '32 Rooms', occupancy: '64 Students', status: 'Optimal' },
                { block: 'Block B', rooms: '28 Rooms', occupancy: '56 Students', status: 'Optimal' },
                { block: 'Block C', rooms: '30 Rooms', occupancy: '60 Students', status: 'Optimal' },
                { block: 'Block D', rooms: '24 Rooms', occupancy: '48 Students', status: 'Maintenance' },
              ].map((b) => (
                <div key={b.block} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <strong>{b.block}</strong>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: b.status === 'Optimal' ? '#059669' : '#d97706' }}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Capacity: {b.rooms}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Occupancy: {b.occupancy}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Maintenance Work Orders & Technician Dispatch */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={18} color="#059669" />
                <h2 className="card-title">Maintenance Work Orders & Dispatch ({maintenanceTasks.length})</h2>
              </div>
              <Link to="/technician/tasks" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>View All Maintenance Tasks</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Task Code</th>
                    <th>Work Order Title</th>
                    <th>Category</th>
                    <th>Room Location</th>
                    <th>Priority</th>
                    <th>Repair Status</th>
                    <th>Assigned Technician</th>
                    <th style={{ textAlign: 'right' }}>Admin 2 Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceTasks.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No maintenance work orders pending.
                      </td>
                    </tr>
                  ) : (
                    maintenanceTasks.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <span className="code-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                            {t.taskCode}
                          </span>
                        </td>
                        <td>
                          <strong>{t.title}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {t.issueDescription?.slice(0, 50)}...
                          </div>
                        </td>
                        <td>{t.category}</td>
                        <td>{t.hostelBlock} • Rm {t.roomNumber}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: t.priority === 'Emergency' ? '#fee2e2' : t.priority === 'High' ? '#ffedd5' : '#f1f5f9',
                              color: t.priority === 'Emergency' ? '#b91c1c' : t.priority === 'High' ? '#c2410c' : '#475569',
                            }}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={t.status} />
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>
                            {t.assignedName || 'Unassigned'}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            {t.status === 'Pending' && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => openAssignModal(t)}
                                title="Assign to technician"
                                id={`btn-assign-${t.taskCode}`}
                              >
                                <Send size={13} />
                                <span>Assign Tech</span>
                              </button>
                            )}
                            {t.status !== 'Completed' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => openApproveModal(t)}
                                title="Approve maintenance completion"
                                id={`btn-approve-${t.taskCode}`}
                              >
                                <CheckCircle size={13} color="#059669" />
                                <span>Approve Sign-off</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                   */}
      {/* ========================================================================= */}

      {/* Admin 1: Modal for Receiving Returned Asset */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Admin 1: Receive Returned Asset into Central Store"
      >
        <form onSubmit={handleReceiveReturnSubmit}>
          <div className="form-group">
            <label className="form-label">Select Assigned Asset to Check-In *</label>
            <select
              className="form-control"
              value={returnAssetId}
              onChange={(e) => setReturnAssetId(e.target.value)}
              required
            >
              <option value="">-- Choose Assigned Room Asset --</option>
              {recentAssets
                .filter((a) => a.status === 'Assigned')
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    [{a.assetCode}] {a.assetName} • {a.hostelBlock} Rm {a.roomNumber} ({a.assignedTo?.name || 'Resident'})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Received Physical Condition *</label>
            <select
              className="form-control"
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              required
            >
              <option value="Good">Good (Ready for re-allocation)</option>
              <option value="Fair">Fair (Usable)</option>
              <option value="Poor">Poor (Minor scratches)</option>
              <option value="Damaged">Damaged (Send to maintenance)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Warden Storage Remarks</label>
            <input
              type="text"
              className="form-control"
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </button>
            <button id="btn-confirm-return-checkin" type="submit" className="btn btn-primary" disabled={!returnAssetId}>
              Confirm Return & Make Available
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin 2: Modal for Assigning Task to Technician */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Admin 2: Assign Task [${selectedTaskToAssign?.taskCode}] to Technician`}
      >
        <form onSubmit={handleAssignSubmit}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div><strong>Task:</strong> {selectedTaskToAssign?.title}</div>
            <div style={{ color: '#64748b', marginTop: '0.2rem' }}>
              Location: {selectedTaskToAssign?.hostelBlock} • Room {selectedTaskToAssign?.roomNumber}
            </div>
            <div style={{ marginTop: '0.35rem', color: '#334155' }}>
              Issue: {selectedTaskToAssign?.issueDescription}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Technician / Staff Member *</label>
            <select
              id="select-assign-technician"
              className="form-control"
              value={selectedTechId}
              onChange={(e) => setSelectedTechId(e.target.value)}
              required
            >
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email}) • {t.phone || 'Technician Depot'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Work Order Priority *</label>
              <select
                className="form-control"
                value={assignPriority}
                onChange={(e) => setAssignPriority(e.target.value)}
              >
                <option value="Emergency">Emergency (Immediate)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Dispatch Notes</label>
              <input
                type="text"
                className="form-control"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </button>
            <button id="btn-confirm-assign-tech" type="submit" className="btn btn-primary">
              Dispatch to Technician
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin 2: Modal for Approving Maintenance Completion */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={`Admin 2: Sign-Off & Approve Completion [${selectedTaskToApprove?.taskCode}]`}
      >
        <form onSubmit={handleApproveSubmit}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div><strong>Task Code:</strong> {selectedTaskToApprove?.taskCode}</div>
            <div><strong>Item:</strong> {selectedTaskToApprove?.title}</div>
            <div style={{ marginTop: '0.35rem', color: '#059669', fontWeight: 600 }}>
              Technician Remarks: "{selectedTaskToApprove?.remarks || 'Repaired'}"
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Admin Sign-Off Remarks *</label>
            <input
              id="input-approve-signoff"
              type="text"
              className="form-control"
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </button>
            <button id="btn-confirm-approve-completion" type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>
              Approve Sign-off & Restore Asset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
