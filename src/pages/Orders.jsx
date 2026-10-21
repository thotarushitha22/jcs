import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import { getOrderItems } from "../utils/orderItems";
import "./Orders.css";

export default function CustomerOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        const backendOrders = Array.isArray(response.data)
          ? response.data
          : response.data?.orders || [];

        if (isMounted) {
          setOrders(backendOrders);
          setError("");
        }
      } catch (err) {
        console.error("Customer orders fetch failed:", err.response?.data || err.message);
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load your orders. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    const handleFocus = () => fetchOrders();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div className="container page">
        <p>Loading your orders…</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="container page">
        <h2>Your orders</h2>
        <p className="no-orders" style={{ marginTop: "20px", color: "#b91c1c" }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="container page" style={{ padding: "40px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* HEADER WITH BACK ARROW */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <button 
            onClick={() => navigate("/account")} // <-- Always goes back to the Account page
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "40px", height: "40px", borderRadius: "50%", 
              border: "1px solid #e2e8f0", 
              backgroundColor: "#f8fafc", 
              cursor: "pointer", 
              color: "#0f172a", 
              fontSize: "18px", 
              fontWeight: "bold",
              transition: "all 0.2s ease",
              flexShrink: 0
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}
          >
            &lt;
          </button>

          <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>
            Your orders
          </h2>
        </div>

        {orders.length === 0 ? (
          <p className="no-orders" style={{ marginTop: "20px", color: "#666" }}>
            No orders found for your account — once you place one, it'll show up here.
          </p>
        ) : (
          <div className="orders-list" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {orders.map((order) => {
              const rawId = String(order.order_id || order.id || order._id || "");
              if (!rawId) return null;

              const displayId = rawId.replace(/^JCS-/i, "");
              const orderItems = getOrderItems(order);

              const orderStatus = String(order.status || order.paymentStatus || "PENDING").toUpperCase();

              const paymentMethodStr = String(
                order.paymentMethod || order.payment_method || order.payment_method_title || "Cash on Delivery"
              );

              const isOnlinePaid =
                String(order.paymentStatus || "").toLowerCase() === "paid" ||
                paymentMethodStr.toLowerCase().includes("razorpay") ||
                orderStatus === "PAID" ||
                rawId.toUpperCase().includes("RAZORPAY_SANDBOX");

              const isDelivered = orderStatus === "DELIVERED" || orderStatus === "COMPLETED";
              const isPaid = isOnlinePaid || isDelivered;
              const badgeText = isPaid ? "PAID" : "PENDING";

              const rawTotal = order.totalAmount ?? order.totalPrice ?? order.grandTotal ?? 0;
              const calculatedTotal =
                Number(rawTotal) === 0 && orderItems.length > 0
                  ? orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty ?? item.quantity ?? 1), 0)
                  : rawTotal;
              const total = Number(calculatedTotal).toLocaleString("en-IN");

              const displayStatus = orderStatus.replaceAll("_", " ");

              return (
                <div
                  key={order.id || order._id || order.order_id}
                  className="card order-card"
                  style={{ padding: "24px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}
                >
                  {/* HEADER */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #eee", paddingBottom: "16px", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px" }}>
                        <Link to={`/orders/${rawId}`} style={{ color: "#2563eb", textDecoration: "none", fontWeight: "600" }}>
                          Order JCS-{displayId}
                        </Link>
                      </h3>

                      <span style={{ fontSize: "14px", color: "#64748b", display: "block", marginTop: "4px" }}>
                        Placed on{" "}
                        {order.createdAt && !isNaN(new Date(order.createdAt))
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
                          : "Recent"}
                      </span>

                      <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: isPaid ? "#d1fae5" : "#fef3c7", color: isPaid ? "#065f46" : "#92400e" }}>
                          {badgeText}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          via {{ upi: "UPI / Card / Netbanking", credit: "Credit Terms", cod: "Cash on Delivery" }[paymentMethodStr.toLowerCase()] || paymentMethodStr}
                        </span>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      <span
                        className={`badge status-${orderStatus.toLowerCase()}`}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          background: orderStatus === "DELIVERED" || orderStatus === "COMPLETED" ? "#d1fae5" : orderStatus === "SHIPPED" || orderStatus === "OUT_FOR_DELIVERY" ? "#e0f2fe" : orderStatus === "CANCELLED" ? "#fee2e2" : orderStatus === "PROCESSING" ? "#dbeafe" : "#fef3c7",
                          color: orderStatus === "DELIVERED" || orderStatus === "COMPLETED" ? "#065f46" : orderStatus === "SHIPPED" || orderStatus === "OUT_FOR_DELIVERY" ? "#0369a1" : orderStatus === "CANCELLED" ? "#991b1b" : orderStatus === "PROCESSING" ? "#1d4ed8" : "#92400e",
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        {displayStatus}
                      </span>
                    </div>
                  </div>

                  {/* PRODUCTS */}
                  <div style={{ marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "15px", marginBottom: "10px", color: "#334155" }}>Ordered Products</h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {orderItems.length > 0 ? (
                        orderItems.map((item, idx) => {
                          const title = item.title;
                          const qty = item.qty;
                          const price = item.price;

                          return (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>
                                {title} <span style={{ color: "#64748b", fontSize: "13px", marginLeft: "6px" }}>× {qty}</span>
                              </span>
                              <span style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>
                                ₹{(qty * price).toLocaleString("en-IN")}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "13px" }}>Product details unavailable</span>
                      )}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                    <div>
                      <span style={{ fontSize: "14px", color: "#64748b" }}>Total Amount: </span>
                      <strong style={{ fontSize: "16px", color: "#0f172a" }}>₹{total}</strong>
                    </div>

                    <Link
                      to={`/orders/${rawId}`}
                      className="btn btn-sm"
                      style={{
                        padding: "10px 18px",
                        background: "#0f172a",
                        color: "#fff",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        whiteSpace: "nowrap"
                      }}
                    >
                      View Tracking & Details <span style={{ fontSize: "16px", lineHeight: 1 }}>→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}