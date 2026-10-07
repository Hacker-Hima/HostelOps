import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Wrench,
  Clock,
  Search,
  RefreshCw,
} from 'lucide-react';

const STATUS_OPTIONS = [
  'All',
  'Reported',
  'Under Review',
  'Under Maintenance',
  'Resolved',
  'Rejected',
];

const AdminDamageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Pagination state (Backend Pagination)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('Under Review');
  const [resolveAction, setResolveAction] = useState('keep_status');
  const [adminRemarks, setAdminRemarks] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };
      if (typeFilter !== 'All') params.reportType = typeFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/damage', { params });
      if (res.data.success) {
        setReports(res.data.reports || res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
        setPage(res.data.currentPage || 1);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch incident reports from server', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, limit, typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const openResolutionModal = (report) => {
    setSelectedReport(report);
    setStatusUpdate(report.status);
    setAdminRemarks(report.adminRemarks || '');
    setResolveAction('keep_status');
    setIsModalOpen(true);
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/damage/${selectedReport._id}`, {
        status: statusUpdate,
        adminRemarks,
        resolveAction: resolveAction !== 'keep_status' ? resolveAction : null,
      });

      if (res.data.success) {
        setMessage({ text: 'Damage report updated successfully', type: 'success' });
        setIsModalOpen(false);
        fetchReports();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating report',
        type: 'danger',
      });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Damage & Lost Asset Reports</h1>
          <p className="page-subtitle">
            Track reported equipment defects, lost hostel property, and initiate repair workflows
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Type:</span>
            {['All', 'Damaged', 'Lost'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setTypeFilter(type);
                  setPage(1);
                }}
                className={`btn btn-sm ${typeFilter === type ? 'btn-primary' : 'btn-secondary'}`}
              >
                {type}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
            <select
              className="form-control"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {message.text && (
        <div
          className={`alert alert-${message.type}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '450px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search reports by description or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#dc2626" />
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
              Incident Register ({totalItems} Incidents)
            </strong>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>INCIDENT TYPE</th>
                <th>ASSET INVOLVED</th>
                <th>REPORTED BY</th>
                <th>SEVERITY</th>
                <th>DESCRIPTION OF DAMAGE / LOSS</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto' }}></div>
                    <span style={{ color: '#64748b' }}>Loading incident reports...</span>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No damage or loss incidents match criteria.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep._id}>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: rep.reportType === 'Lost' ? '#fffbeb' : '#fef2f2',
                          color: rep.reportType === 'Lost' ? '#b45309' : '#dc2626',
                        }}
                      >
                        {rep.reportType === 'Lost' ? <HelpCircle size={13} /> : <AlertTriangle size={13} />}
                        <span>{rep.reportType}</span>
                      </span>
                    </td>
                    <td>
                      <div>
                        <code>{rep.asset?.assetCode || 'N/A'}</code>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {rep.asset?.assetName || 'Equipment Item'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {rep.asset?.hostelBlock} • Rm {rep.asset?.roomNumber}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {rep.reportedBy?.name || 'Resident'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {rep.reportedBy?.email}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background:
                            rep.severity === 'Severe' || rep.severity === 'Total Loss'
                              ? '#fee2e2'
                              : rep.severity === 'Moderate'
                              ? '#fef3c7'
                              : '#ecfdf5',
                          color:
                            rep.severity === 'Severe' || rep.severity === 'Total Loss'
                              ? '#b91c1c'
                              : rep.severity === 'Moderate'
                              ? '#b45309'
                              : '#047857',
                        }}
                      >
                        {rep.severity}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontSize: '0.85rem', color: '#334155', maxWidth: '300px' }}>
                        {rep.description}
                      </p>
                      {rep.adminRemarks && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          Remark: {rep.adminRemarks}
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={rep.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openResolutionModal(rep)}
                        style={{ padding: '0.3rem 0.6rem' }}
                      >
                        <Wrench size={14} />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Manage Incident Resolution & Asset State"
      >
        <form onSubmit={handleUpdateReport}>
          <div
            style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Asset:</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              [{selectedReport?.asset?.assetCode}] {selectedReport?.asset?.assetName}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#475569', marginTop: '0.25rem' }}>
              Reported Issue: "{selectedReport?.description}" ({selectedReport?.severity})
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Report Workflow Status</label>
            <select
              className="form-control"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
            >
              <option value="Reported">Reported</option>
              <option value="Under Review">Under Review</option>
              <option value="Under Maintenance">Under Maintenance (Sent to Workshop)</option>
              <option value="Resolved">Resolved (Repaired / Replaced)</option>
              <option value="Rejected">Rejected (Not Eligible)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Synchronize Asset Inventory State</label>
            <select
              className="form-control"
              value={resolveAction}
              onChange={(e) => setResolveAction(e.target.value)}
            >
              <option value="keep_status">Keep Current Asset Status</option>
              <option value="under_maintenance">Set Asset to 'Under Maintenance'</option>
              <option value="mark_available">Mark Asset as 'Available' & Condition 'Good'</option>
            </select>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              Automatically adjusts the asset status in inventory and logs an audit log entry.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Warden Remarks / Resolution Notes</label>
            <textarea
              className="form-control"
              rows="3"
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              placeholder="e.g. Sent for welding; carpenter assigned; resolved on 10 Oct..."
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Resolution
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDamageReports;
