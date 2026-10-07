import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Search,
  CheckCircle,
  AlertCircle,
  Layers,
  MapPin,
  Tag,
  ShieldCheck,
  Calendar,
  Save,
} from 'lucide-react';

const CONDITIONS = ['Good', 'Under Maintenance', 'Damaged', 'Fair', 'Poor', 'Critical', 'New'];

const InspectAsset = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [condition, setCondition] = useState('Good');
  const [status, setStatus] = useState('Available');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assets?limit=100');
      if (res.data.success) {
        const list = res.data.assets || res.data.data || [];
        setAssets(list);
        if (list.length > 0 && !selectedAsset) {
          selectForInspection(list[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const selectForInspection = (asset) => {
    setSelectedAsset(asset);
    setCondition(asset.condition || 'Good');
    setStatus(asset.status || 'Available');
    setInspectionNotes(`Physical inspection on ${new Date().toLocaleDateString()}: hardware verified.`);
  };

  const handleInspectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      setSubmitting(true);
      const res = await api.post('/maintenance/inspect', {
        assetId: selectedAsset._id,
        condition,
        status,
        inspectionNotes,
      });

      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        // Update local asset copy
        setSelectedAsset(res.data.asset);
        fetchAssets();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error submitting inspection',
        type: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssets = assets.filter(
    (a) =>
      a.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Physical Asset Inspection</h1>
          <p className="page-subtitle">
            Inspect hostel equipment, test operational condition, and certify physical standards
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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left: Asset Selector List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Select Asset to Inspect</h2>
          </div>

          <div style={{ padding: '0 0 1rem 0' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search code, name, room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>Loading assets...</p>
            ) : filteredAssets.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>No matching assets.</p>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset._id}
                  onClick={() => selectForInspection(asset)}
                  style={{
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: selectedAsset?._id === asset._id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    background: selectedAsset?._id === asset._id ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    transition: 'all 0.15s ease',
                  }}
                  id={`select-asset-${asset.assetCode}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="code-badge" style={{ fontSize: '0.75rem' }}>{asset.assetCode}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                      {asset.condition}
                    </span>
                  </div>
                  <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>{asset.assetName}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {asset.category} • {asset.hostelBlock} Rm {asset.roomNumber}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Inspection Form & Condition Update */}
        {selectedAsset ? (
          <div className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Inspection Log: [{selectedAsset.assetCode}] {selectedAsset.assetName}</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedAsset.hostelBlock} • Room {selectedAsset.roomNumber} • Category: {selectedAsset.category}
                </span>
              </div>
              <StatusBadge status={selectedAsset.status} />
            </div>

            <form onSubmit={handleInspectSubmit}>
              {/* Asset Snapshot Card */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Current Condition:</span>
                  <strong style={{ color: '#2563eb' }}>{selectedAsset.condition}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Operating Status:</span>
                  <strong>{selectedAsset.status}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Room Allocation:</span>
                  <strong>{selectedAsset.hostelBlock} Rm {selectedAsset.roomNumber}</strong>
                </div>
              </div>

              {/* Physical Condition Dropdown */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Inspected Physical Condition *</label>
                  <select
                    id="select-inspect-condition"
                    className="form-control"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    required
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hostel Asset Operational Status *</label>
                  <select
                    id="select-inspect-status"
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned (In Room Possession)</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Damaged">Damaged (Requires Work Order)</option>
                  </select>
                </div>
              </div>

              {/* Inspection Notes */}
              <div className="form-group">
                <label className="form-label">Physical Inspection Findings & Field Notes *</label>
                <textarea
                  id="textarea-inspect-notes"
                  className="form-control"
                  rows="4"
                  placeholder="Detail test results (e.g. Fan blades aligned, regulator noise absent, table surface unchipped, bed welds intact)..."
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  required
                />
              </div>

              <button
                id="btn-save-inspection"
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem' }}
              >
                <Save size={16} />
                <span>{submitting ? 'Certifying Inspection...' : 'Certify & Save Inspection'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <Layers size={40} color="#94a3b8" style={{ marginBottom: '1rem' }} />
            <p style={{ color: '#64748b' }}>Select an asset on the left to begin physical inspection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectAsset;
