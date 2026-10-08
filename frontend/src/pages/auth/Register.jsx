import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, AlertCircle, ArrowRight } from 'lucide-react';
import GoogleAuthButton from '../../components/GoogleAuthButton';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    hostelBlock: 'Block A',
    roomNumber: '101',
    phone: '',
    studentId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(formData);
    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '540px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          padding: '2.25rem',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: '#eff6ff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
              marginBottom: '0.75rem',
            }}
          >
            <Building2 size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Student Resident Registration
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            Register your hostel account to request and track assets
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" id="register-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Continue with Google OAuth Button */}
        <GoogleAuthButton text="Sign up with Google" onError={(msg) => setError(msg)} />

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0 1rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ padding: '0 0.75rem', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            or register manually
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              className="form-control"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Hostel Email</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className="form-control"
                placeholder="student@hostel.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-block">Hostel Block</label>
              <select
                id="reg-block"
                name="hostelBlock"
                className="form-control"
                value={formData.hostelBlock}
                onChange={handleChange}
              >
                <option value="Block A">Block A (Boys Wing)</option>
                <option value="Block B">Block B (Girls Wing)</option>
                <option value="Block C">Block C (PG & Scholars)</option>
                <option value="Block D">Block D (International)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-room">Room Number</label>
              <input
                id="reg-room"
                name="roomNumber"
                type="text"
                className="form-control"
                placeholder="e.g. A-101 or 204"
                value={formData.roomNumber}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-sid">Student Roll / ID</label>
              <input
                id="reg-sid"
                name="studentId"
                type="text"
                className="form-control"
                placeholder="HST-2024-001"
                value={formData.studentId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">Contact Phone</label>
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                className="form-control"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
            <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
