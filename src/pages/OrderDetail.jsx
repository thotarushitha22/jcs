import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";
import { XCircle } from "lucide-react"; 
import "./Orders.css";
import "./OrderDetail.css";

import { getOrderItems } from "../utils/orderItems";

// =========================================================
// SHIPMENT TRACKING - 10 STOPS
// =========================================================
const TRACKING_STOPS = [
  { title: "Order placed", place: "JCSGlobal, Vijayawada" },
  { title: "Payment confirmed", place: "Secure checkout" },
  { title: "Packed & quality checked", place: "JCS warehouse, Vijayawada" },
  { title: "Shipped", place: "Vijayawada dispatch centre" },
  { title: "Arrived at hub", place: "Hyderabad, Telangana" },
  { title: "In transit", place: "Nagpur, Maharashtra" },
  { title: "Arrived at hub", place: "Surat, Gujarat" },
  { title: "Arrived at hub", place: "Delhi" },
  { title: "Out for delivery", place: "Local delivery partner" },
  { title: "Delivered", place: "" },
];

const SIMULATE_TRANSIT = false;
const HOURS_PER_HUB = 3;
const HOUR = 60 * 60 * 1000;
const HUB_STOPS = { HUB_1: 5, HUB_2: 6, HUB_3: 7, HUB_4: 8 };

const SELLER = {
  name: "JCS Group (JCSGlobal)",
  addressLines: [
    "Current office road, 76-16-53,",
    "Bhavani Puram, RR Nagar,",
    "Vijayawada, Andhra Pradesh 520012",
  ],
  email: "tech.support@jcsglobal.in",
  phone: "+91-9090007108",
  gstin: "",
};

const formatStopTime = (ms) =>
  new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

