import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  Upload,
  Layers,
  X,
} from 'lucide-react';

const TechnicianReportDamage = () => {
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    assetId: '',
    title: '',
    category: 'Fan',
    priority: 'High',
    assetCondition: 'Damaged',
    issueDescription: '',
    evidencePhoto: '',
  });

  const fetchAssets = async () => {
    try {
      setLoadingAssets(true);
      const res = await api.get('/assets?limit=100');
      if (res.data.success) {
        const list = res.data.assets || res.data.data || [];
        setAssets(list);
        if (list.length > 0) {
          setFormData((prev) => ({
            ...prev,
            assetId: list[0]._id,
            category: list[0].category,
            title: `Repair ${list[0].assetName} in ${list[0].hostelBlock} Rm ${list[0].roomNumber}`,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAssetSelect = (e) => {
    const id = e.target.value;
    const selected = assets.find((a) => a._id === id);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        assetId: id,
        category: selected.category,
        title: `Repair ${selected.assetName} in ${selected.hostelBlock} Rm ${selected.roomNumber}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, assetId: id }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: 'File size exceeds 2MB limit.', type: 'danger' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, evidencePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, evidencePhoto: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.assetId || !formData.issueDescription) {
      setMessage({ text: 'Please fill in all required fields.', type: 'danger' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/maintenance/report-damage', formData);
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setFormData({
          assetId: assets[0]?._id || '',
          title: '',
          category: assets[0]?.category || 'Fan',
          priority: 'High',
          assetCondition: 'Damaged',
          issueDescription: '',
          evidencePhoto: '',
        });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error creating maintenance damage report',
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
          <h1 className="page-title">Report Damaged Asset with Photo Evidence</h1>
          <p className="page-subtitle">
            Log physical defects, upload damage photos, and automatically initiate maintenance tickets
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

      <div className="card" style={{ maxWidth: '820px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <h2 className="card-title">Damage Incident & Work Order Generator</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Asset Selection */}
          <div className="form-group">
            <label className="form-label">Select Hostel Asset Item *</label>
            {loadingAssets ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading inventory items...</p>
            ) : (
              <select
                id="select-damaged-asset"
                className="form-control"
                value={formData.assetId}
                onChange={handleAssetSelect}
                required
              >
                {assets.map((a) => (
                  <option key={a._id} value={a._id}>
                    [{a.assetCode}] {a.assetName} • {a.category} • {a.hostelBlock} Rm {a.roomNumber} ({a.condition})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Work Order Title *</label>
              <input
                id="input-damage-title"
                type="text"
                className="form-control"
                placeholder="e.g. Repair damaged fan blade in Room A-101"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Item Category *</label>
              <input
                type="text"
                className="form-control"
                value={formData.category}
                disabled
                style={{ backgroundColor: '#f1f5f9' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Repair Priority *</label>
              <select
                id="select-damage-priority"
                className="form-control"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
              >
                <option value="Emergency">Emergency (Electrical hazard, water leakage)</option>
                <option value="High">High (Major functional breakdown)</option>
                <option value="Medium">Medium (Partial malfunction)</option>
                <option value="Low">Low (Cosmetic / routine repair)</option>
              </select>
            </div>

            {/* 📦 Update Asset Condition */}
            <div className="form-group">
              <label className="form-label">Asset Condition *</label>
              <select
                id="select-damage-condition"
                className="form-control"
                value={formData.assetCondition}
                onChange={(e) => setFormData({ ...formData, assetCondition: e.target.value })}
                required
              >
                <option value="Damaged">Damaged</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Critical">Critical</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>

          {/* Issue Description */}
          <div className="form-group">
            <label className="form-label">Damage Description & Symptoms *</label>
            <textarea
              id="textarea-damage-desc"
              className="form-control"
              rows="3"
              placeholder="Describe physical damage, broken components, noise, burning smell, or test failures observed..."
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              required
            />
          </div>

          {/* 📸 Upload Evidence */}
          <div className="form-group" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Camera size={16} color="var(--primary)" />
              <span>Upload Photographic Evidence (Optional)</span>
            </label>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Capture or upload photos of broken parts, burnt electronics, or cracked furniture for warden verification.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Upload size={14} />
                <span>Select Photo File</span>
                <input
                  id="input-evidence-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {formData.evidencePhoto && (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={formData.evidencePhoto}
                    alt="Damage Evidence"
                    style={{ height: '100px', borderRadius: '6px', border: '1px solid #e2e8f0', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Remove Photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            id="btn-submit-tech-damage"
            type="submit"
            className="btn btn-danger"
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1.25rem' }}
          >
            <AlertTriangle size={16} />
            <span>{submitting ? 'Generating Work Order...' : 'Submit Damage Report & Create Work Order'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechnicianReportDamage;
