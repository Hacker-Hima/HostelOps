import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure db directory exists
const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'hostelops.db');
const db = new DatabaseSync(dbPath);

// Enable Foreign Keys & WAL mode for performance
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize database schema
 */
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      room TEXT NOT NULL,
      block TEXT NOT NULL,
      floor TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student'
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      student TEXT NOT NULL,
      room TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      assigned_worker TEXT NOT NULL DEFAULT 'Unassigned',
      asset_tag TEXT,
      created_at TEXT NOT NULL,
      creator_role TEXT NOT NULL DEFAULT 'Student',
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_comments (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      author TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      time TEXT NOT NULL,
      created_timestamp INTEGER NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ticket_ratings (
      ticket_id TEXT PRIMARY KEY,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      created_timestamp INTEGER NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      dept TEXT NOT NULL,
      cost INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending Res. Warden',
      time TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'Normal',
      note TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      skill TEXT NOT NULL,
      phone TEXT NOT NULL,
      availability TEXT NOT NULL DEFAULT 'Available',
      jobs INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 5.0,
      completed_jobs INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS assets (
      tag TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      condition TEXT NOT NULL DEFAULT 'Good',
      last_checked TEXT NOT NULL,
      value INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS asset_maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_tag TEXT NOT NULL,
      date TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      color TEXT DEFAULT 'var(--accent-cyan)',
      FOREIGN KEY (asset_tag) REFERENCES assets(tag) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor TEXT NOT NULL,
      target TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      time TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      total INTEGER NOT NULL DEFAULT 500000,
      spent INTEGER NOT NULL DEFAULT 340000,
      pending INTEGER NOT NULL DEFAULT 115000
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      name TEXT PRIMARY KEY,
      spent INTEGER NOT NULL DEFAULT 0,
      budget INTEGER NOT NULL DEFAULT 0
    );
  `);

  seedInitialData();
}

/**
 * Seed initial database records if empty
 */
function seedInitialData() {
  // Check if already seeded
  const ticketCountStmt = db.prepare('SELECT COUNT(*) as count FROM tickets');
  const result = ticketCountStmt.get();
  if (result && result.count > 0) {
    return; // Already seeded
  }

  // 1. Seed User
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, initials, room, block, floor, roll_number, email, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(
    'usr-1',
    'Himachalam',
    'HC',
    'A-204',
    'Block A',
    'Floor 2',
    '21CS204',
    'hima@hostel.edu',
    '+91 98765 43210',
    'student'
  );

  // 2. Seed Tickets
  const initialTickets = [
    { id: 'TKT-312', title: 'Plumbing Issue in Washroom',   student: 'Himachalam',     room: 'A-204', category: 'Plumbing',    priority: 'High',   status: 'In Progress', assigned_worker: 'Sarathi Kamal', asset_tag: 'QR-A204-PLM-01', created_at: '2 days ago',  creator_role: 'Student', description: 'Water leaking from the tap joint near the washbasin. Has been dripping for 3 days.' },
    { id: 'TKT-314', title: 'AC Not Cooling Properly',       student: 'Naveen',         room: 'A-112', category: 'Electrical',  priority: 'Medium', status: 'Pending',     assigned_worker: 'Unassigned',   asset_tag: 'QR-A112-AC-01',  created_at: '5 hours ago', creator_role: 'Student', description: 'The AC runs but does not cool below 26°C even at full setting.' },
    { id: 'TKT-315', title: 'Internet Outage',               student: 'Devansh Chouhan',room: 'A-309', category: 'Networking',  priority: 'Low',    status: 'Resolved',    assigned_worker: 'Dhariq Anwar', asset_tag: 'QR-A309-RTR-01', created_at: '1 week ago',  creator_role: 'Student', description: 'No internet connectivity on the entire floor. Router seems down.' },
    { id: 'TKT-318', title: 'Geyser Sparking',               student: 'Venkatesh',      room: 'A-215', category: 'Electrical',  priority: 'High',   status: 'In Progress', assigned_worker: 'Mohan Kumar',  asset_tag: 'QR-A215-GYS-01', created_at: '1 day ago',   creator_role: 'Student', description: 'Electric geyser is sparking when switched on. Potential fire hazard.' },
    { id: 'TKT-319', title: 'Power Socket Repair',           student: 'Nickson',        room: 'A-101', category: 'Electrical',  priority: 'Low',    status: 'Resolved',    assigned_worker: 'Sarathi Kamal',asset_tag: 'QR-A101-SKT-02', created_at: '4 days ago',  creator_role: 'Student', description: 'Wall socket near desk is loose and does not hold plug properly.' },
    { id: 'TKT-320', title: 'Ceiling Fan Noise',             student: 'Arjun',          room: 'B-304', category: 'Electrical',  priority: 'High',   status: 'Pending',     assigned_worker: 'Unassigned',   asset_tag: 'QR-B304-FAN-01', created_at: '3 hours ago', creator_role: 'Student', description: 'Fan makes loud grinding sound, worse at high speed.' },
    { id: 'TKT-321', title: 'Broken Chair Leg',              student: 'Priya',          room: 'C-201', category: 'Furniture',   priority: 'Low',    status: 'Pending',     assigned_worker: 'Unassigned',   asset_tag: 'QR-C201-CHR-02', created_at: '6 hours ago', creator_role: 'Student', description: 'Study chair front leg is cracked and unstable.' },
    { id: 'TKT-322', title: 'Bathroom Door Latch Broken',    student: 'Himachalam',     room: 'A-204', category: 'Furniture',   priority: 'Medium', status: 'Pending',     assigned_worker: 'Unassigned',   asset_tag: 'QR-A204-DR-01',  created_at: '1 hour ago',  creator_role: 'Student', description: 'Bathroom door latch does not lock from inside.' },
  ];

  const insertTicket = db.prepare(`
    INSERT INTO tickets (id, title, student, room, category, priority, status, assigned_worker, asset_tag, created_at, creator_role, description)
    VALUES (@id, @title, @student, @room, @category, @priority, @status, @assigned_worker, @asset_tag, @created_at, @creator_role, @description)
  `);

  for (const t of initialTickets) {
    insertTicket.run(t);
  }

  // 3. Seed Comments
  const insertComment = db.prepare(`
    INSERT INTO ticket_comments (id, ticket_id, author, role, text, time, created_timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertComment.run('C1', 'TKT-312', 'Dr. Meena Sharma', 'Asst. Warden', 'Worker has been dispatched. Should be resolved by evening.', '2 hrs ago', Date.now() - 7200000);
  insertComment.run('C2', 'TKT-312', 'Sarathi Kamal', 'Technician', 'On site. Checking the pipe joint now.', '1 hr ago', Date.now() - 3600000);
  insertComment.run('C3', 'TKT-318', 'Dr. Meena Sharma', 'Asst. Warden', 'High priority — please handle ASAP. Safety concern.', '20 min ago', Date.now() - 1200000);

  // 4. Seed Ratings
  const insertRating = db.prepare(`
    INSERT INTO ticket_ratings (ticket_id, rating, created_timestamp)
    VALUES (?, ?, ?)
  `);
  insertRating.run('TKT-315', 4, Date.now() - 86400000);
  insertRating.run('TKT-319', 5, Date.now() - 172800000);

  // 5. Seed Staff Requests
  const initialRequests = [
    { id: 'REQ-4092', title: 'Mess Chimney Replacement',    dept: 'Mess & Dining', cost: 45000,  status: 'Pending Res. Warden', time: 'Submitted today',        submitted_by: 'Sanji',        urgency: 'Normal', note: 'Exhaust fan chimney leaking grease in the main kitchen area.' },
    { id: 'REQ-4080', title: 'Hostel B Plumbing Overhaul',  dept: 'Maintenance',   cost: 120000, status: 'Pending Principal',   time: '27 Jul, 02:15 PM',       submitted_by: 'Rajan Kumar',  urgency: 'Urgent', note: 'Central pipeline degradation in Block B needs overhaul.' },
    { id: 'REQ-4055', title: 'CCTV System Upgrade',         dept: 'Security',      cost: 85000,  status: 'Pending Principal',   time: '26 Jul, 09:00 AM',       submitted_by: 'Durai Selvam', urgency: 'Normal', note: 'Replacing analog cams with 4K IP security cameras.' },
    { id: 'REQ-4031', title: 'Kitchen Exhaust Fan',         dept: 'Mess & Dining', cost: 8500,   status: 'Approved',            time: '28 Nov 2024, 11:00 AM',   submitted_by: 'Sanji',        urgency: 'Low',    note: 'Secondary kitchen exhaust fan replacement.' },
    { id: 'REQ-4010', title: 'Gas Pipeline Repair',         dept: 'Maintenance',   cost: 12000,  status: 'Approved',            time: '12 Jan 2025, 09:30 AM',   submitted_by: 'Rajan Kumar',  urgency: 'Urgent', note: 'Gas leak resolved and pressure safety valves replaced.' },
  ];

  const insertReq = db.prepare(`
    INSERT INTO staff_requests (id, title, dept, cost, status, time, submitted_by, urgency, note)
    VALUES (@id, @title, @dept, @cost, @status, @time, @submitted_by, @urgency, @note)
  `);
  for (const r of initialRequests) {
    insertReq.run(r);
  }

  // 6. Seed Workers
  const initialWorkers = [
    { id: 'W1', name: 'Sarathi Kamal', skill: 'Electrician', phone: '+91 98765 43210', availability: 'Available', jobs: 2, rating: 4.8, completed_jobs: 142 },
    { id: 'W2', name: 'Dhariq Anwar',  skill: 'Plumber',     phone: '+91 98765 09987', availability: 'Busy',      jobs: 4, rating: 4.6, completed_jobs: 98  },
    { id: 'W3', name: 'Mohan Kumar',   skill: 'Electrician', phone: '+91 98765 54321', availability: 'Available', jobs: 1, rating: 4.7, completed_jobs: 210 },
    { id: 'W4', name: 'Selvam R.',     skill: 'Carpenter',   phone: '+91 98765 11122', availability: 'Available', jobs: 0, rating: 4.5, completed_jobs: 76  },
    { id: 'W5', name: 'Rajan M.',      skill: 'Plumber',     phone: '+91 98765 66677', availability: 'Busy',      jobs: 3, rating: 4.9, completed_jobs: 183 },
  ];

  const insertWorker = db.prepare(`
    INSERT INTO workers (id, name, skill, phone, availability, jobs, rating, completed_jobs)
    VALUES (@id, @name, @skill, @phone, @availability, @jobs, @rating, @completed_jobs)
  `);
  for (const w of initialWorkers) {
    insertWorker.run(w);
  }

  // 7. Seed Assets & Maintenance
  const initialAssets = [
    { tag: 'QR-A302-BED-01', name: 'Single Bed',       category: 'Furniture',   location: 'Room 302, Block A', condition: 'Good',              last_checked: '10 Aug 2025', value: 8000,
      history: [
        { date: '10 Aug 2025', action: 'Annual inspection — Good', actor: 'Dr. Meena Sharma', color: 'var(--accent-green)' },
        { date: '15 Jan 2025', action: 'Minor repair on frame', actor: 'Selvam R.', color: 'var(--accent-cyan)' }
      ]
    },
    { tag: 'QR-A302-DSK-01', name: 'Study Desk',        category: 'Furniture',   location: 'Room 302, Block A', condition: 'Needs Repair',      last_checked: '05 Aug 2025', value: 4500,
      history: [
        { date: '05 Aug 2025', action: 'Surface crack noted — needs repair', actor: 'Dr. Meena Sharma', color: 'var(--accent-yellow)' }
      ]
    },
    { tag: 'QR-A302-AC-01',  name: 'Split AC 1.5T',     category: 'Appliance',   location: 'Room 302, Block A', condition: 'Good',              last_checked: '12 Aug 2025', value: 35000,
      history: [
        { date: '12 Aug 2025', action: 'Annual servicing done', actor: 'Sarathi Kamal', color: 'var(--accent-green)' },
        { date: '01 Mar 2025', action: 'Gas refill & cleaning', actor: 'Mohan Kumar', color: 'var(--accent-cyan)' }
      ]
    },
    { tag: 'QR-B112-FAN-02', name: 'Ceiling Fan',        category: 'Electrical',  location: 'Room 112, Block B', condition: 'Damaged',           last_checked: '01 Aug 2025', value: 2500,
      history: [
        { date: '01 Aug 2025', action: 'Blade bent — marked damaged', actor: 'Dr. Meena Sharma', color: 'var(--accent-red)' }
      ]
    },
    { tag: 'QR-C208-LGT-01', name: 'LED Tube 20W',       category: 'Electrical',  location: 'Room 208, Block C', condition: 'Under Maintenance', last_checked: '08 Aug 2025', value: 800,
      history: [
        { date: '08 Aug 2025', action: 'Flickering — under maintenance', actor: 'Sarathi Kamal', color: 'var(--accent-primary)' }
      ]
    },
    { tag: 'QR-A304-RTR-01', name: 'Wi-Fi AP Router',    category: 'Networking',  location: 'Room 304, Block A', condition: 'Good',              last_checked: '14 Aug 2025', value: 6000,
      history: [
        { date: '14 Aug 2025', action: 'Firmware updated', actor: 'Dhariq Anwar', color: 'var(--accent-green)' }
      ]
    },
    { tag: 'QR-D101-GYS-01', name: 'Electric Geyser 25L',category: 'Appliance',   location: 'Room 101, Block D', condition: 'Good',              last_checked: '11 Aug 2025', value: 7500,
      history: [
        { date: '11 Aug 2025', action: 'Safety check passed', actor: 'Mohan Kumar', color: 'var(--accent-green)' }
      ]
    },
    { tag: 'QR-B205-CHR-03', name: 'Study Chair',        category: 'Furniture',   location: 'Room 205, Block B', condition: 'Good',              last_checked: '09 Aug 2025', value: 2200,
      history: [
        { date: '09 Aug 2025', action: 'Annual inspection — Good', actor: 'Dr. Meena Sharma', color: 'var(--accent-green)' }
      ]
    },
  ];

  const insertAsset = db.prepare(`
    INSERT INTO assets (tag, name, category, location, condition, last_checked, value)
    VALUES (@tag, @name, @category, @location, @condition, @last_checked, @value)
  `);

  const insertMaint = db.prepare(`
    INSERT INTO asset_maintenance (asset_tag, date, action, actor, color)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const a of initialAssets) {
    insertAsset.run({
      tag: a.tag,
      name: a.name,
      category: a.category,
      location: a.location,
      condition: a.condition,
      last_checked: a.last_checked,
      value: a.value,
    });

    if (a.history) {
      for (const h of a.history) {
        insertMaint.run(a.tag, h.date, h.action, h.actor, h.color);
      }
    }
  }

  // 8. Seed Audit Log
  const initialAuditLogs = [
    { id: 'AL-001', action: 'Ticket Created',          actor: 'Himachalam (Student)',    target: 'TKT-312',  timestamp: '2026-08-22 08:14 AM', category: 'Ticket' },
    { id: 'AL-002', action: 'Worker Assigned',         actor: 'Dr. Meena Sharma (AW)',  target: 'TKT-312',  timestamp: '2026-08-22 09:30 AM', category: 'Assignment' },
    { id: 'AL-003', action: 'Staff Request Submitted', actor: 'Sanji (Staff)',           target: 'REQ-4092', timestamp: '2026-08-24 10:00 AM', category: 'Request' },
    { id: 'AL-004', action: 'Request Endorsed',        actor: 'Dr. Meena Sharma (AW)',  target: 'REQ-4092', timestamp: '2026-08-24 10:15 AM', category: 'Approval' },
    { id: 'AL-005', action: 'Ticket Resolved',         actor: 'Dhariq Anwar (Worker)',  target: 'TKT-315',  timestamp: '2026-08-23 04:45 PM', category: 'Ticket' },
    { id: 'AL-006', action: 'Asset Condition Updated', actor: 'Dr. Meena Sharma (AW)',  target: 'QR-B112-FAN-02', timestamp: '2026-08-21 11:00 AM', category: 'Asset' },
    { id: 'AL-007', action: 'Request Approved',        actor: 'Prof. R. Iyer (RW)',     target: 'REQ-4031', timestamp: '2026-08-20 03:15 PM', category: 'Approval' },
    { id: 'AL-008', action: 'Notification Sent',       actor: 'System',                 target: 'Himachalam',timestamp: '2026-08-22 09:31 AM', category: 'System' },
  ];

  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, action, actor, target, timestamp, category)
    VALUES (@id, @action, @actor, @target, @timestamp, @category)
  `);
  for (const log of initialAuditLogs) {
    insertAudit.run(log);
  }

  // 9. Seed Notifications
  const initialNotifs = [
    { id: 'N1', message: 'Your ticket TKT-312 has been assigned to Sarathi Kamal', type: 'info',    is_read: 0, time: '10 min ago' },
    { id: 'N2', message: 'TKT-315 Internet Outage has been resolved',               type: 'success', is_read: 0, time: '2 hrs ago' },
    { id: 'N3', message: 'New complaint logged in Block A — Room 309',              type: 'warn',    is_read: 1, time: '1 day ago' },
    { id: 'N4', message: 'Principal approved REQ-4092 — ₹45,000 released',         type: 'success', is_read: 1, time: '2 days ago' },
  ];

  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, message, type, is_read, time)
    VALUES (@id, @message, @type, @is_read, @time)
  `);
  for (const n of initialNotifs) {
    insertNotif.run(n);
  }

  // 10. Seed Budget & Categories
  db.exec(`
    INSERT OR REPLACE INTO budget (id, total, spent, pending)
    VALUES (1, 500000, 340000, 115000);
  `);

  const initialBudgetCats = [
    { name: 'Electrical',  spent: 98000,  budget: 140000 },
    { name: 'Plumbing',    spent: 72000,  budget: 100000 },
    { name: 'Furniture',   spent: 45000,  budget: 80000  },
    { name: 'Appliances',  spent: 85000,  budget: 120000 },
    { name: 'Networking',  spent: 40000,  budget: 60000  },
  ];

  const insertBudgetCat = db.prepare(`
    INSERT OR REPLACE INTO budget_categories (name, spent, budget)
    VALUES (@name, @spent, @budget)
  `);
  for (const bc of initialBudgetCats) {
    insertBudgetCat.run(bc);
  }
}

export default db;
