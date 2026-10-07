import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Lock, Save, CheckCircle, AlertCircle, Building2 } from 'lucide-react';

const UserProfile = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    hostelBlock: user?.hostelBlock || 'Block A',
    roomNumber: user?.roomNumber || '101',
    phone: user?.phone || '',
    studentId: user?.studentId || '',
    password: '',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        hostelBlock: formData.hostelBlock,
        roomNumber: formData.roomNumber,
        phone: formData.phone,
        studentId: formData.studentId,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.data.success) {
        updateUser(res.data.user);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setFormData((prev) => ({ ...prev, password: '' }));
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating profile',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resident Profile Settings</h1>
          <p className="page-subtitle">
            Update your contact information, room allocation, and account credentials
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

      <div className="card" style={{ maxWidth: '680px' }}>
        <div className="card-header">
          <h2 className="card-title">Resident Account Details</h2>
          <span className="badge badge-assigned">
            {user?.role === 'admin' ? 'Administrator' : 'Hostel Resident'}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email (System Read-Only)</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hostel Block</label>
              <select
                className="form-control"
                value={formData.hostelBlock}
                onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
              >
                <option value="Block A">Block A</option>
                <option value="Block B">Block B</option>
                <option value="Block C">Block C</option>
                <option value="Block D">Block D</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student ID / Roll Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <label className="form-label">New Password (Leave blank to keep current)</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={6}
            />
          </div>

          <button
            id="btn-update-profile"
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            <Save size={16} />
            <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
