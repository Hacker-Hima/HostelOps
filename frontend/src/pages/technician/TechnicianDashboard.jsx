import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Search,
  PlusCircle,
  Camera,
  Play,
  RotateCcw,
} from 'lucide-react';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Quick Complete Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [repairDetails, setRepairDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [condition, setCondition] = useState('Good');
  const [completing, setCompleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, tasksRes] = await Promise.all([
        api.get('/maintenance/stats'),
        api.get('/maintenance/tasks?limit=6'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartWork = async (taskId) => {
    try {
      const res = await api.put(`/maintenance/tasks/${taskId}/status`, {
        status: 'In Progress',
        remarks: 'Technician commenced physical inspection & repair work',
      });
      if (res.data.success) {
        setMessage({ text: 'Repair work commenced!', type: 'success' });
        fetchData();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating status',
        type: 'danger',
      });
    }
  };

  const openCompleteModal = (task) => {
    setSelectedTask(task);
    setRepairDetails(
      task.category === 'Fan'
        ? 'Replaced capacitor and oiled motor bearings. Tested all 5 speeds.'
        : task.category === 'Light'
        ? 'Replaced LED driver and ballast.'
        : 'Tightened joint bolts, replaced damaged hardware.'
    );
    setRemarks(
      task.category === 'Fan' ? 'Fan capacitor replaced' : 'Component repaired & tested'
    );
    setCondition('Good');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setCompleting(true);
      const res = await api.put(`/maintenance/tasks/${selectedTask._id}/complete`, {
        repairDetails,
        remarks,
        condition,
        completionDate: new Date().toISOString().split('T')[0],
      });

      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setIsCompleteModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error completing task',
        type: 'danger',
      });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Technician Maintenance Operations</h1>
          <p className="page-subtitle">
            Welcome, <strong>{user?.name}</strong> • Physical repair management, inspection & asset restoration
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/technician/report-damage" className="btn btn-danger" id="btn-tech-report-shortcut">
            <Camera size={16} />
            <span>Report Damage</span>
          </Link>
          <Link to="/technician/inspect" className="btn btn-secondary" id="btn-tech-inspect-shortcut">
            <Search size={16} />
            <span>Inspect Asset</span>
          </Link>
          <Link to="/technician/tasks" className="btn btn-primary" id="btn-tech-tasks-shortcut">
            <Wrench size={16} />
            <span>All Tasks</span>
          </Link>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* 5 Technician Metric Cards */}
      <div className="stat-grid">
        <StatCard
          title="Total Work Orders"
          value={stats?.totalTasks ?? 0}
          icon={Wrench}
          color="blue"
          subtext="Logged in system"
          id="stat-tech-total"
        />
        <StatCard
          title="Pending Work"
          value={stats?.pendingTasks ?? 0}
          icon={Clock}
          color="amber"
          subtext="Awaiting service"
          id="stat-tech-pending"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressTasks ?? 0}
          icon={Play}
          color="purple"
          subtext="Active repairs"
          id="stat-tech-progress"
        />
        <StatCard
          title="Completed Repairs"
          value={stats?.completedTasks ?? 0}
          icon={CheckCircle}
          color="green"
          subtext="Restored assets"
          id="stat-tech-completed"
        />
        <StatCard
          title="Under Maintenance"
          value={stats?.underMaintenanceAssets ?? 0}
          icon={AlertTriangle}
          color="red"
          subtext="Hostel assets"
          id="stat-tech-maintenance"
        />
      </div>

      {/* Active Work Tasks Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Wrench size={20} color="var(--primary)" />
            <h2 className="card-title">Active Maintenance Work Tasks ({tasks.length})</h2>
          </div>
          <Link
            to="/technician/tasks"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#2563eb',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <span>Manage All Tasks</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Loading maintenance tasks...
          </p>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem' }}>
            <CheckCircle size={36} color="#059669" style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: '#64748b' }}>All maintenance jobs are up to date! No pending work orders.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task Code</th>
                  <th>Asset Item</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Repair Status</th>
                  <th>Issue Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <span className="code-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                        {task.taskCode}
                      </span>
                    </td>
                    <td>
                      <strong>{task.asset?.assetName || task.title}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Code: {task.asset?.assetCode}
                      </div>
                    </td>
                    <td>{task.category}</td>
                    <td>
                      {task.hostelBlock} • Rm {task.roomNumber}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor:
                            task.priority === 'Emergency'
                              ? '#fee2e2'
                              : task.priority === 'High'
                              ? '#ffedd5'
                              : '#f1f5f9',
                          color:
                            task.priority === 'Emergency'
                              ? '#b91c1c'
                              : task.priority === 'High'
                              ? '#c2410c'
                              : '#475569',
                        }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>
                      {task.issueDescription}
                      {task.remarks && (
                        <div style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.2rem' }}>
                          <em>Note: {task.remarks}</em>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {task.status === 'Pending' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStartWork(task._id)}
                            title="Commence Repair"
                            id={`btn-start-${task.taskCode}`}
                          >
                            <Play size={13} />
                            <span>Start Work</span>
                          </button>
                        )}
                        {task.status !== 'Completed' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openCompleteModal(task)}
                            title="Complete Maintenance"
                            id={`btn-complete-${task.taskCode}`}
                          >
                            <CheckCircle size={13} />
                            <span>Complete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Completing Maintenance */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Maintenance: [${selectedTask?.taskCode}] ${selectedTask?.title}`}
      >
        <form onSubmit={handleCompleteSubmit}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Asset:</span>
              <strong>[{selectedTask?.asset?.assetCode}] {selectedTask?.asset?.assetName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Location:</span>
              <strong>{selectedTask?.hostelBlock} • Room {selectedTask?.roomNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Original Issue:</span>
              <span>{selectedTask?.issueDescription}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Repair Work Details *</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Fan capacitor replaced, motor greased and test run completed..."
              value={repairDetails}
              onChange={(e) => setRepairDetails(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Technician Remarks / Notes *</label>
              <input
                type="text"
                className="form-control"
                placeholder='e.g. "Fan capacitor replaced"'
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Restored Asset Condition *</label>
              <select
                className="form-control"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="Good">Good (Fully functional)</option>
                <option value="Fair">Fair (Usable with minor cosmetic wear)</option>
                <option value="New">New (Replaced unit)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCompleteModalOpen(false)}>
              Cancel
            </button>
            <button
              id="btn-confirm-complete-task"
              type="submit"
              className="btn btn-primary"
              disabled={completing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={15} />
              <span>{completing ? 'Completing...' : 'Sign Off & Complete Maintenance'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TechnicianDashboard;
