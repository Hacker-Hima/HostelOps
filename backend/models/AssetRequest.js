const mongoose = require('mongoose');

const assetRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assetName: {
      type: String,
      required: [true, 'Please specify the asset name or type'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Bed',
        'Table',
        'Chair',
        'Fan',
        'Light',
        'Computer',
        'Mattress',
        'Cupboard',
        'Electrical Equipment',
        'Other',
      ],
      default: 'Other',
    },
    hostelBlock: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a reason for the request'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    adminRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    allocatedAsset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

assetRequestSchema.index({ requestedBy: 1 });
assetRequestSchema.index({ status: 1 });
assetRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AssetRequest || mongoose.model('AssetRequest', assetRequestSchema);
