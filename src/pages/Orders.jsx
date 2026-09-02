import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Orders.css";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      let backendOrders = [];
      try {
        const token = localStorage.getItem("token");
        const API_BASE_URL = import.meta.env.VITE_API_URL || "https://jcs-server-1.onrender.com";
        
        const response = await axios.get(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        backendOrders = Array.isArray(response.data) ? response.data : response.data.orders || [];
      } catch (err) {
        console.warn("Backend orders fetch failed, falling back to local storage...", err);
      }

      // Combine with local orders to ensure newly created or modified orders always show up
      const localOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      
      // Merge unique orders by ID (preferring backend version if duplicated)
      const combinedMap = new Map();
      [...localOrders, ...backendOrders].forEach(ord => {
        const key = ord.id || ord._id || ord.order_id;
        if (key) combinedMap.set(String(key), ord);
      });

      const allOrders = Array.from(combinedMap.values());
      filterAndSetOrders(allOrders);
      setLoading(false);
    };

    const filterAndSetOrders = (allOrders) => {
      try {
        // If no strict separation is necessary or if we want users to see all relevant fetched orders:
        setOrders(allOrders);
      } catch (e) {
        console.error("Error setting orders:", e);
        setOrders(allOrders);
      }
    };

    fetchOrders();

    const handleStorageChange = () => {
      const updatedLocalOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      if (updatedLocalOrders.length > 0) {
        setOrders(updatedLocalOrders);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (loading) return <div className="container page"><p>Loading your orders…</p></div>;

  return (
    <div className="container page">
      <h2>Your orders</h2>
      
      {orders.length === 0 ? (
        <p className="no-orders" style={{ marginTop: "20px", color: "#666" }}>
          No orders found for your account — once you place one, it'll show up here.
        </p>
      ) : (
        <div className="orders-list" style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {orders.map((order) => {
            const rawId = String(order.order_id || order.id || "");
            const displayId = rawId.replace("JCS-", "");
            
            const orderStatus = String(order.status || order.paymentStatus || "PENDING").toUpperCase();
            const paymentMethodStr = String(order.paymentMethod || order.payment_method || "Cash on Delivery");
            
            const isOnlinePaid = paymentMethodStr.toLowerCase().includes("razorpay") || orderStatus === "PAID" || rawId.includes("RAZORPAY_SANDBOX");
            const isDelivered = orderStatus === "DELIVERED";
            
            const isPaid = isOnlinePaid || isDelivered;
            const badgeText = isPaid ? "PAID" : "PENDING";
            
            const rawTotal = order.totalAmount ?? order.totalPrice ?? order.grandTotal ?? 0;
            const calculatedTotal = (Number(rawTotal) === 0 && order.items)
              ? order.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty ?? item.quantity ?? 1)), 0)
              : rawTotal;

            const total = Number(calculatedTotal).toLocaleString("en-IN");
            
            return (
              <div key={order.id || order._id || order.order_id} className="card order-card" style={{ padding: "20px", background: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "15px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>
                      <Link to={`/orders/${rawId}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                        Order JCS-{displayId.replace("JCS-", "")}
                      </Link>
                    </h3>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      Placed on {order.createdAt && !isNaN(new Date(order.createdAt)) ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "Recent"}
                    </span>
                    
                    <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ 
                        padding: "3px 8px", 
                        borderRadius: "12px", 
                        fontSize: "11px", 
                        fontWeight: "700", 
                        background: isPaid ? "#d1fae5" : "#fef3c7", 
                        color: isPaid ? "#065f46" : "#92400e" 
                      }}>
                        {badgeText}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        via {paymentMethodStr}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`badge status-${orderStatus.toLowerCase()}`} style={{ padding: "6px 12px", borderRadius: "20px", background: orderStatus === 'DELIVERED' ? '#d1fae5' : orderStatus === 'SHIPPED' ? '#e0f2fe' : orderStatus === 'CANCELLED' ? '#fee2e2' : '#fef3c7', color: orderStatus === 'DELIVERED' ? '#065f46' : orderStatus === 'SHIPPED' ? '#0369a1' : orderStatus === 'CANCELLED' ? '#991b1b' : '#92400e', fontSize: "12px", fontWeight: "600" }}>
                      {orderStatus}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "#334155" }}>Ordered Products</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {order.items?.map((item, idx) => {
                      const title = item.product?.title || item.title || item.name || "Product item";
                      const qty = item.qty ?? item.quantity ?? 1;
                      const price = Number(item.price || 0);

                      return (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px", borderRadius: "6px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "500" }}>{title} <span style={{ color: "#64748b", fontSize: "13px" }}>× {qty}</span></span>
                          <span style={{ fontSize: "14px", fontWeight: "600" }}>₹{(qty * price).toLocaleString("en-IN")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: "12px" }}>
                  <div>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Total Amount: </span>
                    <strong style={{ fontSize: "15px" }}>₹{total}</strong>
                  </div>
                  <Link to={`/orders/${rawId}`} className="btn btn-sm" style={{ padding: "6px 14px", background: "#0f172a", color: "#fff", borderRadius: "6px", textDecoration: "none", fontSize: "13px" }}>
                    View Tracking & Details →
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}