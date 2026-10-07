import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatusBadge from '../../components/StatusBadge';
import { CheckSquare, PlusCircle, AlertCircle, CheckCircle, Clock, PackageCheck, Tag, MapPin, Sparkles, Filter } from 'lucide-react';

const CATEGORIES = [
  'Bed',
  'Table',
  'Chair',
  'Fan',
  'Light',
  'Computer',
  'Mattress',
  'Cupboard',
  'Electrical Equipment',
  'Other',
];

const RequestAsset = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const formRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    assetName: '',
    category: 'Chair',
    reason: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, availRes] = await Promise.all([
        api.get('/requests/my'),
        api.get('/assets?status=Available&limit=12'),
      ]);

      if (reqRes.data.success) {
        setRequests(reqRes.data.requests);
      }
      if (availRes.data.success) {
        setAvailableAssets(availRes.data.assets || availRes.data.data || []);
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

  const selectAssetToRequest = (asset) => {
    setFormData({
      assetName: asset.assetName,
      category: asset.category,
      reason: `Requisition for room allocation (${asset.assetCode})`,
    });
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/requests', {
        ...formData,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
      });

      if (res.data.success) {
        setMessage({ text: 'Asset request submitted to Warden successfully!', type: 'success' });
        setFormData({ assetName: '', category: 'Chair', reason: '' });
        fetchData();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to submit request',
        type: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Request Hostel Asset</h1>
          <p className="page-subtitle">
            Submit equipment requisition for your assigned hostel room ({user?.hostelBlock} • Rm {user?.roomNumber})
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Section 1: Available Hostel Inventory (Ready for Requisition) */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PackageCheck size={20} color="var(--primary)" />
            <h2 className="card-title">Available Hostel Inventory (Ready for Requisition)</h2>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Browse in-stock Bed, Chair, Table, Fan, etc. and click to request
          </span>
        </div>

        {availableAssets.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
            Standard inventory items are currently in use. You can submit a new equipment request below!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', padding: '0.25rem 0' }}>
            {availableAssets.map((asset) => (
              <div
                key={asset._id}
                style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className="code-badge">{asset.assetCode}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Available
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                    {asset.assetName}
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.75rem' }}>
                    <span>Category: <strong>{asset.category}</strong></span>
                    <span>Condition: <strong>{asset.condition}</strong></span>
                    <span>Block: <strong>{asset.hostelBlock || 'Central'}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontWeight: 600 }}
                  onClick={() => selectAssetToRequest(asset)}
                  id={`btn-request-item-${asset.assetCode}`}
                >
                  <PlusCircle size={14} />
                  <span>Request This Asset</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Requisition Submission Form */}
      <div className="card" style={{ marginBottom: '2rem' }} ref={formRef}>
        <div className="card-header">
          <h2 className="card-title">New Asset Requisition Form</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Asset Name / Type Required *</label>
              <input
                id="req-asset-name"
                type="text"
                className="form-control"
                placeholder="e.g. Ergonomic Study Chair, Wooden Bed Frame, Table Fan..."
                value={formData.assetName}
                onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Equipment Category *</label>
              <select
                id="req-category"
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Request *</label>
            <textarea
              id="req-reason"
              className="form-control"
              rows="3"
              placeholder="State the academic or living necessity for this item in your room..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <button
            id="btn-submit-asset-request"
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            <PlusCircle size={16} />
            <span>{submitting ? 'Submitting Requisition...' : 'Submit Request to Warden'}</span>
          </button>
        </form>
      </div>

      {/* Section 3: View Request Status (Pending, Approved, Rejected) */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 className="card-title">My Requisition History ({requests.length})</h2>
          
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('All')}
              className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              id="filter-req-all"
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`btn btn-sm ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
              style={statusFilter === 'Pending' ? { background: '#ea580c', borderColor: '#ea580c', color: '#fff' } : {}}
              id="filter-req-pending"
            >
              Pending ({requests.filter((r) => r.status === 'Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`btn btn-sm ${statusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
              style={statusFilter === 'Approved' ? { background: '#16a34a', borderColor: '#16a34a', color: '#fff' } : {}}
              id="filter-req-approved"
            >
              Approved ({requests.filter((r) => r.status === 'Approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`btn btn-sm ${statusFilter === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`}
              style={statusFilter === 'Rejected' ? { background: '#dc2626', borderColor: '#dc2626', color: '#fff' } : {}}
              id="filter-req-rejected"
            >
              Rejected ({requests.filter((r) => r.status === 'Rejected').length})
            </button>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Requested Item</th>
                <th>Category</th>
                <th>Reason</th>
                <th>Approval Status</th>
                <th>Allocated Asset</th>
                <th>Warden Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading requisitions...
                  </td>
                </tr>
              ) : requests.filter((r) => statusFilter === 'All' || r.status === statusFilter).length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No {statusFilter === 'All' ? '' : statusFilter.toLowerCase()} asset requisitions found.
                  </td>
                </tr>
              ) : (
                requests
                  .filter((r) => statusFilter === 'All' || r.status === statusFilter)
                  .map((req) => (
                    <tr key={req._id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{req.assetName}</td>
                      <td>{req.category}</td>
                      <td style={{ maxWidth: '260px', fontSize: '0.85rem' }}>{req.reason}</td>
                      <td>
                        <StatusBadge status={req.status} />
                      </td>
                      <td>
                        {req.allocatedAsset ? (
                          <span className="code-badge">{req.allocatedAsset.assetCode}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.825rem', color: '#475569', maxWidth: '200px' }}>
                        {req.adminRemarks || '-'}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RequestAsset;
