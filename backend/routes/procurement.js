import express from 'express';
import { Vendor } from '../models/Vendor.js';
import { PurchaseOrder } from '../models/PurchaseOrder.js';
import { Asset } from '../models/Asset.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { generateAssetTag } from '../utils/idGenerator.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/permissions.js';

const router = express.Router();

// ==========================================
// VENDORS API
// ==========================================

// GET /api/procurement/vendors - List all vendors
router.get('/vendors', authenticate, async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vendorId: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const vendors = await Vendor.find(query).sort({ rating: -1, createdAt: -1 });

    // Aggregate scorecard stats
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter((v) => v.status === 'Active').length;
    const avgRating =
      totalVendors > 0
        ? (vendors.reduce((acc, v) => acc + (v.rating || 0), 0) / totalVendors).toFixed(1)
        : '0.0';
    const totalSpend = vendors.reduce((acc, v) => acc + (v.totalSpend || 0), 0);

    res.json({
      success: true,
      data: vendors,
      metrics: {
        totalVendors,
        activeVendors,
        avgRating: Number(avgRating),
        totalSpend,
      },
    });
  } catch (err) {
    console.error('Error fetching vendors:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch vendors', error: err.message });
  }
});

// POST /api/procurement/vendors - Register a new vendor
router.post(
  '/vendors',
  authenticate,
  requirePermission(PERMISSIONS.VENDOR_MANAGE),
  async (req, res) => {
    try {
      const { name, category, contactPerson, email, phone, gstNumber, address, catalog, rating, slaCompliance } = req.body;

      if (!name || !category || !contactPerson || !email || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Missing required vendor fields: name, category, contactPerson, email, phone',
        });
      }

      const vendor = new Vendor({
        name,
        category,
        contactPerson,
        email,
        phone,
        gstNumber: gstNumber || '',
        address: address || '',
        rating: rating !== undefined ? rating : 4.5,
        slaCompliance: slaCompliance !== undefined ? slaCompliance : 95.0,
        catalog: Array.isArray(catalog) ? catalog : [],
      });

      await vendor.save();

      res.status(201).json({
        success: true,
        message: `Vendor ${vendor.name} (${vendor.vendorId}) registered successfully`,
        data: vendor,
      });
    } catch (err) {
      console.error('Error registering vendor:', err);
      res.status(500).json({ success: false, message: 'Failed to create vendor', error: err.message });
    }
  }
);

// GET /api/procurement/vendors/:vendorId - Vendor details and purchase history
router.get('/vendors/:vendorId', authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const vendor = await Vendor.findOne({
      $or: [{ vendorId }, { _id: vendorId.match(/^[0-9a-fA-F]{24}$/) ? vendorId : null }],
    });

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const orders = await PurchaseOrder.find({ vendorId: vendor.vendorId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: vendor,
      orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor details', error: err.message });
  }
});

// ==========================================
// PURCHASE ORDERS API
// ==========================================

// GET /api/procurement/orders - List all purchase orders
router.get('/orders', authenticate, async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (priority && priority !== 'All') query.priority = priority;
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await PurchaseOrder.find(query).sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const pendingApproval = orders.filter((o) => o.status === 'Pending Approval').length;
    const activeOrders = orders.filter((o) => ['Approved', 'Ordered'].includes(o.status)).length;
    const completedOrders = orders.filter((o) => o.status === 'Received').length;
    const totalCommittedSpend = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      success: true,
      data: orders,
      metrics: {
        totalOrders,
        pendingApproval,
        activeOrders,
        completedOrders,
        totalCommittedSpend,
      },
    });
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch purchase orders', error: err.message });
  }
});

// POST /api/procurement/orders - Create a new Purchase Order
router.post(
  '/orders',
  authenticate,
  requirePermission(PERMISSIONS.PROCUREMENT_CREATE),
  async (req, res) => {
    try {
      const { title, vendorId, category, priority, items, expectedDeliveryDate } = req.body;

      if (!title || !vendorId || !items || !items.length) {
        return res.status(400).json({
          success: false,
          message: 'Title, vendorId, and at least one item are required for a Purchase Order',
        });
      }

      const vendor = await Vendor.findOne({ vendorId });
      if (!vendor) {
        return res.status(404).json({ success: false, message: `Vendor ${vendorId} not found` });
      }

      const totalAmount = items.reduce(
        (sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice),
        0
      );

      const order = new PurchaseOrder({
        title,
        vendorId: vendor.vendorId,
        vendorName: vendor.name,
        category: category || vendor.category,
        priority: priority || 'Medium',
        items,
        totalAmount,
        requestedBy: req.user?.name || req.user?.username || 'Procurement Officer',
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        status: 'Pending Approval',
      });

      await order.save();

      res.status(201).json({
        success: true,
        message: `Purchase Order ${order.poNumber} created successfully`,
        data: order,
      });
    } catch (err) {
      console.error('Error creating purchase order:', err);
      res.status(500).json({ success: false, message: 'Failed to create purchase order', error: err.message });
    }
  }
);

