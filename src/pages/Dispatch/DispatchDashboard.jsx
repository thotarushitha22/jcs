import { useState, useEffect } from "react";
import { Truck, MapPin, Send, CheckCircle2, Search, Package } from "lucide-react";
import { fetchMerchantOrders } from "../../api/orders";
import { fetchMyProducts } from "../../api/products"; // <-- NEW IMPORT
import axios from "axios";
import toast from "react-hot-toast";
import "./Dispatch.css";

const API_BASE = "https://jcs-server-1.onrender.com/api";

export default function DispatchDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); // <-- Store inventory
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch BOTH orders and products at the same time
        const [ordRes, prodRes] = await Promise.allSettled([
          fetchMerchantOrders(),
          fetchMyProducts()
        ]);

        if (prodRes.status === "fulfilled") {
          const rawProds = Array.isArray(prodRes.value) ? prodRes.value : prodRes.value?.data || [];
          setProducts(rawProds);
        }

        if (ordRes.status === "fulfilled") {
          const rawOrders = Array.isArray(ordRes.value) ? ordRes.value : ordRes.value?.data || [];
          const dispatchQueue = rawOrders.filter(o => 
            ["PROCESSING", "PACKED", "SHIPPED", "DISPATCHED"].includes(String(o.status).toUpperCase())
          );
          setOrders(dispatchQueue);
        }
      } catch (err) {
        toast.error("Failed to load dispatch queue");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePartnerChange = (id, partner) => {
    setSelectedPartner(prev => ({ ...prev, [id]: partner }));
  };

  const dispatchOrder = async (order) => {
    const orderId = order.id || order._id || order.orderId;
    if (!orderId) return toast.error("Order ID missing");

    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
      await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: "SHIPPED" }, config);
      
      setOrders(prev => prev.map(o => 
        (o.id || o._id || o.orderId) === orderId ? { ...o, status: "SHIPPED" } : o
      ));
      toast.success(`Dispatched via ${selectedPartner[orderId] || 'Delivery Partner'}!`);
    } catch (err) {
      toast.error("Failed to dispatch order");
    }
  };

  const filteredOrders = orders.filter(o => {
    const id = o.orderId || o.id || o._id;
    return String(id).toLowerCase().includes(search.toLowerCase()) || 
           String(o.shippingAddress?.name || o.user_name || "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="dp-layout">
      <header className="dp-header">
        <div className="dp-brand">
          <div className="dp-logo" style={{ background: "#2563eb" }}><Truck size={20} /></div>
          <span>Logistics & Dispatch</span>
        </div>
        <div className="dp-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="dp-main">
        <div className="dp-title">
          <h2>Dispatch Center</h2>
          <p>{filteredOrders.length} orders ready for dispatch.</p>
        </div>

        {loading ? (
          <p>Loading real orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p style={{ color: "#64748b" }}>No orders ready for dispatch.</p>
        ) : (
          <div className="dp-grid">
            {filteredOrders.map(order => {
              const oId = order.orderId || order.id || order._id;
              const address = order.shippingAddress?.city || order.shippingAddress?.address || "Address unavailable";
              const status = String(order.status || "").toUpperCase();
              const isShipped = status === "SHIPPED" || status === "DISPATCHED";

              // Fallback for customer name
              const customerName = order.shippingAddress?.name || order.user_name || order.customerName || order.buyer?.name || "Customer";

              let orderItems = order.items || order.orderItems || order.cartItems || order.products || [];

              return (
                <div key={oId} className="dp-card" style={{ borderLeft: "4px solid #2563eb" }}>
                  <div className="dp-card-header">
                    <div>
                      <h4>JCS-{oId}</h4>
                      <p style={{ marginTop: "4px" }}>
                        <strong style={{ color: "#0f172a" }}>{customerName}</strong>
                      </p>
                      <p><MapPin size={12} /> {address}</p>
                    </div>
                    <span className="dp-badge">{status}</span>
                  </div>

                  {/* ITEMS TO DISPATCH */}
                  <div style={{ margin: "16px 0", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                      <Package size={14} /> Items in Package:
                    </div>
                    
                    {Array.isArray(orderItems) && orderItems.length > 0 ? (
                      orderItems.map((item, idx) => {
                        
                        // 1. Try to get image directly from the order item
                        let itemImage = item.image || (item.images && item.images[0]);
                        
                        // 2. If no image, search our Products list using the product ID!
                        if (!itemImage) {
                          const pId = item.productId || item.product_id || item._id || item.id;
                          const matchedProduct = products.find(p => (p._id || p.id) === pId);
                          if (matchedProduct) {
                            itemImage = matchedProduct.images?.[0] || matchedProduct.image;
                          }
                        }

                        // 3. Fallback name search if ID fails
                        if (!itemImage) {
                          const matchedByName = products.find(p => (p.title || p.name) === (item.title || item.name));
                          if (matchedByName) {
                             itemImage = matchedByName.images?.[0] || matchedByName.image;
                          }
                        }

                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", marginBottom: "12px", paddingBottom: "12px", borderBottom: idx !== orderItems.length - 1 ? "1px dashed #cbd5e1" : "none" }}>
                            
                            {/* IMAGE BOX */}
                            <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "#e2e8f0", overflow: "hidden", flexShrink: 0 }}>
                              {itemImage ? (
                                <img src={itemImage} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                                  <Package size={16} />
                                </div>
                              )}
                            </div>

                            {/* PRODUCT DETAILS */}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "2px" }}>
                                {item.title || item.name || item.productName || "Product"}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b" }}>
                                Qty: <strong style={{ color: "#2563eb" }}>{item.quantity || item.qty || 1}</strong>
                              </div>
                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                        {order.productName || order.productTitle || "Items not listed in detail."}
                      </p>
                    )}
                  </div>

                  {!isShipped && (
                    <div className="dp-card-body">
                      <label>Assign Delivery Partner</label>
                      <select 
                        className="dp-select"
                        onChange={(e) => handlePartnerChange(oId, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Select Partner</option>
                        <option>BlueDart Express</option>
                        <option>Delhivery</option>
                        <option>DTDC</option>
                        <option>India Post</option>
                      </select>
                    </div>
                  )}

                  {isShipped && (
                    <div className="dp-assigned">
                      <span>Status:</span>
                      <strong>In Transit</strong>
                    </div>
                  )}

                  <div className="dp-card-actions">
                    {!isShipped ? (
                      <button className="dp-btn primary" onClick={() => dispatchOrder(order)}>
                        <Send size={16} /> Dispatch to Hub
                      </button>
                    ) : (
                      <button className="dp-btn success" disabled>
                        <CheckCircle2 size={16} /> Currently In Transit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}