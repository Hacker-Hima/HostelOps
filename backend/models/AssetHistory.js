const mongoose = require('mongoose');

const assetHistorySchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    assetCode: {
      type: String,
      required: true,
      trim: true,
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    performedByName: {
      type: String,
      default: 'System Administrator',
    },
    previousStatus: {
      type: String,
      default: '',
    },
    newStatus: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

assetHistorySchema.index({ assetCode: 1 });
assetHistorySchema.index({ timestamp: -1 });
assetHistorySchema.index({ action: 1 });

module.exports = mongoose.models.AssetHistory || mongoose.model('AssetHistory', assetHistorySchema);
