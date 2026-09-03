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
    title: 'Special South Indian Festive Feast this Sunday',
    category: 'events',
    date: 'Upcoming Sunday, 12:30 PM',
    body: 'Special lunch banquet will be served including Pulihora, Paneer Kurma, Medu Vada, Semiya Payasam, and seasonal fruit salad. Resident guests permitted with prior coupon booking.',
    author: 'Mess Committee',
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

const TODAY_MEALS = [
  { id: 'breakfast', name: 'Breakfast (7:30 - 9:30 AM)', menu: 'Steamed Idli, Crispy Medu Vada, Hot Sambar, Coconut & Tomato Chutneys, Tea / Filter Coffee', rating: 4 },
  { id: 'lunch',     name: 'Lunch (12:30 - 2:30 PM)',   menu: 'Jeera Basmati Rice, Paneer Butter Masala, Home-style Dal Tadka, Fresh Curd, Papad & Garden Salad', rating: 5 },
  { id: 'snacks',    name: 'Evening Snacks (5:00 - 6:00 PM)', menu: 'Crispy Veg Samosa, Mint Chutney, Sweet Tamarind Dip, Cutting Masala Chai', rating: 0 },
  { id: 'dinner',    name: 'Dinner (7:30 - 9:30 PM)',   menu: 'Hot Phulka Rotis, Aloo Gobi Masala, Steamed Rice, Tomato Rasam, Gulab Jamun', rating: 0 },
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

export function StudentMessMenu() {
  const dispatch = useDispatch();
  const [meals, setMeals] = useState(TODAY_MEALS);
  const [feedback, setFeedback] = useState('');

  const handleRate = (mealId, stars) => {
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, rating: stars } : m));
    dispatch(addToast({
      id: `rate-${Date.now()}`,
      message: `Rated ${stars} ⭐ for ${meals.find(m => m.id === mealId)?.name.split(' ')[0]}`,
      type: 'success',
    }));
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    dispatch(addToast({
      id: `fb-${Date.now()}`,
      message: 'Mess committee received your feedback!',
      type: 'success',
    }));
    setFeedback('');
  };

  const MEAL_ICONS = {
    breakfast: '🍳',
    lunch: '🍛',
    snacks: '☕',
    dinner: '🍲'
  };

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
            <span>🍽️</span>
            <span>Daily Mess Menu & Meal Ratings</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Freshly prepared catering menu for residents • Rate meals daily</p>
        </div>
        <span className="badge badge-resolved" style={{ fontSize: 12, padding: '6px 14px' }}>
          ● Live Active Menu
        </span>
      </div>

      {/* Meal Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {meals.map((m) => (
          <div key={m.id} className="mess-meal-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{MEAL_ICONS[m.id] || '🍽️'}</span>
              <div className="mess-meal-title" style={{ margin: 0 }}>{m.name}</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, minHeight: 65, margin: '0 0 14px 0' }}>
              {m.menu}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>Rate meal:</span>
              <div className="star-rating" style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(m.id, star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 18,
                      cursor: 'pointer',
                      color: star <= m.rating ? '#f59e0b' : 'var(--border-strong)',
                      padding: '0 2px',
                      transition: 'transform 0.15s ease'
                    }}
                    aria-label={`Rate ${star} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestion Box */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: 22,
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💬</span>
          <span>Suggestions for Mess Chef & Warden</span>
        </h4>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>Share your feedback on spice level, menu suggestions, or hygiene.</p>
        <form onSubmit={handleSendFeedback} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <textarea
            className="form-input"
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Please add extra curd or adjust spice level in lunch dal..."
            style={{ flex: 1, fontSize: 12.5, resize: 'vertical', minHeight: 46 }}
          />
          <button type="submit" className="btn btn-primary" disabled={!feedback.trim()} style={{ whiteSpace: 'nowrap', padding: '12px 20px', height: 46 }}>
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
