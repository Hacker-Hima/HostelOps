import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, HelpCircle, AlertCircle, CheckCircle, Plus } from 'lucide-react';

const ReportIssue = () => {
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    assetId: '',
    reportType: 'Damaged',
    severity: 'Moderate',
    description: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsRes, reportsRes] = await Promise.all([
        api.get('/assets/my-assets'),
        api.get('/damage/my'),
      ]);

      if (assetsRes.data.success) {
        setAssignedAssets(assetsRes.data.assets);
        if (assetsRes.data.assets.length > 0 && !formData.assetId) {
          setFormData((prev) => ({ ...prev, assetId: assetsRes.data.assets[0]._id }));
        }
      }
      if (reportsRes.data.success) {
        setReports(reportsRes.data.reports);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId) {
      setMessage({ text: 'Please select an asset to report', type: 'danger' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/damage', formData);
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setFormData({
          assetId: assignedAssets[0]?._id || '',
          reportType: 'Damaged',
          severity: 'Moderate',
          description: '',
        });
        fetchData();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error reporting issue',
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
          <h1 className="page-title">Report Damaged or Lost Asset</h1>
          <p className="page-subtitle">
            Notify hostel administration of broken furniture, electrical faults, or missing equipment
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

      {/* Report Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h2 className="card-title">File an Incident Report</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Select Equipment / Asset *</label>
              {assignedAssets.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#dc2626', padding: '0.5rem 0' }}>
                  No assets assigned to your account. Please request an asset first or contact Warden.
                </p>
              ) : (
                <select
                  id="select-report-asset"
                  className="form-control"
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  required
                >
                  {assignedAssets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      [{asset.assetCode}] {asset.assetName} ({asset.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Incident Classification *</label>
              <select
                id="select-report-type"
                className="form-control"
                value={formData.reportType}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
              >
                <option value="Damaged">Damaged / Malfunctioning</option>
                <option value="Lost">Lost / Missing</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Severity Level *</label>
              <select
                id="select-report-severity"
                className="form-control"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="Minor">Minor (Scratched, cosmetic)</option>
                <option value="Moderate">Moderate (Partially working)</option>
                <option value="Severe">Severe (Not working, electrical hazard)</option>
                <option value="Total Loss">Total Loss (Broken beyond repair)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Incident Description & Location Details *</label>
            <textarea
              id="textarea-report-description"
              className="form-control"
              rows="3"
              placeholder="Describe when the issue was observed, exact condition, and any safety concerns..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <button
            id="btn-submit-incident"
            type="submit"
            className="btn btn-danger"
            disabled={submitting || assignedAssets.length === 0}
          >
            <AlertTriangle size={16} />
            <span>{submitting ? 'Submitting Incident...' : 'Submit Incident Report'}</span>
          </button>
        </form>
      </div>

      {/* Reported Incidents Log */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">My Incident Log ({reports.length})</h2>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Investigation Status</th>
                <th>Warden Remarks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No damage or loss incidents reported.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${r.reportType === 'Lost' ? 'badge-lost' : 'badge-damaged'}`}>
                        {r.reportType}
                      </span>
                    </td>
                    <td>
                      <span className="code-badge">{r.asset?.assetCode}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.asset?.assetName}</td>
                    <td>
                      <strong style={{ fontSize: '0.75rem', color: r.severity === 'Severe' ? '#dc2626' : '#d97706' }}>
                        {r.severity}
                      </strong>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>{r.description}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '200px' }}>
                      {r.adminRemarks || '-'}
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

export default ReportIssue;
