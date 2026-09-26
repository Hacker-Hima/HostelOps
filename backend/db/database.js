import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  User,
  Asset,
  AssetCategory,
  AssetMaintenance,
  AssetTransfer,
  AssetAudit,
  AssetDisposal,
  AssetRequest,
  AuditLog,
  Notification,
  Worker,
  Room,
  Hostel,
  Resident,
  Vendor,
  PurchaseOrder,
} from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hostelops';

/**
 * Mask sensitive credentials for safe logging
 */
function sanitizeUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

export const dbStatus = {
  connected: false,
  connectionType: 'none', // 'atlas' | 'local' | 'none'
  host: null,
  database: null,
  lastError: null,
};

export let isConnected = false;

// Register live Mongoose connection listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  dbStatus.connected = true;
  dbStatus.host = mongoose.connection.host;
  dbStatus.database = mongoose.connection.name;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  dbStatus.connected = false;
  console.warn('⚠️ MongoDB connection lost. Attempting auto-reconnect...');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  dbStatus.connected = false;
  dbStatus.lastError = err.message;
  console.error('❌ MongoDB runtime error:', err.message);
});

/**
 * Connect to MongoDB with safe fallback
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    dbStatus.connected = true;
    dbStatus.connectionType = MONGODB_URI.includes('mongodb.net') ? 'atlas' : 'primary';
    dbStatus.host = conn.connection.host;
    dbStatus.database = conn.connection.name;

    console.log(`✅ MongoDB Connected (${dbStatus.connectionType}): ${conn.connection.host}/${conn.connection.name}`);
    await checkAndSeedData();
  } catch (error) {
    dbStatus.lastError = error.message;

    // Try local fallback if primary was Atlas
    if (
      MONGODB_URI !== 'mongodb://127.0.0.1:27017/hostelops' &&
      !MONGODB_URI.includes('127.0.0.1') &&
      !MONGODB_URI.includes('localhost')
    ) {
      console.warn(`⚠️ Primary MongoDB connection failed (${error.message}). Trying local MongoDB fallback...`);
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/hostelops?retryWrites=false', {
          serverSelectionTimeoutMS: 3000,
        });
        isConnected = true;
        dbStatus.connected = true;
        dbStatus.connectionType = 'local';
        dbStatus.host = localConn.connection.host;
        dbStatus.database = localConn.connection.name;

        console.log(`✅ MongoDB Connected (Local Fallback): ${localConn.connection.host}/${localConn.connection.name}`);
        await checkAndSeedData();
        return;
      } catch (fallbackError) {
        dbStatus.lastError = fallbackError.message;
      }
    }

    isConnected = false;
    dbStatus.connected = false;
    dbStatus.connectionType = 'none';
    console.warn(`⚠️ MongoDB Connection Notice: Could not connect to database.`);
    console.log(`📡 Backend server will continue running. Endpoints requiring database will report status accordingly.`);
  }
}

/**
 * Check if seeding is required (Idempotent; runs only if explicitly requested or database is empty)
 */
async function checkAndSeedData() {
  try {
    console.log('🌱 Verifying seed data and institutional records...');
    await seedInitialData();
    await ensureDefaultPasswords();
  } catch (err) {
    console.error('Seeding check error:', err.message);
  }
}

async function ensureDefaultPasswords() {
  const defaultCredentials = [
    { username: 'superadmin', password: 'admin@123' },
    { username: 'assetadmin', password: 'admin@123' },
    { username: 'student1', password: 'user@123' },
    { username: 'student2', password: 'user@123' },
    { username: 'student3', password: 'user@123' },
    { username: 'student4', password: 'user@123' },
    { username: 'staff1', password: 'user@123' },
  ];

  for (const cred of defaultCredentials) {
    const user = await User.findOne({ username: cred.username }).select('+password');
    if (user && !user.password) {
      user.password = cred.password;
      await user.save();
      console.log(`🔒 Upgraded password hash for ${cred.username}`);
    }
  }
}

/**
 * Seed initial database records without clobbering existing user data
 */