// PATCH /api/procurement/orders/:poNumber/status - Approve or transition PO status
router.patch(
  '/orders/:poNumber/status',
  authenticate,
  requirePermission(PERMISSIONS.PROCUREMENT_APPROVE),
  async (req, res) => {
    try {
      const { poNumber } = req.params;
      const { status } = req.body;

      if (!['Approved', 'Ordered', 'Cancelled', 'Pending Approval'].includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status transition: ${status}` });
      }

      const order = await PurchaseOrder.findOne({ poNumber });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Purchase Order not found' });
      }

      order.status = status;
      if (status === 'Approved') {
        order.approvedBy = req.user?.name || req.user?.username || 'Facility Director';
        order.approvalDate = new Date();
      }
      if (status === 'Ordered') {
        order.orderDate = new Date();
      }

      await order.save();

      res.json({
        success: true,
        message: `Purchase Order ${poNumber} marked as ${status}`,
        data: order,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
    }
  }
);

// POST /api/procurement/orders/:poNumber/receive - Goods Received Inspection & Automatic Asset Registration
router.post(
  '/orders/:poNumber/receive',
  authenticate,
  requirePermission(PERMISSIONS.PROCUREMENT_APPROVE),
  async (req, res) => {
    try {
      const { poNumber } = req.params;
      const { invoiceNumber, receivingNotes, conditionCheck = 'Pass' } = req.body;

      const order = await PurchaseOrder.findOne({ poNumber });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Purchase Order not found' });
      }

      if (order.status === 'Received') {
        return res.status(400).json({ success: false, message: 'This purchase order has already been received' });
      }

      const createdAssets = [];
      const generatedTags = [];
      const receivingTime = new Date();

      // Auto-mint institutional asset tags for each received item quantity
      for (const item of order.items) {
        const qty = item.quantity || 1;
        const blockCode = (item.targetBlock || 'Central').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3) || 'BLK';
        const roomCode = (item.targetRoom || 'STR').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'STR';
        const catCode = (item.category || 'EQP').slice(0, 3).toUpperCase();

        for (let i = 0; i < qty; i++) {
          const assetTag = generateAssetTag(blockCode, roomCode, catCode);
          
          // Calculate warranty date (default 12 months from delivery)
          const warrantyExpiry = new Date(receivingTime);
          warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 1);

          const targetBlock = item.targetBlock || 'Block A';
          const targetRoom = item.targetRoom || 'Central Store';
          const targetLocation = `${targetBlock} - ${targetRoom}`;

          const asset = new Asset({
            tag: assetTag,
            name: `${item.itemName} (${item.modelNumber || 'Standard'})`,
            category: item.category,
            block: targetBlock,
            floor: 'Floor 1',
            room: targetRoom,
            location: targetLocation,
            purchase_cost: item.unitPrice,
            current_value: item.unitPrice,
            purchase_date: receivingTime.toISOString().split('T')[0],
            purchaseDate: receivingTime,
            warranty_expiry: warrantyExpiry.toISOString().split('T')[0],
            warrantyExpiry: warrantyExpiry,
            supplier: order.vendorName,
            status: 'In Store',
            condition: conditionCheck === 'Pass' ? 'Good' : 'Needs Repair',
            last_checked: 'Today',
            notes: `Auto-registered via Purchase Order ${order.poNumber}`,
          });

          await asset.save();
          createdAssets.push(asset);
          generatedTags.push(assetTag);
        }
      }

      // Update PO status
      order.status = 'Received';
      order.receivedDate = receivingTime;
      order.invoiceNumber = invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
      order.receivingNotes = receivingNotes || `Goods received inspection passed by ${req.user?.name || 'Store Manager'}`;
      order.generatedAssetTags = generatedTags;
      order.receivedItemsCount = createdAssets.length;
      await order.save();

      // Update Vendor stats
      await Vendor.findOneAndUpdate(
        { vendorId: order.vendorId },
        {
          $inc: {
            ordersCount: 1,
            totalSpend: order.totalAmount,
          },
        }
      );

      // Institutional Audit Log
      await AuditLog.create({
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        action: `Goods Received Auto-Asset Mint (${createdAssets.length} assets)`,
        actor: req.user?.name || req.user?.username || 'Store Manager',
        target: order.poNumber,
        timestamp: new Date().toISOString(),
        category: 'procurement',
      });

      // Notification
      await Notification.create({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        message: `Successfully received ${createdAssets.length} items from ${order.vendorName} (PO: ${order.poNumber}). Institutional Asset tags generated and registered into inventory.`,
        type: 'success',
        is_read: 0,
        time: 'Just now',
      });

      res.status(200).json({
        success: true,
        message: `Successfully received ${createdAssets.length} items and registered into inventory.`,
        purchaseOrder: order,
        registeredAssetsCount: createdAssets.length,
        generatedTags: generatedTags,
        assets: createdAssets,
      });
    } catch (err) {
      console.error('Error receiving purchase order goods:', err);
      res.status(500).json({ success: false, message: 'Failed to process received goods', error: err.message });
    }
  }
);

export default router;
