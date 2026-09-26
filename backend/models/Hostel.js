import mongoose from 'mongoose';

/**
 * Bed Schema
 */
const bedSchema = new mongoose.Schema(
  {
    bedNumber: { type: String, required: true }, // e.g., 'Bed-1', 'Bed-A'
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'],
      default: 'Available',
    },
    residentId: { type: String, default: null }, // resident ref
    residentName: { type: String, default: null },
    residentRoll: { type: String, default: null },
  },
  { _id: true }
);

/**
 * First-Class Room Model
 */
const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, index: true }, // e.g., 'A-204' or '204'
    hostelName: { type: String, required: true, default: 'Hostel Main' },
    block: { type: String, required: true, index: true }, // 'Block A', 'Block B', 'Admin Block'
    floor: { type: String, required: true }, // 'Floor 1', 'Floor 2'
    floorNumber: { type: Number, default: 1 },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Dormitory', 'Store', 'Common Room'],
      default: 'Double',
    },
    capacity: { type: Number, required: true, default: 2 },
    occupancy: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Optimal', 'Attention', 'Maintenance', 'Critical', 'Vacant'],
      default: 'Optimal',
    },
    maintenanceScore: { type: Number, default: 95 }, // 0 to 100
    wardenAssigned: { type: String, default: 'Dr. Meena Sharma' },
    beds: [bedSchema],
    assetsCount: { type: Number, default: 0 },
    openTicketsCount: { type: Number, default: 0 },
    amenities: [{ type: String }], // ['Fan', 'Geyser', 'Study Desk', 'AC', 'LAN']
    powerMeterId: { type: String, default: '' },
    monthlyEnergyKWh: { type: Number, default: 120 },
  },
  { timestamps: true }
);

roomSchema.index({ block: 1, floor: 1, roomNumber: 1 }, { unique: true });

/**
 * Hostel Block & Facility Model
 */
const hostelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // 'Boys Hostel 1', 'Girls Hostel 2'
    code: { type: String, required: true, unique: true }, // 'BH-1'
    campus: { type: String, default: 'Main Campus' },
    chiefWarden: { type: String, default: 'Dr. K. Sundaram' },
    blocks: [
      {
        name: { type: String, required: true }, // 'Block A'
        totalFloors: { type: Number, default: 4 },
        roomsCount: { type: Number, default: 24 },
        supervisor: { type: String, default: 'Sarathi Kamal' },
      },
    ],
    totalCapacity: { type: Number, default: 350 },
    currentOccupancy: { type: Number, default: 280 },
    overallHealthIndex: { type: Number, default: 92 },
  },
  { timestamps: true }
);

export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
export const Hostel = mongoose.models.Hostel || mongoose.model('Hostel', hostelSchema);
