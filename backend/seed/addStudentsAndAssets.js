const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Asset = require('../models/Asset');
const AssetHistory = require('../models/AssetHistory');

dotenv.config();

const addStudentsAndAssets = async () => {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel_asset_management';

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  console.log('[Setup]: Connected to MongoDB at', mongoUri);

  // Find Chief Warden or first admin for history logging
  let admin = await User.findOne({ role: 'admin' });
  const adminName = admin ? admin.name : 'Chief Warden';
  const adminId = admin ? admin._id : null;

  // 1. Define new students to add
  const newStudentsData = [
    {
      name: 'Rohan Mehta',
      email: 'rohan.mehta@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block B',
      roomNumber: 'B-201',
      phone: '+91 98112 34567',
      studentId: 'HST-2024-0201',
    },
    {
      name: 'Ananya Sharma',
      email: 'ananya.sharma@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block A',
      roomNumber: 'A-105',
      phone: '+91 98223 45678',
      studentId: 'HST-2024-0105',
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.singh@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block C',
      roomNumber: 'C-302',
      phone: '+91 98334 56789',
      studentId: 'HST-2024-0302',
    },
    {
      name: 'Kavita Raman',
      email: 'kavita.raman@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block B',
      roomNumber: 'B-208',
      phone: '+91 98445 67890',
      studentId: 'HST-2024-0208',
    },
    {
      name: 'Deepak Verma',
      email: 'deepak.verma@hostel.edu',
      password: 'password123',
      role: 'student',
      hostelBlock: 'Block D',
      roomNumber: 'D-401',
      phone: '+91 98556 78901',
      studentId: 'HST-2024-0401',
    },
  ];

  console.log('[Setup]: Checking and creating students...');
  const studentMap = {};

  // Also fetch existing students: Rahul, Priya, Amit, Sneha, Arun
  const existingStudents = await User.find({ role: 'student' });
  for (const s of existingStudents) {
    studentMap[s.email.toLowerCase()] = s;
  }

  for (const sData of newStudentsData) {
    let student = await User.findOne({ email: sData.email.toLowerCase() });
    if (!student) {
      student = await User.create(sData);
      console.log(`  + Created student: ${student.name} (${student.email})`);
    } else {
      console.log(`  * Student already exists: ${student.name} (${student.email})`);
    }
    studentMap[student.email.toLowerCase()] = student;
  }

  // 2. Define Assets to create and assign
  const assetsDefinitions = [
    // Rohan Mehta (Block B, B-201)
    {
      assetName: 'Single Ergonomic Steel Bed',
      assetCode: 'AST-BED-014',
      category: 'Bed',
      hostelBlock: 'Block B',
      roomNumber: 'B-201',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'rohan.mehta@hostel.edu',
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
      assignToEmail: 'rohan.mehta@hostel.edu',
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
      assignToEmail: 'rohan.mehta@hostel.edu',
      price: 2400,
      description: 'Ergonomic breathable mesh chair with lumbar cushion',
    },

    // Ananya Sharma (Block A, A-105)
    {
      assetName: 'Premium Steel Single Bed',
      assetCode: 'AST-BED-017',
      category: 'Bed',
      hostelBlock: 'Block A',
      roomNumber: 'A-105',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'ananya.sharma@hostel.edu',
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
      assignToEmail: 'ananya.sharma@hostel.edu',
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
      assignToEmail: 'ananya.sharma@hostel.edu',
      price: 7800,
      description: 'Lockable dual compartment steel almirah with hanger rail',
    },

    // Vikram Singh (Block C, C-302)
    {
      assetName: 'Compact Corner Study Desk',
      assetCode: 'AST-TBL-020',
      category: 'Table',
      hostelBlock: 'Block C',
      roomNumber: 'C-302',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'vikram.singh@hostel.edu',
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
      assignToEmail: 'vikram.singh@hostel.edu',
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
      assignToEmail: 'vikram.singh@hostel.edu',
      price: 1950,
      description: '1200mm 380 RPM aerodynamic blade energy efficient ceiling fan',
    },

    // Kavita Raman (Block B, B-208)
    {
      assetName: 'Tubular Steel Single Cot',
      assetCode: 'AST-BED-023',
      category: 'Bed',
      hostelBlock: 'Block B',
      roomNumber: 'B-208',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'kavita.raman@hostel.edu',
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
      assignToEmail: 'kavita.raman@hostel.edu',
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
      assignToEmail: 'kavita.raman@hostel.edu',
      price: 1250,
      description: 'Dimmable 10W LED study lamp with adjustable flexible neck',
    },

    // Deepak Verma (Block D, D-401)
    {
      assetName: 'HP ProBook Student Workstation',
      assetCode: 'AST-CMP-026',
      category: 'Computer',
      hostelBlock: 'Block D',
      roomNumber: 'D-401',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'deepak.verma@hostel.edu',
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
      assignToEmail: 'deepak.verma@hostel.edu',
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
      assignToEmail: 'deepak.verma@hostel.edu',
      price: 3200,
      description: 'High density foam cushioned chair with armrests',
    },

    // Sneha Kulkarni (Block C, C-305) - existing student who lacked assets
    {
      assetName: 'Single Metal Bed Frame',
      assetCode: 'AST-BED-029',
      category: 'Bed',
      hostelBlock: 'Block C',
      roomNumber: 'C-305',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'sneha@hostel.edu',
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
      assignToEmail: 'sneha@hostel.edu',
      price: 2900,
      description: 'High-resilience foam mattress with anti-dust mite cover',
    },

    // Arun Kumar (Block A, 101) - existing student
    {
      assetName: 'Solid Teak Study Desk',
      assetCode: 'AST-TBL-031',
      category: 'Table',
      hostelBlock: 'Block A',
      roomNumber: '101',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'arunkumar.student@gmail.com',
      price: 3400,
      description: 'Classic wooden study desk with smooth lacquer finish',
    },
    {
      assetName: 'Adjustable Height Swivel Chair',
      assetCode: 'AST-CHR-032',
      category: 'Chair',
      hostelBlock: 'Block A',
      roomNumber: '101',
      quantity: 1,
      condition: 'Good',
      status: 'Assigned',
      assignToEmail: 'arunkumar.student@gmail.com',
      price: 2500,
      description: 'Pneumatic height-adjustable study chair with castors',
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
      assignToEmail: null,
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
      assignToEmail: null,
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
      assignToEmail: null,
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
      assignToEmail: null,
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
      assignToEmail: null,
      price: 9500,
      description: 'High security steel cupboard with keypad passcode lock',
    },
  ];

  console.log('[Setup]: Checking and creating assets + assignments...');
  for (const aDef of assetsDefinitions) {
    let assignedUserId = null;
    let targetRoom = aDef.roomNumber;
    let targetBlock = aDef.hostelBlock;

    if (aDef.assignToEmail && studentMap[aDef.assignToEmail.toLowerCase()]) {
      const student = studentMap[aDef.assignToEmail.toLowerCase()];
      assignedUserId = student._id;
      targetRoom = student.roomNumber;
      targetBlock = student.hostelBlock;
    }

    let asset = await Asset.findOne({ assetCode: aDef.assetCode });
    if (!asset) {
      asset = await Asset.create({
        assetName: aDef.assetName,
        assetCode: aDef.assetCode,
        category: aDef.category,
        hostelBlock: targetBlock,
        roomNumber: targetRoom,
        quantity: aDef.quantity,
        condition: aDef.condition,
        status: assignedUserId ? 'Assigned' : aDef.status,
        assignedTo: assignedUserId,
        price: aDef.price,
        description: aDef.description,
      });

      console.log(
        `  + Created Asset: ${asset.assetCode} - ${asset.assetName} [${asset.status}]` +
          (assignedUserId ? ` -> Assigned to ${aDef.assignToEmail}` : '')
      );

      // Create history record
      await AssetHistory.create({
        asset: asset._id,
        assetCode: asset.assetCode,
        assetName: asset.assetName,
        action: asset.status === 'Assigned' ? 'Assigned' : 'Created',
        performedBy: adminId,
        performedByName: adminName,
        previousStatus: 'Available',
        newStatus: asset.status,
        details:
          asset.status === 'Assigned'
            ? `Allocated to ${aDef.assignToEmail} in ${targetBlock} Rm ${targetRoom}`
            : `Initial inventory batch registered with status: ${asset.status}`,
        timestamp: new Date(),
      });
    } else {
      // If already exists, update assignment if needed
      if (assignedUserId && (!asset.assignedTo || asset.status !== 'Assigned')) {
        asset.assignedTo = assignedUserId;
        asset.status = 'Assigned';
        asset.roomNumber = targetRoom;
        asset.hostelBlock = targetBlock;
        await asset.save();
        console.log(`  * Updated Asset: ${asset.assetCode} -> Assigned to ${aDef.assignToEmail}`);

        await AssetHistory.create({
          asset: asset._id,
          assetCode: asset.assetCode,
          assetName: asset.assetName,
          action: 'Assigned',
          performedBy: adminId,
          performedByName: adminName,
          previousStatus: 'Available',
          newStatus: 'Assigned',
          details: `Assigned to ${aDef.assignToEmail} in ${targetBlock} Rm ${targetRoom}`,
          timestamp: new Date(),
        });
      } else {
        console.log(`  * Asset already exists: ${asset.assetCode} [${asset.status}]`);
      }
    }
  }

  console.log('\n[Summary of Students and Assigned Assets]:');
  const allStudents = await User.find({ role: 'student' }).sort({ name: 1 });
  for (const s of allStudents) {
    const sAssets = await Asset.find({ assignedTo: s._id });
    console.log(
      `👤 ${s.name} (${s.email}) | ID: ${s.studentId || 'N/A'} | Room: ${s.hostelBlock} - ${s.roomNumber} | Assigned Assets: ${sAssets.length}`
    );
    for (const a of sAssets) {
      console.log(`   - [${a.assetCode}] ${a.assetName} (${a.category}) - ${a.condition}`);
    }
  }

  const availableCount = await Asset.countDocuments({ status: 'Available' });
  console.log(`\n📦 Total Available Inventory Assets for testing: ${availableCount}`);
};

if (require.main === module) {
  addStudentsAndAssets()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

module.exports = addStudentsAndAssets;
