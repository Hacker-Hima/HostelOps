import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { getStoredSession, saveSession, clearSession } from '../utils/authStorage';

/* ══════════════════════════════════════════════════════════
   ASYNC THUNKS — BACKEND DATABASE COMMUNICATION
══════════════════════════════════════════════════════════ */

// 1. Initial Hydration from Backend
export const fetchInitialData = createAsyncThunk(
  'assetOps/fetchInitialData',
  async (_, { rejectWithValue }) => {
    try {
      // First verify backend & database health
      let health = null;
      try {
        if (api.system && typeof api.system.health === 'function') {
          health = await api.system.health();
        } else if (typeof api.health === 'function') {
          health = await api.health();
        } else {
          const res = await fetch('/api/health');
          health = await res.json();
        }
      } catch {
        return rejectWithValue({
          type: 'BACKEND_UNAVAILABLE',
          message: 'Backend server is unreachable. Please verify server is running on port 5000.',
        });
      }

      if (health && health.database && !health.database.connected) {
        return rejectWithValue({
          type: 'DATABASE_UNAVAILABLE',
          message: 'Backend is running, but database connection is unavailable.',
          health,
        });
      }

      // Backend & DB reachable — fetch all resources with Promise.allSettled
      const endpoints = [
        api.assets.getAll(),
        api.assets.getCategories(),
        api.assets.getMaintenance(),
        api.assets.getTransfers(),
        api.assets.getAudits(),
        api.assets.getDisposals(),
        api.assets.getRequests(),
        api.assets.getReportsSummary(),
        api.workers.getAll(),
        api.audit.getAll(),
        api.notifications.getAll(),
        api.auth.getUsers(),
      ];

      const results = await Promise.allSettled(endpoints);

      const [
        assetsRes,
        categoriesRes,
        maintenanceRes,
        transfersRes,
        auditsRes,
        disposalsRes,
        requestsRes,
        reportsRes,
        workersRes,
        auditLogsRes,
        notifsRes,
        usersRes,
      ] = results;

      const failedEndpoints = [];
      const extract = (res, name, fallback) => {
        if (res.status === 'fulfilled') return res.value;
        failedEndpoints.push(name);
        return fallback;
      };

      // Standardize notifications to ensure isRead camelCase property
      const rawNotifs = extract(notifsRes, 'notifications', []);
      const normalizedNotifs = Array.isArray(rawNotifs)
        ? rawNotifs.map((n) => ({
            ...n,
            isRead: n.isRead !== undefined ? !!n.isRead : (n.is_read === 1 || n.is_read === true),
            is_read: n.isRead ? 1 : (n.is_read ?? 0),
          }))
        : [];

      return {
        assets: extract(assetsRes, 'assets', []),
        categories: extract(categoriesRes, 'categories', []),
        maintenanceTickets: extract(maintenanceRes, 'maintenance', []),
        transfers: extract(transfersRes, 'transfers', []),
        audits: extract(auditsRes, 'audits', []),
        disposals: extract(disposalsRes, 'disposals', []),
        assetRequests: extract(requestsRes, 'requests', []),
        reportsSummary: extract(reportsRes, 'reports', null),
        workers: extract(workersRes, 'workers', []),
        auditLogs: extract(auditLogsRes, 'auditLogs', []),
        notifications: normalizedNotifs,
        usersList: extract(usersRes, 'users', []),
        failedEndpoints,
        dbStatus: health?.database?.connected ? 'connected' : 'unknown',
      };
    } catch (err) {
      return rejectWithValue({
        type: 'INITIAL_FETCH_FAILED',
        message: err.message || 'Failed to fetch initial application data.',
      });
    }
  }
);

