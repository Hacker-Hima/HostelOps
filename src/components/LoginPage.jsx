import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setRole } from '../redux/ticketSlice';

const ROLES = [
  { id: 'student',     icon: '🎓', name: 'Student',             desc: 'Submit complaints, track repairs & scan room assets', tag: 'Mobile App',   grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  { id: 'staff',       icon: '👨‍🍳', name: 'Working Staff',       desc: 'Raise equipment requests and track approval pipeline', tag: 'Mobile App',   grad: 'linear-gradient(135deg,#f97316,#eab308)' },
  { id: 'asst-warden', icon: '🏫', name: 'Asst. Warden',        desc: 'Review complaints, assign technicians, manage workers', tag: 'Dashboard',    grad: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  { id: 'res-warden',  icon: '🏛️', name: 'Residential Warden', desc: 'Approve budgets, sign off requests & view audit logs', tag: 'Dashboard',    grad: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  { id: 'technician',  icon: '⚡', name: 'Technician',          desc: 'View assigned jobs, upload proof & mark completions',  tag: 'Mobile App',   grad: 'linear-gradient(135deg,#f59e0b,#f97316)' },
  { id: 'assets',      icon: '🏁', name: 'Asset Manager',       desc: 'QR inventory tracking, condition updates & reporting', tag: 'Dashboard',    grad: 'linear-gradient(135deg,#10b981,#06b6d4)' },
  { id: 'principal',   icon: '👑', name: 'Principal',           desc: 'Final authority on high-value approvals & analytics',  tag: 'Dashboard',    grad: 'linear-gradient(135deg,#ef4444,#ec4899)' },
];

export default function LoginPage() {
  const dispatch = useDispatch();

  const handleLogin = useCallback(
    (roleId) => dispatch(setRole(roleId)),
    [dispatch]
  );

  return (
    <div className="login-page">
      {/* Hero */}
      <div className="login-hero" style={{ animation: 'slideUp 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 0 32px rgba(124,58,237,0.4)' }}>
            🏫
          </div>
          <h1>HostelOps</h1>
        </div>
        <p>Real-Time Hostel Service & Asset Management Platform.<br />Select your role to continue.</p>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
          {[
            { value: '6 Roles', label: 'User Types' },
            { value: '22+ Pages', label: 'Views' },
            { value: '147', label: 'Assets Tracked' },
            { value: 'Real-Time', label: 'Updates' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="login-role-grid" style={{ animation: 'slideUp 0.6s ease' }}>
        {ROLES.map((role, i) => (
          <button
            key={role.id}
            id={`login-${role.id}`}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 20,
              padding: '26px 18px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              position: 'relative',
              overflow: 'hidden',
              animationDelay: `${i * 0.06}s`,
              fontFamily: 'Inter, sans-serif',
            }}
            onClick={() => handleLogin(role.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)';
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.5), 0 0 24px rgba(124,58,237,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Gradient overlay on hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: role.grad,
              opacity: 0.05,
              pointerEvents: 'none',
            }} />

            <div style={{ fontSize: 38, marginBottom: 12 }}>{role.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{role.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 12 }}>{role.desc}</div>
            <div style={{
              display: 'inline-block',
              padding: '3px 9px',
              borderRadius: 9999,
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              background: `${role.grad}20`,
              border: `1px solid ${role.grad}40`,
              color: 'var(--text-accent)',
            }}>
              {role.tag}
            </div>

            {/* Arrow */}
            <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 14, opacity: 0.3, color: 'var(--text-primary)' }}>→</div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 36, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        Demo mode — no authentication required. Click any role card to explore.
      </div>
    </div>
  );
}
