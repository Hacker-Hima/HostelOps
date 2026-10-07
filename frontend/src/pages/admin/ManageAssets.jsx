import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Upload,
  Download,
  ArrowUpDown,
  RefreshCw,
  FileCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Bed',
  'Table',
  'Chair',
  'Fan',
  'Light',
  'Computer',
  'Mattress',
  'Cupboard',
  'Electrical Equipment',
  'Other',
];

const STATUSES = ['All', 'Available', 'Assigned', 'Damaged', 'Lost', 'Under Maintenance'];
const BLOCKS = ['All', 'Block A', 'Block B', 'Block C', 'Block D'];
const CONDITIONS = ['All', 'New', 'Good', 'Fair', 'Poor', 'Critical', 'Damaged'];

const ManageAssets = () => {
  const [assets, setAssets] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Pagination state (Backend Pagination)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [blockFilter, setBlockFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');

  // Sorting state (Backend Sorting)
  const [sortOption, setSortOption] = useState('createdAt-desc');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // CSV Import State
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState('');

  // Form states
  const initialAssetForm = {
    assetName: '',
    assetCode: '',
    category: 'Bed',
    hostelBlock: 'Block A',
    roomNumber: '101',
    quantity: 1,
    condition: 'Good',
    status: 'Available',
    price: 0,
    description: '',
  };
  const [formData, setFormData] = useState(initialAssetForm);
  const [assignUserId, setAssignUserId] = useState('');

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const [sortField, order] = sortOption.split('-');
      const params = {
        page,
        limit,
        sort: sortField,
        order,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (blockFilter !== 'All') params.hostelBlock = blockFilter;
      if (conditionFilter !== 'All') params.condition = conditionFilter;

      const res = await api.get('/assets', { params });
      if (res.data.success) {
        setAssets(res.data.assets || res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
        setPage(res.data.currentPage || 1);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load assets from server', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/users?role=student&limit=100');
      if (res.data.success) {
        setStudents(res.data.users || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Refetch when filters or pagination change
  useEffect(() => {
    fetchAssets();
  }, [page, limit, categoryFilter, statusFilter, blockFilter, conditionFilter, sortOption]);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle live search with reset to page 1
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAssets();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
    setStatusFilter('All');
    setBlockFilter('All');
    setConditionFilter('All');
    setSortOption('createdAt-desc');
    setPage(1);
  };

  // CSV Export handler respecting active filters
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (blockFilter !== 'All') params.append('hostelBlock', blockFilter);
      if (conditionFilter !== 'All') params.append('condition', conditionFilter);

      const response = await api.get(`/assets/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hostel_assets_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ text: 'CSV export downloaded successfully', type: 'success' });
    } catch (err) {
      console.error('Export error', err);
      setMessage({ text: 'Failed to export assets CSV', type: 'danger' });
    }
  };

  // CSV Bulk Import handler
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setImportError('Please choose a .csv file to upload');
      return;
    }

    try {
      setImportLoading(true);
      setImportError('');
      setImportSummary(null);

      const uploadData = new FormData();
      uploadData.append('file', csvFile);

      const res = await api.post('/assets/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setImportSummary(res.data.summary);
        setMessage({ text: res.data.message, type: 'success' });
        fetchAssets();
      }
    } catch (err) {
      setImportError(
        err.response?.data?.message || 'Error processing CSV file upload'
      );
    } finally {
      setImportLoading(false);
    }
  };

  // Download Sample CSV template for viva / testing
  const handleDownloadSampleCSV = () => {
    const csvHeader = 'assetName,assetCode,category,hostelBlock,roomNumber,quantity,status,condition,price,description\n';
    const sampleRows = [
      'Ergonomic Study Chair,AST-CHR-DEMO1,Chair,Block A,101,1,Available,Good,1400,High durability wood frame',
      'Solid Teak Bed,AST-BED-DEMO2,Bed,Block B,204,1,Available,New,4500,Single resident teak bed',
      'Ceiling Sweep Fan,AST-FAN-DEMO3,Fan,Block A,102,1,Available,Good,1200,High speed 48-inch fan',
      'Reading Table Lamp,AST-LGT-DEMO4,Light,Block C,305,1,Available,New,600,Warm white LED reading light',
    ].join('\n');

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_hostel_assets_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Form submission: Create Asset
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/assets', formData);
      if (res.data.success) {
        setMessage({ text: 'Asset successfully added to inventory', type: 'success' });
        setIsAddOpen(false);
        setFormData(initialAssetForm);
        setPage(1);
        fetchAssets();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error creating asset',
        type: 'danger',
      });
    }
  };

  // Form submission: Edit Asset
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/assets/${selectedAsset._id}`, formData);
      if (res.data.success) {
        setMessage({ text: 'Asset updated successfully', type: 'success' });
        setIsEditOpen(false);
        fetchAssets();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating asset',
        type: 'danger',
      });
    }
  };

  // Open Edit Modal
  const openEditModal = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      assetName: asset.assetName,
      assetCode: asset.assetCode,
      category: asset.category,
      hostelBlock: asset.hostelBlock,
      roomNumber: asset.roomNumber,
      quantity: asset.quantity,
      condition: asset.condition,
      status: asset.status,
      price: asset.price,
      description: asset.description || '',
    });
    setIsEditOpen(true);
  };

  // Open Assign Modal
  const openAssignModal = (asset) => {
    setSelectedAsset(asset);
    setAssignUserId('');
    setIsAssignOpen(true);
  };

  // Submit Assign
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignUserId) {
      alert('Please select a student resident');
      return;
    }

    const studentObj = students.find((s) => s._id === assignUserId);
    try {
      const res = await api.put(`/assets/${selectedAsset._id}/assign`, {
        userId: assignUserId,
        roomNumber: studentObj?.roomNumber,
        hostelBlock: studentObj?.hostelBlock,
      });

      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setIsAssignOpen(false);
        fetchAssets();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error assigning asset',
        type: 'danger',
      });
    }
  };

  // Submit Unassign
  const handleUnassign = async (asset) => {
    if (window.confirm(`Unassign asset ${asset.assetCode} and return it to Available status?`)) {
      try {
        const res = await api.put(`/assets/${asset._id}/unassign`);
        if (res.data.success) {
          setMessage({ text: res.data.message, type: 'success' });
          fetchAssets();
        }
      } catch (err) {
        setMessage({
          text: err.response?.data?.message || 'Error unassigning asset',
          type: 'danger',
        });
      }
    }
  };

  // Delete Asset
  const handleDelete = async (asset) => {
    if (window.confirm(`Are you sure you want to permanently delete [${asset.assetCode}] ${asset.assetName}?`)) {
      try {
        const res = await api.delete(`/assets/${asset._id}`);
        if (res.data.success) {
          setMessage({ text: 'Asset removed permanently', type: 'success' });
          fetchAssets();
        }
      } catch (err) {
        setMessage({
          text: err.response?.data?.message || 'Error removing asset',
          type: 'danger',
        });
      }
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Hostel Asset Inventory Management</h1>
          <p className="page-subtitle">
            Catalog, track condition, assign equipment, and conduct bulk CSV import/export operations
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setImportSummary(null);
              setImportError('');
              setCsvFile(null);
              setIsImportOpen(true);
            }}
            className="btn btn-secondary"
            id="btn-import-csv"
            title="Upload CSV asset file"
          >
            <Upload size={16} />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            id="btn-export-csv"
            title="Download matching assets as CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setFormData(initialAssetForm);
              setIsAddOpen(true);
            }}
            className="btn btn-primary"
            id="btn-add-asset"
          >
            <Plus size={16} />
            <span>Add New Asset</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message.text && (
        <div
          className={`alert alert-${message.type}`}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          {/* Search Input */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Inventory</label>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by code, name, room, block, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                  id="input-asset-search"
                />
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
              </div>
              <button type="submit" className="btn btn-primary btn-sm" id="btn-search-submit">
                Search
              </button>
            </form>
          </div>

          {/* Category Filter */}
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              id="filter-category"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              id="filter-status"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Block Filter */}
          <div>
            <label className="form-label">Hostel Block</label>
            <select
              className="form-control"
              value={blockFilter}
              onChange={(e) => {
                setBlockFilter(e.target.value);
                setPage(1);
              }}
              id="filter-block"
            >
              {BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div>
            <label className="form-label">Condition</label>
            <select
              className="form-control"
              value={conditionFilter}
              onChange={(e) => {
                setConditionFilter(e.target.value);
                setPage(1);
              }}
              id="filter-condition"
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div>
            <label className="form-label">Sort By</label>
            <select
              className="form-control"
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setPage(1);
              }}
              id="sort-select"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="assetName-asc">Asset Name (A-Z)</option>
              <option value="assetName-desc">Asset Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{ width: '100%' }}
              title="Reset all filters"
            >
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Table Card */}
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
            <FileSpreadsheet size={18} color="#2563eb" />
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
              Asset Register ({totalItems} Records)
            </strong>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: '#64748b' }}>Querying inventory from database...</p>
          </div>
        ) : assets.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center' }}>
            <AlertCircle size={40} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>
              No Assets Found
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              No equipment matched the active search and filter constraints.
            </p>
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>ASSET CODE</th>
                  <th>ASSET NAME</th>
                  <th>CATEGORY</th>
                  <th>BLOCK / ROOM</th>
                  <th>QTY</th>
                  <th>CONDITION</th>
                  <th>STATUS</th>
                  <th>ASSIGNED TO</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset._id}>
                    <td>
                      <code
                        style={{
                          fontWeight: 700,
                          background: '#f1f5f9',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          color: '#0f172a',
                        }}
                      >
                        {asset.assetCode}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{asset.assetName}</div>
                      {asset.description && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {asset.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {asset.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {asset.hostelBlock} • Rm {asset.roomNumber}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{asset.quantity || 1}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color:
                            asset.condition === 'New' || asset.condition === 'Good'
                              ? '#059669'
                              : asset.condition === 'Fair'
                              ? '#d97706'
                              : '#dc2626',
                        }}
                      >
                        ● {asset.condition}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={asset.status} />
                    </td>
                    <td>
                      {asset.assignedTo ? (
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                            {asset.assignedTo.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {asset.assignedTo.email}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {asset.status === 'Available' ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openAssignModal(asset)}
                            title="Assign to student"
                            style={{ padding: '0.3rem 0.5rem', color: '#2563eb' }}
                          >
                            <UserPlus size={14} />
                          </button>
                        ) : asset.status === 'Assigned' ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUnassign(asset)}
                            title="Unassign asset"
                            style={{ padding: '0.3rem 0.5rem', color: '#d97706' }}
                          >
                            <UserMinus size={14} />
                          </button>
                        ) : null}

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(asset)}
                          title="Edit details"
                          style={{ padding: '0.3rem 0.5rem' }}
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDelete(asset)}
                          title="Delete asset"
                          style={{ padding: '0.3rem 0.5rem', color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

      {/* MODAL 1: Add New Asset */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Asset to Inventory">
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label">Asset Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Wooden Single Bed Frame"
              value={formData.assetName}
              onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Asset Code * (Unique)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. AST-BED-012"
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Hostel Block</label>
              <select
                className="form-control"
                value={formData.hostelBlock}
                onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
              >
                {BLOCKS.filter((b) => b !== 'All').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 101 or Common"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Condition</label>
              <select
                className="form-control"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                {CONDITIONS.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUSES.filter((s) => s !== 'All').map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purchase Price (₹)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              placeholder="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Specifications</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Serial number, warranty details, material..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Edit Asset */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Asset: ${selectedAsset?.assetCode}`}>
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Asset Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.assetName}
              onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Asset Code</label>
              <input
                type="text"
                className="form-control"
                value={formData.assetCode}
                onChange={(e) => setFormData({ ...formData, assetCode: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Hostel Block</label>
              <select
                className="form-control"
                value={formData.hostelBlock}
                onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
              >
                {BLOCKS.filter((b) => b !== 'All').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select
                className="form-control"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                {CONDITIONS.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUSES.filter((s) => s !== 'All').map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Price (₹)</label>
            <input
              type="number"
              className="form-control"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Assign Asset to Resident */}
      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assign Asset to Resident">
        <form onSubmit={handleAssignSubmit}>
          <div
            style={{
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Allocating Asset:</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              [{selectedAsset?.assetCode}] {selectedAsset?.assetName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
              Category: {selectedAsset?.category} • Current: {selectedAsset?.hostelBlock} (Room {selectedAsset?.roomNumber})
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Student Resident *</label>
            <select
              className="form-control"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              required
            >
              <option value="">-- Choose Registered Student --</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} ({student.studentId || student.email}) — {student.hostelBlock} / Room {student.roomNumber}
                </option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: '0.825rem', color: '#64748b', marginBottom: '1.5rem' }}>
            Assigning will update the asset location to the student's room, change status to 'Assigned', and generate an immutable audit log entry.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Bulk Import Assets CSV */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          setImportSummary(null);
        }}
        title="Bulk Import Assets via CSV"
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
            Upload a CSV sheet with asset records to batch-register hostel equipment directly into MongoDB.
            The system verifies mandatory fields, checks for duplicate asset codes, and records an audit log for each imported item.
          </p>
        </div>

        {/* Template Download Section */}
        <div
          style={{
            padding: '0.85rem 1rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#2563eb" />
            <span style={{ fontSize: '0.825rem', color: '#1e40af', fontWeight: 600 }}>
              Need the template format?
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadSampleCSV}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <Download size={13} />
            <span>Download Sample CSV</span>
          </button>
        </div>

        {importError && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{importError}</span>
          </div>
        )}

        <form onSubmit={handleImportSubmit}>
          <div className="form-group">
            <label className="form-label">Select CSV File (.csv)</label>
            <input
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={(e) => setCsvFile(e.target.files[0] || null)}
              className="form-control"
              style={{ padding: '0.5rem' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsImportOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={importLoading || !csvFile}
            >
              {importLoading ? 'Processing CSV...' : 'Upload & Import Assets'}
            </button>
          </div>
        </form>

        {/* Import Summary Results */}
        {importSummary && (
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Import Summary Results:
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Rows</div>
                <strong style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                  {importSummary.totalRows}
                </strong>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Imported</div>
                <strong style={{ fontSize: '1.2rem', color: '#059669' }}>
                  {importSummary.importedCount}
                </strong>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>Failed</div>
                <strong style={{ fontSize: '1.2rem', color: '#dc2626' }}>
                  {importSummary.failedCount}
                </strong>
              </div>
            </div>

            {/* List Failed Rows if any */}
            {importSummary.failedRows && importSummary.failedRows.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#dc2626',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <AlertTriangle size={14} />
                  <span>Validation Errors Detected:</span>
                </div>
                <div
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <table className="table" style={{ fontSize: '0.75rem', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>ROW</th>
                        <th>CODE</th>
                        <th>REASON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importSummary.failedRows.map((f, i) => (
                        <tr key={i}>
                          <td>Row {f.row}</td>
                          <td><code>{f.assetCode}</code></td>
                          <td style={{ color: '#dc2626' }}>{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageAssets;
