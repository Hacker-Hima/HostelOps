import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Package,
  Search,
  FileQuestion,
  RefreshCw,
  Download,
} from 'lucide-react';
import { exportToCSV } from '../../utils/exportCSV';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Pagination state (Backend Pagination)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('Approved'); // 'Approved' | 'Rejected'
  const [adminRemarks, setAdminRemarks] = useState('');
  const [allocatedAssetId, setAllocatedAssetId] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/requests', { params });
      if (res.data.success) {
        setRequests(res.data.requests || res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
        setPage(res.data.currentPage || 1);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load requests from server', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const res = await api.get('/assets?status=Available&limit=100');
      if (res.data.success) {
        setAvailableAssets(res.data.assets || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, limit, statusFilter]);

  useEffect(() => {
    fetchAvailableAssets();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const openDecisionModal = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
    setAdminRemarks(
      type === 'Approved'
        ? 'Approved by Warden. Asset allocated from inventory store.'
        : 'Request cannot be fulfilled due to inventory limitations.'
    );
    // Find matching available asset by category if any
    const matching = availableAssets.find((a) => a.category === req.category);
    setAllocatedAssetId(matching ? matching._id : availableAssets[0]?._id || '');
    setIsActionModalOpen(true);
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: actionType,
        adminRemarks,
        allocatedAssetId: actionType === 'Approved' ? allocatedAssetId : null,
      };

      const res = await api.put(`/requests/${selectedRequest._id}`, payload);
      if (res.data.success) {
        setMessage({
          text: `Request status updated to ${actionType}`,
          type: 'success',
        });
        setIsActionModalOpen(false);
        setSelectedRequest(null);
        fetchRequests();
        fetchAvailableAssets();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to update request',
        type: 'danger',
      });
    }
  };

  const handleExportRequestsCSV = () => {
    const reportData = requests.map((r) => ({
      'Date Requested': new Date(r.createdAt).toLocaleDateString(),
      'Resident Name': r.requestedBy?.name || 'Student',
      'Requested Item': r.assetName,
      Category: r.category,
      Location: `${r.hostelBlock} Rm ${r.roomNumber}`,
      Status: r.status,
      'Allocated Asset Code': r.allocatedAsset?.assetCode || 'Unassigned',
      'Reason / Justification': r.reason,
      'Warden Remarks': r.adminRemarks || '',
    }));
    exportToCSV(reportData, `Hostel_Asset_Requests_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resident Asset Requisitions</h1>
          <p className="page-subtitle">
            Review room equipment requisitions from hostel residents, verify justification, and allocate stock
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportRequestsCSV}
            className="btn btn-secondary btn-sm"
            title="Export requisitions to CSV"
            id="btn-export-requests-csv"
          >
            <Download size={14} />
            <span>Export Requests (CSV)</span>
          </button>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Filter:</span>
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
              >
                {status}
              </button>
            ))}
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
                transform: 'translateY(-50)',
                color: '#94a3b8',
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search by asset requested, room, or reason..."
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
            <FileQuestion size={18} color="#2563eb" />
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
              Requisition Queue ({totalItems} Requests)
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
                <th>STUDENT RESIDENT</th>
                <th>REQUESTED ASSET</th>
                <th>CATEGORY</th>
                <th>LOCATION</th>
                <th>JUSTIFICATION / REASON</th>
                <th>STATUS</th>
                <th>ALLOCATION</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto' }}></div>
                    <span style={{ color: '#64748b' }}>Loading requisitions...</span>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No asset requisitions found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {req.requestedBy?.name || 'Resident'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {req.requestedBy?.studentId || req.requestedBy?.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{req.assetName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {req.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {req.hostelBlock} • Rm {req.roomNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>{req.reason}</span>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      {req.allocatedAsset ? (
                        <div>
                          <code style={{ fontSize: '0.8rem' }}>{req.allocatedAsset.assetCode}</code>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {req.allocatedAsset.assetName}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {req.status === 'Pending' ? (
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            title="Approve and allocate asset"
                            onClick={() => openDecisionModal(req, 'Approved')}
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            title="Reject request"
                            onClick={() => openDecisionModal(req, 'Rejected')}
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Processed</span>
                      )}
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

      {/* Decision Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`${actionType === 'Approved' ? 'Approve' : 'Reject'} Asset Requisition`}
      >
        <form onSubmit={handleSubmitDecision}>
          <div
            style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Student Requisition:</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {selectedRequest?.assetName} ({selectedRequest?.category})
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
              Requested by {selectedRequest?.requestedBy?.name} for {selectedRequest?.hostelBlock} / Room {selectedRequest?.roomNumber}
            </div>
          </div>

          {actionType === 'Approved' && (
            <div className="form-group">
              <label className="form-label">
                Allocate Available Inventory Asset *
              </label>
              <select
                className="form-control"
                value={allocatedAssetId}
                onChange={(e) => setAllocatedAssetId(e.target.value)}
                required
              >
                <option value="">-- Choose Stock Item to Allocate --</option>
                {availableAssets
                  .filter((a) => a.status === 'Available')
                  .map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      [{asset.assetCode}] {asset.assetName} ({asset.category} - Condition: {asset.condition})
                    </option>
                  ))}
              </select>
              {availableAssets.filter((a) => a.status === 'Available').length === 0 && (
                <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  No available items in stock. Please add items to inventory before approving.
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Warden Decision Remarks</label>
            <textarea
              className="form-control"
              rows="3"
              value={adminRemarks}
              onChange={(e) => setAdminRemarks(e.target.value)}
              placeholder="Notes or instructions for resident..."
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsActionModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${actionType === 'Approved' ? 'btn-success' : 'btn-danger'}`}
              disabled={actionType === 'Approved' && !allocatedAssetId}
            >
              Confirm {actionType}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminRequests;
