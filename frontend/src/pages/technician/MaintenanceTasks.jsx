import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Wrench,
  Search,
  Filter,
  CheckCircle,
  Play,
  Clock,
  AlertTriangle,
  Camera,
  Layers,
  MapPin,
  Tag,
  Calendar,
  FileText,
  RotateCcw,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Fan',
  'Light',
  'Chair',
  'Table',
  'Bed',
  'Electrical Equipment',
  'Cupboard',
  'Computer',
  'Mattress',
  'Other',
];

const MaintenanceTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Update / Repair Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState('In Progress');
  const [assetCondition, setAssetCondition] = useState('Under Maintenance');
  const [remarks, setRemarks] = useState('');
  const [repairDetails, setRepairDetails] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [evidencePhoto, setEvidencePhoto] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/maintenance/tasks', { params });
      if (res.data.success) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const openRepairModal = (task) => {
    setSelectedTask(task);
    setStatus(task.status);
    setAssetCondition(task.assetCondition || 'Under Maintenance');
    setRemarks(task.remarks || '');
    setRepairDetails(task.repairDetails || '');
    setCompletionDate(task.completionDate || new Date().toISOString().split('T')[0]);
    setEvidencePhoto(task.evidencePhoto || '');
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: 'Image size exceeds 2MB limit.', type: 'danger' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEvidencePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setUpdating(true);
      const res = await api.put(`/maintenance/tasks/${selectedTask._id}/status`, {
        status,
        assetCondition,
        remarks,
        repairDetails,
        completionDate: status === 'Completed' ? completionDate : '',
        evidencePhoto,
      });

      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating maintenance task',
        type: 'danger',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Physical Maintenance & Repair Tasks</h1>
          <p className="page-subtitle">
            Manage repair workflows for hostel items (fan, light, chair, table, geyser, bed)
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['All', 'Pending', 'In Progress', 'Completed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                id={`filter-task-${s.toLowerCase().replace(' ', '-')}`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '340px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search task code, asset, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              <Search size={14} />
            </button>
          </form>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Category:</span>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading maintenance tasks...
        </p>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Wrench size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3>No Maintenance Tasks Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            No work orders match the selected filters.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {tasks.map((task) => (
            <div className="card" key={task._id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="code-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                  {task.taskCode}
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <StatusBadge status={task.status} />
                </div>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {task.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem', flex: 1 }}>
                {task.issueDescription}
              </p>

              {/* Asset Meta Info */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                  <Tag size={13} />
                  <span>Item: <strong>[{task.asset?.assetCode}] {task.asset?.assetName}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                  <MapPin size={13} />
                  <span>Location: <strong>{task.hostelBlock} • Rm {task.roomNumber}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                  <Layers size={13} />
                  <span>Asset Condition: <strong>{task.assetCondition}</strong></span>
                </div>
                {task.remarks && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb' }}>
                    <FileText size={13} />
                    <span>Remarks: <strong>{task.remarks}</strong></span>
                  </div>
                )}
                {task.completionDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669' }}>
                    <Calendar size={13} />
                    <span>Completed On: <strong>{task.completionDate}</strong></span>
                  </div>
                )}
              </div>

              {/* Photo Evidence Preview if present */}
              {task.evidencePhoto && (
                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                  <img
                    src={task.evidencePhoto}
                    alt="Damage evidence"
                    style={{ maxHeight: '120px', borderRadius: '6px', border: '1px solid #e2e8f0', objectFit: 'cover', width: '100%' }}
                  />
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600 }}
                onClick={() => openRepairModal(task)}
                id={`btn-manage-${task.taskCode}`}
              >
                <Wrench size={14} />
                <span>Update Status & Repair</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full Repair & Status Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Maintenance Work Order: [${selectedTask?.taskCode}] ${selectedTask?.title}`}
      >
        <form onSubmit={handleUpdateSubmit}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Asset:</span>
              <strong>[{selectedTask?.asset?.assetCode}] {selectedTask?.asset?.assetName} ({selectedTask?.category})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Location:</span>
              <strong>{selectedTask?.hostelBlock} • Room {selectedTask?.roomNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Original Problem:</span>
              <span>{selectedTask?.issueDescription}</span>
            </div>
          </div>

          <div className="form-row">
            {/* Update Repair Status: Pending -> In Progress -> Completed */}
            <div className="form-group">
              <label className="form-label">Repair Status *</label>
              <select
                id="select-task-status"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="Pending">Pending (Not Started)</option>
                <option value="In Progress">In Progress (Work Underway)</option>
                <option value="Completed">Completed (Maintenance Finished)</option>
                <option value="On Hold">On Hold (Awaiting Parts)</option>
              </select>
            </div>

            {/* Update Asset Condition: Good / Damaged / Under Maintenance */}
            <div className="form-group">
              <label className="form-label">Asset Condition *</label>
              <select
                id="select-asset-condition"
                className="form-control"
                value={assetCondition}
                onChange={(e) => setAssetCondition(e.target.value)}
                required
              >
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Good">Good (Working & restored)</option>
                <option value="Damaged">Damaged (Defect unresolved)</option>
                <option value="Fair">Fair (Usable with cosmetic wear)</option>
                <option value="Poor">Poor (Degraded performance)</option>
                <option value="Critical">Critical (Severe defect)</option>
              </select>
            </div>
          </div>

          {/* Remarks (Notes such as "Fan capacitor replaced") */}
          <div className="form-group">
            <label className="form-label">Technician Remarks / Quick Note *</label>
            <input
              id="input-task-remarks"
              type="text"
              className="form-control"
              placeholder='e.g. "Fan capacitor replaced", "Bearing oiled", "Table leg screwed tight"'
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
            />
          </div>

          {/* Repair Details */}
          <div className="form-group">
            <label className="form-label">Comprehensive Repair Details</label>
            <textarea
              id="textarea-repair-details"
              className="form-control"
              rows="3"
              placeholder="Detail parts replaced, electrical tests conducted, physical adjustments made..."
              value={repairDetails}
              onChange={(e) => setRepairDetails(e.target.value)}
            />
          </div>

          {/* Completion Date (if marked completed) */}
          {status === 'Completed' && (
            <div className="form-group">
              <label className="form-label">Completion Date *</label>
              <input
                id="input-completion-date"
                type="date"
                className="form-control"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                required
              />
            </div>
          )}

          {/* Upload Photo Evidence */}
          <div className="form-group">
            <label className="form-label">Attach / Update Photo Evidence (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={14} />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {evidencePhoto && (
                <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>
                  ✓ Photo attached ({Math.round(evidencePhoto.length / 1024)} KB)
                </span>
              )}
            </div>
            {evidencePhoto && (
              <div style={{ marginTop: '0.5rem' }}>
                <img
                  src={evidencePhoto}
                  alt="Preview"
                  style={{ maxHeight: '100px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                />
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button
              id="btn-save-task-update"
              type="submit"
              className="btn btn-primary"
              disabled={updating}
            >
              {updating ? 'Saving Work Order...' : 'Save & Update Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceTasks;
