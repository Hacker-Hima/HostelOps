const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetName: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    assetCode: {
      type: String,
      required: [true, 'Asset code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
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
      required: [true, 'Hostel block is required'],
      trim: true,
      default: 'Block A',
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      default: '101',
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Critical', 'Damaged', 'Under Maintenance'],
      default: 'Good',
    },
    status: {
      type: String,
      enum: ['Available', 'Assigned', 'Damaged', 'Lost', 'Under Maintenance'],
      default: 'Available',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose indexes for fast search and query optimization
assetSchema.index({ status: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ hostelBlock: 1, roomNumber: 1 });
assetSchema.index({ condition: 1 });
assetSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Asset || mongoose.model('Asset', assetSchema);
