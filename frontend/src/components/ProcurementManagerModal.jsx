import React, { useState, useEffect } from 'react';
import api from '../services/api';

// Self-contained high-fidelity SVG icons with guaranteed dimensions
const Icons = {
  Cart: ({ size = 20, color = 'currentColor', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Building: ({ size = 16, color = 'currentColor', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  CheckCircle: ({ size = 16, color = '#10b981', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ShieldCheck: ({ size = 16, color = 'currentColor', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Truck: ({ size = 16, color = 'currentColor', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Star: ({ size = 14, color = '#f59e0b', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill={color} viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Plus: ({ size = 16, color = 'currentColor', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Close: ({ size = 18, color = 'currentColor', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Refresh: ({ size = 16, color = 'currentColor', style = {} }) => (
    <svg width={size} height={size} style={{ width: size, height: size, flexShrink: 0, ...style }} fill="none" viewBox="0 0 24 24" stroke={color}>
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

  const statusStyles = {
    'Pending Approval': { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: 'rgba(217, 119, 6, 0.25)' },
    Approved: { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.25)' },
    Ordered: { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', border: 'rgba(124, 58, 237, 0.25)' },
    Received: { bg: 'rgba(5, 150, 105, 0.12)', color: '#059669', border: 'rgba(5, 150, 105, 0.25)' },
    Cancelled: { bg: 'rgba(220, 38, 38, 0.12)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.25)' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '18px',
          boxShadow: 'var(--shadow-float)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'var(--accent-primary-soft)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icons.Cart size={22} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Procurement & Vendor Lifecycle Hub
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '999px',
                    background: 'rgba(5, 150, 105, 0.1)',
                    color: '#059669',
                    border: '1px solid rgba(5, 150, 105, 0.25)',
                  }}
                >
                  Institutional
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Purchase Order pipeline, Supplier Scorecards & Auto-Asset Tag Registration
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={fetchProcurementData}
              disabled={loading}
              title="Refresh"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-glass)',
                color: 'var(--text-secondary)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <Icons.Refresh size={16} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-glass)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <Icons.Close size={18} />
            </button>
          </div>
        </div>

        {/* Metrics Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            padding: '14px 24px',
            background: 'var(--bg-card-hover)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Active Pipeline
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{orderMetrics.totalOrders || orders.length} Orders</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  background: 'rgba(217, 119, 6, 0.1)',
                  color: '#d97706',
                }}
              >
                {orderMetrics.pendingApproval || 0} Pending
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Committed Spend
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)' }}>
              ₹{(orderMetrics.totalCommittedSpend || 0).toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Verified Vendors
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{vendorMetrics.totalVendors || vendors.length} Suppliers</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Icons.Star size={13} color="#f59e0b" />
                <span>{vendorMetrics.avgRating || '4.5'}</span>
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Auto-Inventory Mint
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.ShieldCheck size={16} color="#0284c7" />
              <span>AST-2026 Ready</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Action Bar */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('orders')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'orders' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                background: activeTab === 'orders' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'orders' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Purchase Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === 'vendors' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                background: activeTab === 'vendors' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'vendors' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Vendors & Scorecards ({vendors.length})
            </button>
          </div>

          {activeTab === 'orders' && (
            <button
              onClick={() => setShowNewPo(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Icons.Plus size={15} color="#ffffff" />
              <span>New Purchase Order</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.4 }}>
                  <Icons.Cart size={40} />
                </div>
                <p style={{ fontSize: '14px', margin: 0 }}>No purchase orders found. Click "New Purchase Order" to begin.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map((po) => {
                  const sStyle = statusStyles[po.status] || { bg: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' };

                  return (
                    <div
                      key={po.poNumber || po._id}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-card)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      {/* Top Header of Card */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                          paddingBottom: '10px',
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: 'var(--accent-primary)',
                              background: 'var(--accent-primary-soft)',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(37, 99, 235, 0.2)',
                            }}
                          >
                            {po.poNumber}
                          </span>
                          <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 650, margin: 0, color: 'var(--text-primary)' }}>
                              {po.title}
                            </h3>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Icons.Building size={14} color="var(--text-muted)" />
                                <span>{po.vendorName}</span>
                              </span>
                              <span>•</span>
                              <span>Category: {po.category}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              fontSize: '11px',
                              fontWeight: 650,
                              borderRadius: '999px',
                              background: sStyle.bg,
                              color: sStyle.color,
                              border: `1px solid ${sStyle.border}`,
                            }}
                          >
                            {po.status}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            ₹{(po.totalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Item Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                        {po.items?.map((it, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'var(--bg-card-hover)',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{it.itemName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Target: {it.targetBlock} ({it.targetRoom || 'Store'})
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', fontWeight: 650, color: 'var(--text-primary)' }}>
                                {it.quantity} × ₹{it.unitPrice}
                              </div>
                              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                ₹{it.quantity * it.unitPrice}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Generated Tags if Received */}
                      {po.status === 'Received' && po.generatedAssetTags?.length > 0 && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'rgba(5, 150, 105, 0.08)',
                            border: '1px solid rgba(5, 150, 105, 0.25)',
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <Icons.CheckCircle size={15} color="#059669" />
                            <span>Inventory Minted: {po.generatedAssetTags.length} Institutional Assets</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {po.generatedAssetTags.map((t) => (
                              <span
                                key={t}
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '11px',
                                  background: 'var(--bg-surface)',
                                  color: '#059669',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(5, 150, 105, 0.3)',
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div
                        style={{
                          paddingTop: '8px',
                          borderTop: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>
                          Requested by: <strong style={{ color: 'var(--text-primary)' }}>{po.requestedBy}</strong>
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {po.status === 'Pending Approval' && (
                            <button
                              onClick={() => handleUpdateStatus(po.poNumber, 'Approved')}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: 'var(--accent-primary)',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Approve Purchase Order
                            </button>
                          )}
                          {po.status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(po.poNumber, 'Ordered')}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: '#7c3aed',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 600,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <Icons.Truck size={14} color="#ffffff" />
                              <span>Mark Dispatched/Ordered</span>
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
                              style={{
                                padding: '6px 14px',
                                borderRadius: '6px',
                                background: '#059669',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 650,
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: 'var(--shadow-sm)',
                              }}
                            >
                              <Icons.ShieldCheck size={15} color="#ffffff" />
                              <span>Receive Goods & Auto-Tag</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {vendors.map((v) => (
                <div
                  key={v.vendorId || v._id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          fontWeight: 650,
                          color: 'var(--text-secondary)',
                          background: 'var(--bg-card-hover)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {v.vendorId}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', fontSize: '12px', fontWeight: 700 }}>
                        <Icons.Star size={13} color="#f59e0b" />
                        <span>{v.rating} / 5.0</span>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px', marginBottom: '2px' }}>
                      {v.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '12px' }}>
                      {v.category}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
                        <span>{v.contactPerson} ({v.phone})</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{v.email}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>SLA Compliance:</span>
                        <span style={{ color: '#059669', fontWeight: 650 }}>{v.slaCompliance}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Lifetime Spend:</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{(v.totalSpend || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {v.catalog?.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                          Standard Catalog Offerings
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {v.catalog.map((c, i) => (
                            <div
                              key={i}
                              style={{
                                fontSize: '11px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: 'var(--bg-card-hover)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <span>{c.itemName}</span>
                              <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>₹{c.unitPrice}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{v.ordersCount || 0} completed orders</span>
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
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        background: 'var(--accent-primary-soft)',
                        border: '1px solid rgba(37, 99, 235, 0.25)',
                        color: 'var(--accent-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
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
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '540px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-float)',
                padding: '24px',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.Plus size={16} color="var(--accent-primary)" />
                  <span>Create Institutional Purchase Order</span>
                </h3>
                <button
                  onClick={() => setShowNewPo(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Icons.Close size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePo} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    PO Title / Purpose
                  </label>
                  <input
                    type="text"
                    required
                    value={newPoForm.title}
                    onChange={(e) => setNewPoForm({ ...newPoForm, title: e.target.value })}
                    placeholder="e.g. Procurement of 4 Daikin 1.5T Split ACs for Block B"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Vendor</label>
                    <select
                      value={newPoForm.vendorId}
                      onChange={(e) => setNewPoForm({ ...newPoForm, vendorId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    >
                      {vendors.map((v) => (
                        <option key={v.vendorId} value={v.vendorId}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
                    <select
                      value={newPoForm.category}
                      onChange={(e) => setNewPoForm({ ...newPoForm, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    >
                      <option value="HVAC & Cooling">HVAC & Cooling</option>
                      <option value="Furniture & Woodwork">Furniture & Woodwork</option>
                      <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                      <option value="Electricals & Wiring">Electricals & Wiring</option>
                      <option value="IT & Electronics">IT & Electronics</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Item Name</label>
                    <input
                      type="text"
                      required
                      value={newPoForm.itemName}
                      onChange={(e) => setNewPoForm({ ...newPoForm, itemName: e.target.value })}
                      placeholder="e.g. Split AC 1.5T"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newPoForm.quantity}
                      onChange={(e) => setNewPoForm({ ...newPoForm, quantity: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newPoForm.unitPrice}
                      onChange={(e) => setNewPoForm({ ...newPoForm, unitPrice: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Block</label>
                    <input
                      type="text"
                      value={newPoForm.targetBlock}
                      onChange={(e) => setNewPoForm({ ...newPoForm, targetBlock: e.target.value })}
                      placeholder="e.g. Block A"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Room / Store</label>
                    <input
                      type="text"
                      value={newPoForm.targetRoom}
                      onChange={(e) => setNewPoForm({ ...newPoForm, targetRoom: e.target.value })}
                      placeholder="e.g. Room 204 or Store"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--accent-primary-soft)',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Estimated PO Total:</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    ₹{(Number(newPoForm.quantity || 0) * Number(newPoForm.unitPrice || 0)).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowNewPo(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: 'var(--accent-primary)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 650,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
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
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-float)',
                padding: '24px',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icons.ShieldCheck size={18} color="#059669" />
                  <span>Goods Received & Auto-Asset Mint</span>
                </h3>
                <button
                  onClick={() => setReceivingPo(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Icons.Close size={18} />
                </button>
              </div>

              <div
                style={{
                  marginTop: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{receivingPo.title}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>Vendor: {receivingPo.vendorName}</div>
                <div style={{ color: '#059669', fontFamily: 'monospace', fontWeight: 700, marginTop: '4px' }}>
                  Mints {receivingPo.items?.reduce((s, it) => s + it.quantity, 0)} Assets with AST-2026 tags
                </div>
              </div>

              <form onSubmit={handleReceiveGoods} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Invoice / Delivery Challan #
                  </label>
                  <input
                    type="text"
                    required
                    value={receiveForm.invoiceNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, invoiceNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Inspection Result
                  </label>
                  <select
                    value={receiveForm.conditionCheck}
                    onChange={(e) => setReceiveForm({ ...receiveForm, conditionCheck: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  >
                    <option value="Pass">Pass - Good Condition</option>
                    <option value="Minor defect">Needs Inspection / Minor Flaw</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Receiving Remarks / AMC Notes
                  </label>
                  <textarea
                    rows={3}
                    value={receiveForm.receivingNotes}
                    onChange={(e) => setReceiveForm({ ...receiveForm, receivingNotes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setReceivingPo(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: '#059669',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 650,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Icons.CheckCircle size={15} color="#ffffff" />
                    <span>{submitting ? 'Minting Assets...' : 'Confirm & Register Assets'}</span>
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
