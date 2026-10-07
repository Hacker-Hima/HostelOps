import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Layers,
  FileQuestion,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  PlusCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  RotateCcw,
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [assignedAssets, setAssignedAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick report damage modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [reportType, setReportType] = useState('Damaged');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Moderate');
  const [reportMessage, setReportMessage] = useState({ text: '', type: '' });

  // Return handover modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('End of Semester / Vacation Handover');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [statsRes, assetsRes] = await Promise.all([
        api.get('/assets/stats/overview'),
        api.get('/assets/my-assets'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats?.studentStats);
      }
      if (assetsRes.data.success) {
        setAssignedAssets(assetsRes.data.assets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const openReportModal = (asset, type = 'Damaged') => {
    setSelectedAsset(asset);
    setReportType(type);
    setDescription('');
    setSeverity('Moderate');
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/damage', {
        assetId: selectedAsset._id,
        reportType,
        description,
        severity,
      });

      if (res.data.success) {
        setReportMessage({ text: res.data.message, type: 'success' });
        setIsReportModalOpen(false);
        fetchUserData();
      }
    } catch (err) {
      setReportMessage({
        text: err.response?.data?.message || 'Failed to submit report',
        type: 'danger',
      });
    }
  };

  const openReturnModal = (asset) => {
    setSelectedAsset(asset);
    setReturnReason('End of Semester / Vacation Handover');
    setReturnCondition(asset.condition || 'Good');
    setReturnRemarks('');
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReturn(true);
      const res = await api.put(`/assets/${selectedAsset._id}/return`, {
        returnReason,
        condition: returnCondition,
        remarks: returnRemarks,
      });

      if (res.data.success) {
        setReportMessage({ text: res.data.message, type: 'success' });
        setIsReturnModalOpen(false);
        fetchUserData();
      }
    } catch (err) {
      setReportMessage({
        text: err.response?.data?.message || 'Failed to return asset',
        type: 'danger',
      });
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('welcome')}, {user?.name}</h1>
          <p className="page-subtitle">
            {t('hostelBlock')}: <strong>{user?.hostelBlock}</strong> • {t('roomNumber')}: <strong>{user?.roomNumber}</strong> ({t('rollNumber')}: {user?.studentId || 'N/A'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/request-asset" className="btn btn-primary" id="btn-user-request-shortcut">
            <PlusCircle size={16} />
            <span>{t('requestAssetBtn')}</span>
          </Link>
          <Link to="/report-issue" className="btn btn-secondary" id="btn-user-report-shortcut">
            <AlertTriangle size={16} />
            <span>{t('reportIssueBtn')}</span>
          </Link>
        </div>
      </div>

      {reportMessage.text && (
        <div className={`alert alert-${reportMessage.type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{reportMessage.text}</span>
          <button onClick={() => setReportMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Student 5 Required Stats Grid */}
      <div className="stat-grid">
        <StatCard
          title={t('assignedAssets')}
          value={stats?.myAssignedCount ?? assignedAssets.length}
          icon={Layers}
          color="blue"
          subtext={t('inRoomPossession')}
          id="stat-user-assigned"
        />
        <StatCard
          title={t('pendingRequests')}
          value={stats?.myPendingRequests ?? 0}
          icon={FileQuestion}
          color="amber"
          subtext={t('awaitingApproval')}
          id="stat-user-pending"
        />
        <StatCard
          title={t('approvedRequests')}
          value={stats?.myApprovedRequests ?? 0}
          icon={CheckCircle}
          color="green"
          subtext={t('processed')}
          id="stat-user-approved"
        />
        <StatCard
          title={t('damageReports')}
          value={stats?.myDamageReports ?? 0}
          icon={AlertTriangle}
          color="red"
          subtext={t('defectsReported')}
          id="stat-user-damage"
        />
        <StatCard
          title={t('lostReports')}
          value={stats?.myLostReports ?? 0}
          icon={HelpCircle}
          color="purple"
          subtext={t('missingProperty')}
          id="stat-user-lost"
        />
      </div>

      {/* Currently Assigned Assets in Cards / Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('myRoomAssets')} ({assignedAssets.length})</h2>
          <Link
            to="/my-assets"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#2563eb',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <span>{t('viewAllAssets')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            {t('loading')}
          </p>
        ) : assignedAssets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <Layers size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              No assets currently assigned to your room.
            </p>
            <Link to="/request-asset" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              {t('requestAssetBtn')}
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{t('assetCode')}</th>
                  <th>{t('assetName')}</th>
                  <th>{t('category')}</th>
                  <th>{t('roomLocation')}</th>
                  <th>{t('condition')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {assignedAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td>
                      <span className="code-badge">{asset.assetCode}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{asset.assetName}</td>
                    <td>{asset.category}</td>
                    <td>{asset.hostelBlock} • {asset.roomNumber}</td>
                    <td>{asset.condition}</td>
                    <td>
                      <StatusBadge status={asset.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => openReportModal(asset, 'Damaged')}
                          title="Report damaged"
                        >
                          <AlertTriangle size={14} />
                          <span>{t('reportDamage')}</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openReportModal(asset, 'Lost')}
                          title="Report lost"
                        >
                          <HelpCircle size={14} />
                          <span>{t('reportLost')}</span>
                        </button>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => openReturnModal(asset)}
                          title={t('returnAsset')}
                          id={`btn-return-dashboard-${asset.assetCode}`}
                        >
                          <RotateCcw size={14} />
                          <span>{t('handoverAsset')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Report Issue Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={`Report Issue: [${selectedAsset?.assetCode}] ${selectedAsset?.assetName}`}
      >
        <form onSubmit={handleSubmitReport}>
          <div className="form-group">
            <label className="form-label">Incident Type</label>
            <select
              className="form-control"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="Damaged">Damaged / Broken / Defective</option>
              <option value="Lost">Lost / Missing</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Severity Level</label>
            <select
              className="form-control"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="Minor">Minor (Cosmetic defect, usable)</option>
              <option value="Moderate">Moderate (Partially functional)</option>
              <option value="Severe">Severe (Non-functional, hazardous)</option>
              <option value="Total Loss">Total Loss / Completely Missing</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description of Problem *</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Explain how it occurred or current condition..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)}>
              {t('cancel')}
            </button>
            <button id="btn-submit-user-damage-report" type="submit" className="btn btn-danger">
              {t('submitReport')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return / Handover Asset Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title={`${t('returnModalTitle')}: [${selectedAsset?.assetCode}] ${selectedAsset?.assetName}`}
      >
        <form onSubmit={handleReturnSubmit}>
          <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Item Code:</span>
              <strong>{selectedAsset?.assetCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ color: '#64748b' }}>Item Name:</span>
              <strong>{selectedAsset?.assetName} ({selectedAsset?.category})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Room:</span>
              <strong>{selectedAsset?.hostelBlock} • Room {selectedAsset?.roomNumber}</strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('returnReason')} *</label>
            <select
              className="form-control"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              required
            >
              <option value="End of Semester / Vacation Handover">End of Semester / Vacation Handover</option>
              <option value="Leaving Room / Hostel Vacation">Leaving Room / Hostel Vacation</option>
              <option value="Room Relocation Handover">Room Relocation Handover</option>
              <option value="Surplus / No Longer Needed">Surplus / No Longer Needed</option>
              <option value="Graduation / Final Clearance">Graduation / Final Clearance</option>
              <option value="Defective / Replacement Return">Defective / Replacement Return</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('handoverCondition')} *</label>
            <select
              className="form-control"
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              required
            >
              <option value="Good">Good (Working, clean condition)</option>
              <option value="Fair">Fair (Normal wear, usable)</option>
              <option value="Poor">Poor (Minor wear / scratches)</option>
              <option value="Damaged">Damaged (Requires maintenance)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Handover Remarks / Notes (Optional)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Returned to hostel store room upon vacating room..."
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsReturnModalOpen(false)}>
              {t('cancel')}
            </button>
            <button
              id="btn-confirm-dashboard-return"
              type="submit"
              className="btn btn-primary"
              disabled={submittingReturn}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={15} />
              <span>{submittingReturn ? 'Processing...' : t('confirmReturn')}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserDashboard;
