import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  User,
  Ticket,
  TicketComment,
  TicketRating,
  StaffRequest,
  Worker,
  Asset,
  AssetMaintenance,
  AuditLog,
  Notification,
  Budget,
  BudgetCategory,
} from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostelops';

export let isConnected = false;

/**
 * Connect to MongoDB and initialize seeds
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    await seedInitialData();
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ MongoDB Connection Notice: ${error.message}`);
    console.log(`💡 To connect MongoDB:`);
    console.log(`   1. Start local MongoDB service (e.g., mongod or 'net start MongoDB')`);
    console.log(`   2. OR set MONGODB_URI in backend/.env with your MongoDB Atlas Cloud URI`);
    console.log(`📡 Backend server will continue running and retry connection.`);
  }
}

/**
 * Seed initial database records if empty
 */
export async function seedInitialData() {
  try {
    const ticketCount = await Ticket.countDocuments();
    if (ticketCount > 0) {
      return; // Already seeded
    }

    console.log('🌱 Seeding initial MongoDB data...');

    // 1. Seed User
    await User.findOneAndUpdate(
      { id: 'usr-1' },
      {
        id: 'usr-1',
        name: 'Himachalam',
        initials: 'HC',
        room: 'A-204',
        block: 'Block A',
        floor: 'Floor 2',
        roll_number: '21CS204',
        email: 'hima@hostel.edu',
        phone: '+91 98765 43210',
        role: 'student',
      },
      { upsert: true, returnDocument: 'after' }
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

    await Ticket.insertMany(initialTickets);

    // 3. Seed Comments
    const initialComments = [
      { id: 'C1', ticket_id: 'TKT-312', author: 'Dr. Meena Sharma', role: 'Asst. Warden', text: 'Worker has been dispatched. Should be resolved by evening.', time: '2 hrs ago', created_timestamp: Date.now() - 7200000 },
      { id: 'C2', ticket_id: 'TKT-312', author: 'Sarathi Kamal', role: 'Technician', text: 'On site. Checking the pipe joint now.', time: '1 hr ago', created_timestamp: Date.now() - 3600000 },
      { id: 'C3', ticket_id: 'TKT-318', author: 'Dr. Meena Sharma', role: 'Asst. Warden', text: 'High priority — please handle ASAP. Safety concern.', time: '20 min ago', created_timestamp: Date.now() - 1200000 },
    ];
    await TicketComment.insertMany(initialComments);

    // 4. Seed Ratings
    const initialRatings = [
      { ticket_id: 'TKT-315', rating: 4, created_timestamp: Date.now() - 86400000 },
      { ticket_id: 'TKT-319', rating: 5, created_timestamp: Date.now() - 172800000 },
    ];
    await TicketRating.insertMany(initialRatings);

    // 5. Seed Staff Requests
    const initialRequests = [
      { id: 'REQ-4092', title: 'Mess Chimney Replacement',    dept: 'Mess & Dining', cost: 45000,  status: 'Pending Res. Warden', time: 'Submitted today',        submitted_by: 'Sanji',        urgency: 'Normal', note: 'Exhaust fan chimney leaking grease in the main kitchen area.' },
      { id: 'REQ-4080', title: 'Hostel B Plumbing Overhaul',  dept: 'Maintenance',   cost: 120000, status: 'Pending Principal',   time: '27 Jul, 02:15 PM',       submitted_by: 'Rajan Kumar',  urgency: 'Urgent', note: 'Central pipeline degradation in Block B needs overhaul.' },
      { id: 'REQ-4055', title: 'CCTV System Upgrade',         dept: 'Security',      cost: 85000,  status: 'Pending Principal',   time: '26 Jul, 09:00 AM',       submitted_by: 'Durai Selvam', urgency: 'Normal', note: 'Replacing analog cams with 4K IP security cameras.' },
      { id: 'REQ-4031', title: 'Kitchen Exhaust Fan',         dept: 'Mess & Dining', cost: 8500,   status: 'Approved',            time: '28 Nov 2024, 11:00 AM',   submitted_by: 'Sanji',        urgency: 'Low',    note: 'Secondary kitchen exhaust fan replacement.' },
      { id: 'REQ-4010', title: 'Gas Pipeline Repair',         dept: 'Maintenance',   cost: 12000,  status: 'Approved',            time: '12 Jan 2025, 09:30 AM',   submitted_by: 'Rajan Kumar',  urgency: 'Urgent', note: 'Gas leak resolved and pressure safety valves replaced.' },
    ];
    await StaffRequest.insertMany(initialRequests);

    // 6. Seed Workers
    const initialWorkers = [
      { id: 'W1', name: 'Sarathi Kamal', skill: 'Electrician', phone: '+91 98765 43210', availability: 'Available', jobs: 2, rating: 4.8, completed_jobs: 142 },
      { id: 'W2', name: 'Dhariq Anwar',  skill: 'Plumber',     phone: '+91 98765 09987', availability: 'Busy',      jobs: 4, rating: 4.6, completed_jobs: 98  },
      { id: 'W3', name: 'Mohan Kumar',   skill: 'Electrician', phone: '+91 98765 54321', availability: 'Available', jobs: 1, rating: 4.7, completed_jobs: 210 },
      { id: 'W4', name: 'Selvam R.',     skill: 'Carpenter',   phone: '+91 98765 11122', availability: 'Available', jobs: 0, rating: 4.5, completed_jobs: 76  },
      { id: 'W5', name: 'Rajan M.',      skill: 'Plumber',     phone: '+91 98765 66677', availability: 'Busy',      jobs: 3, rating: 4.9, completed_jobs: 183 },
    ];
    await Worker.insertMany(initialWorkers);

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

    for (const a of initialAssets) {
      await Asset.create({
        tag: a.tag,
        name: a.name,
        category: a.category,
        location: a.location,
        condition: a.condition,
        last_checked: a.last_checked,
        value: a.value,
      });

      if (a.history && a.history.length) {
        for (const h of a.history) {
          await AssetMaintenance.create({
            asset_tag: a.tag,
            date: h.date,
            action: h.action,
            actor: h.actor,
            color: h.color,
          });
        }
      }
    }

    // 8. Seed Audit Logs
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
    await AuditLog.insertMany(initialAuditLogs);

    // 9. Seed Notifications
    const initialNotifs = [
      { id: 'N1', message: 'Your ticket TKT-312 has been assigned to Sarathi Kamal', type: 'info',    is_read: 0, time: '10 min ago' },
      { id: 'N2', message: 'TKT-315 Internet Outage has been resolved',               type: 'success', is_read: 0, time: '2 hrs ago' },
      { id: 'N3', message: 'New complaint logged in Block A — Room 309',              type: 'warn',    is_read: 1, time: '1 day ago' },
      { id: 'N4', message: 'Principal approved REQ-4092 — ₹45,000 released',         type: 'success', is_read: 1, time: '2 days ago' },
    ];
    await Notification.insertMany(initialNotifs);

    // 10. Seed Budget & Categories
    await Budget.findOneAndUpdate(
      { id: 1 },
      { id: 1, total: 500000, spent: 340000, pending: 115000 },
      { upsert: true, returnDocument: 'after' }
    );

    const initialBudgetCats = [
      { name: 'Electrical',  spent: 98000,  budget: 140000 },
      { name: 'Plumbing',    spent: 72000,  budget: 100000 },
      { name: 'Furniture',   spent: 45000,  budget: 80000  },
      { name: 'Appliances',  spent: 85000,  budget: 120000 },
      { name: 'Networking',  spent: 40000,  budget: 60000  },
    ];

    for (const bc of initialBudgetCats) {
      await BudgetCategory.findOneAndUpdate(
        { name: bc.name },
        { name: bc.name, spent: bc.spent, budget: bc.budget },
        { upsert: true, returnDocument: 'after' }
      );
    }

    console.log('✅ MongoDB database initialized & seeded successfully.');
  } catch (error) {
    console.error('❌ MongoDB Seeding Error:', error.message);
  }
}

export default { connectDB, seedInitialData };
