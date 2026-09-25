/**
 * Hostel Asset Management System — API Service
 * Central REST Client with Authorization Header Injection & Unified Error Handling
 */

import { getToken, clearSession } from '../utils/authStorage';

// Use Vite proxy (/api) in development, configurable via VITE_API_URL in production
const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';

/**
 * Central HTTP Request handler
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      // 401 Session expired handling (Requirement 8)
      if (response.status === 401) {
        clearSession();
        const msg = (typeof data === 'object' && (data?.message || data?.error)) || 'Session expired. Please sign in again.';
        // Dispatch session-expired custom event so UI can prompt login
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('hostelops:session-expired', { detail: { message: msg } }));
        }
        throw new Error(msg);
      }

      // 403 Forbidden handling
      if (response.status === 403) {
        const msg = (typeof data === 'object' && (data?.message || data?.error)) || 'Access forbidden: Insufficient permissions.';
        throw new Error(msg);
      }

      const errorMsg =
        (typeof data === 'object' && (data?.message || data?.error)) ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      console.warn(`[API Network Error] ${url} is unreachable.`);
      throw new Error('HostelOps backend is currently unreachable. Please check backend server status.', { cause: err });
    }
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  // ── 1. Auth & Profiles ──
  auth: {
    getDemoAccounts: () => request('/auth/demo-accounts'),
    getUsers: () => request('/auth/users'),
    registerUser: (data) => request('/auth/register', { method: 'POST', body: data }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    getProfile: (params = '') => request(`/user/profile${params ? `?${params}` : ''}`),
    getMe: () => request('/auth/me'),
    updateProfile: (data) => request('/auth/profile', { method: 'PATCH', body: data }),
  },

  // ── 2. Asset Register ──
  assets: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/assets${qs ? `?${qs}` : ''}`);
    },
    getByTag: (tag) => request(`/assets/${encodeURIComponent(tag)}`),
    create: (data) => request('/assets', { method: 'POST', body: data }),
    update: (tag, data) => request(`/assets/${encodeURIComponent(tag)}`, { method: 'PUT', body: data }),
    delete: (tag) => request(`/assets/${encodeURIComponent(tag)}`, { method: 'DELETE' }),

    // ── 3. Categories ──
    getCategories: () => request('/assets/categories/all'),
    createCategory: (data) => request('/assets/categories', { method: 'POST', body: data }),

    // ── 4. Allocation ──
    allocate: (data) => request('/assets/allocate', { method: 'POST', body: data }),

    // ── 5. Return & Transfer ──
    returnAsset: (data) => request('/assets/return', { method: 'POST', body: data }),
    transfer: (data) => request('/assets/transfer', { method: 'POST', body: data }),
    getTransfers: () => request('/assets/transfers/all'),

    // ── 6. Maintenance & Repairs ──
    getMaintenance: () => request('/assets/maintenance/all'),
    reportMaintenance: (data) => request('/assets/maintenance', { method: 'POST', body: data }),
    updateMaintenance: (ticketId, data) =>
      request(`/assets/maintenance/${encodeURIComponent(ticketId)}`, { method: 'PATCH', body: data }),

    // ── 7. Inventory Physical Audits ──
    getAudits: () => request('/assets/audits/all'),
    submitAudit: (data) => request('/assets/audit', { method: 'POST', body: data }),

    // ── 8. Asset Disposal ──
    getDisposals: () => request('/assets/disposal/all'),
    submitDisposal: (data) => request('/assets/disposal', { method: 'POST', body: data }),

    // ── 9. Student Asset Requests ──
    getRequests: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/assets/requests/all${qs ? `?${qs}` : ''}`);
    },
    submitRequest: (data) => request('/assets/requests', { method: 'POST', body: data }),
    reviewRequest: (requestId, data) =>
      request(`/assets/requests/${encodeURIComponent(requestId)}`, { method: 'PATCH', body: data }),

    // ── 10. Reports & Summary ──
    getReportsSummary: () => request('/assets/reports/summary'),
  },

  // ── Analytics Overview ──
  analytics: {
    getOverview: () => request('/analytics/overview'),
  },

  // ── Workers Directory ──
  workers: {
    getAll: () => request('/workers'),
    toggleAvailability: (id, availability) =>
      request(`/workers/${id}/availability`, { method: 'PATCH', body: { availability } }),
  },

  // ── Notifications ──
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
    create: (data) => request('/notifications', { method: 'POST', body: data }),
  },

  // ── Audit Logs ──
  audit: {
    getAll: () => request('/audit-logs'),
    create: (data) => request('/audit-logs', { method: 'POST', body: data }),
  },

  // ── System Health ──
  system: {
    health: () => request('/health'),
  },
  health: () => request('/health'),
};

export default api;
