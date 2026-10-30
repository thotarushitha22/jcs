import { useState, useEffect } from "react";
import { Box, Package, CheckCircle2, Search, Truck, ClipboardList, AlertCircle } from "lucide-react";
import { fetchMerchantOrders } from "../../api/orders";
import { fetchMyProducts } from "../../api/products";
import axios from "axios";
import toast from "react-hot-toast";
import "./Warehouse.css";

const API_BASE = "https://jcs-server-1.onrender.com/api";

export default function WarehouseDashboard() {
  const [activeTab, setActiveTab] = useState("orders"); 
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordRes, prodRes] = await Promise.allSettled([
          fetchMerchantOrders(),
          fetchMyProducts()
        ]);

        if (ordRes.status === "fulfilled") {
          const rawOrders = Array.isArray(ordRes.value) ? ordRes.value : ordRes.value?.data || [];
          setOrders(rawOrders);
          console.log("Warehouse loaded orders:", rawOrders); // Debug log
        }

        if (prodRes.status === "fulfilled") {
          const rawProds = Array.isArray(prodRes.value) ? prodRes.value : prodRes.value?.data || [];
          setProducts(rawProds);
        }
      } catch (err) {
        toast.error("Failed to load warehouse data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const markAsPacked = async (order) => {
    const orderId = order.id || order._id || order.orderId;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
      
      await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: "PROCESSING" }, config);
      
      setOrders(prev => prev.map(o => 
        (o.id || o._id || o.orderId) === orderId ? { ...o, status: "PROCESSING" } : o
      ));
      toast.success("Order packed! Ready for dispatch.");
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  const filteredOrders = orders.filter(o => {
    const id = o.orderId || o.id || o._id;
    return String(id).toLowerCase().includes(search.toLowerCase()) || 
           String(o.shippingAddress?.name || "").toLowerCase().includes(search.toLowerCase());
  });

  const filteredProducts = products.filter(p => 
    (p.title || p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  // UPDATED STATS LOGIC
  // Treats PENDING, PAID, or even empty status as "Needs Packing"
  const pendingPack = orders.filter(o => {
    const status = String(o.status || "PENDING").toUpperCase();
    return ["PENDING", "PAID", "PLACED", "CONFIRMED", ""].includes(status);
  }).length;

  const readyForDispatch = orders.filter(o => {
    const status = String(o.status || "").toUpperCase();
    return ["PROCESSING", "PACKED"].includes(status);
  }).length;

  const shipped = orders.filter(o => {
    const status = String(o.status || "").toUpperCase();
    return ["SHIPPED", "DISPATCHED", "DELIVERED", "HUB_1", "HUB_2"].includes(status);
  }).length;

  return (
    <div className="wh-layout">
      <header className="wh-header">
        <div className="wh-brand">
          <div className="wh-logo" style={{ background: "#f59e0b" }}><Box size={20} /></div>
          <span>Warehouse Operations</span>
        </div>
        <div className="wh-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder={activeTab === "orders" ? "Search Order ID or Customer..." : "Search Product or SKU..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <main className="wh-main">
        
        <div className="wh-tabs">
          <button className={`wh-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => {setActiveTab('orders'); setSearch('');}}>
            <ClipboardList size={16} /> All Orders
          </button>
          <button className={`wh-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => {setActiveTab('inventory'); setSearch('');}}>
            <Package size={16} /> Warehouse Inventory
          </button>
        </div>

        {activeTab === "orders" && (
          <div className="animate-fade-in">
            
            {/* Stats Cards */}
            <div className="wh-stats-grid">
              <div className="wh-stat-card">
                <div className="wh-stat-icon" style={{ background: "#fef3c7", color: "#b45309" }}><AlertCircle size={24} /></div>
                <div><p>Needs Packing</p><h3>{pendingPack}</h3></div>
              </div>
              <div className="wh-stat-card">
                <div className="wh-stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><CheckCircle2 size={24} /></div>
                <div><p>Packed (Awaiting Pickup)</p><h3>{readyForDispatch}</h3></div>
              </div>
              <div className="wh-stat-card">
                <div className="wh-stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}><Truck size={24} /></div>
                <div><p>In Transit / Shipped</p><h3>{shipped}</h3></div>
              </div>
            </div>

            {loading ? <p>Loading orders...</p> : filteredOrders.length === 0 ? (
              <p style={{ marginTop: "24px", color: "#64748b" }}>No orders found.</p>
            ) : (
              <div className="wh-grid" style={{ marginTop: "24px" }}>
                {filteredOrders.map(order => {
                  const oId = order.orderId || order.id || order._id;
                  const status = String(order.status || "PENDING").toUpperCase();
                  
                  const isPacked = ["PACKED", "PROCESSING"].includes(status);
                  const isShipped = ["SHIPPED", "DISPATCHED", "DELIVERED", "HUB_1", "HUB_2"].includes(status);
                  
                  // If it's NOT packed and NOT shipped, it needs packing.
                  const canPack = !isPacked && !isShipped;

                  const borderColor = isShipped ? "#2563eb" : isPacked ? "#16a34a" : "#f59e0b";
                  const badgeClass = isShipped ? "dispatch" : isPacked ? "instock" : "low";

                  // BUG FIX: Safely grab product names from different backend formats
                  let orderItems = order.items || order.orderItems || order.cartItems || order.products || [];
                  
                  return (
                    <div key={oId} className="wh-card" style={{ borderLeft: `4px solid ${borderColor}` }}>
                      
                      <div className="wh-card-header">
                        <div>
                          <h4>JCS-{oId}</h4>
                          <p>{order.shippingAddress?.name || order.user_name || order.customerName || "Customer"} • {order.shippingAddress?.city || order.shippingAddress?.address || "City"}</p>
                        </div>
                        <span className={`wh-badge ${badgeClass}`} style={isShipped ? {background: '#dbeafe', color: '#1d4ed8'} : {}}>
                          {status}
                        </span>
                      </div>

                      <div className="wh-card-body">
                        <strong>Items to Pick:</strong>
                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {Array.isArray(orderItems) && orderItems.length > 0 ? (
                            orderItems.map((item, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", padding: "8px", borderRadius: "6px", fontSize: "13px" }}>
                                <span style={{ fontWeight: 500 }}>{item.title || item.name || item.productName || "Product"}</span>
                                <strong style={{ color: "#475569" }}>Qty: {item.quantity || item.qty || 1}</strong>
                              </div>
                            ))
                          ) : (
                            <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px", fontSize: "13px", color: "#64748b" }}>
                              {order.productName || order.productTitle || "Items not listed in detail."}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="wh-card-actions">
                        {canPack ? (
                          <button className="wh-btn primary" onClick={() => markAsPacked(order)}>
                            <Package size={16} /> Mark as Packed
                          </button>
                        ) : isPacked ? (
                          <button className="wh-btn success" disabled style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #16a34a" }}>
                            <CheckCircle2 size={16} /> Ready for Dispatch
                          </button>
                        ) : (
                          <button className="wh-btn" disabled style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #2563eb" }}>
                            <Truck size={16} /> In Transit
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="animate-fade-in">
            <div className="wh-grid">
              {filteredProducts.map(product => {
                const pId = product._id || product.id;
                const stock = Number(product.stock) || 0;
                const image = product.images?.[0] || product.image || "https://via.placeholder.com/80";
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= 5;

                return (
                  <div key={pId} className="wh-card" style={{ borderLeft: `4px solid ${isOut ? '#dc2626' : isLow ? '#f59e0b' : '#16a34a'}` }}>
                    <div className="wh-card-header">
                      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                        <img src={image} alt="" style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} />
                        <div>
                          <h4>{product.title || product.name}</h4>
                          <p>{product.brand} • SKU: {product.sku || "N/A"}</p>
                        </div>
                      </div>
                      <span className={`wh-badge ${isOut ? 'out' : isLow ? 'low' : 'instock'}`}>
                        {isOut ? "Out" : isLow ? "Low" : "In Stock"}
                      </span>
                    </div>
                    
                    <div className="wh-card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>Stock:</strong>
                        <p style={{ fontSize: "20px", fontWeight: "800", color: isOut ? "#dc2626" : "#0f172a", margin: "4px 0 0 0" }}>
                          {stock} units
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong>Price:</strong>
                        <p style={{ fontSize: "16px", fontWeight: "600", margin: "4px 0 0 0" }}>₹{Number(product.price).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}