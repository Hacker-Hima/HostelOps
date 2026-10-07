const mongoose = require('mongoose');

const maintenanceTaskSchema = new mongoose.Schema(
  {
    taskCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedName: {
      type: String,
      default: 'Hostel Maintenance Staff',
      trim: true,
    },
    category: {
      type: String,
      default: 'Other',
      trim: true,
    },
    hostelBlock: {
      type: String,
      default: 'Block A',
      trim: true,
    },
    roomNumber: {
      type: String,
      default: '101',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'On Hold'],
      default: 'Pending',
    },
    assetCondition: {
      type: String,
      enum: ['Good', 'Damaged', 'Under Maintenance', 'Fair', 'Poor', 'Critical', 'New'],
      default: 'Damaged',
    },
    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },
    evidencePhoto: {
      type: String,
      default: '', // base64 or URL
    },
    repairDetails: {
      type: String,
      default: '',
      trim: true,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    completionDate: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    inspectedAt: {
      type: Date,
      default: null,
    },
    inspectionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    damageReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DamageReport',
      default: null,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reportedByName: {
      type: String,
      default: 'Student Resident',
    },
  },
  {
    timestamps: true,
  }
);

maintenanceTaskSchema.index({ status: 1 });
maintenanceTaskSchema.index({ assignedTo: 1 });
maintenanceTaskSchema.index({ asset: 1 });
maintenanceTaskSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.MaintenanceTask ||
  mongoose.model('MaintenanceTask', maintenanceTaskSchema);
