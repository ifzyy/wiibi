import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:5000/api";

// ══════════════════════════════════════════════════════════════════════════════
// ICON SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

const Icon = ({ name, size = 20, className = "", strokeWidth = 2 }) => {
  const paths = {
    package: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
    truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    check: "M20 6L9 17l-5-5",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
    calendar: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18",
    dollarSign: "M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    printer: "M6 9V2h12v7 M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2 M6 14h12v8H6v-8z",
    edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    x: "M18 6L6 18M6 6l12 12",
    alertCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01",
    checkCircle: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
    xCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M15 9l-6 6 M9 9l6 6",
    moreVertical: "M12 13a1 1 0 100-2 1 1 0 000 2z M12 6a1 1 0 100-2 1 1 0 000 2z M12 20a1 1 0 100-2 1 1 0 000 2z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
    creditCard: "M1 4h22v16H1V4z M1 10h22",
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ORDER STATUS CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const ORDER_STATUSES = {
  pending: {
    label: "Pending",
    color: "#f59e0b",
    bg: "from-amber-50 to-amber-100",
    icon: "clock",
    description: "Awaiting confirmation",
  },
  confirmed: {
    label: "Confirmed",
    color: "#3b82f6",
    bg: "from-blue-50 to-blue-100",
    icon: "checkCircle",
    description: "Order confirmed",
  },
  processing: {
    label: "Processing",
    color: "#8b5cf6",
    bg: "from-purple-50 to-purple-100",
    icon: "package",
    description: "Being prepared",
  },
  shipped: {
    label: "Shipped",
    color: "#06b6d4",
    bg: "from-cyan-50 to-cyan-100",
    icon: "truck",
    description: "On the way",
  },
  delivered: {
    label: "Delivered",
    color: "#10b981",
    bg: "from-green-50 to-green-100",
    icon: "check",
    description: "Successfully delivered",
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
    bg: "from-red-50 to-red-100",
    icon: "xCircle",
    description: "Order cancelled",
  },
};

const PAYMENT_STATUSES = {
  pending: { label: "Pending", color: "#f59e0b", icon: "clock" },
  paid: { label: "Paid", color: "#10b981", icon: "checkCircle" },
  failed: { label: "Failed", color: "#ef4444", icon: "xCircle" },
  refunded: { label: "Refunded", color: "#6366f1", icon: "creditCard" },
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ORDER MANAGEMENT COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const OrderManagement = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    payment: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [viewMode, setViewMode] = useState("cards"); // cards | table

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ══════════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ══════════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {

      
      // Mock data for demonstration
      const mockOrders = [
        {
          id: "ORD-2024-001",
          customer: {
            name: "Chioma Adeyemi",
            email: "chioma@email.com",
            phone: "+234 803 123 4567",
            address: "15 Admiralty Way, Lekki Phase 1, Lagos",
          },
          items: [
            { id: 1, name: "5kW Solar Inverter", quantity: 2, price: 450000, image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200" },
            { id: 2, name: "200Ah Deep Cycle Battery", quantity: 4, price: 180000, image: "https://images.unsplash.com/photo-1626787075847-ff6b0dcbcf72?w=200" },
          ],
          subtotal: 1620000,
          shipping: 15000,
          tax: 81000,
          total: 1716000,
          status: "processing",
          paymentStatus: "paid",
          paymentMethod: "Bank Transfer",
          createdAt: "2024-02-15T10:30:00Z",
          updatedAt: "2024-02-15T14:20:00Z",
          timeline: [
            { status: "pending", date: "2024-02-15T10:30:00Z", note: "Order placed" },
            { status: "confirmed", date: "2024-02-15T11:00:00Z", note: "Payment verified" },
            { status: "processing", date: "2024-02-15T14:20:00Z", note: "Items being prepared" },
          ],
        },
        {
          id: "ORD-2024-002",
          customer: {
            name: "Emeka Okonkwo",
            email: "emeka@business.ng",
            phone: "+234 810 987 6543",
            address: "Plot 42, Industrial Estate, Ikeja, Lagos",
          },
          items: [
            { id: 3, name: "10kW Three-Phase Inverter", quantity: 1, price: 1200000, image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200" },
          ],
          subtotal: 1200000,
          shipping: 25000,
          tax: 60000,
          total: 1285000,
          status: "shipped",
          paymentStatus: "paid",
          paymentMethod: "POS",
          trackingNumber: "TRK-NG-9876543210",
          courier: "DHL Express",
          createdAt: "2024-02-14T09:15:00Z",
          updatedAt: "2024-02-16T08:00:00Z",
          timeline: [
            { status: "pending", date: "2024-02-14T09:15:00Z", note: "Order placed" },
            { status: "confirmed", date: "2024-02-14T10:00:00Z", note: "Payment confirmed" },
            { status: "processing", date: "2024-02-14T16:30:00Z", note: "Items packed" },
            { status: "shipped", date: "2024-02-16T08:00:00Z", note: "Dispatched via DHL" },
          ],
        },
        {
          id: "ORD-2024-003",
          customer: {
            name: "Fatima Ibrahim",
            email: "fatima@gmail.com",
            phone: "+234 702 456 7890",
            address: "123 Gimbiya Street, Garki, Abuja",
          },
          items: [
            { id: 4, name: "150W Solar Panel", quantity: 10, price: 65000, image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200" },
            { id: 5, name: "MPPT Charge Controller 60A", quantity: 2, price: 95000, image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200" },
          ],
          subtotal: 840000,
          shipping: 35000,
          tax: 42000,
          total: 917000,
          status: "pending",
          paymentStatus: "pending",
          paymentMethod: "Bank Transfer",
          createdAt: "2024-02-17T14:45:00Z",
          updatedAt: "2024-02-17T14:45:00Z",
          timeline: [
            { status: "pending", date: "2024-02-17T14:45:00Z", note: "Order placed, awaiting payment" },
          ],
        },
      ];

      setOrders(mockOrders);
      toast.success("Orders loaded ✨", { autoClose: 1500 });
      setLoading(false)
    
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ORDER STATUS UPDATE
  // ══════════════════════════════════════════════════════════════════════════════

  const updateOrderStatus = async (orderId, newStatus, note = "") => {
    try {
      // API call would go here
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            const newTimeline = [
              ...order.timeline,
              {
                status: newStatus,
                date: new Date().toISOString(),
                note: note || `Status changed to ${ORDER_STATUSES[newStatus].label}`,
              },
            ];
            return {
              ...order,
              status: newStatus,
              timeline: newTimeline,
              updatedAt: new Date().toISOString(),
            };
          }
          return order;
        })
      );

      if (selectedOrder?.id === orderId) {
        const updated = orders.find((o) => o.id === orderId);
        if (updated) {
          setSelectedOrder({ ...updated, status: newStatus });
        }
      }

      toast.success(`Order ${ORDER_STATUSES[newStatus].label}! 🎉`);
    } catch (err) {
      toast.error("Failed to update order");
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // FILTERING & STATS
  // ══════════════════════════════════════════════════════════════════════════════

  const filtered = orders.filter((order) => {
    if (filters.status !== "all" && order.status !== filters.status) return false;
    if (filters.payment !== "all" && order.paymentStatus !== filters.payment) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !order.id.toLowerCase().includes(search) &&
        !order.customer.name.toLowerCase().includes(search) &&
        !order.customer.email.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalRevenue: orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0),
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInScale {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        
        .timeline-line {
          position: absolute;
          left: 1.125rem;
          top: 2.5rem;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}

      <div className="sticky top-0 z-50 glass border-b border-white shadow-lg">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Order Management
              </h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">
                {filtered.length} orders · ₦{stats.totalRevenue.toLocaleString("en-NG")} revenue
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:border-indigo-500 hover:text-indigo-600 transition-all"
              >
                <Icon name="download" size={16} className="inline mr-2" />
                Export
              </button>
              
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:border-indigo-500 hover:text-indigo-600 transition-all"
              >
                <Icon name="printer" size={16} className="inline mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-8 py-8 space-y-6">
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* STATS */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Orders" value={stats.total} color="#3b82f6" icon="package" />
          <StatCard label="Pending" value={stats.pending} color="#f59e0b" icon="clock" />
          <StatCard label="Processing" value={stats.processing} color="#8b5cf6" icon="package" />
          <StatCard label="Shipped" value={stats.shipped} color="#06b6d4" icon="truck" />
          <StatCard label="Delivered" value={stats.delivered} color="#10b981" icon="check" />
          <StatCard
            label="Revenue"
            value={`₦${(stats.totalRevenue / 1000000).toFixed(1)}M`}
            color="#ec4899"
            icon="dollarSign"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* FILTERS */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}

        <div className="glass rounded-3xl border border-white shadow-xl p-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Icon
                name="search"
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search orders, customers..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Statuses</option>
              {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>

            {/* Payment Filter */}
            <select
              value={filters.payment}
              onChange={(e) => setFilters({ ...filters, payment: e.target.value })}
              className="px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="all">All Payments</option>
              {Object.entries(PAYMENT_STATUSES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* ORDERS LIST */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-6" />
            <p className="text-lg font-bold text-slate-600">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-3xl border border-white p-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
              <Icon name="package" size={40} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-700 mb-2">No orders found</h3>
            <p className="text-slate-500 font-medium">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onView={() => setSelectedOrder(order)}
                onStatusUpdate={(status, note) => updateOrderStatus(order.id, status, note)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* ORDER DETAILS MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={(status, note) => updateOrderStatus(selectedOrder.id, status, note)}
        />
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// STAT CARD
// ══════════════════════════════════════════════════════════════════════════════

const StatCard = ({ label, value, color, icon }) => (
  <div
    className="glass rounded-2xl p-5 border border-white shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer group"
    style={{ borderLeft: `4px solid ${color}` }}
  >
    <div className="flex items-center justify-between mb-3">
      <div
        className="p-2.5 rounded-xl transition-transform group-hover:rotate-12"
        style={{ background: `${color}20` }}
      >
        <Icon name={icon} size={18} style={{ color }} strokeWidth={2.5} />
      </div>
      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
    <div className="text-3xl font-black" style={{ color }}>
      {value}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ORDER CARD
// ══════════════════════════════════════════════════════════════════════════════

const OrderCard = ({ order, index, onView, onStatusUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = ORDER_STATUSES[order.status];
  const paymentConfig = PAYMENT_STATUSES[order.paymentStatus];

  return (
    <div
      className="glass rounded-3xl border border-white shadow-lg hover:shadow-2xl transition-all overflow-hidden"
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "fadeInScale 0.5s ease-out forwards",
      }}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Order Icon */}
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${statusConfig.bg} flex items-center justify-center`}
            >
              <Icon name={statusConfig.icon} size={24} style={{ color: statusConfig.color }} strokeWidth={2.5} />
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-lg font-black text-slate-800">{order.id}</h3>
              <p className="text-sm font-semibold text-slate-500">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} config={statusConfig} />
            <PaymentBadge status={order.paymentStatus} config={paymentConfig} />
            
            <button
              onClick={onView}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all hover:scale-105 shadow-lg shadow-indigo-600/30"
            >
              <Icon name="eye" size={16} className="inline mr-2" />
              View
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Customer */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon name="user" size={16} className="text-blue-600" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Customer
              </span>
            </div>
            <p className="font-bold text-slate-800 mb-1">{order.customer.name}</p>
            <p className="text-xs text-slate-500 font-medium">{order.customer.email}</p>
            <p className="text-xs text-slate-500 font-medium">{order.customer.phone}</p>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Icon name="package" size={16} className="text-purple-600" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Items
              </span>
            </div>
            <p className="font-bold text-slate-800">{order.items.length} Products</p>
            <p className="text-xs text-slate-500 font-medium">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} total units
            </p>
          </div>

          {/* Total */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Icon name="dollarSign" size={16} className="text-green-600" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Total
              </span>
            </div>
            <p className="text-2xl font-black text-green-600">
              ₦{order.total.toLocaleString("en-NG")}
            </p>
            <p className="text-xs text-slate-500 font-medium">{order.paymentMethod}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex gap-2">
          {order.status === "pending" && (
            <button
              onClick={() => onStatusUpdate("confirmed", "Payment verified and order confirmed")}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-200 transition-all"
            >
              Confirm Order
            </button>
          )}
          {order.status === "confirmed" && (
            <button
              onClick={() => onStatusUpdate("processing", "Started preparing items")}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-bold text-xs hover:bg-purple-200 transition-all"
            >
              Start Processing
            </button>
          )}
          {order.status === "processing" && (
            <button
              onClick={() => onStatusUpdate("shipped", "Order dispatched to customer")}
              className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-xl font-bold text-xs hover:bg-cyan-200 transition-all"
            >
              Mark as Shipped
            </button>
          )}
          {order.status === "shipped" && (
            <button
              onClick={() => onStatusUpdate("delivered", "Successfully delivered to customer")}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold text-xs hover:bg-green-200 transition-all"
            >
              Mark as Delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// STATUS & PAYMENT BADGES
// ══════════════════════════════════════════════════════════════════════════════

const StatusBadge = ({ status, config }) => (
  <div
    className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 bg-gradient-to-r ${config.bg}`}
    style={{ color: config.color }}
  >
    <Icon name={config.icon} size={14} strokeWidth={2.5} />
    {config.label}
  </div>
);

const PaymentBadge = ({ status, config }) => (
  <div
    className="px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5"
    style={{ background: `${config.color}20`, color: config.color }}
  >
    <Icon name={config.icon} size={12} strokeWidth={2.5} />
    {config.label}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ORDER DETAILS MODAL
// ══════════════════════════════════════════════════════════════════════════════

const OrderDetailsModal = ({ order, onClose, onStatusUpdate }) => {
  const statusConfig = ORDER_STATUSES[order.status];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
      />

      {/* Modal */}
      <div
        className="fixed inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl z-50 overflow-y-auto"
        style={{ animation: "slideInFromRight 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-800">Order Details</h2>
              <p className="text-sm text-slate-500 font-semibold mt-1">{order.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <Icon name="x" size={24} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Timeline */}
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Icon name="clock" size={20} className="text-indigo-600" />
              Order Timeline
            </h3>
            <div className="relative pl-12">
              <div className="timeline-line" />
              {order.timeline.map((event, index) => {
                const eventConfig = ORDER_STATUSES[event.status];
                return (
                  <div key={index} className="relative mb-8 last:mb-0">
                    <div
                      className="absolute left-[-2.75rem] w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${eventConfig.color}40, ${eventConfig.color}60)`,
                      }}
                    >
                      <Icon
                        name={eventConfig.icon}
                        size={16}
                        style={{ color: eventConfig.color }}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="font-black text-sm"
                          style={{ color: eventConfig.color }}
                        >
                          {eventConfig.label}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {new Date(event.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">{event.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div className="glass rounded-3xl p-6 border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Icon name="user" size={20} className="text-blue-600" />
              Customer Information
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                  Name
                </label>
                <p className="font-bold text-slate-800">{order.customer.name}</p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                  Email
                </label>
                <p className="font-bold text-slate-800">{order.customer.email}</p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                  Phone
                </label>
                <p className="font-bold text-slate-800">{order.customer.phone}</p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                  <Icon name="mapPin" size={14} className="inline mr-1" />
                  Delivery Address
                </label>
                <p className="font-bold text-slate-800">{order.customer.address}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Icon name="package" size={20} className="text-purple-600" />
              Order Items
            </h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-indigo-600">
                      ₦{(item.price * item.quantity).toLocaleString("en-NG")}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      ₦{item.price.toLocaleString("en-NG")} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>Subtotal</span>
                <span>₦{order.subtotal.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>Shipping</span>
                <span>₦{order.shipping.toLocaleString("en-NG")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-600">
                <span>Tax</span>
                <span>₦{order.tax.toLocaleString("en-NG")}</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-200 flex justify-between">
                <span className="text-lg font-black text-slate-800">Total</span>
                <span className="text-2xl font-black text-indigo-600">
                  ₦{order.total.toLocaleString("en-NG")}
                </span>
              </div>
            </div>
          </div>

          {/* Status Update Actions */}
          <div className="glass rounded-3xl p-6 border border-slate-200">
            <h3 className="text-lg font-black text-slate-800 mb-6">Update Order Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(ORDER_STATUSES).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => onStatusUpdate(key)}
                  disabled={order.status === key}
                  className={`p-4 rounded-2xl font-bold text-sm transition-all ${
                    order.status === key
                      ? `bg-gradient-to-br ${config.bg} cursor-not-allowed opacity-75`
                      : "bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-lg"
                  }`}
                  style={order.status === key ? { color: config.color } : {}}
                >
                  <Icon
                    name={config.icon}
                    size={20}
                    className="mx-auto mb-2"
                    style={{ color: config.color }}
                  />
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 rounded-2xl font-bold hover:bg-slate-100 transition-all"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-indigo-500/50 transition-all"
            >
              <Icon name="printer" size={18} className="inline mr-2" />
              Print Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderManagement;