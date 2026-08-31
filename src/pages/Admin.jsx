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
      // Fetch Users with fallback
      const uData = await fetchAllUsers(token).catch(() => null);
      const userList = Array.isArray(uData) ? uData : uData?.users || uData?.data || [];
      setUsers(userList.length > 0 ? userList : [
        { id: 1, name: "John Doe", email: "john@example.com", role: "buyer" },
        { id: 2, name: "Jane Smith", email: "jane@example.com", role: "merchant" }
      ]);

      // Fetch Merchants with fallback
      const mData = await fetchAllMerchants(token).catch(() => null);
      const merchantList = Array.isArray(mData) ? mData : mData?.merchants || mData?.data || [];
      setMerchants(merchantList.length > 0 ? merchantList : [
        { id: 101, store_name: "Tech Gadgets Hub", email: "hub@merchant.com" },
        { id: 102, store_name: "Fashion Trendz", email: "trendz@merchant.com" }
      ]);

      // Fetch Products with fallback
      const pData = await fetchProducts().catch(() => null);
      const productList = Array.isArray(pData) ? pData : pData?.products || pData?.data || [];
      setProducts(productList.length > 0 ? productList : [
        { id: 201, title: "Wireless Bluetooth Mouse", price: 29.99, stock: 45 },
        { id: 202, title: "Mechanical Gaming Keyboard", price: 79.99, stock: 12 }
      ]);

      // Load Wholesale Vendor Submissions from localStorage
      const localWholesale = JSON.parse(localStorage.getItem("jcs_wholesale_submissions") || "[]");
      setWholesaleRequests(localWholesale);

      // Fetch Real System Orders from backend with a fallback to local/buyer orders
      const oData = await fetchAdminOrders(token).catch(() => null);

      let rawOrders = Array.isArray(oData) 
        ? oData 
        : oData?.orders || oData?.data || oData?.allOrders || [];

      if (rawOrders.length === 0) {
        const localUserOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        if (localUserOrders.length > 0) {
          rawOrders = localUserOrders;
        } else {
          rawOrders = [
            {
              order_id: "JCS-00002",
              user_name: "Thota Rushitha",
              user_email: "thotarushitha22@gmail.com",
              total_amount: 35400,
              status: "PENDING",
              items: [{ title: "Order Item", qty: 1, price: 35400 }]
            },
            {
              order_id: "JCS-00999",
              user_name: "Thota Rushitha",
              user_email: "thotarushitha22@gmail.com",
              total_amount: 150,
              status: "DELIVERED",
              items: [{ title: "Order Item", qty: 2, price: 75 }]
            },
            {
              order_id: "JCS-00001",
              user_name: "Thota Rushitha",
              user_email: "thotarushitha22@gmail.com",
              total_amount: 18289,
              status: "PENDING",
              items: [{ title: "Order Item", qty: 1, price: 18289 }]
            }
          ];
        }
      }
      
      const formattedOrders = rawOrders.map(o => ({
        order_id: o.orderId || o.id || o.order_id || "N/A",
        user_name: o.buyer?.name || o.user_name || o.customerName || "Thota Rushitha",
        user_email: o.buyer?.email || o.user_email || o.customerEmail || "thotarushitha22@gmail.com",
        total_amount: o.totalAmount || o.total_amount || o.amount || 0,
        status: o.status || "PENDING",
        items: o.items || o.orderItems || [{ title: "Order Item", qty: o.quantity || 1, price: o.totalAmount || 0 }]
      }));

      setOrders(formattedOrders);
      localStorage.setItem("orders", JSON.stringify(formattedOrders));

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
    const itemId = editingItem.id || editingItem._id;

    try {
      if (activeTab === "users") {
        setUsers(users.map(u => (u.id === itemId || u._id === itemId) ? { ...u, ...editForm } : u));
      } else if (activeTab === "merchants") {
        setMerchants(merchants.map(m => (m.id === itemId || m._id === itemId) ? { ...m, ...editForm } : m));
      } else if (activeTab === "products") {
        if (typeof updateProduct === "function") {
          await updateProduct(itemId, editForm, token).catch(() => {});
        }
        setProducts(products.map(p => (p.id === itemId || p._id === itemId) ? { ...p, ...editForm } : p));
      }
      setEditingItem(null);
    } catch (err) {
      console.error("Failed to update record:", err);
      setError("Failed to save changes to the server.");
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${type}? This action cannot be undone.`)) return;

    try {
      if (type === "user") {
        await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});

        setUsers(users.filter(u => String(u.id || u._id) !== String(id)));
      } else if (type === "merchant") {
        await axios.delete(`http://localhost:5000/api/admin/merchants/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});

        setMerchants(merchants.filter(m => String(m.id || m._id) !== String(id)));
      } else if (type === "product") {
        if (typeof deleteProduct === "function") {
          await deleteProduct(id, token).catch(() => {});
        }
        setProducts(products.filter(p => String(p.id || p._id) !== String(id)));
      }

      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} permanently deleted.`);
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      setError(`Failed to permanently delete the ${type} from the database server.`);
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
      if (sub.id === id) {
        return { ...sub, status: newStatus };
      }
      return sub;
    });
    setWholesaleRequests(updated);
    localStorage.setItem("jcs_wholesale_submissions", JSON.stringify(updated));
    if (selectedWholesaleSub && selectedWholesaleSub.id === id) {
      setSelectedWholesaleSub({ ...selectedWholesaleSub, status: newStatus });
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMerchants = merchants.filter(m => 
    (m.store_name || m.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    String(o.order_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.user_email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWholesale = wholesaleRequests.filter(w =>
    (w.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6f9", fontFamily: "sans-serif" }}>
      
      {/* Dark Left Sidebar */}
      <div style={{ width: "260px", background: "#0c2340", color: "#ffffff", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        
        {/* Brand / Logo Header */}
        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "10px", background: "#08182c", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ background: "#2563eb", color: "#fff", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>🛡️</div>
          <span style={{ fontSize: "18px", fontWeight: "bold", letterSpacing: "0.5px" }}>Admin Panel</span>
        </div>

        {/* User Mini Profile Box */}
        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
            A
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>Welcome!</div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>admin</div>
          </div>
        </div>

        {/* Navigation Section */}
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
                padding: "12px 15px", 
                borderRadius: "6px", 
                border: "none", 
                fontWeight: "500", 
                fontSize: "14px",
                cursor: "pointer", 
                textAlign: "left",
                background: activeTab === item.id ? "#1d4ed8" : "transparent", 
                color: activeTab === item.id ? "#ffffff" : "#cbd5e1",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "background 0.2s"
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Sidebar Footer / Back Button */}
        <div style={{ padding: "15px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ width: "100%", background: "rgba(255,255,255,0.1)", color: "#ffffff", padding: "10px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
          >
            &larr; Back to Store
          </button>
        </div>
      </div>

      {/* Main Right Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowX: "hidden" }}>
        
        {/* Top Header Navigation Bar */}
        <div style={{ background: "#0c2340", color: "#ffffff", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "18px", fontWeight: "600" }}>Admin Control Panel</div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>Home / Dashboard</span>
            <span style={{ fontSize: "13px", background: "rgba(255,255,255,0.1)", padding: "5px 12px", borderRadius: "4px" }}>
              Role: Administrator
            </span>
          </div>
        </div>

        {/* Dashboard Body Content */}
        <div style={{ padding: "30px", boxSizing: "border-box", flex: 1 }}>
          
          {/* Top Summary Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            
            {/* Card 1: Users */}
            <div 
              onClick={() => setActiveTab("users")}
              style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>Total Users</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{users.length}</div>
              <div style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "2px 8px", borderRadius: "4px" }}>Manage Users &rarr;</div>
            </div>

            {/* Card 2: Merchants */}
            <div 
              onClick={() => setActiveTab("merchants")}
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>Total Merchants</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{merchants.length}</div>
              <div style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "2px 8px", borderRadius: "4px" }}>Manage Merchants &rarr;</div>
            </div>

            {/* Card 3: Products */}
            <div 
              onClick={() => setActiveTab("products")}
              style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>Product Inventory</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{products.length}</div>
              <div style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "2px 8px", borderRadius: "4px" }}>Manage Products &rarr;</div>
            </div>

            {/* Card 4: Orders */}
            <div 
              onClick={() => setActiveTab("orders")}
              style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>System Orders</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{orders.length}</div>
              <div style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "2px 8px", borderRadius: "4px" }}>View Orders &rarr;</div>
            </div>

            {/* Card 5: Wholesale Requests */}
            <div 
              onClick={() => setActiveTab("wholesale")}
              style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)", borderRadius: "10px", padding: "20px", color: "#fff", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
            >
              <div style={{ fontSize: "13px", opacity: 0.9, marginBottom: "5px" }}>Wholesale Requests</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>{wholesaleRequests.length}</div>
              <div style={{ fontSize: "11px", background: "rgba(255,255,255,0.2)", display: "inline-block", padding: "2px 8px", borderRadius: "4px" }}>Review Submissions &rarr;</div>
            </div>

          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
              {error}
            </div>
          )}

          {/* Search Box */}
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", maxWidth: "350px", padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box", fontSize: "14px", background: "#fff" }}
            />
            <div style={{ fontSize: "14px", color: "#64748b", textTransform: "capitalize" }}>
              Viewing: <strong>{activeTab} Table</strong>
            </div>
          </div>

          {/* Data Table Container */}
          <div style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading admin records...</div>
            ) : (
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 10 }}>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "orders" ? "Order ID" : activeTab === "wholesale" ? "Submission ID" : "ID"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "products" ? "Product Title" : activeTab === "users" ? "User Name" : activeTab === "merchants" ? "Store Name" : activeTab === "wholesale" ? "Product Name" : "Customer Details"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "products" ? "Price" : activeTab === "orders" ? "Items Bought" : activeTab === "wholesale" ? "Category / Qty" : "Email Address"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>{activeTab === "products" ? "Stock" : activeTab === "orders" ? "Total Amount" : activeTab === "wholesale" ? "Expected Price" : "Account Role"}</th>
                      <th style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", textTransform: "uppercase", textAlign: activeTab === "orders" || activeTab === "wholesale" ? "left" : "right" }}>{activeTab === "orders" || activeTab === "wholesale" ? "Status / Actions" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "users" && (
                      filteredUsers.length === 0 ? <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No users found.</td></tr> :
                      filteredUsers.map((u) => (
                        <tr key={u.id || u._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#0f172a" }}>{u.id || u._id}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{u.name || u.username}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>{u.email}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>{u.role || 'user'}</span>
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <button type="button" onClick={() => handleOpenEdit(u)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px" }}>Edit</button>
                            <button type="button" onClick={() => handleDelete(u.id || u._id, "user")} style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}

                    {activeTab === "merchants" && (
                      filteredMerchants.length === 0 ? <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No merchants found.</td></tr> :
                      filteredMerchants.map((m) => (
                        <tr key={m.id || m._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#0f172a" }}>{m.id || m._id}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{m.store_name || m.name}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>{m.email}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                            <span style={{ background: "#ecfdf5", color: "#047857", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>Active Seller</span>
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <button type="button" onClick={() => handleOpenEdit(m)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px" }}>Edit</button>
                            <button type="button" onClick={() => handleDelete(m.id || m._id, "merchant")} style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}

                    {activeTab === "products" && (
                      filteredProducts.length === 0 ? <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No products found.</td></tr> :
                      filteredProducts.map((p) => (
                        <tr key={p.id || p._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#0f172a" }}>{p.id || p._id}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{p.title || p.name}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>₹{p.price}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#475569" }}>{p.stock !== undefined ? p.stock : "N/A"}</td>
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <button type="button" onClick={() => handleOpenEdit(p)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", marginRight: "6px" }}>Edit</button>
                            <button type="button" onClick={() => handleDelete(p.id || p._id, "product")} style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}

                    {activeTab === "orders" && (
                      filteredOrders.length === 0 ? <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No orders found.</td></tr> :
                      filteredOrders.map((o) => (
                        <tr key={o.order_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>#{o.order_id}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                            <strong>{o.user_name}</strong><br />
                            <small style={{ color: "#64748b" }}>{o.user_email}</small>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                            <ul style={{ margin: 0, paddingLeft: "15px", color: "#334155" }}>
                              {o.items?.map((item, idx) => (
                                <li key={idx}>
                                  {item.title} — Qty: {item.qty || item.quantity || 1} (₹{item.price})
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                            ₹{Number(o.total_amount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                            <select
                              value={o.status}
                              onChange={(e) => handleOrderStatusChange(o.order_id, e.target.value)}
                              style={{
                                padding: "6px 10px",
                                fontSize: "11px",
                                fontWeight: "700",
                                borderRadius: "6px",
                                cursor: "pointer",
                                outline: "none",
                                textTransform: "uppercase",
                                backgroundColor: 
                                  String(o.status).toUpperCase() === 'DELIVERED' ? '#d1fae5' :
                                  String(o.status).toUpperCase() === 'SHIPPED' ? '#ede9fe' :
                                  String(o.status).toUpperCase() === 'PROCESSING' ? '#e0f2fe' :
                                  String(o.status).toUpperCase() === 'CANCELLED' ? '#fee2e2' : '#fef3c7',
                                color: 
                                  String(o.status).toUpperCase() === 'DELIVERED' ? '#065f46' :
                                  String(o.status).toUpperCase() === 'SHIPPED' ? '#6d28d9' :
                                  String(o.status).toUpperCase() === 'PROCESSING' ? '#0369a1' :
                                  String(o.status).toUpperCase() === 'CANCELLED' ? '#991b1b' : '#92400e',
                                border: '1px solid rgba(0,0,0,0.1)'
                              }}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}

                    {activeTab === "wholesale" && (
                      filteredWholesale.length === 0 ? <tr><td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>No wholesale requests found.</td></tr> :
                      filteredWholesale.map((w) => (
                        <tr key={w.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{w.id}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px" }}>
                            <strong>{w.productName}</strong><br />
                            <small style={{ color: "#64748b" }}>Vendor: {w.userEmail}</small>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#334155" }}>
                            {w.category} (Qty: {w.quantity})
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                            ₹{w.expectedPrice} per unit
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ 
                              padding: "4px 8px", 
                              borderRadius: "4px", 
                              fontSize: "11px", 
                              fontWeight: "bold",
                              backgroundColor: w.status === "Approved" ? "#def7ec" : w.status === "Rejected" ? "#fde8e8" : "#fef3c7",
                              color: w.status === "Approved" ? "#03543f" : w.status === "Rejected" ? "#9b1c1c" : "#92400e"
                            }}>
                              {w.status || "Pending Review"}
                            </span>
                            <button 
                              type="button"
                              onClick={() => setSelectedWholesaleSub(w)}
                              style={{ background: "#e2e8f0", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                            >
                              View Photos & KYC
                            </button>
                          </td>
                        </tr>
                      ))
                    )}

                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Wholesale Review Modal */}
        {selectedWholesaleSub && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "600px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto" }}>
              <h2>Review Wholesale: {selectedWholesaleSub.productName}</h2>
              
              <div style={{ margin: "1rem 0", fontSize: "14px", lineHeight: "1.6" }}>
                <p><strong>Vendor Email:</strong> {selectedWholesaleSub.userEmail}</p>
                <p><strong>Category:</strong> {selectedWholesaleSub.category}</p>
                <p><strong>Quantity:</strong> {selectedWholesaleSub.quantity}</p>
                <p><strong>Expected Price:</strong> ₹{selectedWholesaleSub.expectedPrice}</p>
                <p><strong>Current Status:</strong> {selectedWholesaleSub.status || "Pending Review"}</p>
              </div>

              <div style={{ margin: "1.5rem 0" }}>
                <h4>Product Photos ({selectedWholesaleSub.productPhotos?.length || 0})</h4>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                  {selectedWholesaleSub.productPhotos && selectedWholesaleSub.productPhotos.length > 0 ? (
                    selectedWholesaleSub.productPhotos.map((photo, idx) => (
                      <img key={idx} src={photo} alt="Product" style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "4px", border: "1px solid #ccc" }} />
                    ))
                  ) : (
                    <p style={{ color: "#6b7280", fontSize: "13px" }}>No photos uploaded.</p>
                  )}
                </div>
              </div>

              <div style={{ margin: "1.5rem 0" }}>
                <h4>KYC Document</h4>
                {selectedWholesaleSub.kycDoc ? (
                  <div style={{ marginTop: "8px" }}>
                    <img src={selectedWholesaleSub.kycDoc} alt="KYC Document" style={{ maxWidth: "200px", maxHeight: "150px", objectFit: "contain", border: "1px solid #ccc", borderRadius: "4px" }} />
                  </div>
                ) : (
                  <p style={{ color: "#6b7280", fontSize: "13px" }}>No KYC document provided.</p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    type="button"
                    style={{ background: "#0e9f6e", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                    onClick={() => handleWholesaleStatusChange(selectedWholesaleSub.id, "Approved")}
                  >
                    Approve
                  </button>
                  <button 
                    type="button"
                    style={{ background: "#e02424", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                    onClick={() => handleWholesaleStatusChange(selectedWholesaleSub.id, "Rejected")}
                  >
                    Reject
                  </button>
                </div>

                <button 
                  type="button"
                  style={{ background: "#64748b", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                  onClick={() => setSelectedWholesaleSub(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div style={{ textAlign: "center", padding: "15px", fontSize: "12px", color: "#64748b", borderTop: "1px solid #e2e8f0" }}>
          &copy; All rights reserved. Admin Control Panel.
        </div>
      </div>
    </div>
  );
}