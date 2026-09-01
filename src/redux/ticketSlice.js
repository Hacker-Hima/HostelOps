import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

/* ══════════════════════════════════════════════════════════
   ASYNC THUNKS — BACKEND DATABASE COMMUNICATION
══════════════════════════════════════════════════════════ */

// 1. Initial Full Data Hydration from Backend
export const fetchInitialData = createAsyncThunk(
  'hostel/fetchInitialData',
  async (_, { rejectWithValue }) => {
    try {
      const [
        ticketsRes,
        requestsRes,
        workersRes,
        assetsRes,
        budgetRes,
        auditRes,
        notifsRes,
        commentsRes,
        ratingsRes,
        profileRes,
        analyticsRes,
      ] = await Promise.all([
        api.tickets.getAll().catch(() => null),
        api.requests.getAll().catch(() => null),
        api.workers.getAll().catch(() => null),
        api.assets.getAll().catch(() => null),
        api.budget.get().catch(() => null),
        api.audit.getAll().catch(() => null),
        api.notifications.getAll().catch(() => null),
        api.tickets.getAllComments().catch(() => null),
        api.tickets.getAllRatings().catch(() => null),
        api.auth.getProfile().catch(() => null),
        api.analytics.getOverview().catch(() => null),
      ]);

      return {
        tickets: ticketsRes,
        staffRequests: requestsRes,
        workers: workersRes,
        assets: assetsRes,
        budget: budgetRes,
        auditLog: auditRes,
        notifications: notifsRes,
        ticketComments: commentsRes,
        ticketRatings: ratingsRes,
        currentUser: profileRes,
        analytics: analyticsRes,
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 2. Ticket Async Operations
export const createTicketAsync = createAsyncThunk(
  'hostel/createTicketAsync',
  async (ticketData, { rejectWithValue }) => {
    try {
      const created = await api.tickets.create(ticketData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const resolveTicketAsync = createAsyncThunk(
  'hostel/resolveTicketAsync',
  async ({ ticketId, notes, actor }, { rejectWithValue }) => {
    try {
      const resolved = await api.tickets.resolve(ticketId, { notes, actor });
      return { ticketId, resolved, notes, actor };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const assignWorkerAsync = createAsyncThunk(
  'hostel/assignWorkerAsync',
  async ({ ticketId, workerName, actor }, { rejectWithValue }) => {
    try {
      const updated = await api.tickets.assign(ticketId, workerName, actor);
      return { ticketId, workerName, updated };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateTicketPriorityAsync = createAsyncThunk(
  'hostel/updateTicketPriorityAsync',
  async ({ ticketId, priority }, { rejectWithValue }) => {
    try {
      const updated = await api.tickets.updatePriority(ticketId, priority);
      return { ticketId, priority, updated };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const bulkUpdateTicketStatusAsync = createAsyncThunk(
  'hostel/bulkUpdateTicketStatusAsync',
  async ({ ids, status }, { rejectWithValue }) => {
    try {
      await api.tickets.bulkUpdateStatus(ids, status);
      return { ids, status };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addCommentAsync = createAsyncThunk(
  'hostel/addCommentAsync',
  async ({ ticketId, comment }, { rejectWithValue }) => {
    try {
      const created = await api.tickets.addComment(ticketId, comment);
      return { ticketId, comment: created };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rateTicketAsync = createAsyncThunk(
  'hostel/rateTicketAsync',
  async ({ ticketId, rating }, { rejectWithValue }) => {
    try {
      const res = await api.tickets.rate(ticketId, rating);
      return res;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 3. Staff Request Async Operations
export const submitStaffRequestAsync = createAsyncThunk(
  'hostel/submitStaffRequestAsync',
  async (requestData, { rejectWithValue }) => {
    try {
      const created = await api.requests.create(requestData);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const approveStaffRequestAsync = createAsyncThunk(
  'hostel/approveStaffRequestAsync',
  async ({ id, actor, cost }, { rejectWithValue }) => {
    try {
      const approved = await api.requests.approve(id, actor);
      return { id, approved, cost };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const rejectStaffRequestAsync = createAsyncThunk(
  'hostel/rejectStaffRequestAsync',
  async ({ id, actor }, { rejectWithValue }) => {
    try {
      const rejected = await api.requests.reject(id, actor);
      return { id, rejected };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const bulkApproveStaffRequestsAsync = createAsyncThunk(
  'hostel/bulkApproveStaffRequestsAsync',
  async ({ ids, actor }, { rejectWithValue }) => {
    try {
      const res = await api.requests.bulkApprove(ids, actor);
      return { ids, totalCost: res.totalCost };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 4. Asset Async Operations
export const updateAssetConditionAsync = createAsyncThunk(
  'hostel/updateAssetConditionAsync',
  async ({ tag, condition, actor }, { rejectWithValue }) => {
    try {
      const updated = await api.assets.updateCondition(tag, condition, actor);
      return { tag, condition, updated };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addAssetMaintenanceRecordAsync = createAsyncThunk(
  'hostel/addAssetMaintenanceRecordAsync',
  async ({ tag, record }, { rejectWithValue }) => {
    try {
      const updated = await api.assets.addMaintenance(tag, record);
      return { tag, record, updated };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 5. Worker Async Operations
export const toggleWorkerAvailabilityAsync = createAsyncThunk(
  'hostel/toggleWorkerAvailabilityAsync',
  async ({ id, availability }, { rejectWithValue }) => {
    try {
      const updated = await api.workers.toggleAvailability(id, availability);
      return { id, availability, updated };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 6. Notification Async Operations
export const markNotificationReadAsync = createAsyncThunk(
  'hostel/markNotificationReadAsync',
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
  'hostel/markAllNotificationsReadAsync',
  async (_, { rejectWithValue }) => {
    try {
      const all = await api.notifications.markAllRead();
      return all;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// 7. Audit Log Async Operations
export const addAuditEntryAsync = createAsyncThunk(
  'hostel/addAuditEntryAsync',
  async (entry, { rejectWithValue }) => {
    try {
      const created = await api.audit.create(entry);
      return created;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* ══════════════════════════════════════════════════════════
   INITIAL STATE
══════════════════════════════════════════════════════════ */
const initialState = {
  /* ── Network & Connection Status ── */
  isLoading: false,
  isBackendConnected: false,
  apiError: null,

  /* ── Navigation & View ── */
  currentRole: 'login',
  currentPage: 'login',
  viewMode: 'desktop',          // 'mobile' | 'desktop'
  selectedTicketId: null,

  /* ── Customization Settings ── */
  themeMode: 'dark',            // 'dark' | 'light'
  colorTheme: 'purple',         // 'purple' | 'cyan' | 'green' | 'orange' | 'red' | 'pink'
  language: 'en',               // 'en' | 'hi' | 'ta' | 'te' | 'es'

  /* ── Current User ── */
  currentUser: {
    name: 'Himachalam',
    initials: 'HC',
    room: 'A-204',
    block: 'Block A',
    floor: 'Floor 2',
    rollNumber: '21CS204',
    email: 'hima@hostel.edu',
    phone: '+91 98765 43210',
  },

  /* ── Toast Notifications (UI) ── */
  toasts: [],

  /* ── Ticket Drawer ── */
  drawerTicketId: null,

  /* ── Ticket Comments (ticketId → [{id,author,role,text,time}]) ── */
  ticketComments: {
    'TKT-312': [
      { id: 'C1', author: 'Dr. Meena Sharma', role: 'Asst. Warden', text: 'Worker has been dispatched. Should be resolved by evening.', time: '2 hrs ago' },
      { id: 'C2', author: 'Sarathi Kamal', role: 'Technician', text: 'On site. Checking the pipe joint now.', time: '1 hr ago' },
    ],
    'TKT-318': [
      { id: 'C3', author: 'Dr. Meena Sharma', role: 'Asst. Warden', text: 'High priority — please handle ASAP. Safety concern.', time: '20 min ago' },
    ],
  },

  /* ── Ticket Satisfaction Ratings (ticketId → 1-5) ── */
  ticketRatings: {
    'TKT-315': 4,
    'TKT-319': 5,
  },

  /* ── Notifications ── */
  notifications: [
    { id: 'N1', message: 'Your ticket TKT-312 has been assigned to Sarathi Kamal', type: 'info',    isRead: false, time: '10 min ago' },
    { id: 'N2', message: 'TKT-315 Internet Outage has been resolved',               type: 'success', isRead: false, time: '2 hrs ago' },
    { id: 'N3', message: 'New complaint logged in Block A — Room 309',              type: 'warn',    isRead: true,  time: '1 day ago' },
    { id: 'N4', message: 'Principal approved REQ-4092 — ₹45,000 released',         type: 'success', isRead: true,  time: '2 days ago' },
  ],

  /* ── Tickets ── */
  tickets: [
    { id: 'TKT-312', title: 'Plumbing Issue in Washroom',   student: 'Himachalam',     room: 'A-204', category: 'Plumbing',    priority: 'High',   status: 'In Progress', assignedWorker: 'Sarathi Kamal', assetTag: 'QR-A204-PLM-01', createdAt: '2 days ago',  creatorRole: 'Student', description: 'Water leaking from the tap joint near the washbasin. Has been dripping for 3 days.' },
    { id: 'TKT-314', title: 'AC Not Cooling Properly',       student: 'Naveen',         room: 'A-112', category: 'Electrical',  priority: 'Medium', status: 'Pending',     assignedWorker: 'Unassigned',   assetTag: 'QR-A112-AC-01',  createdAt: '5 hours ago', creatorRole: 'Student', description: 'The AC runs but does not cool below 26°C even at full setting.' },
    { id: 'TKT-315', title: 'Internet Outage',               student: 'Devansh Chouhan',room: 'A-309', category: 'Networking',  priority: 'Low',    status: 'Resolved',    assignedWorker: 'Dhariq Anwar', assetTag: 'QR-A309-RTR-01', createdAt: '1 week ago',  creatorRole: 'Student', description: 'No internet connectivity on the entire floor. Router seems down.' },
    { id: 'TKT-318', title: 'Geyser Sparking',               student: 'Venkatesh',      room: 'A-215', category: 'Electrical',  priority: 'High',   status: 'In Progress', assignedWorker: 'Mohan Kumar',  assetTag: 'QR-A215-GYS-01', createdAt: '1 day ago',   creatorRole: 'Student', description: 'Electric geyser is sparking when switched on. Potential fire hazard.' },
    { id: 'TKT-319', title: 'Power Socket Repair',           student: 'Nickson',        room: 'A-101', category: 'Electrical',  priority: 'Low',    status: 'Resolved',    assignedWorker: 'Sarathi Kamal',assetTag: 'QR-A101-SKT-02', createdAt: '4 days ago',  creatorRole: 'Student', description: 'Wall socket near desk is loose and does not hold plug properly.' },
    { id: 'TKT-320', title: 'Ceiling Fan Noise',             student: 'Arjun',          room: 'B-304', category: 'Electrical',  priority: 'High',   status: 'Pending',     assignedWorker: 'Unassigned',   assetTag: 'QR-B304-FAN-01', createdAt: '3 hours ago', creatorRole: 'Student', description: 'Fan makes loud grinding sound, worse at high speed.' },
    { id: 'TKT-321', title: 'Broken Chair Leg',              student: 'Priya',          room: 'C-201', category: 'Furniture',   priority: 'Low',    status: 'Pending',     assignedWorker: 'Unassigned',   assetTag: 'QR-C201-CHR-02', createdAt: '6 hours ago', creatorRole: 'Student', description: 'Study chair front leg is cracked and unstable.' },
    { id: 'TKT-322', title: 'Bathroom Door Latch Broken',    student: 'Himachalam',     room: 'A-204', category: 'Furniture',   priority: 'Medium', status: 'Pending',     assignedWorker: 'Unassigned',   assetTag: 'QR-A204-DR-01',  createdAt: '1 hour ago',  creatorRole: 'Student', description: 'Bathroom door latch does not lock from inside.' },
  ],

  /* ── Ticket Volume (last 7 days) for trend charts ── */
  ticketVolume7d: [3, 5, 2, 8, 4, 6, 7],
  ticketVolume30d: [12, 9, 15, 8, 11, 14, 10, 7, 9, 13, 11, 8, 6, 10, 12, 15, 9, 8, 11, 14, 10, 7, 9, 13, 11, 8, 6, 10, 12, 15],
  budgetBurn7d: [310000, 318000, 322000, 328000, 332000, 337000, 340000],

  /* ── Staff Requests ── */
  staffRequests: [
    { id: 'REQ-4092', title: 'Mess Chimney Replacement',    dept: 'Mess & Dining', cost: 45000,  status: 'Pending Res. Warden', time: 'Submitted today',      submittedBy: 'Sanji' },
    { id: 'REQ-4080', title: 'Hostel B Plumbing Overhaul',  dept: 'Maintenance',   cost: 120000, status: 'Pending Principal',   time: '27 Jul, 02:15 PM',     submittedBy: 'Rajan Kumar' },
    { id: 'REQ-4055', title: 'CCTV System Upgrade',         dept: 'Security',      cost: 85000,  status: 'Pending Principal',   time: '26 Jul, 09:00 AM',     submittedBy: 'Durai Selvam' },
    { id: 'REQ-4031', title: 'Kitchen Exhaust Fan',         dept: 'Mess & Dining', cost: 8500,   status: 'Approved',            time: '28 Nov 2024, 11:00 AM', submittedBy: 'Sanji' },
    { id: 'REQ-4010', title: 'Gas Pipeline Repair',         dept: 'Maintenance',   cost: 12000,  status: 'Approved',            time: '12 Jan 2025, 09:30 AM', submittedBy: 'Rajan Kumar' },
  ],

  /* ── Workers ── */
  workers: [
    { id: 'W1', name: 'Sarathi Kamal', skill: 'Electrician', phone: '+91 98765 43210', availability: 'Available', jobs: 2, rating: 4.8, completedJobs: 142 },
    { id: 'W2', name: 'Dhariq Anwar',  skill: 'Plumber',     phone: '+91 98765 09987', availability: 'Busy',      jobs: 4, rating: 4.6, completedJobs: 98  },
    { id: 'W3', name: 'Mohan Kumar',   skill: 'Electrician', phone: '+91 98765 54321', availability: 'Available', jobs: 1, rating: 4.7, completedJobs: 210 },
    { id: 'W4', name: 'Selvam R.',     skill: 'Carpenter',   phone: '+91 98765 11122', availability: 'Available', jobs: 0, rating: 4.5, completedJobs: 76  },
    { id: 'W5', name: 'Rajan M.',      skill: 'Plumber',     phone: '+91 98765 66677', availability: 'Busy',      jobs: 3, rating: 4.9, completedJobs: 183 },
  ],

  /* ── Assets ── */
  assets: [
    { tag: 'QR-A302-BED-01', name: 'Single Bed',       category: 'Furniture',   location: 'Room 302, Block A', condition: 'Good',              lastChecked: '10 Aug 2025', value: 8000,  maintenanceHistory: [{ date:'10 Aug 2025', action:'Annual inspection — Good', actor:'Dr. Meena Sharma', color:'var(--accent-green)' }, { date:'15 Jan 2025', action:'Minor repair on frame', actor:'Selvam R.', color:'var(--accent-cyan)' }] },
    { tag: 'QR-A302-DSK-01', name: 'Study Desk',        category: 'Furniture',   location: 'Room 302, Block A', condition: 'Needs Repair',      lastChecked: '05 Aug 2025', value: 4500,  maintenanceHistory: [{ date:'05 Aug 2025', action:'Surface crack noted — needs repair', actor:'Dr. Meena Sharma', color:'var(--accent-yellow)' }] },
    { tag: 'QR-A302-AC-01',  name: 'Split AC 1.5T',     category: 'Appliance',   location: 'Room 302, Block A', condition: 'Good',              lastChecked: '12 Aug 2025', value: 35000, maintenanceHistory: [{ date:'12 Aug 2025', action:'Annual servicing done', actor:'Sarathi Kamal', color:'var(--accent-green)' }, { date:'01 Mar 2025', action:'Gas refill & cleaning', actor:'Mohan Kumar', color:'var(--accent-cyan)' }] },
    { tag: 'QR-B112-FAN-02', name: 'Ceiling Fan',        category: 'Electrical',  location: 'Room 112, Block B', condition: 'Damaged',           lastChecked: '01 Aug 2025', value: 2500,  maintenanceHistory: [{ date:'01 Aug 2025', action:'Blade bent — marked damaged', actor:'Dr. Meena Sharma', color:'var(--accent-red)' }] },
    { tag: 'QR-C208-LGT-01', name: 'LED Tube 20W',       category: 'Electrical',  location: 'Room 208, Block C', condition: 'Under Maintenance', lastChecked: '08 Aug 2025', value: 800,   maintenanceHistory: [{ date:'08 Aug 2025', action:'Flickering — under maintenance', actor:'Sarathi Kamal', color:'var(--accent-primary)' }] },
    { tag: 'QR-A304-RTR-01', name: 'Wi-Fi AP Router',    category: 'Networking',  location: 'Room 304, Block A', condition: 'Good',              lastChecked: '14 Aug 2025', value: 6000,  maintenanceHistory: [{ date:'14 Aug 2025', action:'Firmware updated', actor:'Dhariq Anwar', color:'var(--accent-green)' }] },
    { tag: 'QR-D101-GYS-01', name: 'Electric Geyser 25L',category: 'Appliance',   location: 'Room 101, Block D', condition: 'Good',              lastChecked: '11 Aug 2025', value: 7500,  maintenanceHistory: [{ date:'11 Aug 2025', action:'Safety check passed', actor:'Mohan Kumar', color:'var(--accent-green)' }] },
    { tag: 'QR-B205-CHR-03', name: 'Study Chair',        category: 'Furniture',   location: 'Room 205, Block B', condition: 'Good',              lastChecked: '09 Aug 2025', value: 2200,  maintenanceHistory: [{ date:'09 Aug 2025', action:'Annual inspection — Good', actor:'Dr. Meena Sharma', color:'var(--accent-green)' }] },
  ],

  /* ── Audit Log ── */
  auditLog: [
    { id: 'AL-001', action: 'Ticket Created',          actor: 'Himachalam (Student)',    target: 'TKT-312',  timestamp: '2026-08-22 08:14 AM', category: 'Ticket' },
    { id: 'AL-002', action: 'Worker Assigned',         actor: 'Dr. Meena Sharma (AW)',  target: 'TKT-312',  timestamp: '2026-08-22 09:30 AM', category: 'Assignment' },
    { id: 'AL-003', action: 'Staff Request Submitted', actor: 'Sanji (Staff)',           target: 'REQ-4092', timestamp: '2026-08-24 10:00 AM', category: 'Request' },
    { id: 'AL-004', action: 'Request Endorsed',        actor: 'Dr. Meena Sharma (AW)',  target: 'REQ-4092', timestamp: '2026-08-24 10:15 AM', category: 'Approval' },
    { id: 'AL-005', action: 'Ticket Resolved',         actor: 'Dhariq Anwar (Worker)',  target: 'TKT-315',  timestamp: '2026-08-23 04:45 PM', category: 'Ticket' },
    { id: 'AL-006', action: 'Asset Condition Updated', actor: 'Dr. Meena Sharma (AW)',  target: 'QR-B112-FAN-02', timestamp: '2026-08-21 11:00 AM', category: 'Asset' },
    { id: 'AL-007', action: 'Request Approved',        actor: 'Prof. R. Iyer (RW)',     target: 'REQ-4031', timestamp: '2026-08-20 03:15 PM', category: 'Approval' },
    { id: 'AL-008', action: 'Notification Sent',       actor: 'System',                 target: 'Himachalam',timestamp: '2026-08-22 09:31 AM', category: 'System' },
  ],

  /* ── Budget ── */
  budget: {
    total: 500000,
    spent: 340000,
    pending: 115000,
    categories: [
      { name: 'Electrical',  spent: 98000,  budget: 140000 },
      { name: 'Plumbing',    spent: 72000,  budget: 100000 },
      { name: 'Furniture',   spent: 45000,  budget: 80000  },
      { name: 'Appliances',  spent: 85000,  budget: 120000 },
      { name: 'Networking',  spent: 40000,  budget: 60000  },
    ],
  },
};

export const ticketSlice = createSlice({
  name: 'hostel',
  initialState,
  reducers: {
    /* ── Navigation ── */
    setRole: (state, action) => {
      state.currentRole = action.payload;
      const defaultPages = {
        login: 'login', student: 'home', staff: 'dashboard',
        'asst-warden': 'dashboard', 'res-warden': 'dashboard',
        technician: 'feed', assets: 'registry', principal: 'dashboard',
      };
      state.currentPage = defaultPages[action.payload] || 'home';
    },
    setPage: (state, action) => { state.currentPage = action.payload; },
    setViewMode: (state, action) => { state.viewMode = action.payload; },
    selectTicket: (state, action) => { state.selectedTicketId = action.payload; },

    /* ── Ticket Drawer ── */
    openTicketDrawer: (state, action) => { state.drawerTicketId = action.payload; },
    closeTicketDrawer: (state) => { state.drawerTicketId = null; },

    /* ── Toast System ── */
    addToast: (state, action) => {
      state.toasts.push(action.payload);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },

    /* ── Comments ── */
    addComment: (state, action) => {
      const { ticketId, comment } = action.payload;
      if (!state.ticketComments[ticketId]) state.ticketComments[ticketId] = [];
      state.ticketComments[ticketId].push(comment);
    },

    /* ── Satisfaction Rating ── */
    rateTicket: (state, action) => {
      const { ticketId, rating } = action.payload;
      state.ticketRatings[ticketId] = rating;
    },

    /* ── Customization Settings ── */
    setThemeMode: (state, action) => { state.themeMode = action.payload; },
    setColorTheme: (state, action) => { state.colorTheme = action.payload; },
    setLanguage: (state, action) => { state.language = action.payload; },

    /* ── Ticket Actions (Sync fallback) ── */
    addTicket: (state, action) => { state.tickets.unshift(action.payload); },
    addStudentTicket: (state, action) => { state.tickets.unshift(action.payload); },
    resolveTicket: (state, action) => {
      const t = state.tickets.find((t) => t.id === action.payload);
      if (t) t.status = 'Resolved';
    },
    assignWorkerToTicket: (state, action) => {
      const { ticketId, workerName } = action.payload;
      const t = state.tickets.find((t) => t.id === ticketId);
      if (t) { t.assignedWorker = workerName; t.status = 'In Progress'; }
    },
    updateTicketPriority: (state, action) => {
      const { ticketId, priority } = action.payload;
      const t = state.tickets.find(t => t.id === ticketId);
      if (t) t.priority = priority;
    },

    /* ── Staff Request Actions ── */
    approveStaffReq: (state, action) => {
      const r = state.staffRequests.find((r) => r.id === action.payload);
      if (r) r.status = 'Approved';
    },
    rejectStaffReq: (state, action) => {
      const r = state.staffRequests.find((r) => r.id === action.payload);
      if (r) r.status = 'Rejected';
    },

    /* ── Worker / Asset Actions ── */
    markJobComplete: (state, action) => {
      const t = state.tickets.find((t) => t.id === action.payload);
      if (t) t.status = 'Resolved';
    },
    updateAssetCondition: (state, action) => {
      const { tag, condition } = action.payload;
      const a = state.assets.find((a) => a.tag === tag);
      if (a) a.condition = condition;
    },
    addAssetMaintenanceRecord: (state, action) => {
      const { tag, record } = action.payload;
      const a = state.assets.find(a => a.tag === tag);
      if (a) { if (!a.maintenanceHistory) a.maintenanceHistory = []; a.maintenanceHistory.unshift(record); }
    },

    /* ── Notification Actions ── */
    markNotificationRead: (state, action) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) n.isRead = true;
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((n) => { n.isRead = true; });
    },
    addNotification: (state, action) => { state.notifications.unshift(action.payload); },

    /* ── Audit Log ── */
    addAuditEntry: (state, action) => { state.auditLog.unshift(action.payload); },
  },

  /* ── Extra Reducers for Async Thunk Backend Integration ── */
  extraReducers: (builder) => {
    // 1. Initial Data Fetch
    builder
      .addCase(fetchInitialData.pending, (state) => {
        state.isLoading = true;
        state.apiError = null;
      })
      .addCase(fetchInitialData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isBackendConnected = true;

        const {
          tickets,
          staffRequests,
          workers,
          assets,
          budget,
          auditLog,
          notifications,
          ticketComments,
          ticketRatings,
          currentUser,
          analytics,
        } = action.payload;

        if (tickets && tickets.length) state.tickets = tickets;
        if (staffRequests && staffRequests.length) state.staffRequests = staffRequests;
        if (workers && workers.length) state.workers = workers;
        if (assets && assets.length) state.assets = assets;
        if (budget) state.budget = budget;
        if (auditLog && auditLog.length) state.auditLog = auditLog;
        if (notifications && notifications.length) state.notifications = notifications;
        if (ticketComments && Object.keys(ticketComments).length) state.ticketComments = ticketComments;
        if (ticketRatings && Object.keys(ticketRatings).length) state.ticketRatings = ticketRatings;
        if (currentUser) state.currentUser = { ...state.currentUser, ...currentUser };
        if (analytics) {
          if (analytics.ticketVolume7d) state.ticketVolume7d = analytics.ticketVolume7d;
          if (analytics.ticketVolume30d) state.ticketVolume30d = analytics.ticketVolume30d;
          if (analytics.budgetBurn7d) state.budgetBurn7d = analytics.budgetBurn7d;
        }
      })
      .addCase(fetchInitialData.rejected, (state, action) => {
        state.isLoading = false;
        state.isBackendConnected = false;
        state.apiError = action.payload || 'Failed to connect to backend';
      });

    // 2. Create Ticket
    builder.addCase(createTicketAsync.fulfilled, (state, action) => {
      const created = action.payload;
      state.tickets.unshift(created);
      state.auditLog.unshift({
        id: `AL-${Date.now()}`,
        action: 'Ticket Created',
        actor: `${created.student} (Student)`,
        target: created.id,
        timestamp: new Date().toLocaleString(),
        category: 'Ticket',
      });
      state.notifications.unshift({
        id: `N-${Date.now()}`,
        message: `New complaint ${created.id} logged in ${created.room} (${created.category})`,
        type: 'info',
        isRead: false,
        time: 'Just now',
      });
    });

    // 3. Resolve Ticket
    builder.addCase(resolveTicketAsync.fulfilled, (state, action) => {
      const { ticketId, notes, actor } = action.payload;
      const t = state.tickets.find((tk) => tk.id === ticketId);
      if (t) t.status = 'Resolved';
      if (notes) {
        if (!state.ticketComments[ticketId]) state.ticketComments[ticketId] = [];
        state.ticketComments[ticketId].push({
          id: `C${Date.now()}`,
          author: actor || 'User',
          role: (actor && actor.includes('Tech')) ? 'Technician' : 'Student',
          text: notes,
          time: 'Just now',
        });
      }
      state.auditLog.unshift({
        id: `AL-${Date.now()}`,
        action: 'Ticket Resolved',
        actor: actor || 'User',
        target: ticketId,
        timestamp: new Date().toLocaleString(),
        category: 'Ticket',
      });
    });

    // 4. Assign Worker
    builder.addCase(assignWorkerAsync.fulfilled, (state, action) => {
      const { ticketId, workerName } = action.payload;
      const t = state.tickets.find((tk) => tk.id === ticketId);
      if (t) {
        t.assignedWorker = workerName;
        t.status = 'In Progress';
      }
      const w = state.workers.find(worker => worker.name === workerName);
      if (w) w.jobs += 1;
      state.auditLog.unshift({
        id: `AL-${Date.now()}`,
        action: 'Worker Assigned',
        actor: 'Dr. Meena Sharma (AW)',
        target: ticketId,
        timestamp: new Date().toLocaleString(),
        category: 'Assignment',
      });
      state.notifications.unshift({
        id: `N-${Date.now()}`,
        message: `Ticket ${ticketId} has been assigned to ${workerName}`,
        type: 'info',
        isRead: false,
        time: 'Just now',
      });
    });

    // 5. Update Priority
    builder.addCase(updateTicketPriorityAsync.fulfilled, (state, action) => {
      const { ticketId, priority } = action.payload;
      const t = state.tickets.find((tk) => tk.id === ticketId);
      if (t) t.priority = priority;
    });

    // 6. Bulk Update Ticket Status
    builder.addCase(bulkUpdateTicketStatusAsync.fulfilled, (state, action) => {
      const { ids, status } = action.payload;
      state.tickets.forEach((t) => {
        if (ids.includes(t.id)) {
          t.status = status;
        }
      });
    });

    // 7. Add Comment
    builder.addCase(addCommentAsync.fulfilled, (state, action) => {
      const { ticketId, comment } = action.payload;
      if (!state.ticketComments[ticketId]) state.ticketComments[ticketId] = [];
      state.ticketComments[ticketId].push(comment);
    });

    // 8. Rate Ticket
    builder.addCase(rateTicketAsync.fulfilled, (state, action) => {
      const { ticketId, rating } = action.payload;
      state.ticketRatings[ticketId] = rating;
    });

    // 9. Submit Staff Request
    builder.addCase(submitStaffRequestAsync.fulfilled, (state, action) => {
      const req = action.payload;
      state.staffRequests.unshift(req);
      state.auditLog.unshift({
        id: `AL-${Date.now()}`,
        action: 'Staff Request Submitted',
        actor: `${req.submittedBy} (Staff)`,
        target: req.id,
        timestamp: new Date().toLocaleString(),
        category: 'Request',
      });
      state.notifications.unshift({
        id: `N-${Date.now()}`,
        message: `New ${req.dept} request ${req.id} for ₹${req.cost.toLocaleString()} submitted`,
        type: 'info',
        isRead: false,
        time: 'Just now',
      });
    });

    // 10. Approve Staff Request
    builder.addCase(approveStaffRequestAsync.fulfilled, (state, action) => {
      const { id, cost } = action.payload;
      const r = state.staffRequests.find((req) => req.id === id);
      if (r) r.status = 'Approved';
      if (cost || (r && r.cost)) {
        const amount = cost || r.cost;
        state.budget.spent += amount;
        state.budget.pending = Math.max(0, state.budget.pending - amount);
      }
      state.auditLog.unshift({
        id: `AL-${Date.now()}`,
        action: 'Request Approved',
        actor: 'Prof. R. Iyer (RW)',
        target: id,
        timestamp: new Date().toLocaleString(),
        category: 'Approval',
      });
    });

    // 11. Reject Staff Request
    builder.addCase(rejectStaffRequestAsync.fulfilled, (state, action) => {
      const { id } = action.payload;
      const r = state.staffRequests.find((req) => req.id === id);
      if (r) r.status = 'Rejected';
      if (r) {
        state.budget.pending = Math.max(0, state.budget.pending - r.cost);
      }
      state.auditLog.unshift({
        id: `AL-${Date.now()}`,
        action: 'Request Rejected',
        actor: 'Prof. R. Iyer (RW)',
        target: id,
        timestamp: new Date().toLocaleString(),
        category: 'Approval',
      });
    });

    // 12. Bulk Approve Staff Requests
    builder.addCase(bulkApproveStaffRequestsAsync.fulfilled, (state, action) => {
      const { ids, totalCost } = action.payload;
      state.staffRequests.forEach((r) => {
        if (ids.includes(r.id)) {
          r.status = 'Approved';
        }
      });
      if (totalCost) {
        state.budget.spent += totalCost;
        state.budget.pending = Math.max(0, state.budget.pending - totalCost);
      }
    });

    // 13. Update Asset Condition
    builder.addCase(updateAssetConditionAsync.fulfilled, (state, action) => {
      const { tag, condition } = action.payload;
      const a = state.assets.find((ast) => ast.tag === tag);
      if (a) a.condition = condition;
      state.auditLog.unshift({
        id: `AL-${Date.now()}`,
        action: 'Asset Condition Updated',
        actor: 'Dr. Meena Sharma (Asset Mgr)',
        target: tag,
        timestamp: new Date().toLocaleString(),
        category: 'Asset',
      });
    });

    // 14. Add Asset Maintenance Record
    builder.addCase(addAssetMaintenanceRecordAsync.fulfilled, (state, action) => {
      const { tag, record } = action.payload;
      const a = state.assets.find((ast) => ast.tag === tag);
      if (a) {
        if (!a.maintenanceHistory) a.maintenanceHistory = [];
        a.maintenanceHistory.unshift(record);
      }
    });

    // 15. Toggle Worker Availability
    builder.addCase(toggleWorkerAvailabilityAsync.fulfilled, (state, action) => {
      const { id, availability } = action.payload;
      const w = state.workers.find((wkr) => wkr.id === id || wkr.name === id);
      if (w) w.availability = availability;
    });

    // 16. Notification Read Updates
    builder.addCase(markNotificationReadAsync.fulfilled, (state, action) => {
      const { id } = action.payload;
      const n = state.notifications.find((notif) => notif.id === id);
      if (n) n.isRead = true;
    });

    builder.addCase(markAllNotificationsReadAsync.fulfilled, (state) => {
      state.notifications.forEach((n) => { n.isRead = true; });
    });

    // 17. Add Audit Entry
    builder.addCase(addAuditEntryAsync.fulfilled, (state, action) => {
      state.auditLog.unshift(action.payload);
    });
  },
});

export const {
  setRole, setPage, setViewMode, selectTicket,
  openTicketDrawer, closeTicketDrawer,
  addToast, removeToast,
  addComment, rateTicket,
  setThemeMode, setColorTheme, setLanguage,
  addTicket, addStudentTicket, resolveTicket, assignWorkerToTicket, updateTicketPriority,
  approveStaffReq, rejectStaffReq,
  markJobComplete, updateAssetCondition, addAssetMaintenanceRecord,
  markNotificationRead, markAllNotificationsRead, addNotification,
  addAuditEntry,
} = ticketSlice.actions;

export default ticketSlice.reducer;