// 2. Asset Operations
export const createAssetAsync = createAsyncThunk(
  'assetOps/createAssetAsync',
  async (assetData, { rejectWithValue }) => {
    try {
      const created = await api.assets.create(assetData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateAssetAsync = createAsyncThunk(
  'assetOps/updateAssetAsync',
  async ({ tag, data }, { rejectWithValue }) => {
    try {
      const updated = await api.assets.update(tag, data);
      return { tag, updated };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteAssetAsync = createAsyncThunk(
  'assetOps/deleteAssetAsync',
  async (tag, { rejectWithValue }) => {
    try {
      await api.assets.delete(tag);
      return tag;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 3. Category Operations
export const createCategoryAsync = createAsyncThunk(
  'assetOps/createCategoryAsync',
  async (categoryData, { rejectWithValue }) => {
    try {
      const created = await api.assets.createCategory(categoryData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 4. Allocation Operations
export const allocateAssetAsync = createAsyncThunk(
  'assetOps/allocateAssetAsync',
  async (allocationData, { rejectWithValue }) => {
    try {
      const res = await api.assets.allocate(allocationData);
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 5. Return & Transfer Operations
export const returnAssetAsync = createAsyncThunk(
  'assetOps/returnAssetAsync',
  async (returnData, { rejectWithValue }) => {
    try {
      const res = await api.assets.returnAsset(returnData);
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const transferAssetAsync = createAsyncThunk(
  'assetOps/transferAssetAsync',
  async (transferData, { rejectWithValue }) => {
    try {
      const res = await api.assets.transfer(transferData);
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 6. Maintenance Operations
export const reportMaintenanceAsync = createAsyncThunk(
  'assetOps/reportMaintenanceAsync',
  async (ticketData, { rejectWithValue }) => {
    try {
      const created = await api.assets.reportMaintenance(ticketData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateMaintenanceAsync = createAsyncThunk(
  'assetOps/updateMaintenanceAsync',
  async ({ ticketId, data }, { rejectWithValue }) => {
    try {
      const res = await api.assets.updateMaintenance(ticketId, data);
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 7. Audit Operations
export const submitAuditAsync = createAsyncThunk(
  'assetOps/submitAuditAsync',
  async (auditData, { rejectWithValue }) => {
    try {
      const created = await api.assets.submitAudit(auditData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 8. Disposal Operations
export const submitDisposalAsync = createAsyncThunk(
  'assetOps/submitDisposalAsync',
  async (disposalData, { rejectWithValue }) => {
    try {
      const created = await api.assets.submitDisposal(disposalData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 9. Student Asset Request Operations
export const submitAssetRequestAsync = createAsyncThunk(
  'assetOps/submitAssetRequestAsync',
  async (requestData, { rejectWithValue }) => {
    try {
      const created = await api.assets.submitRequest(requestData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const reviewAssetRequestAsync = createAsyncThunk(
  'assetOps/reviewAssetRequestAsync',
  async ({ requestId, data }, { rejectWithValue }) => {
    try {
      const updated = await api.assets.reviewRequest(requestId, data);
      return updated;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 10. Notifications & Users
export const markNotificationReadAsync = createAsyncThunk(
  'assetOps/markNotificationReadAsync',
  async (id, { rejectWithValue }) => {
    try {
      const updated = await api.notifications.markRead(id);
      return { id, updated };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markAllNotificationsReadAsync = createAsyncThunk(
  'assetOps/markAllNotificationsReadAsync',
  async (_, { rejectWithValue }) => {
    try {
      await api.notifications.markAllRead();
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const registerUserAsync = createAsyncThunk(
  'assetOps/registerUserAsync',
  async (userData, { rejectWithValue }) => {
    try {
      const created = await api.auth.registerUser(userData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 11. Profile Update
export const updateProfileAsync = createAsyncThunk(
  'assetOps/updateProfileAsync',
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await api.auth.updateProfile(profileData);
      return res.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* ══════════════════════════════════════════════════════════
   INITIAL STATE & SESSION RESTORATION
══════════════════════════════════════════════════════════ */
const storedSession = getStoredSession();

const initialState = {
  /* Connection & Status */
  isLoading: false,
  isBackendConnected: false,
  dbStatus: 'unknown', // 'connected' | 'disconnected' | 'unknown'
  connectionError: null,
  apiError: null,
  authToken: storedSession ? storedSession.token : null,
  isAuthenticated: !!(storedSession && storedSession.user),

  /* Roles & Persona */
  currentRole: storedSession?.user?.role || 'login', // 'login' | 'admin' | 'user' | 'staff' | 'student'
  adminType: storedSession?.user?.admin_type || (storedSession?.user?.role === 'admin' ? 'superadmin' : ''),
  currentUser: storedSession?.user || null,
  rememberMe: storedSession?.remember ?? true,

  /* Active Navigation Tab */
  activeTab: 'register',

  /* UI Preferences */
  viewMode: 'desktop',
  themeMode: 'light',
  colorTheme: 'cyan',
  fontStyle: 'inter',
  fontSize: 'normal',

  /* 10 Lifecycle Data Collections */
  assets: [],
  categories: [],
  maintenanceTickets: [],
  transfers: [],
  audits: [],
  disposals: [],
  assetRequests: [],
  reportsSummary: null,
  workers: [],
  auditLogs: [],
  notifications: [],
  usersList: [],

  /* Modals & Overlays */
  selectedAssetTag: null,
  qrScannerModalOpen: false,
  newAssetModalOpen: false,
  allocateModalOpen: false,
  transferModalOpen: false,
  returnModalOpen: false,
  maintenanceModalOpen: false,
  disposalModalOpen: false,
  auditModalOpen: false,
  requestAssetModalOpen: false,
  profileModalOpen: false,
  settingsModalOpen: false,
  qrPreviewTag: null,

  /* Filters & Search */
  searchQuery: '',
  selectedCategoryFilter: 'All',
  selectedConditionFilter: 'All',
  selectedStatusFilter: 'All',
  selectedBlockFilter: 'All',

  /* Toast Alerts */
  toasts: [],
};

export const ticketSlice = createSlice({
  name: 'ticketStore',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, token, remember } = action.payload;
      state.isAuthenticated = true;
      state.currentUser = user;
      state.authToken = token;
      state.currentRole = user.role || 'user';
      state.adminType = user.admin_type || (user.role === 'admin' ? 'superadmin' : '');
      state.rememberMe = !!remember;
      saveSession({ user, token, remember });
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.currentUser = null;
      state.authToken = null;
      state.currentRole = 'login';
      state.adminType = '';
      clearSession();
    },
    setConnectionStatus: (state, action) => {
      state.isBackendConnected = action.payload.isBackendConnected;
      state.dbStatus = action.payload.dbStatus || state.dbStatus;
      state.connectionError = action.payload.error || null;
    },
    setRole: (state, action) => {
      state.currentRole = action.payload;
    },
    setAdminType: (state, action) => {
      state.adminType = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
      if (action.payload?.role) state.currentRole = action.payload.role;
      if (action.payload?.admin_type) state.adminType = action.payload.admin_type;
      if (state.authToken && action.payload) {
        saveSession({ user: action.payload, token: state.authToken, remember: state.rememberMe });
      }
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
    },
    setColorTheme: (state, action) => {
      state.colorTheme = action.payload;
    },
    setFontStyle: (state, action) => {
      state.fontStyle = action.payload;
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
    setSelectedAssetTag: (state, action) => {
      state.selectedAssetTag = action.payload;
    },
    setQrPreviewTag: (state, action) => {
      state.qrPreviewTag = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setCategoryFilter: (state, action) => {
      state.selectedCategoryFilter = action.payload;
    },
    setConditionFilter: (state, action) => {
      state.selectedConditionFilter = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.selectedStatusFilter = action.payload;
    },
    setBlockFilter: (state, action) => {
      state.selectedBlockFilter = action.payload;
    },
    setQrScannerModalOpen: (state, action) => {
      state.qrScannerModalOpen = action.payload;
    },
    setNewAssetModalOpen: (state, action) => {
      state.newAssetModalOpen = action.payload;
    },
    setAllocateModalOpen: (state, action) => {
      state.allocateModalOpen = action.payload;
    },
    setTransferModalOpen: (state, action) => {
      state.transferModalOpen = action.payload;
    },
    setReturnModalOpen: (state, action) => {
      state.returnModalOpen = action.payload;
    },
    setMaintenanceModalOpen: (state, action) => {
      state.maintenanceModalOpen = action.payload;
    },
    setDisposalModalOpen: (state, action) => {
      state.disposalModalOpen = action.payload;
    },
    setAuditModalOpen: (state, action) => {
      state.auditModalOpen = action.payload;
    },
    setRequestAssetModalOpen: (state, action) => {
      state.requestAssetModalOpen = action.payload;
    },
    setProfileModalOpen: (state, action) => {
      state.profileModalOpen = action.payload;
    },
    setSettingsModalOpen: (state, action) => {
      state.settingsModalOpen = action.payload;
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: action.payload.id || `t-${Date.now()}-${Math.random()}`,
        message: action.payload.message,
        type: action.payload.type || 'info', // 'success' | 'warn' | 'error' | 'info'
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setRadiusMode: (state, action) => {
      state.radiusMode = action.payload;
    },
    setLayoutMode: (state, action) => {
      state.layoutMode = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    updateUserProfile: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload };
      if (state.authToken) {
        saveSession({ user: state.currentUser, token: state.authToken, remember: state.rememberMe });
      }
    },
    markNotificationRead: (state, action) => {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) {
        notif.isRead = true;
        notif.is_read = 1;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
        n.is_read = 1;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      /* Initial Data Hydration */
      .addCase(fetchInitialData.pending, (state) => {
        state.isLoading = true;
        state.connectionError = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isBackendConnected = true;
        state.dbStatus = action.payload.dbStatus || 'connected';
        state.connectionError = null;
        state.assets = action.payload.assets;
        state.categories = action.payload.categories;
        state.maintenanceTickets = action.payload.maintenanceTickets;
        state.transfers = action.payload.transfers;
        state.audits = action.payload.audits;
        state.disposals = action.payload.disposals;
        state.assetRequests = action.payload.assetRequests;
        state.reportsSummary = action.payload.reportsSummary;
        state.workers = action.payload.workers;
        state.auditLogs = action.payload.auditLogs;
        state.notifications = action.payload.notifications;
        state.usersList = action.payload.usersList;
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.isLoading = false;
        state.isBackendConnected = false;
        const errPayload = action.payload;
        state.apiError = typeof errPayload === 'string' ? errPayload : errPayload?.message;
        state.connectionError = errPayload?.message || 'Unable to connect to backend';
        state.dbStatus = errPayload?.type === 'DATABASE_UNAVAILABLE' ? 'disconnected' : 'unknown';
      })

      /* Create Asset */
      .addCase(createAssetAsync.fulfilled, (state, action) => {
        state.assets.unshift(action.payload);
      })

      /* Update Asset */
      .addCase(updateAssetAsync.fulfilled, (state, action) => {
        const idx = state.assets.findIndex((a) => a.tag === action.payload.tag);
        if (idx !== -1) {
          state.assets[idx] = { ...state.assets[idx], ...action.payload.updated };
        }
      })

      /* Delete Asset */
      .addCase(deleteAssetAsync.fulfilled, (state, action) => {
        state.assets = state.assets.filter((a) => a.tag !== action.payload);
      })

      /* Create Category */
      .addCase(createCategoryAsync.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      })

      /* Allocate Asset */
      .addCase(allocateAssetAsync.fulfilled, (state, action) => {
        const updated = action.payload.asset;
        if (updated) {
          const idx = state.assets.findIndex((a) => a.tag === updated.tag);
          if (idx !== -1) state.assets[idx] = updated;
        }
      })

      /* Return Asset */
      .addCase(returnAssetAsync.fulfilled, (state, action) => {
        const updated = action.payload.asset;
        if (updated) {
          const idx = state.assets.findIndex((a) => a.tag === updated.tag);
          if (idx !== -1) state.assets[idx] = updated;
        }
      })

      /* Transfer Asset */
      .addCase(transferAssetAsync.fulfilled, (state, action) => {
        const updated = action.payload.asset;
        if (updated) {
          const idx = state.assets.findIndex((a) => a.tag === updated.tag);
          if (idx !== -1) state.assets[idx] = updated;
        }
        if (action.payload.transfer) {
          state.transfers.unshift(action.payload.transfer);
        }
      })

      /* Report Maintenance */
      .addCase(reportMaintenanceAsync.fulfilled, (state, action) => {
        state.maintenanceTickets.unshift(action.payload);
        const idx = state.assets.findIndex((a) => a.tag === action.payload.asset_tag);
        if (idx !== -1) {
          state.assets[idx].condition = 'Needs Repair';
          state.assets[idx].status = 'Under Maintenance';
        }
      })

      /* Update Maintenance */
      .addCase(updateMaintenanceAsync.fulfilled, (state, action) => {
        const updatedTicket = action.payload.ticket;
        if (updatedTicket) {
          const idx = state.maintenanceTickets.findIndex((m) => m.ticket_id === updatedTicket.ticket_id);
          if (idx !== -1) state.maintenanceTickets[idx] = updatedTicket;
        }
        const updatedAsset = action.payload.asset;
        if (updatedAsset) {
          const idx = state.assets.findIndex((a) => a.tag === updatedAsset.tag);
          if (idx !== -1) state.assets[idx] = updatedAsset;
        }
      })

      /* Submit Audit */
      .addCase(submitAuditAsync.fulfilled, (state, action) => {
        state.audits.unshift(action.payload);
      })

      /* Submit Disposal */
      .addCase(submitDisposalAsync.fulfilled, (state, action) => {
        state.disposals.unshift(action.payload);
        const idx = state.assets.findIndex((a) => a.tag === action.payload.asset_tag);
        if (idx !== -1) {
          state.assets[idx].status = 'Disposed';
          state.assets[idx].condition = 'Beyond Repair';
        }
      })

      /* Submit Request */
      .addCase(submitAssetRequestAsync.fulfilled, (state, action) => {
        state.assetRequests.unshift(action.payload);
      })

      /* Review Request */
      .addCase(reviewAssetRequestAsync.fulfilled, (state, action) => {
        const idx = state.assetRequests.findIndex((r) => r.request_id === action.payload.request_id);
        if (idx !== -1) state.assetRequests[idx] = action.payload;
      })

      /* Notification Read Async */
      .addCase(markNotificationReadAsync.fulfilled, (state, action) => {
        const notif = state.notifications.find((n) => n.id === action.payload.id);
        if (notif) {
          notif.isRead = true;
          notif.is_read = 1;
        }
      })
      .addCase(markAllNotificationsReadAsync.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
          n.is_read = 1;
        });
      })

      /* Register User */
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        state.usersList.push(action.payload);
      })

      /* Profile Update Async */
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        state.currentUser = { ...state.currentUser, ...action.payload };
        if (state.authToken) {
          saveSession({ user: state.currentUser, token: state.authToken, remember: state.rememberMe });
        }
      });
  },
});

export const {
  loginSuccess,
  logout,
  setConnectionStatus,
  setRole,
  setAdminType,
  setCurrentUser,
  setActiveTab,
  setViewMode,
  setThemeMode,
  setColorTheme,
  setRadiusMode,
  setLayoutMode,
  setLanguage,
  updateUserProfile,
  setFontStyle,
  setFontSize,
  setSelectedAssetTag,
  setQrPreviewTag,
  setSearchQuery,
  setCategoryFilter,
  setConditionFilter,
  setStatusFilter,
  setBlockFilter,
  setQrScannerModalOpen,
  setNewAssetModalOpen,
  setAllocateModalOpen,
  setTransferModalOpen,
  setReturnModalOpen,
  setMaintenanceModalOpen,
  setDisposalModalOpen,
  setAuditModalOpen,
  setRequestAssetModalOpen,
  setProfileModalOpen,
  setSettingsModalOpen,
  addToast,
  removeToast,
  markNotificationRead,
  markAllNotificationsRead,
} = ticketSlice.actions;

export default ticketSlice.reducer;