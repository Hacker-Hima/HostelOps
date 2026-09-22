import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Furniture',
        'Electrical',
        'Electronics',
        'Plumbing',
        'Appliance',
        'Appliances',
        'Networking',
        'Study Equipment',
        'Safety Equipment',
        'Kitchen Equipment',
      ],
      default: 'Furniture',
    },
    block: { type: String, required: true, default: 'Block A' },
    floor: { type: String, required: true, default: 'Floor 1' },
    room: { type: String, required: true, default: '101' },
    location: { type: String, required: true }, // e.g. "Block A - Room 204"
    condition: {
      type: String,
      required: true,
      enum: ['Good', 'Needs Repair', 'Damaged', 'Under Maintenance'],
      default: 'Good',
    },
    status: {
      type: String,
      required: true,
      enum: ['Assigned', 'Available', 'In Store', 'Damaged', 'Under Maintenance', 'Missing', 'Retired'],
      default: 'Assigned',
    },
    purchase_date: { type: String, default: '2024-06-12' },
    purchase_cost: { type: Number, default: 0 },
    current_value: { type: Number, default: 0 },
    depreciation_rate: { type: Number, default: 10 }, // Annual %
    warranty_expiry: { type: String, default: '2027-06-12' },
    supplier: { type: String, default: 'Apex Institutional Furnishings Ltd.' },
    assigned_student_roll: { type: String, default: '' },
    assigned_student_name: { type: String, default: '' },
    last_checked: { type: String, required: true, default: 'Today' },
    qr_code_data: { type: String, default: '' },
    value: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const assetMaintenanceSchema = new mongoose.Schema(
  {
    asset_tag: { type: String, required: true, index: true },
    date: { type: String, required: true },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    cost: { type: Number, default: 0 },
    color: { type: String, default: 'var(--accent-cyan)' },
  },
  { timestamps: true }
);

const assetTransferSchema = new mongoose.Schema(
  {
    asset_tag: { type: String, required: true, index: true },
    asset_name: { type: String, default: '' },
    from_location: { type: String, required: true },
    to_location: { type: String, required: true },
    transferred_by: { type: String, required: true },
    reason: { type: String, default: 'Routine relocation' },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

const assetAuditSchema = new mongoose.Schema(
  {
    audit_id: { type: String, required: true, unique: true, index: true },
    block: { type: String, required: true },
    room: { type: String, required: true },
    auditor: { type: String, required: true },
    date: { type: String, required: true },
    expected_count: { type: Number, default: 0 },
    scanned_count: { type: Number, default: 0 },
    missing_count: { type: Number, default: 0 },
    expected_tags: [{ type: String }],
    scanned_tags: [{ type: String }],
    missing_tags: [{ type: String }],
    status: { type: String, default: 'Completed' },
  },
  { timestamps: true }
);

const handoverClearanceSchema = new mongoose.Schema(
  {
    handover_id: { type: String, required: true, unique: true, index: true },
    student_roll: { type: String, required: true },
    student_name: { type: String, required: true },
    room: { type: String, required: true },
    block: { type: String, required: true },
    date: { type: String, required: true },
    items: [
      {
        tag: String,
        name: String,
        condition: String,
        verified: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ['Pending Review', 'Cleared', 'Damage Discrepancy'],
      default: 'Pending Review',
    },
    cleared_by: { type: String, default: 'Pending Warden' },
    penalty_amount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);
export const AssetMaintenance = mongoose.models.AssetMaintenance || mongoose.model('AssetMaintenance', assetMaintenanceSchema);
export const AssetTransfer = mongoose.models.AssetTransfer || mongoose.model('AssetTransfer', assetTransferSchema);
export const AssetAudit = mongoose.models.AssetAudit || mongoose.model('AssetAudit', assetAuditSchema);
export const HandoverClearance = mongoose.models.HandoverClearance || mongoose.model('HandoverClearance', handoverClearanceSchema);

export default Asset;
