import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtext, id }) => {
  const getColorStyles = () => {
    switch (color) {
      case 'green':
        return { bg: '#ecfdf5', text: '#059669' };
      case 'amber':
        return { bg: '#fffbeb', text: '#d97706' };
      case 'red':
        return { bg: '#fef2f2', text: '#dc2626' };
      case 'purple':
        return { bg: '#f5f3ff', text: '#7c3aed' };
      case 'indigo':
        return { bg: '#e0e7ff', text: '#4f46e5' };
      case 'blue':
      default:
        return { bg: '#eff6ff', text: '#2563eb' };
    }
  };

  const style = getColorStyles();

  return (
    <div className="stat-card" id={id}>
      <div className="stat-top">
        <div
          className="stat-icon"
          style={{ backgroundColor: style.bg, color: style.text }}
        >
          {Icon && <Icon size={22} />}
        </div>
        {subtext && (
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
            {subtext}
          </span>
        )}
      </div>
      <div className="stat-value">{value ?? 0}</div>
      <div className="stat-label">{title}</div>
    </div>
  );
};

export default StatCard;
