import mongoose from 'mongoose';

const inspectionItemSchema = new mongoose.Schema(
  {
    assetTag: { type: String, required: true },
    assetName: { type: String, required: true },
    conditionOnCheckIn: { type: String, default: 'Good' },
    conditionOnCheckOut: { type: String, default: 'Good' },
    isDamaged: { type: Boolean, default: false },
    damageDescription: { type: String, default: '' },
    penaltyAmount: { type: Number, default: 0 },
    verifiedBy: { type: String, default: '' },
  },
  { _id: true }
);

const inspectionRecordSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['CheckIn', 'CheckOut', 'RoutineAudit'], default: 'CheckOut' },
    date: { type: Date, default: Date.now },
    inspectorName: { type: String, required: true },
    inspectorRole: { type: String, default: 'Warden' },
    items: [inspectionItemSchema],
    totalPenalty: { type: Number, default: 0 },
    wardenApproval: {
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      approvedBy: { type: String, default: '' },
      approvedAt: { type: Date },
      remarks: { type: String, default: '' },
    },
    roomReleased: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const residentSchema = new mongoose.Schema(
  {
    residentId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: '' }, // ref to User.id
    rollNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    department: { type: String, default: 'Computer Science' },
    year: { type: Number, default: 3 },
    hostel: { type: String, default: 'Hostel Main' },
    block: { type: String, required: true },
    floor: { type: String, required: true },
    roomNumber: { type: String, required: true, index: true },
    bedNumber: { type: String, default: 'Bed-1' },
    checkInDate: { type: Date, default: Date.now },
    checkOutDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['Active', 'CheckedOut', 'PendingClearance', 'Vacated'],
      default: 'Active',
    },
    clearanceStatus: {
      type: String,
      enum: ['Cleared', 'Pending', 'DamageFlagged', 'DuesPending'],
      default: 'Cleared',
    },
    totalOutstandingDues: { type: Number, default: 0 },
    assignedAssets: [{ type: String }], // Array of asset tags e.g. AST-A204-BED-01
    inspections: [inspectionRecordSchema],
    guardianContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: 'Parent' },
    },
  },
  { timestamps: true }
);

export const Resident = mongoose.models.Resident || mongoose.model('Resident', residentSchema);
