import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { History, Search, Filter, Clock, RefreshCw } from 'lucide-react';

const ACTIONS = [
  'All',
  'Created',
  'Assigned',
  'Unassigned',
  'Status Change',
  'Damage Reported',
  'Lost Reported',
  'Sent for Maintenance',
  'Asset Restored',
  'Updated',
  'Deleted',
];

const AssetHistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Pagination state (Backend Pagination)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };
      if (actionFilter !== 'All') params.action = actionFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/history', { params });
      if (res.data.success) {
        setHistory(res.data.history || res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
        setPage(res.data.currentPage || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, limit, actionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'Created':
      case 'Asset Restored':
        return '#059669';
      case 'Assigned':
        return '#2563eb';
      case 'Unassigned':
      case 'Returned':
        return '#475569';
      case 'Damage Reported':
      case 'Deleted':
        return '#dc2626';
      case 'Lost Reported':
      case 'Reported Lost':
      case 'Sent for Maintenance':
        return '#d97706';
      default:
        return '#7c3aed';
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Audit History & Logs</h1>
          <p className="page-subtitle">
            Immutable system audit logs tracking asset assignments, status alterations, and incidents
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '420px', width: '100%' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Search by Asset Code (e.g. AST-BED-001)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="#64748b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Event:</span>
            <select
              className="form-control"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchHistory}
              title="Refresh log feed"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#2563eb" />
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
              System Audit Log ({totalItems} Events)
            </strong>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>ASSET CODE</th>
                <th>ASSET NAME</th>
                <th>ACTION TYPE</th>
                <th>PERFORMED BY</th>
                <th>DETAILS & AUDIT NOTES</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto' }}></div>
                    <span style={{ color: '#64748b' }}>Loading audit trail...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No audit records matching filter criteria.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} />
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <code>{item.assetCode}</code>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.assetName}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: `${getActionBadgeColor(item.action)}15`,
                          color: getActionBadgeColor(item.action),
                          border: `1px solid ${getActionBadgeColor(item.action)}40`,
                        }}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        {item.performedByName || 'System'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>{item.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Footer */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};

export default AssetHistoryView;
