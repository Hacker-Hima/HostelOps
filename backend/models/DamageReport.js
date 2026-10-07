const mongoose = require('mongoose');

const damageReportSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['Damaged', 'Lost'],
      default: 'Damaged',
    },
    description: {
      type: String,
      required: [true, 'Description of the damage or incident is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Minor', 'Moderate', 'Severe', 'Total Loss'],
      default: 'Moderate',
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Reported',
        'Under Review',
        'Under Maintenance',
        'Resolved',
        'Rejected',
        'Investigating',
        'Replaced',
      ],
      default: 'Pending',
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

damageReportSchema.index({ asset: 1 });
damageReportSchema.index({ reportedBy: 1 });
damageReportSchema.index({ status: 1 });
damageReportSchema.index({ createdAt: -1 });

module.exports = mongoose.models.DamageReport || mongoose.model('DamageReport', damageReportSchema);