export async function seedInitialData() {
  try {
    // 1. Seed Admins & Students with secure default passwords
    const initialUsers = [
      {
        id: 'adm-1',
        username: 'superadmin',
        name: 'Dr. K. Sundaram',
        initials: 'KS',
        room: 'Executive Suite 301',
        block: 'Admin Block',
        floor: 'Floor 3',
        roll_number: 'ADM-SUPER-01',
        email: 'superadmin@hostel.edu',
        phone: '+91 98765 00001',
        role: 'admin',
        admin_type: 'superadmin',
        avatar_color: '#ef4444',
        password: 'admin@123',
        isActive: true,
      },
      {
        id: 'adm-2',
        username: 'assetadmin',
        name: 'Dr. Meena Sharma',
        initials: 'MS',
        room: 'Asset Logistics 102',
        block: 'Admin Block',
        floor: 'Floor 1',
        roll_number: 'ADM-ASSET-02',
        email: 'assetadmin@hostel.edu',
        phone: '+91 98765 00002',
        role: 'admin',
        admin_type: 'assetadmin',
        avatar_color: '#7c3aed',
        password: 'admin@123',
        isActive: true,
      },
      {
        id: 'usr-1',
        username: 'student1',
        name: 'Himachalam',
        initials: 'HC',
        room: '204',
        block: 'Block A',
        floor: 'Floor 2',
        roll_number: '21CS204',
        email: 'hima@hostel.edu',
        phone: '+91 98765 43210',
        role: 'user',
        admin_type: '',
        avatar_color: '#06b6d4',
        password: 'user@123',
        isActive: true,
      },
      {
        id: 'usr-2',
        username: 'student2',
        name: 'Priya Sharma',
        initials: 'PS',
        room: '102',
        block: 'Block B',
        floor: 'Floor 1',
        roll_number: '22EC102',
        email: 'priya@hostel.edu',
        phone: '+91 98765 43211',
        role: 'user',
        admin_type: '',
        avatar_color: '#ec4899',
        password: 'user@123',
        isActive: true,
      },
      {
        id: 'usr-3',
        username: 'student3',
        name: 'Naveen Kumar',
        initials: 'NK',
        room: '112',
        block: 'Block A',
        floor: 'Floor 1',
        roll_number: '21IT112',
        email: 'naveen@hostel.edu',
        phone: '+91 98765 43212',
        role: 'user',
        admin_type: '',
        avatar_color: '#f59e0b',
        password: 'user@123',
        isActive: true,
      },
      {
        id: 'usr-4',
        username: 'student4',
        name: 'Devansh Chouhan',
        initials: 'DC',
        room: '305',
        block: 'Block C',
        floor: 'Floor 3',
        roll_number: '23ME305',
        email: 'devansh@hostel.edu',
        phone: '+91 98765 43213',
        role: 'user',
        admin_type: '',
        avatar_color: '#10b981',
        password: 'user@123',
        isActive: true,
      },
      {
        id: 'stf-1',
        username: 'staff1',
        name: 'Sarathi Kamal',
        initials: 'SK',
        room: 'Maintenance Workshop',
        block: 'Service Block',
        floor: 'Ground Floor',
        roll_number: 'STF-TECH-01',
        email: 'sarathi@hostel.edu',
        phone: '+91 98765 11122',
        role: 'staff',
        admin_type: '',
        avatar_color: '#f59e0b',
        password: 'user@123',
        isActive: true,
      },
    ];

    for (const u of initialUsers) {
      const query = u.id ? { $or: [{ username: u.username }, { id: u.id }] } : { username: u.username };
      const existing = await User.findOne(query).select('+password');
      if (!existing) {
        await User.create(u);
      } else {
        let changed = false;
        if (!existing.username) { existing.username = u.username; changed = true; }
        if (!existing.password) { existing.password = u.password; changed = true; }
        if (!existing.name) { existing.name = u.name; changed = true; }
        if (!existing.initials) { existing.initials = u.initials; changed = true; }
        if (!existing.roll_number) { existing.roll_number = u.roll_number; changed = true; }
        if (!existing.phone) { existing.phone = u.phone; changed = true; }
        if (!existing.email) { existing.email = u.email; changed = true; }
        if (changed) {
          await existing.save();
        }
      }
    }

    // 2. Seed Categories
    const initialCategories = [
      { name: 'Furniture', icon: '🪑', description: 'Beds, Study Tables, Ergonomic Chairs, Wardrobes, Bookshelves', default_depreciation_rate: 10, color: '#3b82f6' },
      { name: 'Electrical', icon: '💡', description: 'Ceiling Fans, LED Tube Lights, Geysers, Switchboards, DB Panels', default_depreciation_rate: 15, color: '#f59e0b' },
      { name: 'Electronics', icon: '🖥️', description: 'Wi-Fi Access Points, CCTV Cameras, Biometric Readers, LED Displays', default_depreciation_rate: 20, color: '#8b5cf6' },
      { name: 'Plumbing', icon: '🚰', description: 'Faucets, Showers, Water Coolers, Flush Tanks, Sump Pumps', default_depreciation_rate: 12, color: '#06b6d4' },
      { name: 'Appliances', icon: '❄️', description: 'Split ACs, Refrigerators, Microwave Ovens, Water Purifiers', default_depreciation_rate: 15, color: '#10b981' },
      { name: 'Study Equipment', icon: '📚', description: 'Desk Reading Lamps, Whiteboards, Notice Boards, Projectors', default_depreciation_rate: 10, color: '#ec4899' },
      { name: 'Kitchen Equipment', icon: '🍳', description: 'Commercial Stoves, Chimney Exhaust, Steam Boilers, Utensil Racks', default_depreciation_rate: 12, color: '#f97316' },
      { name: 'Safety Equipment', icon: '🧯', description: 'Fire Extinguishers, Smoke Detectors, First Aid Cabinets, Emergency Lights', default_depreciation_rate: 10, color: '#ef4444' },
    ];

    for (const c of initialCategories) {
      const existing = await AssetCategory.findOne({ name: c.name });
      if (!existing) {
        await AssetCategory.create(c);
      }
    }

    // 3. Seed Assets (Insert only if missing)
    const initialAssets = [
      {
        tag: 'AST-A204-BED-01',
        name: 'Single Bed Frame & Mattress',
        category: 'Furniture',
        block: 'Block A',
        floor: 'Floor 2',
        room: '204',
        location: 'Block A - Room 204',
        condition: 'Good',
        status: 'Assigned',
        purchase_date: '2024-02-15',
        purchase_cost: 8500,
        current_value: 7650,
        depreciation_rate: 10,
        warranty_expiry: '2027-02-15',
        supplier: 'Apex Institutional Furnishings',
        serial_number: 'SN-BED-204-01',
        quantity: 1,
        assigned_student_roll: '21CS204',
        assigned_student_name: 'Himachalam',
        assigned_date: '2024-07-10',
        last_checked: '12 Sep 2026',
        qr_code_data: 'HOSTELOPS:AST-A204-BED-01',
        notes: 'Teak wood single bed with heavy duty steel supports.',
      },
      {
        tag: 'AST-A204-DSK-01',
        name: 'Ergonomic Study Desk',
        category: 'Furniture',
        block: 'Block A',
        floor: 'Floor 2',
        room: '204',
        location: 'Block A - Room 204',
        condition: 'Needs Repair',
        status: 'Under Maintenance',
        purchase_date: '2024-02-15',
        purchase_cost: 4500,
        current_value: 4050,
        depreciation_rate: 10,
        warranty_expiry: '2027-02-15',
        supplier: 'Apex Institutional Furnishings',
        serial_number: 'SN-DSK-204-01',
        quantity: 1,
        assigned_student_roll: '21CS204',
        assigned_student_name: 'Himachalam',
        assigned_date: '2024-07-10',
        last_checked: '24 Sep 2026',
        qr_code_data: 'HOSTELOPS:AST-A204-DSK-01',
        notes: 'Drawer runner jammed, edge beading peeling off.',
      },
      {
        tag: 'AST-A204-FAN-01',
        name: 'High-Speed Ceiling Fan 1200mm',
        category: 'Electrical',
        block: 'Block A',
        floor: 'Floor 2',
        room: '204',
        location: 'Block A - Room 204',
        condition: 'Good',
        status: 'Assigned',
        purchase_date: '2024-01-10',
        purchase_cost: 2200,
        current_value: 1870,
        depreciation_rate: 15,
        warranty_expiry: '2026-01-10',
        supplier: 'Crompton Greaves Ltd.',
        serial_number: 'SN-FAN-204-01',
        quantity: 1,
        assigned_student_roll: '21CS204',
        assigned_student_name: 'Himachalam',
        assigned_date: '2024-07-10',
        last_checked: '15 Aug 2026',
        qr_code_data: 'HOSTELOPS:AST-A204-FAN-01',
        notes: 'Running smoothly, speed regulator in good order.',
      },
      {
        tag: 'AST-B102-AC-01',
        name: 'Split AC 1.5 Ton Dual Inverter',
        category: 'Appliances',
        block: 'Block B',
        floor: 'Floor 1',
        room: '102',
        location: 'Block B - Room 102',
        condition: 'Good',
        status: 'Assigned',
        purchase_date: '2024-03-20',
        purchase_cost: 38000,
        current_value: 32300,
        depreciation_rate: 15,
        warranty_expiry: '2029-03-20',
        supplier: 'Daikin India Corp.',
        serial_number: 'SN-AC-102-01',
        quantity: 1,
        assigned_student_roll: '22EC102',
        assigned_student_name: 'Priya Sharma',
        assigned_date: '2024-07-15',
        last_checked: '16 Aug 2026',
        qr_code_data: 'HOSTELOPS:AST-B102-AC-01',
        notes: 'Recently serviced and gas pressure verified.',
      },
      {
        tag: 'AST-A112-CHR-01',
        name: 'Cushioned Study Chair',
        category: 'Furniture',
        block: 'Block A',
        floor: 'Floor 1',
        room: '112',
        location: 'Block A - Room 112',
        condition: 'Needs Repair',
        status: 'Under Maintenance',
        purchase_date: '2024-02-15',
        purchase_cost: 2800,
        current_value: 2520,
        depreciation_rate: 10,
        warranty_expiry: '2027-02-15',
        supplier: 'Apex Institutional Furnishings',
        serial_number: 'SN-CHR-112-01',
        quantity: 1,
        assigned_student_roll: '21IT112',
        assigned_student_name: 'Naveen Kumar',
        assigned_date: '2024-07-10',
        last_checked: '20 Sep 2026',
        qr_code_data: 'HOSTELOPS:AST-A112-CHR-01',
        notes: 'Right leg joint loose. MNT-801 open.',
      },
      {
        tag: 'AST-STR-LMP-01',
        name: 'LED Flexible Desk Study Lamp',
        category: 'Study Equipment',
        block: 'Admin Block',
        floor: 'Ground Floor',
        room: 'Central Store',
        location: 'Admin Block - Central Store',
        condition: 'Good',
        status: 'In Store',
        purchase_date: '2025-01-15',
        purchase_cost: 1200,
        current_value: 1080,
        depreciation_rate: 10,
        warranty_expiry: '2027-01-15',
        supplier: 'Philips Lighting Store',
        serial_number: 'SN-LMP-STR-01',
        quantity: 12,
        assigned_student_roll: '',
        assigned_student_name: '',
        assigned_date: '',
        last_checked: '24 Sep 2026',
        qr_code_data: 'HOSTELOPS:AST-STR-LMP-01',
        notes: 'Stocked in central inventory for student requests.',
      },
      {
        tag: 'AST-STR-CHR-05',
        name: 'Extra Ergonomic Study Chair',
        category: 'Furniture',
        block: 'Admin Block',
        floor: 'Ground Floor',
        room: 'Central Store',
        location: 'Admin Block - Central Store',
        condition: 'Good',
        status: 'In Store',
        purchase_date: '2025-02-10',
        purchase_cost: 3200,
        current_value: 2880,
        depreciation_rate: 10,
        warranty_expiry: '2027-02-10',
        supplier: 'Apex Institutional Furnishings',
        serial_number: 'SN-CHR-STR-05',
        quantity: 8,
        assigned_student_roll: '',
        assigned_student_name: '',
        assigned_date: '',
        last_checked: '24 Sep 2026',
        qr_code_data: 'HOSTELOPS:AST-STR-CHR-05',
        notes: 'Available for immediate allocation.',
      },
      {
        tag: 'AST-DIS-FAN-99',
        name: 'Exhaust Blower Fan 450mm',
        category: 'Electrical',
        block: 'Admin Block',
        floor: 'Ground Floor',
        room: 'Scrap Yard',
        location: 'Admin Block - Scrap Yard',
        condition: 'Beyond Repair',
        status: 'Disposed',
        purchase_date: '2021-04-10',
        purchase_cost: 5400,
        current_value: 0,
        depreciation_rate: 20,
        warranty_expiry: '2023-04-10',
        supplier: 'Industrial Air Tech',
        serial_number: 'SN-EXH-99',
        quantity: 1,
        assigned_student_roll: '',
        assigned_student_name: '',
        assigned_date: '',
        last_checked: '01 Sep 2026',
        qr_code_data: 'HOSTELOPS:AST-DIS-FAN-99',
        notes: 'Motor core burned out. Written off & certified disposed.',
      },
    ];

    for (const a of initialAssets) {
      const existing = await Asset.findOne({ tag: a.tag });
      if (!existing) {
        await Asset.create(a);
      }
    }

    // 4. Seed Workers
    const initialWorkers = [
      { id: 'W1', name: 'Sarathi Kamal', skill: 'Electrician & HVAC', phone: '+91 98765 43210', availability: 'Available', jobs: 1, rating: 4.9, completed_jobs: 148 },
      { id: 'W2', name: 'Selvam R.', skill: 'Carpenter & Furniture Specialist', phone: '+91 98765 11122', availability: 'Busy', jobs: 2, rating: 4.8, completed_jobs: 94 },
      { id: 'W3', name: 'Dhariq Anwar', skill: 'Plumber & Sanitization', phone: '+91 98765 09987', availability: 'Available', jobs: 0, rating: 4.7, completed_jobs: 112 },
      { id: 'W4', name: 'Mohan Kumar', skill: 'Electronics & Network Hardware', phone: '+91 98765 54321', availability: 'Available', jobs: 0, rating: 4.8, completed_jobs: 86 },
    ];

    for (const w of initialWorkers) {
      const existing = await Worker.findOne({ id: w.id });
      if (!existing) {
        await Worker.create(w);
      }
    }

    // 5. Seed Notifications
    const initialNotifs = [
      { id: 'N1', message: 'Asset Request REQ-301 (Study Lamp) approved by Asset Admin.', type: 'success', is_read: 0, time: '10 min ago' },
      { id: 'N2', message: 'Maintenance ticket MNT-801 assigned to Carpenter Selvam R.', type: 'info', is_read: 0, time: '1 hour ago' },
      { id: 'N3', message: 'Physical Audit AUD-902 flagged 1 missing asset in Room A-112.', type: 'warn', is_read: 0, time: '1 day ago' },
      { id: 'N4', message: 'Quarterly depreciation schedule calculated for Q3 2026.', type: 'info', is_read: 1, time: '2 days ago' },
    ];

    for (const n of initialNotifs) {
      const existing = await Notification.findOne({ id: n.id });
      if (!existing) {
        await Notification.create(n);
      }
    }

    // 6. Seed Hostel & Rooms
    const existingHostel = await Hostel.findOne({ code: 'BH-1' });
    if (!existingHostel) {
      await Hostel.create({
        name: 'Boys Hostel 1',
        code: 'BH-1',
        campus: 'Main Campus',
        chiefWarden: 'Dr. K. Sundaram',
        blocks: [
          { name: 'Block A', totalFloors: 4, roomsCount: 24, supervisor: 'Sarathi Kamal' },
          { name: 'Block B', totalFloors: 4, roomsCount: 24, supervisor: 'Selvam R.' },
          { name: 'Block C', totalFloors: 4, roomsCount: 24, supervisor: 'Dhariq Anwar' },
        ],
        totalCapacity: 350,
        currentOccupancy: 280,
        overallHealthIndex: 94,
      });
    }

    const initialRooms = [
      {
        roomNumber: '204',
        block: 'Block A',
        floor: 'Floor 2',
        floorNumber: 2,
        roomType: 'Double',
        capacity: 2,
        occupancy: 1,
        status: 'Optimal',
        maintenanceScore: 95,
        beds: [
          { bedNumber: 'Bed-1', status: 'Occupied', residentRoll: '21CS204', residentName: 'Himachalam' },
          { bedNumber: 'Bed-2', status: 'Available' },
        ],
      },
      {
        roomNumber: '102',
        block: 'Block B',
        floor: 'Floor 1',
        floorNumber: 1,
        roomType: 'Double',
        capacity: 2,
        occupancy: 1,
        status: 'Optimal',
        maintenanceScore: 92,
        beds: [
          { bedNumber: 'Bed-1', status: 'Occupied', residentRoll: '22EC102', residentName: 'Priya Sharma' },
          { bedNumber: 'Bed-2', status: 'Available' },
        ],
      },
      {
        roomNumber: '112',
        block: 'Block A',
        floor: 'Floor 1',
        floorNumber: 1,
        roomType: 'Double',
        capacity: 2,
        occupancy: 1,
        status: 'Attention',
        maintenanceScore: 78,
        beds: [
          { bedNumber: 'Bed-1', status: 'Occupied', residentRoll: '21IT112', residentName: 'Naveen Kumar' },
          { bedNumber: 'Bed-2', status: 'Available' },
        ],
      },
      {
        roomNumber: '305',
        block: 'Block C',
        floor: 'Floor 3',
        floorNumber: 3,
        roomType: 'Double',
        capacity: 2,
        occupancy: 1,
        status: 'Optimal',
        maintenanceScore: 98,
        beds: [
          { bedNumber: 'Bed-1', status: 'Occupied', residentRoll: '23ME305', residentName: 'Devansh Chouhan' },
          { bedNumber: 'Bed-2', status: 'Available' },
        ],
      },
    ];

    for (const rm of initialRooms) {
      const existing = await Room.findOne({ roomNumber: rm.roomNumber, block: rm.block });
      if (!existing) {
        await Room.create(rm);
      }
    }

    // 7. Seed Residents
    const initialResidents = [
      {
        residentId: 'RES-2026-00101',
        rollNumber: '21CS204',
        name: 'Himachalam',
        email: 'hima@hostel.edu',
        phone: '+91 98765 43210',
        department: 'Computer Science',
        year: 3,
        block: 'Block A',
        floor: 'Floor 2',
        roomNumber: '204',
        bedNumber: 'Bed-1',
        status: 'Active',
        clearanceStatus: 'Cleared',
        assignedAssets: ['AST-A204-BED-01', 'AST-A204-DSK-01', 'AST-A204-FAN-01'],
      },
      {
        residentId: 'RES-2026-00102',
        rollNumber: '22EC102',
        name: 'Priya Sharma',
        email: 'priya@hostel.edu',
        phone: '+91 98765 43211',
        department: 'Electronics',
        year: 2,
        block: 'Block B',
        floor: 'Floor 1',
        roomNumber: '102',
        bedNumber: 'Bed-1',
        status: 'Active',
        clearanceStatus: 'Cleared',
        assignedAssets: ['AST-B102-AC-01'],
      },
      {
        residentId: 'RES-2026-00103',
        rollNumber: '21IT112',
        name: 'Naveen Kumar',
        email: 'naveen@hostel.edu',
        phone: '+91 98765 43212',
        department: 'Information Tech',
        year: 3,
        block: 'Block A',
        floor: 'Floor 1',
        roomNumber: '112',
        bedNumber: 'Bed-1',
        status: 'Active',
        clearanceStatus: 'Cleared',
        assignedAssets: ['AST-A112-CHR-01'],
      },
      {
        residentId: 'RES-2026-00104',
        rollNumber: '23ME305',
        name: 'Devansh Chouhan',
        email: 'devansh@hostel.edu',
        phone: '+91 98765 43213',
        department: 'Mechanical',
        year: 1,
        block: 'Block C',
        floor: 'Floor 3',
        roomNumber: '305',
        bedNumber: 'Bed-1',
        status: 'Active',
        clearanceStatus: 'Cleared',
        assignedAssets: [],
      },
    ];

    for (const res of initialResidents) {
      const existing = await Resident.findOne({ rollNumber: res.rollNumber });
      if (!existing) {
        await Resident.create(res);
      }
    }

    // Seed Institutional Vendors
    const initialVendors = [
      {
        vendorId: 'VND-2026-00101',
        name: 'Apex HVAC Solutions Pvt Ltd',
        category: 'HVAC & Cooling',
        contactPerson: 'Rajesh Mehra',
        email: 'service@apexhvac.com',
        phone: '+91 98111 22334',
        gstNumber: '07AAAAA0000A1Z5',
        address: 'Sector 62, Noida, NCR, India',
        rating: 4.8,
        slaCompliance: 98.2,
        ordersCount: 4,
        totalSpend: 245000,
        status: 'Active',
        notes: 'Primary AMC partner for Daikin & Voltas VRV/split systems.',
        catalog: [
          { itemName: 'Daikin 1.5T 5-Star Split AC', category: 'HVAC', unitPrice: 42000, leadTimeDays: 5, warrantyMonths: 24 },
          { itemName: 'Voltas 1.5T Inverter AC', category: 'HVAC', unitPrice: 38000, leadTimeDays: 4, warrantyMonths: 12 },
        ],
      },
      {
        vendorId: 'VND-2026-00102',
        name: 'Godrej Interio Institutional',
        category: 'Furniture & Woodwork',
        contactPerson: 'Sanjay Dutt',
        email: 'institutional@godrejinterio.com',
        phone: '+91 98222 33445',
        gstNumber: '27AAAAA1111B2Z3',
        address: 'Vikhroli West, Mumbai, MH, India',
        rating: 4.6,
        slaCompliance: 95.0,
        ordersCount: 3,
        totalSpend: 180000,
        status: 'Active',
        notes: 'High-durability hostel modular study tables and steel bunker beds.',
        catalog: [
          { itemName: 'Ergonomic Steel Frame Study Desk', category: 'Furniture', unitPrice: 4500, leadTimeDays: 10, warrantyMonths: 36 },
          { itemName: 'Heavy Duty Metal Bed Frame', category: 'Furniture', unitPrice: 7800, leadTimeDays: 14, warrantyMonths: 60 },
        ],
      },
      {
        vendorId: 'VND-2026-00103',
        name: 'Jaquar Commercial Sanitation',
        category: 'Plumbing & Sanitation',
        contactPerson: 'Kavita Singh',
        email: 'projects@jaquar.com',
        phone: '+91 98444 55667',
        gstNumber: '06BBBBB2222C3Z1',
        address: 'Manesar Industrial Area, Gurgaon, HR, India',
        rating: 4.9,
        slaCompliance: 99.0,
        ordersCount: 5,
        totalSpend: 110000,
        status: 'Active',
        notes: 'Brass fixtures, commercial instant water geysers and pressure pumps.',
        catalog: [
          { itemName: 'Commercial 50L Storage Geyser', category: 'Plumbing', unitPrice: 9500, leadTimeDays: 3, warrantyMonths: 24 },
          { itemName: 'Heavy Brass Dual Flow Sensor Tap', category: 'Plumbing', unitPrice: 3200, leadTimeDays: 3, warrantyMonths: 12 },
        ],
      },
    ];

    for (const v of initialVendors) {
      const existing = await Vendor.findOne({ vendorId: v.vendorId });
      if (!existing) {
        await Vendor.create(v);
      }
    }

    // Seed Sample Institutional Purchase Order
    const poExists = await PurchaseOrder.findOne({ poNumber: 'PO-2026-00101' });
    if (!poExists) {
      await PurchaseOrder.create({
        poNumber: 'PO-2026-00101',
        title: 'Batch Procurement of 4 Daikin 1.5T Split ACs for Block B North Wing',
        vendorId: 'VND-2026-00101',
        vendorName: 'Apex HVAC Solutions Pvt Ltd',
        category: 'HVAC & Cooling',
        priority: 'High',
        status: 'Approved',
        requestedBy: 'Campus Facility Director',
        approvedBy: 'Chief Warden',
        approvalDate: new Date(),
        totalAmount: 168000,
        items: [
          {
            itemName: 'Daikin 1.5T 5-Star Split AC',
            category: 'Air Conditioning',
            modelNumber: 'FTKM50',
            quantity: 4,
            unitPrice: 42000,
            totalPrice: 168000,
            specifications: 'Copper Condenser, PM 2.5 Filter, 5-Star BEE',
            targetHostel: 'BH-1',
            targetBlock: 'Block B',
            targetRoom: 'Room 201',
          },
        ],
      });
    }

    console.log('✅ HostelOps database seed check complete (Hostels, Rooms, Residents, Vendors, POs initialized).');
  } catch (error) {
    console.error('❌ MongoDB Seeding Error:', error.message);
  }
}

export default { connectDB, seedInitialData, dbStatus, isConnected };
