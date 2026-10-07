import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { Layers, AlertTriangle, HelpCircle, Calendar, MapPin, Tag, RotateCcw, CheckCircle } from 'lucide-react';

const MyAssets = () => {
  const { t } = useLanguage();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Damage/Lost Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState('Damaged');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Moderate');
  
  // Return/Handover Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('End of Semester / Vacation Handover');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assets/my-assets');
      if (res.data.success) {
        setAssets(res.data.assets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const openReport = (asset, type = 'Damaged') => {
    setSelectedAsset(asset);
    setReportType(type);
    setDescription('');
    setSeverity('Moderate');
    setIsModalOpen(true);
  };

  const openReturn = (asset) => {
    setSelectedAsset(asset);
    setReturnReason('End of Semester / Vacation Handover');
    setReturnCondition(asset.condition || 'Good');
    setReturnRemarks('');
    setIsReturnModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/damage', {
        assetId: selectedAsset._id,
        reportType,
        description,
        severity,
      });

      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setIsModalOpen(false);
        fetchMyAssets();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to submit report',
        type: 'danger',
      });
    }
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
        setMessage({ text: res.data.message, type: 'success' });
        setIsReturnModalOpen(false);
        fetchMyAssets();
      }
    } catch (err) {
      setMessage({
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
          <h1 className="page-title">My Assigned Room Assets</h1>
          <p className="page-subtitle">
            All hostel furniture, electronics, and inventory items currently assigned to your room
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading your assets...
        </p>
      ) : assets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Layers size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Assets Assigned Yet</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            You do not currently have any equipment assigned to your room.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {assets.map((asset) => (
            <div className="card" key={asset._id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="code-badge">{asset.assetCode}</span>
                <StatusBadge status={asset.status} />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                {asset.assetName}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', flex: 1 }}>
                {asset.description || 'Standard hostel furniture equipment.'}
              </p>

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
                  <Tag size={14} />
                  <span>Category: <strong>{asset.category}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                  <MapPin size={14} />
                  <span>Location: <strong>{asset.hostelBlock} • Rm {asset.roomNumber}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                  <Calendar size={14} />
                  <span>Condition: <strong>{asset.condition}</strong></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: 'auto' }}>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => openReport(asset, 'Damaged')}
                >
                  <AlertTriangle size={14} />
                  <span>{t('reportDamage')}</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openReport(asset, 'Lost')}
                >
                  <HelpCircle size={14} />
                  <span>{t('reportLost')}</span>
                </button>
              </div>

              <button
                className="btn btn-outline-primary btn-sm"
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600 }}
                onClick={() => openReturn(asset)}
                id={`btn-return-${asset.assetCode}`}
              >
                <RotateCcw size={14} />
                <span>{t('returnAsset')}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Damage / Lost Report */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Report Problem: ${selectedAsset?.assetName}`}
      >
        <form onSubmit={handleReportSubmit}>
          <div className="form-group">
            <label className="form-label">{t('incidentType')}</label>
            <select
              className="form-control"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="Damaged">Damaged / Malfunctioning</option>
              <option value="Lost">Lost / Missing</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('severity')}</label>
            <select
              className="form-control"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="Minor">Minor</option>
              <option value="Moderate">Moderate</option>
              <option value="Severe">Severe</option>
              <option value="Total Loss">Total Loss</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('description')} *</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Provide specific details about damage or incident..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              {t('cancel')}
            </button>
            <button id="btn-submit-myasset-report" type="submit" className="btn btn-danger">
              {t('submitReport')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal for Return / Handover Asset */}
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
              <span style={{ color: '#64748b' }}>Assigned Room:</span>
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
              <option value="Damaged">Damaged (Requires warden maintenance inspection)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Handover Remarks / Notes (Optional)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Left neatly on desk for warden physical sign-off..."
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsReturnModalOpen(false)}>
              {t('cancel')}
            </button>
            <button
              id="btn-confirm-asset-return"
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

export default MyAssets;
