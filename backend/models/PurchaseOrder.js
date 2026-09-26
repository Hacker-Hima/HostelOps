import mongoose from 'mongoose';
import { generatePOId } from '../utils/idGenerator.js';

const poItemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true },
    category: { type: String, required: true },
    modelNumber: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    specifications: { type: String, default: '' },
    targetHostel: { type: String, default: 'BH-1' },
    targetBlock: { type: String, default: 'Block A' },
    targetRoom: { type: String, default: 'Central Store' },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'PO Title is required'],
      trim: true,
    },
    vendorId: {
      type: String,
      required: true,
      index: true,
    },
    vendorName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Partially Received', 'Received', 'Cancelled'],
      default: 'Pending Approval',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium',
    },
    items: [poItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    requestedBy: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    orderDate: {
      type: Date,
      default: null,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    receivedDate: {
      type: Date,
      default: null,
    },
    receivedItemsCount: {
      type: Number,
      default: 0,
    },
    invoiceNumber: {
      type: String,
      default: '',
    },
    receivingNotes: {
      type: String,
      default: '',
    },
    generatedAssetTags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Mongoose 8+ sync pre-save hook
purchaseOrderSchema.pre('save', function () {
  if (!this.poNumber) {
    this.poNumber = generatePOId();
  }
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((acc, item) => acc + (item.totalPrice || item.quantity * item.unitPrice), 0);
  }
});

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
