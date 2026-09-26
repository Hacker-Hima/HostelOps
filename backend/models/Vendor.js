import mongoose from 'mongoose';
import { generateVendorId } from '../utils/idGenerator.js';

const vendorCatalogItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    category: { type: String, required: true },
    modelNumber: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    leadTimeDays: { type: Number, default: 7 },
    warrantyMonths: { type: Number, default: 12 },
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vendor company name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gstNumber: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4.5,
    },
    status: {
      type: String,
      enum: ['Active', 'Under Review', 'Blacklisted'],
      default: 'Active',
      index: true,
    },
    slaCompliance: {
      type: Number,
      min: 0,
      max: 100,
      default: 95.0,
    },
    ordersCount: {
      type: Number,
      default: 0,
    },
    totalSpend: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    catalog: [vendorCatalogItemSchema],
  },
  {
    timestamps: true,
  }
);

// Mongoose 8+ sync pre-save hook
vendorSchema.pre('save', function () {
  if (!this.vendorId) {
    this.vendorId = generateVendorId();
  }
});

export const Vendor = mongoose.model('Vendor', vendorSchema);