function TrackingTimeline({ order, status, destination }) {
  const total = TRACKING_STOPS.length;

  if (status === "CANCELLED") {
    return (
      <div className="trk-card trk-cancelled" style={{ background: "#fef2f2", border: "1px solid #fca5a5", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h3 style={{ color: "#991b1b", marginTop: 0 }}>Shipment tracking</h3>
        <p style={{ color: "#991b1b", margin: 0, fontWeight: "600" }}>This order was cancelled.</p>
        {order.cancelReason && (
          <p style={{ color: "#991b1b", margin: "8px 0 0 0", fontSize: "14px" }}>
            <strong>Reason:</strong> {order.cancelReason}
          </p>
        )}
      </div>
    );
  }

  const created = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
  const updated = order.updatedAt ? new Date(order.updatedAt).getTime() : created;
  const shippedRaw = order.shippedAt ? new Date(order.shippedAt).getTime() : updated;
  const shipAt = Math.max(shippedRaw, created + 5 * 60 * 1000);

  const times = [
    created,
    created + 2 * 60 * 1000,
    created + (shipAt - created) / 2,
    shipAt,
    shipAt + 1 * HOURS_PER_HUB * HOUR,
    shipAt + 2 * HOURS_PER_HUB * HOUR,
    shipAt + 3 * HOURS_PER_HUB * HOUR,
    shipAt + 4 * HOURS_PER_HUB * HOUR,
    shipAt + 5 * HOURS_PER_HUB * HOUR,
    status === "DELIVERED" || status === "COMPLETED"
      ? Math.max(updated, shipAt + 6 * HOURS_PER_HUB * HOUR)
      : shipAt + 6 * HOURS_PER_HUB * HOUR,
  ];

  const hoursSinceShip = (Date.now() - shipAt) / HOUR;
  const hubsDone = SIMULATE_TRANSIT ? Math.min(4, Math.max(0, Math.floor(hoursSinceShip / HOURS_PER_HUB))) : 0;

  let done = 1;
  if (status === "DELIVERED" || status === "COMPLETED") done = total;
  else if (status === "OUT_FOR_DELIVERY") done = 9;
  else if (HUB_STOPS[status]) done = HUB_STOPS[status];
  else if (status === "SHIPPED" || status === "DISPATCHED") done = 4 + hubsDone;
  else if (["PROCESSING", "CONFIRMED", "ACCEPTED"].includes(status)) done = 3;
  else if (status === "PAID") done = 2;

  return (
    <div className="trk-card">
      <div className="trk-head">
        <h3>Shipment tracking</h3>
        <span className="trk-progress">{done} of {total} stops completed</span>
      </div>

      <ol className="trk-list">
        {TRACKING_STOPS.map((stop, index) => {
          const isDone = index < done;
          const isCurrent = isDone && index === done - 1 && done < total;
          const state = isCurrent ? "current" : isDone ? "done" : "todo";
          const place = index === total - 1 ? destination : stop.place;

          return (
            <li key={index} className={`trk-stop ${state}`}>
              <span className="trk-dot">{isDone ? "✓" : index + 1}</span>
              <div className="trk-text">
                <strong>{stop.title}</strong>
                {place && <span className="trk-place">{place}</span>}
                {isDone && (
                  <span className="trk-time">
                    {formatStopTime(
                      index === done - 1
                        ? Math.min(Math.max(updated, created), Date.now())
                        : Math.min(times[index], Math.max(updated, created), Date.now())
                    )}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State for the Cancel modal and reasons
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Ordered by mistake");
  const [customReason, setCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const orderIdentifier = String(id).trim();
      const response = await api.get(`/orders/${encodeURIComponent(orderIdentifier)}`);
      const backendOrder = response.data?.order || response.data?.data || response.data;

      if (!backendOrder) throw new Error("Order not found");
      setOrder(backendOrder);
      setLoading(false);
    } catch (err) {
      console.error("Backend order fetch failed:", err);
      setOrder(null);
      setError(err.response?.data?.message || "Unable to load order details.");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 3000);
    const handleFocus = () => fetchOrder();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchOrder]);

  // Submit the cancellation with the reason
  const submitCancellation = async () => {
    const finalReason = cancelReason === "Other" ? customReason : cancelReason;
    
    if (cancelReason === "Other" && !customReason.trim()) {
      toast.error("Please specify your reason.");
      return;
    }

    try {
      setCancelling(true);
      await api.put(`/orders/${order.id || order._id}/cancel`, { reason: finalReason });
      toast.success("Order cancelled successfully.");
      setShowCancelModal(false);
      fetchOrder(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container page">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container page">
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={fetchOrder} style={{ marginTop: "10px", padding: "8px 16px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#fff", cursor: "pointer" }}>Try Again</button>
        <div style={{ marginTop: "15px" }}><Link to="/orders" style={{ color: "#2563eb", textDecoration: "none" }}>← Back to orders</Link></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page">
        <p>Order not found.</p>
        <Link to="/orders" style={{ color: "#2563eb", textDecoration: "none" }}>← Back to orders</Link>
      </div>
    );
  }

  const rawStatus = order.status || order.orderStatus || order.shippingStatus || "PENDING";
  const status = String(rawStatus).trim().toUpperCase().replace(/[\s-]+/g, "_");

  const canCancel = ["PENDING", "PAID", "PROCESSING"].includes(status);

  const itemsList = getOrderItems(order);

  const rawTotal = Number(order.totalAmount ?? order.total_amount ?? order.totalPrice ?? order.total ?? 0);
  const rawSubtotal = Math.round((rawTotal / 1.18) * 100) / 100;
  const rawTax = Math.round((rawTotal - rawSubtotal) * 100) / 100;

  const formatName = (value) => {
    if (!value) return "Customer";
    if (typeof value === "object") return value.name || value.username || value.email || "Customer";
    return String(value);
  };

  const customerName = formatName(order.shippingName || order.customerName || order.buyer_name || order.user);

  const formatAddress = (value) => {
    if (!value) return "Address not available";
    if (typeof value === "string") return value;
    if (typeof value === "object") return [value.address, value.street, value.city, value.pincode].filter(Boolean).join(", ") || "Address not available";
    return String(value);
  };

  const shippingAddressText = formatAddress(order.shippingAddress || order.address);

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "Date unavailable";

  const displayStatus = {
    PENDING: "PENDING", PAID: "PAID", PROCESSING: "PROCESSING", CONFIRMED: "CONFIRMED",
    ACCEPTED: "ACCEPTED", SHIPPED: "SHIPPED", DISPATCHED: "DISPATCHED", OUT_FOR_DELIVERY: "OUT FOR DELIVERY",
    DELIVERED: "DELIVERED", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED",
  };

  const orderNumber = order.orderId || order.order_id || order.id;
  const customerEmail = order.shippingEmail || order.shipping_email || order.buyer_email || order.email || "";
  const paymentLabel = order.paymentStatus || (order.status === "paid" ? "PAID" : "PENDING");

  const handlePrintInvoice = () => {
    const previousTitle = document.title;
    document.title = `Invoice-${orderNumber}`;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  return (
    <div className="container page orderdetail-root" style={{ padding: "20px" }}>

      {/* CANCEL REASON MODAL */}
      {showCancelModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "400px", maxWidth: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#0f172a", fontSize: "18px" }}>Reason for Cancellation</h3>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>Please let us know why you are cancelling this order.</p>
            
            <select 
              value={cancelReason} 
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "16px", fontSize: "14px", background: "#ffffff", color: "#0f172a" }}
            >
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Found a better price elsewhere">Found a better price elsewhere</option>
              <option value="Delivery time is too long">Delivery time is too long</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Other">Other</option>
            </select>

            {cancelReason === "Other" && (
              <textarea
                placeholder="Please type your reason here..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "16px", fontSize: "14px", minHeight: "80px", background: "#ffffff", color: "#0f172a" }}
              />
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCancelModal(false)} style={{ padding: "10px 16px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Keep Order</button>
              <button onClick={submitCancellation} disabled={cancelling} style={{ padding: "10px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", cursor: cancelling ? "not-allowed" : "pointer", fontWeight: "600" }}>
                {cancelling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/orders" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>← Back to orders</Link>
        <button onClick={handlePrintInvoice} style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}>🖨 Print Invoice</button>
      </div>

      {/* ORDER HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "15px", marginBottom: "15px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Order {orderNumber}</h2>
          <span style={{ fontSize: "14px", color: "#64748b" }}>Placed on {formattedDate}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          
          {/* CANCEL ORDER BUTTON */}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5",
                padding: "6px 14px", borderRadius: "8px", fontSize: "14px", fontWeight: "600",
                cursor: cancelling ? "not-allowed" : "pointer", transition: "all 0.2s"
              }}
            >
              <XCircle size={16} />
              Cancel Order
            </button>
          )}

          {/* STATUS BADGE */}
          <span style={{
            padding: "6px 14px", borderRadius: "20px",
            background: status === "DELIVERED" || status === "COMPLETED" ? "#d1fae5" : status === "CANCELLED" ? "#fee2e2" : "#e0f2fe",
            color: status === "DELIVERED" || status === "COMPLETED" ? "#065f46" : status === "CANCELLED" ? "#991b1b" : "#0369a1",
            fontSize: "14px", fontWeight: "700",
          }}>
            {displayStatus[status] || status}
          </span>
        </div>
      </div>

      {/* PAYMENT */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
        <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: "#d1fae5", color: "#065f46" }}>
          {order.paymentStatus || (order.status === "paid" ? "PAID" : "PAYMENT")}
        </span>
        <span style={{ fontSize: "14px", color: "#64748b" }}>via {order.paymentMethod || order.payment_method_title || "Payment"}</span>
      </div>

      {/* TRACKING */}
      <TrackingTimeline order={order} status={status} destination={shippingAddressText} />

      {/* DETAILS */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* ITEMS */}
        <div className="card" style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>Items</h3>
          {itemsList.length === 0 && <p style={{ color: "#64748b", fontSize: "14px" }}>Item details are not available for this order.</p>}
          {itemsList.map((item, idx) => {
            const title = typeof item.title === "string" ? item.title : item.name || item.productName || "Product Item";
            const qty = Number(item.qty ?? item.quantity ?? 1);
            const price = Number(item.price ?? item.unitPrice ?? 0);
            return (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", marginBottom: "10px", borderBottom: "1px solid #eee" }}>
                <div>
                  <div style={{ fontWeight: "600" }}>{title}</div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>Qty: {qty} × ₹{price.toLocaleString("en-IN")}</div>
                </div>
                <div style={{ fontWeight: "600" }}>₹{(qty * price).toLocaleString("en-IN")}</div>
              </div>
            );
          })}

          <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}><span>Subtotal:</span><span>₹{rawSubtotal.toLocaleString("en-IN")}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}><span>GST (18%):</span><span>₹{rawTax.toLocaleString("en-IN")}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #eee", fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              <span>Total Amount:</span><span>₹{rawTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="card" style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>Customer & Shipping</h3>
          <p style={{ margin: "0 0 6px 0", fontWeight: "600", fontSize: "15px" }}>{customerName}</p>
          <p style={{ margin: "0 0 4px 0", color: "#64748b", fontSize: "13px" }}>✉ {customerEmail || "Email not available"}</p>
          <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "10px 0" }} />
          <p style={{ margin: "0 0 4px 0", color: "#334155", fontSize: "14px", fontWeight: "500" }}>Shipping Address:</p>
          <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>{shippingAddressText}</p>
        </div>
      </div>

      <div style={{ marginTop: "15px", textAlign: "center", fontSize: "12px", color: "#94a3b8" }}>
        Order status updates automatically.
      </div>

      {/* INVOICE */}
      <div className="invoice-print">
        <div className="inv-top">
          <div>
            <h1 className="inv-brand">JCS Global</h1>
            <div className="inv-seller">
              <strong>{SELLER.name}</strong>
              {SELLER.addressLines.map((line) => (<div key={line}>{line}</div>))}
              <div>{SELLER.email} | {SELLER.phone}</div>
              {SELLER.gstin && <div>GSTIN: {SELLER.gstin}</div>}
            </div>
          </div>
          <div className="inv-meta">
            <h2>TAX INVOICE</h2>
            <div><span>Invoice no:</span> INV-{orderNumber}</div>
            <div><span>Order no:</span> {orderNumber}</div>
            <div><span>Date:</span> {formattedDate}</div>
            <div><span>Payment:</span> {String(paymentLabel).toUpperCase()} ({order.paymentMethod || "Online"})</div>
          </div>
        </div>
        <div className="inv-parties">
          <div><h4>Bill to</h4><strong>{customerName}</strong>{customerEmail && <div>{customerEmail}</div>}</div>
          <div><h4>Ship to</h4><strong>{customerName}</strong><div>{shippingAddressText}</div></div>
        </div>
        <table className="inv-table">
          <thead>
            <tr><th>#</th><th>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr>
          </thead>
          <tbody>
            {itemsList.map((item, idx) => {
              const title = typeof item.title === "string" ? item.title : item.name || item.productName || "Product Item";
              const qty = Number(item.qty ?? item.quantity ?? 1);
              const price = Number(item.price ?? item.unitPrice ?? 0);
              return (
                <tr key={idx}>
                  <td>{idx + 1}</td><td>{title}</td><td className="num">{qty}</td>
                  <td className="num">₹{price.toLocaleString("en-IN")}</td>
                  <td className="num">₹{(qty * price).toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="inv-totals">
          <div><span>Subtotal</span><span>₹{rawSubtotal.toLocaleString("en-IN")}</span></div>
          <div><span>GST (18%)</span><span>₹{rawTax.toLocaleString("en-IN")}</span></div>
          <div className="inv-grand"><span>Total amount</span><span>₹{rawTotal.toLocaleString("en-IN")}</span></div>
        </div>
        <div className="inv-foot">
          <p>Thank you for your order.</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>

    </div>
  );
}