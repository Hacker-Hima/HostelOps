import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import {
  Users,
  Search,
  Trash2,
  Eye,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  UserPlus,
  Edit,
  Download,
  Wrench,
} from 'lucide-react';
import { exportToCSV } from '../../utils/exportCSV';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Pagination state (Backend Pagination)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Inspection Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAssets, setUserAssets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const initialUserForm = {
    name: '',
    email: '',
    password: '',
    role: 'student',
    hostelBlock: 'Block A',
    roomNumber: '101',
    phone: '',
    studentId: '',
  };
  const [userFormData, setUserFormData] = useState(initialUserForm);

  // Edit User Modal
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    hostelBlock: 'Block A',
    roomNumber: '101',
    phone: '',
    studentId: '',
    password: '',
  });

  const handleEditClick = (u) => {
    setEditingUserId(u._id);
    setEditFormData({
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'student',
      hostelBlock: u.hostelBlock || 'Block A',
      roomNumber: u.roomNumber || '101',
      phone: u.phone || '',
      studentId: u.studentId || '',
      password: '',
    });
    setIsEditUserOpen(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editFormData };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
      const res = await api.put(`/users/${editingUserId}`, payload);
      if (res.data.success) {
        setMessage({ text: 'User account details updated successfully', type: 'success' });
        setIsEditUserOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error updating user account',
        type: 'danger',
      });
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
      };
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.users || res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.totalItems || 0);
        setPage(res.data.currentPage || 1);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load users list from server', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleInspect = async (user) => {
    try {
      setSelectedUser(user);
      const res = await api.get(`/users/${user._id}`);
      if (res.data.success) {
        setUserAssets(res.data.assignedAssets || []);
      }
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Delete user ${name}? All assigned assets will be returned to Available.`)) {
      try {
        const res = await api.delete(`/users/${id}`);
        if (res.data.success) {
          setMessage({ text: res.data.message, type: 'success' });
          fetchUsers();
        }
      } catch (err) {
        setMessage({
          text: err.response?.data?.message || 'Error deleting user',
          type: 'danger',
        });
      }
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', userFormData);
      if (res.data.success) {
        setMessage({ text: 'User account created successfully', type: 'success' });
        setIsAddUserOpen(false);
        setUserFormData(initialUserForm);
        setPage(1);
        fetchUsers();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Error creating user account',
        type: 'danger',
      });
    }
  };

  const handleExportUsersCSV = () => {
    const reportData = users.map((u) => ({
      'Full Name': u.name,
      Email: u.email,
      Role: u.role === 'technician' ? 'Technician / Staff' : u.role === 'admin' ? 'Administrator' : 'Resident',
      'Student ID / Staff ID': u.studentId || '',
      'Hostel Block': u.hostelBlock,
      'Room Number': u.roomNumber,
      Phone: u.phone || '',
      'Assigned Assets Count': u.assignedAssetsCount || 0,
    }));
    exportToCSV(reportData, `Hostel_Users_Directory_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Hostel Residents & Administration</h1>
          <p className="page-subtitle">
            Directory of hostel students, wardens, room allocations, and individual asset holdings
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportUsersCSV}
            className="btn btn-secondary"
            id="btn-export-users-csv"
            title="Export user directory as CSV"
          >
            <Download size={16} />
            <span>Export Users (CSV)</span>
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="btn btn-primary"
            id="btn-add-user"
          >
            <UserPlus size={16} />
            <span>Add Resident / Staff</span>
          </button>
        </div>
      </div>

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
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '450px' }}
          >
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
                id="search-user-input"
                type="text"
                className="form-control"
                placeholder="Search by name, email, roll number, room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Role:</span>
            {['All', 'student', 'technician', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setRoleFilter(role);
                  setPage(1);
                }}
                className={`btn btn-sm ${roleFilter === role ? 'btn-primary' : 'btn-secondary'}`}
                id={`filter-user-role-${role}`}
              >
                {role === 'All' ? 'All Roles' : role === 'admin' ? 'Admins' : role === 'technician' ? 'Technicians / Staff' : 'Students'}
              </button>
            ))}
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
            <Users size={18} color="#2563eb" />
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
              User Accounts Directory ({totalItems} Users)
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
                <th>USER DETAILS</th>
                <th>ROLE</th>
                <th>STUDENT ID / ROLL</th>
                <th>HOSTEL LOCATION</th>
                <th>PHONE</th>
                <th>ASSIGNED ASSETS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto' }}></div>
                    <span style={{ color: '#64748b' }}>Loading user directory...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} id={`user-row-${u._id}`}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ color: '#0f172a' }}>{u.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background:
                            u.role === 'admin'
                              ? '#eff6ff'
                              : u.role === 'technician' || u.role === 'staff'
                              ? '#fef3c7'
                              : '#ecfdf5',
                          color:
                            u.role === 'admin'
                              ? '#1d4ed8'
                              : u.role === 'technician' || u.role === 'staff'
                              ? '#b45309'
                              : '#047857',
                        }}
                      >
                        {u.role === 'admin' ? (
                          <ShieldCheck size={12} />
                        ) : u.role === 'technician' || u.role === 'staff' ? (
                          <Wrench size={12} />
                        ) : (
                          <UserCheck size={12} />
                        )}
                        <span>
                          {u.role === 'admin'
                            ? 'Administrator'
                            : u.role === 'technician' || u.role === 'staff'
                            ? 'Technician / Staff'
                            : 'Resident'}
                        </span>
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>
                        {u.studentId || '-'}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {u.hostelBlock} • Rm {u.roomNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{u.phone || '-'}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: (u.assignedAssetsCount || 0) > 0 ? '#2563eb' : '#94a3b8',
                        }}
                      >
                        {u.assignedAssetsCount || 0} items
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="View assigned assets"
                          onClick={() => handleInspect(u)}
                          style={{ padding: '0.3rem 0.5rem' }}
                        >
                          <Eye size={14} />
                          <span>Inspect</span>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Edit user details"
                          onClick={() => handleEditClick(u)}
                          style={{ padding: '0.3rem 0.5rem', color: '#2563eb' }}
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Delete user"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            style={{ padding: '0.3rem 0.5rem', color: '#dc2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
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

      {/* Inspect Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Asset Holdings: ${selectedUser?.name}`}
      >
        <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.85rem', color: '#334155' }}>
            <strong>Email:</strong> {selectedUser?.email} | <strong>Location:</strong> {selectedUser?.hostelBlock} - Rm {selectedUser?.roomNumber}
          </p>
        </div>

        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
          Currently Assigned Assets ({userAssets.length})
        </h4>

        {userAssets.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', padding: '1.5rem', textAlign: 'center' }}>
            No assets currently assigned to this student.
          </p>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <table className="table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>ASSET NAME</th>
                  <th>CATEGORY</th>
                  <th>CONDITION</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {userAssets.map((asset) => (
                  <tr key={asset._id}>
                    <td><code>{asset.assetCode}</code></td>
                    <td style={{ fontWeight: 600 }}>{asset.assetName}</td>
                    <td>{asset.category}</td>
                    <td>{asset.condition}</td>
                    <td><StatusBadge status={asset.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
            Close
          </button>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Register New User Account"
      >
        <form onSubmit={handleCreateUserSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Arun Kumar"
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@hostel.edu"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password * (Min 6 chars)</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                minLength={6}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-control"
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
              >
                <option value="student">Student / Resident</option>
                <option value="technician">Technician / Maintenance Staff</option>
                <option value="admin">Hostel Warden / Administrator</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Student ID / Roll Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="HST-2026-001"
                value={userFormData.studentId}
                onChange={(e) => setUserFormData({ ...userFormData, studentId: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Hostel Block</label>
              <input
                type="text"
                className="form-control"
                placeholder="Block A"
                value={userFormData.hostelBlock}
                onChange={(e) => setUserFormData({ ...userFormData, hostelBlock: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="101"
                value={userFormData.roomNumber}
                onChange={(e) => setUserFormData({ ...userFormData, roomNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="text"
              className="form-control"
              placeholder="+91 98765 43210"
              value={userFormData.phone}
              onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddUserOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        title="Edit User Account Details"
      >
        <form onSubmit={handleEditUserSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-control"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-control"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              >
                <option value="student">Student / Resident</option>
                <option value="technician">Technician / Maintenance Staff</option>
                <option value="admin">Hostel Warden / Administrator</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Hostel Block</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.hostelBlock}
                onChange={(e) => setEditFormData({ ...editFormData, hostelBlock: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.roomNumber}
                onChange={(e) => setEditFormData({ ...editFormData, roomNumber: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Student ID / Roll Number</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.studentId}
                onChange={(e) => setEditFormData({ ...editFormData, studentId: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reset Password (Optional - Min 6 chars)</label>
            <input
              type="password"
              className="form-control"
              placeholder="Leave blank to keep unchanged"
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              minLength={6}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditUserOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageUsers;
