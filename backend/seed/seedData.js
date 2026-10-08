const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Asset = require('../models/Asset');
const AssetRequest = require('../models/AssetRequest');
const DamageReport = require('../models/DamageReport');
const AssetHistory = require('../models/AssetHistory');
const MaintenanceTask = require('../models/MaintenanceTask');

dotenv.config();

const seedAll = async () => {
  try {
    console.log('[Seed]: Clearing existing data...');
    await User.deleteMany({});
    await Asset.deleteMany({});
    await AssetRequest.deleteMany({});
    await DamageReport.deleteMany({});
    await AssetHistory.deleteMany({});
    await MaintenanceTask.deleteMany({});

    console.log('[Seed]: Inserting users...');
    // Seed 2 Admins
    const admin1 = await User.create({
      name: 'Dr. Ramesh Kumar (Chief Warden)',
      email: 'admin1@hostel.edu',
      password: 'password123',
      role: 'admin',
      hostelBlock: 'Admin Office',
      roomNumber: 'Office 1',
      phone: '+91 98765 43210',
    });

    const admin2 = await User.create({
      name: 'Ms. Sunita Sharma (Assistant Warden)',
      email: 'admin2@hostel.edu',
      password: 'password123',
      role: 'admin',
      hostelBlock: 'Admin Office',
      roomNumber: 'Office 2',
      phone: '+91 98765 43211',
    });

    // Seed 4 Students
    const student1 = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block A',
      roomNumber: 'A-101',
      phone: '+91 91234 56781',
      studentId: 'HST-2023-0101',
    });

    const student2 = await User.create({
      name: 'Priya Nair',
      email: 'priya@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block B',
      roomNumber: 'B-204',
      phone: '+91 91234 56782',
      studentId: 'HST-2023-0204',
    });

    const student3 = await User.create({
      name: 'Amit Patel',
      email: 'amit@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block A',
      roomNumber: 'A-102',
      phone: '+91 91234 56783',
      studentId: 'HST-2023-0102',
    });

    const student4 = await User.create({
      name: 'Sneha Kulkarni',
      email: 'sneha@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block C',
      roomNumber: 'C-305',
      phone: '+91 91234 56784',
      studentId: 'HST-2023-0305',
    });

    const student5 = await User.create({
      name: 'Rohan Mehta',
      email: 'rohan.mehta@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block B',
      roomNumber: 'B-201',
      phone: '+91 98112 34567',
      studentId: 'HST-2024-0201',
    });

    const student6 = await User.create({
      name: 'Ananya Sharma',
      email: 'ananya.sharma@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block A',
      roomNumber: 'A-105',
      phone: '+91 98223 45678',
      studentId: 'HST-2024-0105',
    });

    const student7 = await User.create({
      name: 'Vikram Singh',
      email: 'vikram.singh@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block C',
      roomNumber: 'C-302',
      phone: '+91 98334 56789',
      studentId: 'HST-2024-0302',
    });

    const student8 = await User.create({
      name: 'Kavita Raman',
      email: 'kavita.raman@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block B',
      roomNumber: 'B-208',
      phone: '+91 98445 67890',
      studentId: 'HST-2024-0208',
    });

    const student9 = await User.create({
      name: 'Deepak Verma',
      email: 'deepak.verma@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block D',
      roomNumber: 'D-401',
      phone: '+91 98556 78901',
      studentId: 'HST-2024-0401',
    });

    // Seed 1 Technician / Staff
    const tech1 = await User.create({
      name: 'Selvam Kumar (Senior Hostel Technician)',
      email: 'tech@hostel.edu',
      password: 'password123',
      role: 'technician',
      hostelBlock: 'Depot & Workshop',
      roomNumber: 'Shop-1',
      phone: '+91 94444 12345',
      studentId: 'STAFF-TECH-01',
    });

    console.log('[Seed]: Inserting assets...');
    const assetsData = [
      // Assigned to Student 1 (Rahul)
      {
        assetName: 'Single Steel Bed Frame',
        assetCode: 'AST-BED-001',
        category: 'Bed',
        hostelBlock: 'Block A',
        roomNumber: 'A-101',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student1._id,
        price: 4500,
        description: 'Standard heavy gauge tubular steel cot with powder coating',
      },
      {
        assetName: 'Ergonomic Study Table',
        assetCode: 'AST-TBL-002',
        category: 'Table',
        hostelBlock: 'Block A',
        roomNumber: 'A-101',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student1._id,
        price: 3200,
        description: 'Hardwood study desk with drawer and book holder',
      },
      // Assigned to Student 2 (Priya)
      {
        assetName: 'High-Density Foam Mattress',
        assetCode: 'AST-MAT-003',
        category: 'Mattress',
        hostelBlock: 'Block B',
        roomNumber: 'B-204',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student2._id,
        price: 2800,
        description: '72x36 inch ortho mattress with water resistant cover',
      },
      {
        assetName: 'Steel Dual-Door Cupboard',
        assetCode: 'AST-CPB-004',
        category: 'Cupboard',
        hostelBlock: 'Block B',
        roomNumber: 'B-204',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student2._id,
        price: 7500,
        description: 'Full height steel almirah with individual key locks',
      },
      // Assigned to Student 3 (Amit)
      {
        assetName: 'High-Back Mesh Chair',
        assetCode: 'AST-CHR-005',
        category: 'Chair',
        hostelBlock: 'Block A',
        roomNumber: 'A-102',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student3._id,
        price: 2100,
        description: 'Breathable back mesh study chair with lumbar support',
      },
      // Available Assets
      {
        assetName: 'Crompton High-Speed Ceiling Fan',
        assetCode: 'AST-FAN-006',
        category: 'Fan',
        hostelBlock: 'Block A',
        roomNumber: 'Common Store A',
        quantity: 1,
        condition: 'New',
        status: 'Available',
        assignedTo: null,
        price: 1850,
        description: '1200mm sweep 3-blade energy efficient fan',
      },
      {
        assetName: 'Philips 20W LED Batten Light',
        assetCode: 'AST-LGT-007',
        category: 'Light',
        hostelBlock: 'Block B',
        roomNumber: 'Store B',
        quantity: 1,
        condition: 'New',
        status: 'Available',
        assignedTo: null,
        price: 450,
        description: 'Cool daylight glare-free study tube light',
      },
      {
        assetName: 'Dell OptiPlex 3080 Desktop PC',
        assetCode: 'AST-CMP-008',
        category: 'Computer',
        hostelBlock: 'Block A',
        roomNumber: 'Computer Lab A',
        quantity: 1,
        condition: 'Good',
        status: 'Available',
        assignedTo: null,
        price: 42000,
        description: 'Intel Core i5, 16GB RAM, 512GB SSD for hostel digital library',
      },
      {
        assetName: 'Heavy Duty Wooden Stool',
        assetCode: 'AST-CHR-009',
        category: 'Chair',
        hostelBlock: 'Block C',
        roomNumber: 'Store C',
        quantity: 1,
        condition: 'Fair',
        status: 'Available',
        assignedTo: null,
        price: 900,
        description: 'Solid teak wooden stool for common study room',
      },
      // Damaged Asset
      {
        assetName: 'Bajaj 25L Storage Geyser',
        assetCode: 'AST-ELC-010',
        category: 'Electrical Equipment',
        hostelBlock: 'Block A',
        roomNumber: 'A-Washroom-1',
        quantity: 1,
        condition: 'Damaged',
        status: 'Damaged',
        assignedTo: null,
        price: 6800,
        description: 'Heating coil failure causing tripping of circuit breaker',
      },
      // Under Maintenance Asset
      {
        assetName: 'Voltas 1.5 Ton Split AC',
        assetCode: 'AST-ELC-011',
        category: 'Electrical Equipment',
        hostelBlock: 'Block B',
        roomNumber: 'Reading Hall',
        quantity: 1,
        condition: 'Fair',
        status: 'Under Maintenance',
        assignedTo: null,
        price: 34000,
        description: 'Scheduled coolant refill and compressor servicing',
      },
      // Lost Asset
      {
        assetName: 'Logitech Wireless Keyboard & Mouse',
        assetCode: 'AST-CMP-012',
        category: 'Computer',
        hostelBlock: 'Block C',
        roomNumber: 'Study Lounge',
        quantity: 1,
        condition: 'Poor',
        status: 'Lost',
        assignedTo: null,
        price: 1500,
        description: 'Reported missing from common study lounge terminal',
      },
      // Additional Available asset
      {
        assetName: 'Standard Iron Bookshelf',
        assetCode: 'AST-CPB-013',
        category: 'Cupboard',
        hostelBlock: 'Block C',
        roomNumber: 'Store C',
        quantity: 1,
        condition: 'Good',
        status: 'Available',
        assignedTo: null,
        price: 3600,
        description: '4-tier metal book rack with anti-rust coating',
      },
      // Assigned to Student 5 (Rohan Mehta)
      {
        assetName: 'Single Ergonomic Steel Bed',
        assetCode: 'AST-BED-014',
        category: 'Bed',
        hostelBlock: 'Block B',
        roomNumber: 'B-201',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student5._id,
        price: 4800,
        description: 'Single tubular steel frame with reinforced mattress support bars',
      },
      {
        assetName: 'Hardwood Study Table with Drawers',
        assetCode: 'AST-TBL-015',
        category: 'Table',
        hostelBlock: 'Block B',
        roomNumber: 'B-201',
        quantity: 1,
        condition: 'New',
        status: 'Assigned',
        assignedTo: student5._id,
        price: 3600,
        description: 'Laminated teakwood study desk with lockable storage drawer',
      },
      {
        assetName: 'High-Back Mesh Study Chair',
        assetCode: 'AST-CHR-016',
        category: 'Chair',
        hostelBlock: 'Block B',
        roomNumber: 'B-201',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student5._id,
        price: 2400,
        description: 'Ergonomic breathable mesh chair with lumbar cushion',
      },
      // Assigned to Student 6 (Ananya Sharma)
      {
        assetName: 'Premium Steel Single Bed',
        assetCode: 'AST-BED-017',
        category: 'Bed',
        hostelBlock: 'Block A',
        roomNumber: 'A-105',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student6._id,
        price: 5200,
        description: 'Heavy duty single cot bed with anti-scratch coating',
      },
      {
        assetName: 'High-Density Orthopedic Mattress',
        assetCode: 'AST-MAT-018',
        category: 'Mattress',
        hostelBlock: 'Block A',
        roomNumber: 'A-105',
        quantity: 1,
        condition: 'New',
        status: 'Assigned',
        assignedTo: student6._id,
        price: 3100,
        description: '72x36 inch multi-layer ortho foam with waterproof jacquard cover',
      },
      {
        assetName: 'Steel 2-Door Personal Wardrobe',
        assetCode: 'AST-CPB-019',
        category: 'Cupboard',
        hostelBlock: 'Block A',
        roomNumber: 'A-105',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student6._id,
        price: 7800,
        description: 'Lockable dual compartment steel almirah with hanger rail',
      },
      // Assigned to Student 7 (Vikram Singh)
      {
        assetName: 'Compact Corner Study Desk',
        assetCode: 'AST-TBL-020',
        category: 'Table',
        hostelBlock: 'Block C',
        roomNumber: 'C-302',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student7._id,
        price: 3200,
        description: 'Solid engineered wood desk with cable grommet and bookshelf tier',
      },
      {
        assetName: 'Ergonomic Lumbar Support Chair',
        assetCode: 'AST-CHR-021',
        category: 'Chair',
        hostelBlock: 'Block C',
        roomNumber: 'C-302',
        quantity: 1,
        condition: 'New',
        status: 'Assigned',
        assignedTo: student7._id,
        price: 2700,
        description: 'Full back supportive study chair with nylon swivel base',
      },
      {
        assetName: 'Crompton High-Speed Ceiling Fan',
        assetCode: 'AST-FAN-022',
        category: 'Fan',
        hostelBlock: 'Block C',
        roomNumber: 'C-302',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student7._id,
        price: 1950,
        description: '1200mm 380 RPM aerodynamic blade energy efficient ceiling fan',
      },
      // Assigned to Student 8 (Kavita Raman)
      {
        assetName: 'Tubular Steel Single Cot',
        assetCode: 'AST-BED-023',
        category: 'Bed',
        hostelBlock: 'Block B',
        roomNumber: 'B-208',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student8._id,
        price: 4600,
        description: 'Standard hostel tubular frame cot with corner rubber bushes',
      },
      {
        assetName: 'Heavy-Duty 4-Shelf Book Rack',
        assetCode: 'AST-CPB-024',
        category: 'Cupboard',
        hostelBlock: 'Block B',
        roomNumber: 'B-208',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student8._id,
        price: 3400,
        description: 'Multi-tiered steel bookshelf for reference books and files',
      },
      {
        assetName: 'Philips Eye-Friendly Study Desk Lamp',
        assetCode: 'AST-LGT-025',
        category: 'Light',
        hostelBlock: 'Block B',
        roomNumber: 'B-208',
        quantity: 1,
        condition: 'New',
        status: 'Assigned',
        assignedTo: student8._id,
        price: 1250,
        description: 'Dimmable 10W LED study lamp with adjustable flexible neck',
      },
      // Assigned to Student 9 (Deepak Verma)
      {
        assetName: 'HP ProBook Student Workstation',
        assetCode: 'AST-CMP-026',
        category: 'Computer',
        hostelBlock: 'Block D',
        roomNumber: 'D-401',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student9._id,
        price: 45000,
        description: 'Core i5 11th Gen, 16GB RAM, 512GB SSD configured for lab coursework',
      },
      {
        assetName: 'Modular Computer Desk',
        assetCode: 'AST-TBL-027',
        category: 'Table',
        hostelBlock: 'Block D',
        roomNumber: 'D-401',
        quantity: 1,
        condition: 'New',
        status: 'Assigned',
        assignedTo: student9._id,
        price: 4100,
        description: 'Wide desktop workstation table with keyboard tray and CPU stand',
      },
      {
        assetName: 'Padded Executive Study Chair',
        assetCode: 'AST-CHR-028',
        category: 'Chair',
        hostelBlock: 'Block D',
        roomNumber: 'D-401',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student9._id,
        price: 3200,
        description: 'High density foam cushioned chair with armrests',
      },
      // Assigned to Student 4 (Sneha Kulkarni)
      {
        assetName: 'Single Metal Bed Frame',
        assetCode: 'AST-BED-029',
        category: 'Bed',
        hostelBlock: 'Block C',
        roomNumber: 'C-305',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student4._id,
        price: 4500,
        description: 'Durable steel single bed frame with headboard',
      },
      {
        assetName: 'Orthopedic Spring Mattress',
        assetCode: 'AST-MAT-030',
        category: 'Mattress',
        hostelBlock: 'Block C',
        roomNumber: 'C-305',
        quantity: 1,
        condition: 'Good',
        status: 'Assigned',
        assignedTo: student4._id,
        price: 2900,
        description: 'High-resilience foam mattress with anti-dust mite cover',
      },
      // Extra Available Assets for inventory & testing
      {
        assetName: 'Foldable Extra Steel Bed',
        assetCode: 'AST-BED-033',
        category: 'Bed',
        hostelBlock: 'Block A',
        roomNumber: 'Common Store A',
        quantity: 1,
        condition: 'New',
        status: 'Available',
        assignedTo: null,
        price: 3800,
        description: 'Foldable spare steel guest/emergency bed with lock wheels',
      },
      {
        assetName: 'Dell OptiPlex Desktop Lab PC',
        assetCode: 'AST-CMP-034',
        category: 'Computer',
        hostelBlock: 'Block B',
        roomNumber: 'Lab B',
        quantity: 1,
        condition: 'Good',
        status: 'Available',
        assignedTo: null,
        price: 38000,
        description: 'Core i5 10th Gen, 8GB RAM, 256GB SSD available for lab assignment',
      },
      {
        assetName: 'Orient 1200mm Anti-Dust Ceiling Fan',
        assetCode: 'AST-FAN-035',
        category: 'Fan',
        hostelBlock: 'Block C',
        roomNumber: 'Store C',
        quantity: 1,
        condition: 'New',
        status: 'Available',
        assignedTo: null,
        price: 2100,
        description: 'Hydrophobic nanotech coating 3-blade ceiling fan in box',
      },
      {
        assetName: 'Syska 22W LED Batten Light',
        assetCode: 'AST-LGT-036',
        category: 'Light',
        hostelBlock: 'Block D',
        roomNumber: 'Store D',
        quantity: 1,
        condition: 'New',
        status: 'Available',
        assignedTo: null,
        price: 520,
        description: 'High lumen surge protected LED tube fitting',
      },
      {
        assetName: 'Metal Security Almirah with Digital Lock',
        assetCode: 'AST-CPB-037',
        category: 'Cupboard',
        hostelBlock: 'Block A',
        roomNumber: 'Store A',
        quantity: 1,
        condition: 'New',
        status: 'Available',
        assignedTo: null,
        price: 9500,
        description: 'High security steel cupboard with keypad passcode lock',
      },
    ];

    const insertedAssets = await Asset.insertMany(assetsData);

    console.log('[Seed]: Inserting asset history...');
    for (const asset of insertedAssets) {
      await AssetHistory.create({
        asset: asset._id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        action: asset.status === 'Assigned' ? 'Assigned' : 'Created',
        performedByName: 'Dr. Ramesh Kumar (Chief Warden)',
        details:
          asset.status === 'Assigned'
            ? `Allocated during semester setup to ${asset.roomNumber}`
            : `Initial inventory batch registered with status: ${asset.status}`,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000),
      });
    }

    console.log('[Seed]: Inserting asset requests...');
    await AssetRequest.create({
      requestedBy: student1._id,
      assetName: 'Wall Mounted Book Shelf',
      category: 'Cupboard',
      hostelBlock: 'Block A',
      roomNumber: 'A-101',
      reason: 'Need extra shelf to store textbooks for upcoming semester exams.',
      status: 'Pending',
    });

    await AssetRequest.create({
      requestedBy: student4._id,
      assetName: 'Additional Study Chair',
      category: 'Chair',
      hostelBlock: 'Block C',
      roomNumber: 'C-305',
      reason: 'Shared room needs second study chair for roommate.',
      status: 'Approved',
      adminRemarks: 'Approved from Block C inventory store.',
      allocatedAsset: insertedAssets[8]._id,
    });

    console.log('[Seed]: Inserting damage reports...');
    await DamageReport.create({
      asset: insertedAssets[9]._id, // Geyser
      reportedBy: student3._id,
      reportType: 'Damaged',
      description: 'Geyser is not heating water and sparks were noticed on the socket.',
      severity: 'Severe',
      status: 'Investigating',
      adminRemarks: 'Electrician scheduled for inspection on Thursday.',
    });

    await DamageReport.create({
      asset: insertedAssets[11]._id, // Logitech combo
      reportedBy: student4._id,
      reportType: 'Lost',
      description: 'The wireless mouse was not present on desk #2 in Study Lounge.',
      severity: 'Moderate',
      status: 'Reported',
      adminRemarks: 'CCTV footage under review.',
    });

    console.log('[Seed]: Inserting maintenance tasks...');
    await MaintenanceTask.create({
      taskCode: 'MT-1001',
      title: 'Ceiling Fan Speed Regulator & Capacitor Check',
      asset: insertedAssets[3]._id, // Fan in A-101
      assignedTo: tech1._id,
      assignedName: tech1.name,
      category: 'Fan',
      hostelBlock: 'Block A',
      roomNumber: 'A-101',
      priority: 'High',
      status: 'In Progress',
      assetCondition: 'Under Maintenance',
      issueDescription: 'Fan rotating on very low speed on speed 5, humming noise from regulator.',
      repairDetails: 'Inspected regulator box and motor windings; diagnosed weak 2.5uF capacitor.',
      remarks: 'Inspected fan motor, replacing capacitor.',
      reportedBy: student1._id,
      reportedByName: 'Rahul Verma',
    });

    await MaintenanceTask.create({
      taskCode: 'MT-1002',
      title: 'Wooden Study Table Leg Alignment & Screw Tightening',
      asset: insertedAssets[1]._id, // Table in A-101
      assignedTo: tech1._id,
      assignedName: tech1.name,
      category: 'Table',
      hostelBlock: 'Block A',
      roomNumber: 'A-101',
      priority: 'Medium',
      status: 'Pending',
      assetCondition: 'Fair',
      issueDescription: 'Left desk leg is wobbling and drawer runner is jammed.',
      remarks: 'Pending hardware fitting clamp.',
      reportedBy: student1._id,
      reportedByName: 'Rahul Verma',
    });

    await MaintenanceTask.create({
      taskCode: 'MT-1003',
      title: 'Bajaj 25L Storage Geyser Heating Element Overhaul',
      asset: insertedAssets[9]._id, // Geyser in A-Washroom-1
      assignedTo: tech1._id,
      assignedName: tech1.name,
      category: 'Electrical Equipment',
      hostelBlock: 'Block A',
      roomNumber: 'A-Washroom-1',
      priority: 'Emergency',
      status: 'Pending',
      assetCondition: 'Damaged',
      issueDescription: 'Heating element burnt out, breaker tripping upon power on.',
      remarks: 'Spare 2kW heating element requisitioned.',
      reportedBy: student3._id,
      reportedByName: 'Amit Patel',
    });

    await MaintenanceTask.create({
      taskCode: 'MT-1004',
      title: 'Wall Mounted Light Fixture Choke Replacement',
      asset: insertedAssets[4]._id, // Light
      assignedTo: tech1._id,
      assignedName: tech1.name,
      category: 'Light',
      hostelBlock: 'Block B',
      roomNumber: 'B-204',
      priority: 'Low',
      status: 'Completed',
      assetCondition: 'Good',
      issueDescription: 'Flickering LED tube fixture in bedroom area.',
      repairDetails: 'Replaced faulty driver circuit and fitted new 20W LED batten.',
      remarks: 'Fan capacitor replaced in ceiling unit & light driver replaced.',
      completionDate: '2026-10-06',
      completedAt: new Date(Date.now() - 86400000),
      reportedBy: student2._id,
      reportedByName: 'Priya Nair',
    });

    console.log('--------------------------------------------------');
    console.log('✅ Seed Completed Successfully!');
    console.log('Demo Credentials:');
    console.log('Admin 1:    admin1@hostel.edu    / password123');
    console.log('Admin 2:    admin2@hostel.edu    / password123');
    console.log('Technician: tech@hostel.edu      / password123');
    console.log('Student 1:  rahul@hostel.edu     / password123');
    console.log('Student 2:  priya@hostel.edu     / password123');
    console.log('Student 3:  amit@hostel.edu      / password123');
    console.log('Student 4:  sneha@hostel.edu     / password123');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('[Seed Error]:', err);
    throw err;
  }
};

// Check if run directly
if (require.main === module) {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_asset_management';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      await seedAll();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedAll;
