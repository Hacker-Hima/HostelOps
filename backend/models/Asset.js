import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      default: 'Furniture',
    },
    block: { type: String, required: true, default: 'Block A' },
    floor: { type: String, required: true, default: 'Floor 1' },
    room: { type: String, required: true, default: '101' },
    location: { type: String, required: true }, // e.g. "Block A - Room 204"
    condition: {
      type: String,
      required: true,
      enum: ['Good', 'Needs Repair', 'Damaged', 'Under Maintenance', 'Beyond Repair'],
      default: 'Good',
    },
    status: {
      type: String,
      required: true,
      enum: ['Assigned', 'Available', 'In Store', 'Damaged', 'Under Maintenance', 'Missing', 'Disposed', 'Retired'],
      default: 'Assigned',
    },
    purchase_date: { type: String, default: '2024-06-12' },
    purchase_cost: { type: Number, default: 0 },
    current_value: { type: Number, default: 0 },
    depreciation_rate: { type: Number, default: 10 }, // Annual %
    warranty_expiry: { type: String, default: '2027-06-12' },
    supplier: { type: String, default: 'Apex Institutional Furnishings Ltd.' },
    serial_number: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    assigned_student_roll: { type: String, default: '' },
    assigned_student_name: { type: String, default: '' },
    assigned_date: { type: String, default: '' },
    last_checked: { type: String, required: true, default: 'Today' },
    qr_code_data: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const assetCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    icon: { type: String, default: '📦' },
    description: { type: String, default: '' },
    default_depreciation_rate: { type: Number, default: 10 },
    color: { type: String, default: '#7c3aed' },
  },
  { timestamps: true }
);

const assetMaintenanceSchema = new mongoose.Schema(
  {
    ticket_id: { type: String, required: true, unique: true, index: true },
    asset_tag: { type: String, required: true, index: true },
    asset_name: { type: String, default: '' },
    category: { type: String, default: '' },
    location: { type: String, default: '' },
    issue_description: { type: String, required: true },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    reported_by: { type: String, required: true },
    reporter_role: { type: String, default: 'Student' },
    assigned_technician: { type: String, default: 'Unassigned' },
    technician_phone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Reported', 'Assigned', 'In Progress', 'Repaired', 'Beyond Repair'],
      default: 'Reported',
    },
    repair_cost: { type: Number, default: 0 },
    parts_replaced: { type: String, default: '' },
    reported_date: { type: String, required: true },
    completed_date: { type: String, default: '' },
    notes: { type: String, default: '' },
    color: { type: String, default: '#06b6d4' },
  },
  { timestamps: true }
);

const assetTransferSchema = new mongoose.Schema(
  {
    transfer_id: { type: String, required: true, unique: true, index: true },
    asset_tag: { type: String, required: true, index: true },
    asset_name: { type: String, default: '' },
    from_location: { type: String, required: true },
    to_location: { type: String, required: true },
    from_student: { type: String, default: '' },
    to_student: { type: String, default: '' },
    transferred_by: { type: String, required: true },
    reason: { type: String, default: 'Room reallocation' },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

const assetAuditSchema = new mongoose.Schema(
  {
    audit_id: { type: String, required: true, unique: true, index: true },
    block: { type: String, required: true },
    floor: { type: String, default: 'Floor 1' },
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
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const assetDisposalSchema = new mongoose.Schema(
  {
    disposal_id: { type: String, required: true, unique: true, index: true },
    asset_tag: { type: String, required: true, index: true },
    asset_name: { type: String, required: true },
    category: { type: String, required: true },
    purchase_cost: { type: Number, default: 0 },
    salvage_value: { type: Number, default: 0 },
    disposal_reason: {
      type: String,
      default: 'Beyond Economical Repair',
    },
    disposal_method: {
      type: String,
      default: 'Certified E-Waste Scrap',
    },
    approved_by: { type: String, required: true },
    disposal_date: { type: String, required: true },
    certificate_number: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const assetRequestSchema = new mongoose.Schema(
  {
    request_id: { type: String, required: true, unique: true, index: true },
    student_roll: { type: String, required: true },
    student_name: { type: String, required: true },
    room: { type: String, required: true },
    block: { type: String, required: true },
    asset_category: { type: String, required: true },
    asset_name: { type: String, required: true },
    reason: { type: String, required: true },
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Allocated', 'Rejected'],
      default: 'Pending',
    },
    allocated_asset_tag: { type: String, default: '' },
    request_date: { type: String, required: true },
    reviewed_by: { type: String, default: '' },
    review_notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);
export const AssetCategory = mongoose.models.AssetCategory || mongoose.model('AssetCategory', assetCategorySchema);
export const AssetMaintenance = mongoose.models.AssetMaintenance || mongoose.model('AssetMaintenance', assetMaintenanceSchema);
export const AssetTransfer = mongoose.models.AssetTransfer || mongoose.model('AssetTransfer', assetTransferSchema);
export const AssetAudit = mongoose.models.AssetAudit || mongoose.model('AssetAudit', assetAuditSchema);
export const AssetDisposal = mongoose.models.AssetDisposal || mongoose.model('AssetDisposal', assetDisposalSchema);
export const AssetRequest = mongoose.models.AssetRequest || mongoose.model('AssetRequest', assetRequestSchema);

export default Asset;
