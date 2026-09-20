import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../redux/ticketSlice';

const INITIAL_NOTICES = [
  {
    id: 'N1',
    title: 'Water Tank Cleaning Schedule — Block A & B',
    category: 'urgent',
    date: 'Today, 10:00 AM - 2:00 PM',
    body: 'Overhead tanks for Block A and B will undergo mandatory quarterly chlorination. Water supply will be paused between 10:00 AM and 2:00 PM. Please store sufficient water in advance.',
    author: 'Warden Office',
    read: false,
  },
  {
    id: 'N2',
    title: 'Mandatory Room Asset & Inventory Verification',
    category: 'schedule',
    date: 'Upcoming Saturday, 10:00 AM',
    body: 'Wardens will conduct physical asset inspections across Block A and B. Please ensure all assigned furniture, electrical fixtures, and appliances are accessible for QR scanning.',
    author: 'Asset Management Office',
    read: false,
  },
  {
    id: 'N3',
    title: 'Wi-Fi Fiber Router Firmware Upgrade',
    category: 'schedule',
    date: 'Tomorrow, 01:00 AM - 02:00 AM',
    body: 'Central Network Operations will patch security protocols on all 5GHz corridor access points. Expect momentary drops under 10 minutes.',
    author: 'IT Infrastructure',
    read: true,
  },
  {
    id: 'N4',
    title: 'Inter-Hostel Badminton Tournament Sign-ups',
    category: 'general',
    date: 'Next Weekend',
    body: 'Registrations are open for Singles & Doubles at the Sports Pavilion. Submit your team roster before Thursday 6:00 PM.',
    author: 'Sports Secretary',
    read: true,
  },
];

export function EmergencySpeedDial() {
  const dispatch = useDispatch();

  const contacts = [
    { title: 'Campus Security', num: '+91 98765 00001', icon: '🚨', color: 'var(--color-danger)' },
    { title: 'Medical / Ambulance', num: '108 / +91 98765 00002', icon: '🏥', color: 'var(--accent-red)' },
    { title: 'Warden Helpline', num: '+91 98765 99887', icon: '🏫', color: 'var(--accent-primary)' },
    { title: 'Maintenance Desk', num: '+91 98765 43210', icon: '⚡', color: 'var(--accent-yellow)' },
  ];

  const handleCopyOrCall = (c) => {
    navigator.clipboard?.writeText(c.num);
    dispatch(addToast({
      id: `call-${Date.now()}`,
      message: `${c.title} contact copied: ${c.num}`,
      type: 'info',
    }));
  };

  return (
    <div style={{
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-3) var(--space-4)',
      marginBottom: 'var(--space-4)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          🚨 Emergency Speed Dial
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>1-Tap Call / Copy</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        {contacts.map((c) => (
          <button
            key={c.title}
            type="button"
            className="btn btn-ghost"
            onClick={() => handleCopyOrCall(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: 11,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 16 }}>{c.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 11 }}>{c.title}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{c.num}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StudentNotices() {
  const dispatch = useDispatch();
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [activeCat, setActiveCat] = useState('all');

  const filtered = notices.filter(n => activeCat === 'all' || n.category === activeCat);

  const toggleRead = (id) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    dispatch(addToast({ id: `toast-${Date.now()}`, message: 'Notice status updated', type: 'info' }));
  };

  const unreadCount = notices.filter(n => !n.read).length;

  return (
    <div style={{ animation: 'fadeIn 0.25s ease', width: '100%' }}>
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📢</span>
            <span>Campus Notices & Bulletins</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Official announcements and circulars from administration & committees</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-pending" style={{ fontSize: 12, padding: '6px 14px' }}>
            {unreadCount} {unreadCount === 1 ? 'Unread' : 'Unread'}
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {['all', 'urgent', 'events', 'schedule', 'general'].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`btn ${activeCat === cat ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              fontSize: 12,
              textTransform: 'capitalize',
              padding: '6px 16px',
              borderRadius: '9999px',
              fontWeight: 600,
              border: activeCat === cat ? 'none' : '1px solid var(--border-subtle)'
            }}
            onClick={() => setActiveCat(cat)}
          >
            {cat === 'all' ? 'All Notices' : cat}
          </button>
        ))}
      </div>

      {/* Notice Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
        gap: 16
      }}>
        {filtered.map((n) => (
          <div key={n.id} className={`notice-card ${!n.read ? 'unread' : ''}`}>
            <div className="notice-meta">
              <span className={`notice-cat-badge notice-cat-${n.category}`}>{n.category}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🕒</span> {n.date}
              </span>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginLeft: 'auto', fontWeight: 500 }}>
                By {n.author}
              </span>
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {n.title}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
              {n.body}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11.5, padding: '4px 12px', borderRadius: 'var(--radius-md)' }}
                onClick={() => toggleRead(n.id)}
              >
                {n.read ? 'Mark Unread' : '✓ Mark as Read'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


