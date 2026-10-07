import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'Available':
        return 'badge-available';
      case 'Assigned':
        return 'badge-assigned';
      case 'Damaged':
        return 'badge-damaged';
      case 'Lost':
        return 'badge-lost';
      case 'Under Maintenance':
        return 'badge-maintenance';
      case 'In Progress':
        return 'badge-maintenance';
      case 'Completed':
        return 'badge-approved';
      case 'Pending':
        return 'badge-pending';
      case 'Approved':
        return 'badge-approved';
      case 'Rejected':
        return 'badge-rejected';
      case 'Good':
      case 'New':
        return 'badge-available';
      case 'Fair':
        return 'badge-lost';
      case 'Poor':
      case 'Critical':
        return 'badge-damaged';
      default:
        return 'badge-assigned';
    }
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
};

export default StatusBadge;
