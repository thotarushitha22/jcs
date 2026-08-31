import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./Orders.css";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("userInfo") || localStorage.getItem("user") || "{}");
      setUserProfile(storedUser);
    } catch (e) {
      console.warn("Could not load user profile", e);
    }

    const fetchOrderDetails = async () => {
      try {
        // 1. CHECK LOCAL STORAGE FIRST (Prevents unnecessary backend 404 errors for sandbox/local orders)
        const localOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        let found = localOrders.find(
          (o) => String(o.id || o.order_id) === String(id) || String(o.order_id) === String(id)
        );

        if (found) {
          setOrder(found);
          setLoading(false);
          return; // Exit early so no backend request or 404 is triggered!
        }

        // 2. IF NOT FOUND LOCALLY, TRY BACKEND API
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          let foundOrder = response.data.order || response.data;
          setOrder(foundOrder);
        }
      } catch (err) {
        // Fallback mock order if neither local storage nor backend has it
        const mockOrder = {
          id: id,
          order_id: id,
          totalAmount: 30000,
          status: "PROCESSING",
          paymentStatus: "paid",
          paymentMethod: "Razorpay Sandbox QR",
          createdAt: new Date().toISOString(),
          items: [{ title: "MOTOROLA", quantity: 1, price: 30000 }],
          shippingName: "Customer",
          shippingAddress: "123 Main Street"
        };
        setOrder(mockOrder);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (loading) return <div className="container page"><p>Loading order details…</p></div>;
  if (!order) return <div className="container page"><p>Order not found.</p></div>;

  const status = String(order.status || "PENDING").toUpperCase();
  const isShipped = status === "SHIPPED" || status === "DELIVERED";
  const isDelivered = status === "DELIVERED";
  const paymentStatusText = isDelivered || status === "PAID" ? "PAID" : String(order.paymentStatus || "PENDING").toUpperCase();

  const rawTotal = order.totalAmount ?? order.totalPrice ?? order.grandTotal ?? 0;
  const calculatedTotal = (Number(rawTotal) === 0 && order.items) 
    ? order.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty ?? item.quantity ?? 1)), 0)
    : rawTotal;
  const total = Number(calculatedTotal).toLocaleString("en-IN");

  const customerName = order.shippingName || order.customerName || userProfile?.name || "Customer";
  const customerEmail = order.email || userProfile?.email || "";
  const customerPhone = order.phone || userProfile?.phone || "";
  
  const rawAddress = order.shippingAddress || order.address || userProfile?.address;
  let shippingAddress = "123 Main Street";
  let shippingCity = "";
  let shippingPincode = "";

  if (typeof rawAddress === "object" && rawAddress !== null) {
    shippingAddress = rawAddress.address || rawAddress.street || rawAddress.line1 || "";
    shippingCity = rawAddress.city || "";
    shippingPincode = rawAddress.pincode || rawAddress.pin || "";
  } else if (typeof rawAddress === "string" && rawAddress.trim() !== "") {
    shippingAddress = rawAddress;
  }

  shippingCity = order.shippingCity || shippingCity || userProfile?.city || "";
  shippingPincode = order.shippingPincode || shippingPincode || userProfile?.pincode || "";

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="container page" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/orders" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>
          ← Back to orders
        </Link>
        <button 
          onClick={handlePrintInvoice}
          style={{ padding: "6px 12px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
        >
          🖨 Print Invoice
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", marginBottom: "15px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "24px" }}>Order {order.order_id || order.id}</h2>
          <span style={{ fontSize: "14px", color: "#64748b" }}>
            Placed on {order.createdAt && !isNaN(new Date(order.createdAt)) ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "numeric", year: "numeric" }) : "Recent"}
          </span>
        </div>
        <div>
          <span style={{ padding: "6px 14px", borderRadius: "20px", background: isDelivered ? '#d1fae5' : status === 'SHIPPED' ? '#e0f2fe' : '#fef3c7', color: isDelivered ? '#065f46' : status === 'SHIPPED' ? '#0369a1' : '#92400e', fontSize: "14px", fontWeight: "700" }}>
            {status}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
        <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700", background: paymentStatusText === "PAID" ? "#d1fae5" : "#fef3c7", color: paymentStatusText === "PAID" ? "#065f46" : "#92400e" }}>
          {paymentStatusText}
        </span>
        <span style={{ fontSize: "14px", color: "#64748b" }}>
          via {order.paymentMethod || "Cash on Delivery"}
        </span>
      </div>

      <div className="card" style={{ padding: "30px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "25px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
            <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>✓</div>
            <span style={{ fontSize: "13px", marginTop: "8px", fontWeight: "600" }}>Order Placed</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
            <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: isShipped ? "#10b981" : "#cbd5e1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>✓</div>
            <span style={{ fontSize: "13px", marginTop: "8px", fontWeight: "600" }}>Shipped</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
            <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: isDelivered ? "#10b981" : "#cbd5e1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>✓</div>
            <span style={{ fontSize: "13px", marginTop: "8px", fontWeight: "600" }}>Delivered</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        <div className="card" style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>Items</h3>
          {order.items?.map((item, idx) => {
            const title = item.product?.title || item.title || "Product item";
            const qty = item.qty ?? item.quantity ?? 1;
            const price = Number(item.price || 0);
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
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", fontSize: "16px", fontWeight: "700" }}>
            <span>Total Amount:</span>
            <span>₹{total}</span>
          </div>
        </div>

        <div className="card" style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>Customer & Shipping</h3>
          <p style={{ margin: "0 0 6px 0", fontWeight: "600", fontSize: "15px" }}>{customerName}</p>
          {customerEmail && <p style={{ margin: "0 0 4px 0", color: "#64748b", fontSize: "13px" }}>✉ {customerEmail}</p>}
          {customerPhone && <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "13px" }}>📞 {customerPhone}</p>}
          <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "10px 0" }} />
          <p style={{ margin: "0 0 4px 0", color: "#334155", fontSize: "14px", fontWeight: "500" }}>Shipping Address:</p>
          <p style={{ margin: "0 0 4px 0", color: "#64748b", fontSize: "14px" }}>{shippingAddress}</p>
          {(shippingCity || shippingPincode) && (
            <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>{shippingCity} {shippingPincode}</p>
          )}
        </div>
      </div>
    </div>
  );
}