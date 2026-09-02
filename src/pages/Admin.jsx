import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  fetchAllUsers, 
  fetchAllMerchants, 
  deleteUser, 
  deleteMerchant, 
  fetchAdminOrders 
} from "../api/admin";
import { fetchProducts, deleteProduct, updateProduct } from "../api/products";
import { useAuth } from "../context/AuthContext";

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("orders");
  const [users, setUsers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wholesaleRequests, setWholesaleRequests] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", store_name: "", title: "", price: "", stock: "" });
  const [selectedWholesaleSub, setSelectedWholesaleSub] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!user) {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser.email !== "thotarushitha22@gmail.com" && storedUser.role !== "admin") {
        navigate("/login");
      }
    } else if (user.email !== "thotarushitha22@gmail.com" && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    setSearchTerm("");
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Users & Merchants from API and LocalStorage
      const uData = await fetchAllUsers(token).catch(() => null);
      const mData = await fetchAllMerchants(token).catch(() => null);
      
      const apiUsers = Array.isArray(uData) ? uData : uData?.users || uData?.data || [];
      const apiMerchants = Array.isArray(mData) ? mData : mData?.merchants || mData?.data || [];
      const localUsersRegistry = JSON.parse(localStorage.getItem("jcs_users") || "[]");

      // Combine and deduplicate
      const combinedRegistry = [
        ...localUsersRegistry,
        ...apiUsers.map(u => ({ ...u, role: u.role || "buyer" })),
        ...apiMerchants.map(m => ({ ...m, role: "merchant" }))
      ];
      const uniqueRegistry = Array.from(new Map(combinedRegistry.map(item => [item.email, item])).values());

      // Filter into correct tabs
      const customerList = uniqueRegistry.filter(u => u.role !== "merchant" && u.role !== "seller" && u.role !== "admin");
      const merchantList = uniqueRegistry.filter(u => u.role === "merchant" || u.role === "seller");

      setUsers(customerList);
      setMerchants(merchantList);

      // 2. Fetch Products from API and LocalStorage
      const pData = await fetchProducts().catch(() => null);
      const apiProducts = Array.isArray(pData) ? pData : pData?.products || pData?.data || [];
      const localProducts = JSON.parse(localStorage.getItem("jcs_products") || "[]");
      
      const combinedProducts = [...localProducts, ...apiProducts];
      const uniqueProducts = Array.from(new Map(combinedProducts.map(p => [String(p.id || p._id), p])).values());
      
      setProducts(uniqueProducts);

      // 3. Load Wholesale Requests
      const localWholesale = JSON.parse(localStorage.getItem("jcs_wholesale_submissions") || "[]");
      setWholesaleRequests(localWholesale);

      // 4. Fetch Orders
      const oData = await fetchAdminOrders(token).catch(() => null);
      let rawOrders = Array.isArray(oData) ? oData : oData?.orders || oData?.data || oData?.allOrders || [];

      if (rawOrders.length === 0) {
        const localUserOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        rawOrders = localUserOrders;
      }
      
      const formattedOrders = rawOrders.map(o => ({
        order_id: o.orderId || o.id || o.order_id || "N/A",
        user_name: o.buyer?.name || o.user_name || o.customerName || "Customer",
        user_email: o.buyer?.email || o.user_email || o.customerEmail || "N/A",
        total_amount: o.totalAmount || o.total_amount || o.amount || 0,
        status: o.status || "PENDING",
        items: o.items || o.orderItems || [{ title: "Order Item", qty: o.quantity || 1, price: o.totalAmount || 0 }]
      }));

      setOrders(formattedOrders);

    } catch (err) {
      console.error("Error loading records", err);
      setError("Could not connect to the server or fetch records.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name || item.username || "",
      email: item.email || "",
      role: item.role || "buyer",
      store_name: item.store_name || "",
      title: item.title || item.name || "",
      price: item.price || "",
      stock: item.stock || ""
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const itemId = editingItem.id || editingItem._id || editingItem.email; // Fallback to email for local users

    try {
      if (activeTab === "users") {
        // Update state & localStorage
        const updatedUsers = users.map(u => (u.id === itemId || u._id === itemId || u.email === itemId) ? { ...u, ...editForm } : u);
        setUsers(updatedUsers);
        updateLocalStorageRegistry(itemId, editForm);
      } else if (activeTab === "merchants") {
        const updatedMerchants = merchants.map(m => (m.id === itemId || m._id === itemId || m.email === itemId) ? { ...m, ...editForm } : m);
        setMerchants(updatedMerchants);
        updateLocalStorageRegistry(itemId, editForm);
      } else if (activeTab === "products") {
        if (typeof updateProduct === "function" && editingItem._id) {
          await updateProduct(itemId, editForm, token).catch(() => {});
        }
        const updatedProducts = products.map(p => (p.id === itemId || p._id === itemId) ? { ...p, ...editForm } : p);
        setProducts(updatedProducts);
        localStorage.setItem("jcs_products", JSON.stringify(updatedProducts));
      }
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to update record:", err);
      setError("Failed to save changes.");
    }
  };

  // Helper to sync local user edits
  const updateLocalStorageRegistry = (identifier, newData) => {
    let registry = JSON.parse(localStorage.getItem("jcs_users") || "[]");
    registry = registry.map(u => u.email === identifier || u.id === identifier ? { ...u, ...newData } : u);
    localStorage.setItem("jcs_users", JSON.stringify(registry));
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${type}?`)) return;

    try {
      if (type === "user" || type === "merchant") {
        if (id) {
            await axios.delete(`http://localhost:5000/api/admin/${type}s/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {});
        }
        
        // Remove from local storage registry (using ID or Email)
        let registry = JSON.parse(localStorage.getItem("jcs_users") || "[]");
        registry = registry.filter(u => String(u.id || u._id || u.email) !== String(id));
        localStorage.setItem("jcs_users", JSON.stringify(registry));

        if(type === "user") setUsers(users.filter(u => String(u.id || u._id || u.email) !== String(id)));
        if(type === "merchant") setMerchants(merchants.filter(m => String(m.id || m._id || m.email) !== String(id)));
        
      } else if (type === "product") {
        if (typeof deleteProduct === "function" && id) {
          await deleteProduct(id, token).catch(() => {});
        }
        const updatedProducts = products.filter(p => String(p.id || p._id) !== String(id));
        setProducts(updatedProducts);
        localStorage.setItem("jcs_products", JSON.stringify(updatedProducts));
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} permanently deleted.`);
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      setError(`Failed to delete the ${type}.`);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.warn("Backend update route failed, updating status locally.", err);
    }

    const updatedOrders = orders.map((order) => {
      const currentId = String(order.order_id);
      const targetId = String(orderId);
      if (currentId === targetId || currentId === `JCS-${targetId}` || `JCS-${currentId}` === targetId) {
        return { ...order, status: newStatus };
      }
      return order;
    });

    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  const handleWholesaleStatusChange = (id, newStatus) => {
    const updated = wholesaleRequests.map((sub) => {
      if (sub.id === id) return { ...sub, status: newStatus };
      return sub;
    });
    setWholesaleRequests(updated);
    localStorage.setItem("jcs_wholesale_submissions", JSON.stringify(updated));
  };

  const filteredUsers = users.filter(u => (u.name || u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMerchants = merchants.filter(m => (m.store_name || m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (m.email || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProducts = products.filter(p => (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrders = orders.filter(o => String(o.order_id).toLowerCase().includes(searchTerm.toLowerCase()) || (o.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (o.user_email || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredWholesale = wholesaleRequests.filter(w => (w.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (w.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) || (w.category || "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9", fontFamily: "sans-serif" }}>
      
      {/* Dark Left Sidebar */}
      <div style={{ width: "260px", background: "#0c2340", color: "#ffffff", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "10px", background: "#08182c", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ background: "#2563eb", color: "#fff", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>🛡️</div>
          <span style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "0.5px" }}>Admin Panel</span>
        </div>

        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>A</div>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>Welcome!</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>admin</div>
          </div>
        </div>

        <div style={{ padding: "15px 10px", display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
          <div style={{ fontSize: "10px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase", padding: "5px 10px", letterSpacing: "1px" }}>Main Navigation</div>
          {[
            { id: "users", label: "Users", icon: "👥" },
            { id: "merchants", label: "Merchants", icon: "🏬" },
            { id: "products", label: "Products", icon: "📦" },
            { id: "orders", label: "Orders", icon: "📋" },
            { id: "wholesale", label: "Wholesale Requests", icon: "📄" }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              style={{ 
                padding: "12px 15px", borderRadius: "6px", border: "none", fontWeight: "500", fontSize: "14px",
                cursor: "pointer", textAlign: "left", background: activeTab === item.id ? "#1d4ed8" : "transparent", 
                color: activeTab === item.id ? "#ffffff" : "#cbd5e1", display: "flex", alignItems: "center", gap: "12px"
              }}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "15px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button type="button" onClick={() => navigate("/")} style={{ width: "100%", background: "rgba(255,255,255,0.1)", color: "#ffffff", padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
            &larr; Back to Store
          </button>
        </div>
      </div>

      {/* Main Right Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        <div style={{ background: "#0c2340", color: "#ffffff", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "18px", fontWeight: "600" }}>Admin Control Panel</div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>Home / Dashboard</span>
            <span style={{ fontSize: "13px", background: "rgba(255,255,255,0.1)", padding: "5px 12px", borderRadius: "4px" }}>Role: Administrator</span>
          </div>
        </div>

        <div style={{ padding: "30px", boxSizing: "border-box", flex: 1 }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div onClick={() => setActiveTab("users")} style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>Total Users</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{users.length}</div>
            </div>
            <div onClick={() => setActiveTab("merchants")} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>Total Merchants</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{merchants.length}</div>
            </div>
            <div onClick={() => setActiveTab("products")} style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>Product Inventory</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{products.length}</div>
            </div>
            <div onClick={() => setActiveTab("orders")} style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>System Orders</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{orders.length}</div>
            </div>
          </div>

          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>{error}</div>}

          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", maxWidth: "350px", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px", background: "#fff" }} />
            <div style={{ fontSize: "14px", color: "#64748b", textTransform: "capitalize" }}>Viewing: <strong>{activeTab} Table</strong></div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading admin records...</div>
            ) : (
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "orders" ? "Order ID" : activeTab === "wholesale" ? "Submission ID" : "ID"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "products" ? "Product Title" : activeTab === "users" ? "User Name" : activeTab === "merchants" ? "Store Name" : activeTab === "wholesale" ? "Product Name" : "Details"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "products" ? "Price" : activeTab === "orders" ? "Items Bought" : activeTab === "wholesale" ? "Category / Qty" : "Email"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "products" ? "Stock" : activeTab === "orders" ? "Total Amount" : activeTab === "wholesale" ? "Expected Price" : "Role"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", textAlign: activeTab === "orders" || activeTab === "wholesale" ? "left" : "right" }}>Status / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "users" && filteredUsers.map((u) => (
                      <tr key={u.id || u._id || u.email} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>{u.id || u._id || "Local"}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "500" }}>{u.name || u.username}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>{u.email}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}><span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>Customer</span></td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <button onClick={() => handleOpenEdit(u)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px" }}>Edit</button>
                          <button onClick={() => handleDelete(u.id || u._id || u.email, "user")} style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Delete</button>
                        </td>
                      </tr>
                    ))}

                    {activeTab === "merchants" && filteredMerchants.map((m) => (
                      <tr key={m.id || m._id || m.email} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>{m.id || m._id || "Local"}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "500" }}>{m.store_name || m.name}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>{m.email}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}><span style={{ background: "#ecfdf5", color: "#047857", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>Merchant</span></td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <button onClick={() => handleOpenEdit(m)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px" }}>Edit</button>
                          <button onClick={() => handleDelete(m.id || m._id || m.email, "merchant")} style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Delete</button>
                        </td>
                      </tr>
                    ))}

                    {activeTab === "products" && filteredProducts.map((p) => (
                      <tr key={p.id || p._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>{p.id || p._id}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "500" }}>{p.title || p.name}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600" }}>₹{p.price}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", color: "#475569" }}>{p.stock !== undefined ? p.stock : "N/A"}</td>
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <button onClick={() => handleOpenEdit(p)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px" }}>Edit</button>
                          <button onClick={() => handleDelete(p.id || p._id, "product")} style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Delete</button>
                        </td>
                      </tr>
                    ))}

                    {activeTab === "orders" && filteredOrders.map((o) => (
                      <tr key={o.order_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600" }}>#{o.order_id}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}><strong>{o.user_name}</strong><br /><small style={{ color: "#64748b" }}>{o.user_email}</small></td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                          <ul style={{ margin: 0, paddingLeft: "15px", color: "#334155" }}>
                            {o.items?.map((item, idx) => (
                              <li key={idx}>{item.title} — Qty: {item.qty || item.quantity || 1} (₹{item.price})</li>
                            ))}
                          </ul>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600" }}>₹{Number(o.total_amount || 0).toLocaleString()}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                          <select value={o.status} onChange={(e) => handleOrderStatusChange(o.order_id, e.target.value)} style={{ padding: "6px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}>
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}

                    {activeTab === "wholesale" && filteredWholesale.map((w) => (
                      <tr key={w.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600" }}>{w.id}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                          <strong>{w.productName}</strong><br />
                          <small style={{ color: "#64748b" }}>Vendor: {w.userEmail}</small>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>{w.category} / {w.quantity} units</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "bold" }}>₹{w.expectedPrice}</td>
                        <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                          <select value={w.status || "Pending"} onChange={(e) => handleWholesaleStatusChange(w.id, e.target.value)} style={{ padding: "6px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "6px", cursor: "pointer" }}>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal (Hidden by Default) */}
      {editingItem && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "8px", width: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Edit {activeTab.slice(0, -1).toUpperCase()}</h3>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              
              {(activeTab === "users" || activeTab === "merchants") && (
                <>
                  <label>
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>{activeTab === "merchants" ? "Store Name" : "Name"}</div>
                    <input type="text" value={activeTab === "merchants" ? editForm.store_name : editForm.name} onChange={(e) => activeTab === "merchants" ? setEditForm({...editForm, store_name: e.target.value}) : setEditForm({...editForm, name: e.target.value})} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} required />
                  </label>
                  <label>
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Email</div>
                    <input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} required />
                  </label>
                </>
              )}

              {activeTab === "products" && (
                <>
                  <label>
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Product Title</div>
                    <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} required />
                  </label>
                  <label>
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Price (₹)</div>
                    <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} required />
                  </label>
                  <label>
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Stock</div>
                    <input type="number" value={editForm.stock} onChange={(e) => setEditForm({...editForm, stock: e.target.value})} style={{ width: "100%", padding: "8px", boxSizing: "border-box" }} />
                  </label>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setEditingItem(null)} style={{ padding: "8px 15px", border: "1px solid #cbd5e1", background: "#f1f5f9", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 15px", border: "none", background: "#2563eb", color: "#fff", borderRadius: "4px", cursor: "pointer" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}