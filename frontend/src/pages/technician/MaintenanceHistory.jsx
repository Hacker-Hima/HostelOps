import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  History,
  Wrench,
  Search,
  CheckCircle,
  Calendar,
  Layers,
  MapPin,
  Tag,
  Clock,
  User,
} from 'lucide-react';

const MaintenanceHistory = () => {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'audit'

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/maintenance/history');
      if (res.data.success) {
        setHistoryLogs(res.data.history || []);
        setCompletedTasks(res.data.completedTasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredTasks = completedTasks.filter(
    (t) =>
      t.taskCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.asset?.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.asset?.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.repairDetails?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = historyLogs.filter(
    (h) =>
      h.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.performedByName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hostel Maintenance & Repair History</h1>
          <p className="page-subtitle">
            Historical audit log of all physical repairs, parts replacements, and certified inspections
          </p>
        </div>
      </div>

      {/* Navigation tabs & Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`btn btn-sm ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
              id="tab-history-completed-tasks"
            >
              Completed Work Orders ({completedTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
              id="tab-history-audit-events"
            >
              Physical Event Trail ({historyLogs.length})
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by asset code, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', padding: '0.4rem 0.75rem 0.4rem 2.2rem', fontSize: '0.85rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading maintenance history...
        </p>
      ) : activeTab === 'tasks' ? (
        /* Completed Work Orders View */
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Completed Maintenance Jobs ({filteredTasks.length})</h2>
          </div>

          {filteredTasks.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              No completed work orders matching your search.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Completion Date</th>
                    <th>Task Code</th>
                    <th>Asset Details</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Repair Details</th>
                    <th>Technician Remarks</th>
                    <th>Signed Off By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t._id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                        {t.completionDate || (t.completedAt ? new Date(t.completedAt).toLocaleDateString() : 'Recent')}
                      </td>
                      <td>
                        <span className="code-badge" style={{ background: '#dcfce7', color: '#15803d' }}>
                          {t.taskCode}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.9rem' }}>{t.asset?.assetName || t.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t.asset?.assetCode}
                        </div>
                      </td>
                      <td>{t.category}</td>
                      <td>{t.hostelBlock} • Rm {t.roomNumber}</td>
                      <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>
                        {t.repairDetails || 'Physical repair finished.'}
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
                        {t.remarks || 'Repaired'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {t.assignedTo?.name || 'Staff Technician'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Physical Event Trail */
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Physical Maintenance Audit Timeline ({filteredLogs.length})</h2>
          </div>

          {filteredLogs.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              No maintenance event logs found.
            </p>
          ) : (
            <div className="timeline">
              {filteredLogs.map((log) => (
                <div className="timeline-item" key={log._id}>
                  <div
                    className="timeline-dot"
                    style={{
                      backgroundColor:
                        log.action === 'Repaired'
                          ? '#059669'
                          : log.action === 'Inspected'
                          ? '#2563eb'
                          : '#d97706',
                    }}
                  />
                  <div className="timeline-time">
                    {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor:
                          log.action === 'Repaired'
                            ? '#dcfce7'
                            : log.action === 'Inspected'
                            ? '#eff6ff'
                            : '#fef3c7',
                        color:
                          log.action === 'Repaired'
                            ? '#15803d'
                            : log.action === 'Inspected'
                            ? '#1d4ed8'
                            : '#b45309',
                      }}
                    >
                      {log.action}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                      [{log.assetCode}] {log.assetName}
                    </strong>
                  </div>
                  <div className="timeline-content" style={{ marginTop: '0.35rem' }}>
                    {log.details}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Performed by: <strong>{log.performedByName || 'Staff Technician'}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MaintenanceHistory;
