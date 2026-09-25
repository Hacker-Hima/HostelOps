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
    const shouldSeed = process.env.SEED_DATABASE === 'true';
    const userCount = await User.countDocuments();

    if (shouldSeed || userCount === 0) {
      console.log('🌱 Initializing or refreshing Hostel Asset Management System seed data...');
      await seedInitialData();
    } else {
      console.log(`ℹ️ Database already initialized (${userCount} users found). Verifying credentials...`);
      await ensureDefaultPasswords();
    }
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
      const existing = await User.findOne({ username: u.username });
      if (!existing) {
        await User.create(u);
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

    console.log('✅ HostelOps database seed check complete.');
  } catch (error) {
    console.error('❌ MongoDB Seeding Error:', error.message);
  }
}

export default { connectDB, seedInitialData, dbStatus, isConnected };
