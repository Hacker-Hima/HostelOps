/**
 * HostelOps Centralized API Service
 * Handles all communication between the React Frontend and Express Backend.
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic request wrapper with error handling and JSON decoding
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses gracefully
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  // ── Auth & Profile ──
  auth: {
    getProfile: (role) => request(`/user/profile${role ? `?role=${role}` : ''}`),
    login: (credentials) => {
      const payload = typeof credentials === 'string' ? { role: credentials } : credentials;
      return request('/auth/login', { method: 'POST', body: payload });
    },
    getSecurityCheck: () => request('/auth/security-check'),
  },

  // ── Tickets & Complaints ──
  tickets: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/tickets${qs ? `?${qs}` : ''}`);
    },
    getById: (id) => request(`/tickets/${id}`),
    create: (data) => request('/tickets', { method: 'POST', body: data }),
    resolve: (id, payload = {}) => request(`/tickets/${id}/resolve`, { method: 'PATCH', body: payload }),
    assign: (id, workerName, actor) => request(`/tickets/${id}/assign`, { method: 'PATCH', body: { workerName, actor } }),
    updatePriority: (id, priority) => request(`/tickets/${id}/priority`, { method: 'PATCH', body: { priority } }),
    bulkUpdateStatus: (ids, status) => request('/tickets/bulk-status', { method: 'PATCH', body: { ids, status } }),
    getAllComments: () => request('/tickets/comments/all'),
    getComments: (id) => request(`/tickets/${id}/comments`),
    addComment: (id, commentData) => request(`/tickets/${id}/comments`, { method: 'POST', body: commentData }),
    getAllRatings: () => request('/tickets/ratings/all'),
    rate: (id, rating) => request(`/tickets/${id}/rate`, { method: 'POST', body: { rating } }),
  },

  // ── Staff Requests ──
  requests: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/requests${qs ? `?${qs}` : ''}`);
    },
    create: (data) => request('/requests', { method: 'POST', body: data }),
    approve: (id, actor) => request(`/requests/${id}/approve`, { method: 'PATCH', body: { actor } }),
    reject: (id, actor) => request(`/requests/${id}/reject`, { method: 'PATCH', body: { actor } }),
    bulkApprove: (ids, actor) => request('/requests/bulk-approve', { method: 'PATCH', body: { ids, actor } }),
  },

  // ── Workers Directory ──
  workers: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/workers${qs ? `?${qs}` : ''}`);
    },
    toggleAvailability: (id, availability) => request(`/workers/${id}/availability`, { method: 'PATCH', body: { availability } }),
    getJobs: (name) => request(`/workers/${encodeURIComponent(name)}/jobs`),
  },

  // ── Assets & QR Inventory ──
  assets: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/assets${qs ? `?${qs}` : ''}`);
    },
    getByTag: (tag) => request(`/assets/${encodeURIComponent(tag)}`),
    create: (data) => request('/assets', { method: 'POST', body: data }),
    updateCondition: (tag, condition, actor) => request(`/assets/${encodeURIComponent(tag)}/condition`, { method: 'PATCH', body: { condition, actor } }),
    addMaintenance: (tag, record) => request(`/assets/${encodeURIComponent(tag)}/maintenance`, { method: 'POST', body: record }),
  },

  // ── Budget & Analytics ──
  budget: {
    get: () => request('/budget'),
    update: (data) => request('/budget', { method: 'PATCH', body: data }),
  },
  analytics: {
    getOverview: () => request('/analytics/overview'),
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
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/audit-logs${qs ? `?${qs}` : ''}`);
    },
    create: (data) => request('/audit-logs', { method: 'POST', body: data }),
  },

  // Health check
  health: () => request('/health'),
};

export default api;
