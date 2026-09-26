import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Self-contained high-fidelity SVG icons
const Icons = {
  Cart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Truck: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Star: () => (
    <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Close: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

export default function ProcurementManagerModal({ isOpen, onClose, onAssetCreated }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'vendors'
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orderMetrics, setOrderMetrics] = useState({});
  const [vendorMetrics, setVendorMetrics] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New PO Modal state
  const [showNewPo, setShowNewPo] = useState(false);
  const [newPoForm, setNewPoForm] = useState({
    title: '',
    vendorId: '',
    category: 'HVAC & Cooling',
    priority: 'Medium',
    itemName: '',
    quantity: 1,
    unitPrice: 0,
    targetBlock: 'Block A',
    targetRoom: 'Room 201',
    specifications: '',
  });

  // Receive Inspection Modal State
  const [receivingPo, setReceivingPo] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    invoiceNumber: '',
    conditionCheck: 'Pass',
    receivingNotes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchProcurementData();
    }
  }, [isOpen]);

  const fetchProcurementData = async () => {
    try {
      setLoading(true);
      const [ordersRes, vendorsRes] = await Promise.all([
        api.procurement.getOrders(),
        api.procurement.getVendors(),
      ]);
      if (ordersRes?.data) {
        setOrders(ordersRes.data);
        setOrderMetrics(ordersRes.metrics || {});
      }
      if (vendorsRes?.data) {
        setVendors(vendorsRes.data);
        setVendorMetrics(vendorsRes.metrics || {});
        if (vendorsRes.data.length > 0 && !newPoForm.vendorId) {
          setNewPoForm((prev) => ({ ...prev, vendorId: vendorsRes.data[0].vendorId }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch procurement records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        title: newPoForm.title,
        vendorId: newPoForm.vendorId,
        category: newPoForm.category,
        priority: newPoForm.priority,
        items: [
          {
            itemName: newPoForm.itemName,
            category: newPoForm.category,
            quantity: Number(newPoForm.quantity),
            unitPrice: Number(newPoForm.unitPrice),
            totalPrice: Number(newPoForm.quantity) * Number(newPoForm.unitPrice),
            specifications: newPoForm.specifications,
            targetBlock: newPoForm.targetBlock,
            targetRoom: newPoForm.targetRoom,
          },
        ],
      };

      const res = await api.procurement.createOrder(payload);
      if (res?.success) {
        setShowNewPo(false);
        setNewPoForm({
          title: '',
          vendorId: vendors[0]?.vendorId || '',
          category: 'HVAC & Cooling',
          priority: 'Medium',
          itemName: '',
          quantity: 1,
          unitPrice: 0,
          targetBlock: 'Block A',
          targetRoom: 'Room 201',
          specifications: '',
        });
        await fetchProcurementData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (poNumber, newStatus) => {
    try {
      await api.procurement.updateOrderStatus(poNumber, newStatus);
      await fetchProcurementData();
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleReceiveGoods = async (e) => {
    e.preventDefault();
    if (!receivingPo) return;
    try {
      setSubmitting(true);
      const res = await api.procurement.receiveGoods(receivingPo.poNumber, receiveForm);
      if (res?.success) {
        setReceivingPo(null);
        setReceiveForm({ invoiceNumber: '', conditionCheck: 'Pass', receivingNotes: '' });
        await fetchProcurementData();
        if (onAssetCreated) onAssetCreated();
        alert(`Success! Generated ${res.registeredAssetsCount} institutional assets into inventory!`);
      }
    } catch (err) {
      alert(err.message || 'Failed to process goods received');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Icons.Cart />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Procurement & Vendor Lifecycle Hub
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Institutional
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Purchase Order pipeline, Supplier Scorecards & Auto-Asset Tag Registration
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchProcurementData}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh"
            >
              <Icons.Refresh />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <Icons.Close />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3.5 bg-slate-800/40 border-b border-slate-800">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Active Pipeline</div>
            <div className="text-lg font-bold text-white flex items-center justify-between">
              {orderMetrics.totalOrders || orders.length} Orders
              <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">
                {orderMetrics.pendingApproval || 0} Pending
              </span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Committed Spend</div>
            <div className="text-lg font-bold text-indigo-400">
              ₹{(orderMetrics.totalCommittedSpend || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Verified Vendors</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center justify-between">
              {vendorMetrics.totalVendors || vendors.length} Suppliers
              <span className="text-xs font-normal text-slate-400 flex items-center">
                <Icons.Star />
                <span className="ml-1">{vendorMetrics.avgRating || '4.5'}</span>
              </span>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Auto-Inventory Mint</div>
            <div className="text-lg font-bold text-sky-400 flex items-center space-x-1">
              <Icons.ShieldCheck />
              <span className="ml-1">AST-2026 Ready</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Action Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Purchase Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'vendors'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Vendors & Scorecards ({vendors.length})
            </button>
          </div>

          {activeTab === 'orders' && (
            <button
              onClick={() => setShowNewPo(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Icons.Plus />
              <span className="ml-1">New Purchase Order</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <div className="flex justify-center mb-3 opacity-30">
                  <Icons.Cart />
                </div>
                <p>No purchase orders found. Click "New Purchase Order" to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((po) => {
                  const statusColors = {
                    'Pending Approval': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    Ordered: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                    Received: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
                  };

                  return (
                    <div
                      key={po.poNumber || po._id}
                      className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/40">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-800/40">
                            {po.poNumber}
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-white">{po.title}</h3>
                            <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                              <span className="flex items-center">
                                <Icons.Building />
                                <span className="ml-1">{po.vendorName}</span>
                              </span>
                              <span>•</span>
                              <span>Category: {po.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                              statusColors[po.status] || 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {po.status}
                          </span>
                          <span className="text-base font-bold text-white">
                            ₹{(po.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="py-3 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {po.items?.map((it, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-slate-200">{it.itemName}</div>
                              <div className="text-slate-400">
                                Target: {it.targetBlock} ({it.targetRoom || 'Store'})
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-100">
                                {it.quantity} x ₹{it.unitPrice}
                              </div>
                              <div className="text-slate-400 font-mono">
                                ₹{it.quantity * it.unitPrice}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Generated Tags if Received */}
                      {po.status === 'Received' && po.generatedAssetTags?.length > 0 && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs">
                          <div className="font-semibold text-emerald-400 flex items-center mb-1.5">
                            <Icons.CheckCircle />
                            <span className="ml-1">
                              Inventory Minted: {po.generatedAssetTags.length} Institutional Assets
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {po.generatedAssetTags.map((t) => (
                              <span
                                key={t}
                                className="font-mono bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Requested by: <strong className="text-slate-300">{po.requestedBy}</strong>
                        </span>

                        <div className="flex items-center space-x-2">
                          {po.status === 'Pending Approval' && (
                            <button
                              onClick={() => handleUpdateStatus(po.poNumber, 'Approved')}
                              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
                            >
                              Approve Purchase Order
                            </button>
                          )}
                          {po.status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(po.poNumber, 'Ordered')}
                              className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-medium transition flex items-center space-x-1"
                            >
                              <Icons.Truck />
                              <span className="ml-1">Mark Dispatched/Ordered</span>
                            </button>
                          )}
                          {po.status === 'Ordered' && (
                            <button
                              onClick={() => {
                                setReceivingPo(po);
                                setReceiveForm({
                                  invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                                  conditionCheck: 'Pass',
                                  receivingNotes: `Inspection cleared on arrival by Warden.`,
                                });
                              }}
                              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition flex items-center space-x-1"
                            >
                              <Icons.ShieldCheck />
                              <span className="ml-1">Receive Goods & Auto-Tag</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Vendors Tab */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendors.map((v) => (
                <div
                  key={v.vendorId || v._id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {v.vendorId}
                      </span>
                      <div className="flex items-center text-amber-400 text-xs font-bold">
                        <Icons.Star />
                        <span className="ml-1">{v.rating} / 5.0</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mt-2">{v.name}</h3>
                    <div className="text-xs text-indigo-400 font-medium mb-3">{v.category}</div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact:</span>
                        <span>{v.contactPerson} ({v.phone})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-300 font-mono">{v.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SLA Compliance:</span>
                        <span className="text-emerald-400 font-semibold">{v.slaCompliance}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lifetime Spend:</span>
                        <span className="font-bold text-white">₹{(v.totalSpend || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {v.catalog?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700/40">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Standard Catalog Offerings
                        </div>
                        <div className="space-y-1">
                          {v.catalog.map((c, i) => (
                            <div
                              key={i}
                              className="text-xs flex justify-between bg-slate-900/40 px-2 py-1 rounded text-slate-300"
                            >
                              <span>{c.itemName}</span>
                              <span className="font-mono text-slate-400">₹{c.unitPrice}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{v.ordersCount || 0} completed orders</span>
                    <button
                      onClick={() => {
                        setNewPoForm((prev) => ({
                          ...prev,
                          vendorId: v.vendorId,
                          category: v.category,
                          title: `Procurement Order for ${v.name}`,
                        }));
                        setShowNewPo(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition"
                    >
                      Create PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: New Purchase Order Form */}
        {showNewPo && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center">
                  <Icons.Plus />
                  <span className="ml-1.5">Create Institutional Purchase Order</span>
                </h3>
                <button
                  onClick={() => setShowNewPo(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white"
                >
                  <Icons.Close />
                </button>
              </div>

              <form onSubmit={handleCreatePo} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">PO Title / Purpose</label>
                  <input
                    type="text"
                    required
                    value={newPoForm.title}
                    onChange={(e) => setNewPoForm({ ...newPoForm, title: e.target.value })}
                    placeholder="e.g. Procurement of 4 Daikin 1.5T Split ACs for Block B"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Vendor</label>
                    <select
                      value={newPoForm.vendorId}
                      onChange={(e) => setNewPoForm({ ...newPoForm, vendorId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {vendors.map((v) => (
                        <option key={v.vendorId} value={v.vendorId}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Category</label>
                    <select
                      value={newPoForm.category}
                      onChange={(e) => setNewPoForm({ ...newPoForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="HVAC & Cooling">HVAC & Cooling</option>
                      <option value="Furniture & Woodwork">Furniture & Woodwork</option>
                      <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                      <option value="Electricals & Wiring">Electricals & Wiring</option>
                      <option value="IT & Electronics">IT & Electronics</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-slate-300 font-medium mb-1">Item Name</label>
                    <input
                      type="text"
                      required
                      value={newPoForm.itemName}
                      onChange={(e) => setNewPoForm({ ...newPoForm, itemName: e.target.value })}
                      placeholder="e.g. Split AC 1.5T"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newPoForm.quantity}
                      onChange={(e) => setNewPoForm({ ...newPoForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newPoForm.unitPrice}
                      onChange={(e) => setNewPoForm({ ...newPoForm, unitPrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Target Block</label>
                    <input
                      type="text"
                      value={newPoForm.targetBlock}
                      onChange={(e) => setNewPoForm({ ...newPoForm, targetBlock: e.target.value })}
                      placeholder="e.g. Block A"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Target Room / Store</label>
                    <input
                      type="text"
                      value={newPoForm.targetRoom}
                      onChange={(e) => setNewPoForm({ ...newPoForm, targetRoom: e.target.value })}
                      placeholder="e.g. Room 204 or Store"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40 flex justify-between items-center">
                  <span className="text-slate-300 font-medium">Estimated PO Total:</span>
                  <span className="text-base font-bold text-white">
                    ₹{(Number(newPoForm.quantity || 0) * Number(newPoForm.unitPrice || 0)).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPo(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                  >
                    {submitting ? 'Submitting...' : 'Create Purchase Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Goods Received Inspection */}
        {receivingPo && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center">
                  <Icons.ShieldCheck />
                  <span className="ml-1.5">Goods Received & Auto-Asset Mint</span>
                </h3>
                <button
                  onClick={() => setReceivingPo(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white"
                >
                  <Icons.Close />
                </button>
              </div>

              <div className="mt-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
                <div className="font-semibold text-white">{receivingPo.title}</div>
                <div className="text-slate-400 mt-1">Vendor: {receivingPo.vendorName}</div>
                <div className="text-emerald-400 font-mono font-bold mt-1">
                  Mints {receivingPo.items?.reduce((s, it) => s + it.quantity, 0)} Assets with AST-2026 tags
                </div>
              </div>

              <form onSubmit={handleReceiveGoods} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Invoice / Delivery Challan #</label>
                  <input
                    type="text"
                    required
                    value={receiveForm.invoiceNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Inspection Result</label>
                  <select
                    value={receiveForm.conditionCheck}
                    onChange={(e) => setReceiveForm({ ...receiveForm, conditionCheck: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Pass">Pass - Good Condition</option>
                    <option value="Minor defect">Needs Inspection / Minor Flaw</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Receiving Remarks / AMC Notes</label>
                  <textarea
                    rows={3}
                    value={receiveForm.receivingNotes}
                    onChange={(e) => setReceiveForm({ ...receiveForm, receivingNotes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReceivingPo(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md flex items-center space-x-1"
                  >
                    <Icons.CheckCircle />
                    <span className="ml-1">{submitting ? 'Minting Assets...' : 'Confirm & Register Assets'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
