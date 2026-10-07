import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Clock, FileCheck } from 'lucide-react';

const UserHistory = () => {
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const [reqRes, repRes, histRes] = await Promise.all([
          api.get('/requests/my'),
          api.get('/damage/my'),
          api.get('/history'),
        ]);

        if (reqRes.data.success) setRequests(reqRes.data.requests || []);
        if (repRes.data.success) setReports(repRes.data.reports || []);
        if (histRes.data.success) setAuditLogs(histRes.data.data || histRes.data.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Combine and sort events
  const events = [
    ...auditLogs.map((h) => ({
      id: h._id,
      date: new Date(h.timestamp),
      type: `${h.action} Event`,
      title: `[${h.assetCode}] ${h.assetName} - ${h.action}`,
      detail: h.details,
      badgeColor: h.action === 'Assigned' ? '#2563eb' : h.action === 'Returned' ? '#059669' : '#64748b',
    })),
    ...requests.map((r) => ({
      id: r._id,
      date: new Date(r.createdAt),
      type: 'Asset Request',
      title: `Requested ${r.assetName} (${r.category})`,
      detail: `Status: ${r.status}. Remarks: ${r.adminRemarks || 'None'}`,
      badgeColor: r.status === 'Approved' ? '#059669' : r.status === 'Pending' ? '#ea580c' : '#dc2626',
    })),
    ...reports.map((d) => ({
      id: d._id,
      date: new Date(d.createdAt),
      type: `${d.reportType} Incident`,
      title: `Reported ${d.asset?.assetName || 'Asset'} as ${d.reportType}`,
      detail: `Severity: ${d.severity}. Status: ${d.status}. Remarks: ${d.adminRemarks || 'None'}`,
      badgeColor: '#dc2626',
    })),
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal Asset Activity History</h1>
          <p className="page-subtitle">
            Timeline of all your asset requests, damage notices, and allocations
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Activity Timeline ({events.length} Events)</h2>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Loading activity timeline...
          </p>
        ) : events.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No personal activity recorded yet.
          </p>
        ) : (
          <div className="timeline">
            {events.map((evt) => (
              <div className="timeline-item" key={evt.id}>
                <div className="timeline-dot" style={{ backgroundColor: evt.badgeColor }} />
                <div className="timeline-time">
                  {evt.date.toLocaleDateString()} at {evt.date.toLocaleTimeString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: `${evt.badgeColor}15`,
                      color: evt.badgeColor,
                    }}
                  >
                    {evt.type}
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{evt.title}</strong>
                </div>
                <div className="timeline-content">{evt.detail}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHistory;
