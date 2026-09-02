import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { 
  Upload, 
  Trash2, 
  Pencil, 
  X, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Bell, 
  MapPin, 
  Calendar 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

import { useAuth } from "../context/AuthContext";
import {
  fetchCategories,
  fetchMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/products";
import { fetchMerchantOrders } from "../api/orders";
import { uploadImage } from "../api/upload";

import "./MerchantDashboard.css";

const customCategories = [
  { id: "smartphones", name: "Smartphones" },
  { id: "laptops", name: "Laptops" },
  { id: "tvs", name: "TVs" },
  { id: "accessories", name: "Accessories" },
];

const emptyForm = {
  title: "",
  brand: "",
  price: "",
  mrp: "",
  stock: "",
  moq: "1",
  categoryId: "",
  sku: "",
  model: "",
  gstPercent: "18",
  overview: "",
  warranty: "",
  simSlots: "",
  colour: "",
  waterResistant: "",
  securityFeatures: "",
  fastCharging: "",
  networkGen: "",
  screenSize: "",
  weight: "",
  storage: "",
  rearCamera: "",
  frontCamera: "",
  ram: "",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function MerchantDashboard() {
  const { user } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUser = user || storedUser;

  const role = String(currentUser?.role || "").trim().toLowerCase();
  const isMerchant = role === "merchant" || role === "seller" || role === "admin";

  const [activeTab, setActiveTab] = useState("dashboard");

  const [categories, setCategories] = useState(customCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!currentUser || !currentUser.email) {
    return <Navigate to="/login" replace />;
  }

  if (!isMerchant) {
    return <Navigate to="/" replace />;
  }

  const userEmailKey = currentUser?.email ? String(currentUser.email) : "guest";

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setError(null);
        
        let rawOrders = [];
        try {
          const res = await fetchMerchantOrders();
          rawOrders = Array.isArray(res) ? res : res?.data || res?.orders || JSON.parse(localStorage.getItem("orders") || "[]");
        } catch (e) {
          rawOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        }

        if (!Array.isArray(rawOrders)) {
          rawOrders = [rawOrders].filter(Boolean);
        }

        // Resilient mapping checking multiple property names for amounts and IDs
        let finalOrders = rawOrders.map((ord, idx) => {
          const amount = Number(
            ord.totalAmount || 
            ord.total_amount || 
            ord.totalPrice || 
            ord.amount || 
            ord.total || 
            ord.price || 
            0
          );
          const status = String(ord.paymentStatus || ord.status || "Success");
          const orderId = ord.order_id || ord.orderId || ord._id || `JCS-${81670 + idx}`;
          const userName = ord.shippingAddress?.name || ord.user_name || ord.customerName || currentUser.name || "Customer";
          
          return {
            ...ord,
            order_id: orderId,
            total_amount: amount,
            paymentStatus: status,
            user_name: userName,
            gateway: ord.paymentMethod || "JCS Global Cards"
          };
        });

        if (mounted) {
          setOrders(finalOrders);
          
          // Relaxed sum calculation: accounts for orders unless explicitly marked as failed/cancelled
          const sum = finalOrders.reduce((acc, curr) => {
            const rawPay = String(curr.paymentStatus || curr.status || "success").trim().toLowerCase();
            const isFailed = rawPay.includes("fail") || rawPay.includes("cancel") || rawPay.includes("declined");
            return !isFailed ? acc + Number(curr.total_amount || 0) : acc;
          }, 0);
          
          setTotalRevenue(sum);
        }

        const [catResult, prodResult] = await Promise.allSettled([
          fetchCategories(),
          fetchMyProducts(),
        ]);

        if (!mounted) return;

        if (catResult.status === "fulfilled") {
          const rawCats = catResult.value?.data || catResult.value || [];
          setCategories(
            Array.isArray(rawCats) && rawCats.length > 0 ? rawCats : customCategories
          );
        } else {
          setCategories(customCategories);
        }

        if (prodResult.status === "fulfilled") {
          const rawProds = prodResult.value?.data || prodResult.value || [];
          setProducts(Array.isArray(rawProds) ? rawProds : []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        if (!mounted) return;
        setCategories(customCategories);
        setError(err?.response?.data?.message || "Could not load dashboard information.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [userEmailKey]);

  const update = (key) => (e) => {
    setForm((current) => ({
      ...current,
      [key]: e.target.value,
    }));
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          try {
            const res = await uploadImage(file);
            let rawUrl = 
              typeof res === "string" ? res : 
              res?.url || res?.secure_url || res?.data?.url || res?.filePath || res?.path || "";

            if (rawUrl && rawUrl.startsWith("/")) {
              const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
              rawUrl = `${apiBase}${rawUrl}`;
            }

            if (!rawUrl || typeof rawUrl !== "string") {
              rawUrl = URL.createObjectURL(file);
            }

            return rawUrl;
          } catch (apiErr) {
            return URL.createObjectURL(file);
          }
        })
      );

      const validUrls = uploadedUrls.filter(Boolean);
      setImages((previous) => [...previous, ...validUrls]);
    } catch (err) {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (url) => {
    setImages((previous) => previous.filter((image) => image !== url));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setImages([]);
    setEditingId(null);
    setError(null);
  };

  const startEdit = (product) => {
    const realId = product._id || product.id;
    if (!realId) {
      alert("Error: Product identifier missing.");
      return;
    }

    setEditingId(realId);
    setActiveTab("products");

    let catId =
      product.category?.id ||
      product.category?._id ||
      product.categoryId ||
      "";

    if (!catId && product.category) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === String(product.category).toLowerCase()
      );
      if (match) catId = match.id || match._id;
    }

    setForm({
      title: product.title || product.name || "",
      brand: product.brand || "",
      price: product.price ?? "",
      mrp: product.mrp ?? "",
      stock: product.stock ?? "",
      moq: product.moq ?? "1",
      categoryId: catId,
      sku: product.sku || "",
      model: product.model || "",
      gstPercent: product.gstPercent ?? "18",
      overview: product.overview || product.description || "",
      warranty: product.warranty || "",
      simSlots: product.simSlots || "",
      colour: product.colour || "",
      waterResistant: product.waterResistant || "",
      securityFeatures: product.securityFeatures || "",
      fastCharging: product.fastCharging || "",
      networkGen: product.networkGen || "",
      screenSize: product.screenSize || "",
      weight: product.weight || "",
      storage: product.storage || "",
      rearCamera: product.rearCamera || "",
      frontCamera: product.frontCamera || "",
      ram: product.ram || "",
    });

    const existingImages =
      product.images?.length > 0
        ? product.images
        : product.image
        ? [product.image]
        : [];
    setImages(existingImages);
    setError(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError("Add at least one product photo before submitting.");
      return;
    }

    if (!form.categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      setError("Please enter a valid product price.");
      return;
    }

    const payload = {
      ...form,
      title: form.title,
      name: form.title,
      price: Number(form.price),
      mrp: Number(form.mrp) || Number(form.price),
      stock: Number(form.stock) || 0,
      moq: Number(form.moq) || 1,
      gstPercent: Number(form.gstPercent) || 18,
      categoryId: isNaN(Number(form.categoryId))
        ? form.categoryId
        : Number(form.categoryId),
      images,
      image: images[0] || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        const updatedItem = updated?.data || updated;

        setProducts((previous) =>
          previous.map((product) =>
            (product._id || product.id) === editingId ? updatedItem : product
          )
        );
      } else {
        const created = await createProduct(payload);
        const createdItem = created?.data || created;

        setProducts((previous) => [createdItem, ...previous]);
      }

      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not save this listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Remove this listing? This can't be undone.");
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      setProducts((previous) =>
        previous.filter((product) => (product._id || product.id) !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Could not delete this listing.");
    }
  };

  const revenueChartData = orders.map((ord, idx) => ({
    name: ord.order_id ? `#${String(ord.order_id).slice(-5)}` : `Order #${idx + 1}`,
    revenue: Number(ord.total_amount || ord.amount || 0)
  }));

  const categoryCounts = products.reduce((acc, p) => {
    let rawCatId = p.categoryId || p.category?.id || p.category?._id || p.category || "Uncategorized";
    const foundCat = categories.find(
      (c) => String(c.id) === String(rawCatId) || String(c.name).toLowerCase() === String(rawCatId).toLowerCase()
    );
    const catName = foundCat ? foundCat.name : String(rawCatId);
    
    acc[catName] = (acc[catName] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.keys(categoryCounts).length > 0 
    ? Object.keys(categoryCounts).map((key) => ({
        name: key,
        value: categoryCounts[key]
      }))
    : [
        { name: "Smartphones", value: 4 },
        { name: "Laptops", value: 3 },
        { name: "Accessories", value: 6 }
      ];

  return (
    <div className="merchant-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="merchant-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">JC</div>
          <div>
            <span className="brand-name">JCS Global</span>
            <span className="brand-sub">Business</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={16} /> DASHBOARD
          </button>
          <button 
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            <ShoppingBag size={16} /> ORDERS
          </button>
          <button 
            className={`nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            <Package size={16} /> MANAGE PRODUCTS
          </button>
        </nav>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="merchant-main">
        <header className="merchant-header">
          <h2>Merchant Dashboard</h2>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notifications"><Bell size={16} /></button>
            <div className="location-badge">
              <MapPin size={16} />
            </div>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <>
            <section className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon today"><Calendar size={18} /></div>
                <div>
                  <span className="metric-label">Total Revenue</span>
                  <h3 className="metric-value">₹{totalRevenue.toLocaleString("en-IN")}</h3>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon week"><Calendar size={18} /></div>
                <div>
                  <span className="metric-label">Total Orders</span>
                  <h3 className="metric-value">{orders.length}</h3>
                </div>
              </div>
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "15px", marginBottom: "4px" }}>Revenue Overview</h3>
                <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>Incoming sales progression</p>
                <div style={{ width: "100%", height: "240px" }}>
                  <ResponsiveContainer>
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" fontSize={11} stroke="#888" />
                      <YAxis fontSize={11} stroke="#888" />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "15px", marginBottom: "4px" }}>Inventory Distribution</h3>
                <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>Products categorized by type</p>
                <div style={{ width: "100%", height: "240px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={40}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <section className="transactions-section card">
              <div className="tx-header-title">
                <h3>Customer Orders & Delivery Management</h3>
              </div>
              <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>
                Overview of recent customer orders.
              </p>

              <div className="table-responsive">
                <table className="merchant-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Order No</th>
                      <th>Amount</th>
                      <th>Gateway</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord, i) => (
                      <tr key={i}>
                        <td>{ord.user_name}</td>
                        <td>{ord.order_id}</td>
                        <td className="mono">₹{Number(ord.total_amount || 0).toLocaleString("en-IN")}</td>
                        <td>{ord.gateway}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* ORDERS MANAGEMENT TAB */}
        {activeTab === "orders" && (
          <div className="card transactions-section">
            <h3>All Customer Orders ({orders.length})</h3>
            <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>
              View and manage all incoming customer orders.
            </p>
            <div className="table-responsive">
              <table className="merchant-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Customer Name</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((o, idx) => (
                      <tr key={idx}>
                        <td><strong>{o.order_id}</strong></td>
                        <td>{o.user_name}</td>
                        <td className="mono">₹{Number(o.total_amount || 0).toLocaleString("en-IN")}</td>
                        <td><span style={{ color: "#10b981", fontWeight: 500 }}>{o.paymentStatus}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="merchant-empty">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT TAB */}
        {activeTab === "products" && (
          <div className="merchant-grid">
            <form className="card merchant-form" onSubmit={handleSubmit}>
              <h3>{editingId ? "Edit listing" : "Add a new product"}</h3>

              {error && <p className="merchant-error">{error}</p>}

              <div className="field">
                <label>Product title</label>
                <input
                  required
                  value={form.title}
                  onChange={update("title")}
                  placeholder="Enter product title..."
                />
              </div>

              <div className="row">
                <div className="field">
                  <label>Brand</label>
                  <input value={form.brand} onChange={update("brand")} placeholder="Enter brand..." />
                </div>

                <div className="field">
                  <label>Category</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={update("categoryId")}
                  >
                    <option key="default-select" value="">
                      Select category
                    </option>
                    {categories.map((category) => {
                      const catId = category.id || category._id || category.slug;
                      const catName = category.name || category.title;
                      return (
                        <option key={catId} value={catId}>
                          {catName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* SPECIFICATION EXTRA FIELDS ROW 1 */}
              <div className="row">
                <div className="field">
                  <label>Colour</label>
                  <input value={form.colour} onChange={update("colour")} placeholder="" />
                </div>
                <div className="field">
                  <label>Storage Capacity</label>
                  <input value={form.storage} onChange={update("storage")} placeholder="" />
                </div>
              </div>

              {/* SPECIFICATION EXTRA FIELDS ROW 2 */}
              <div className="row">
                <div className="field">
                  <label>RAM</label>
                  <input value={form.ram} onChange={update("ram")} placeholder="" />
                </div>
                <div className="field">
                  <label>Broadband Generation</label>
                  <input value={form.networkGen} onChange={update("networkGen")} placeholder="" />
                </div>
              </div>

              {/* SPECIFICATION EXTRA FIELDS ROW 3 */}
              <div className="row">
                <div className="field">
                  <label>SIM Slots</label>
                  <input value={form.simSlots} onChange={update("simSlots")} placeholder="" />
                </div>
                <div className="field">
                  <label>Screen Size</label>
                  <input value={form.screenSize} onChange={update("screenSize")} placeholder="" />
                </div>
              </div>

              {/* SPECIFICATION EXTRA FIELDS ROW 4 */}
              <div className="row">
                <div className="field">
                  <label>Rear Camera Resolution</label>
                  <input value={form.rearCamera} onChange={update("rearCamera")} placeholder="" />
                </div>
                <div className="field">
                  <label>Front Camera Resolution</label>
                  <input value={form.frontCamera} onChange={update("frontCamera")} placeholder="" />
                </div>
              </div>

              {/* SPECIFICATION EXTRA FIELDS ROW 5 */}
              <div className="row">
                <div className="field">
                  <label>Security Features</label>
                  <input value={form.securityFeatures} onChange={update("securityFeatures")} placeholder="" />
                </div>
                <div className="field">
                  <label>Weight</label>
                  <input value={form.weight} onChange={update("weight")} placeholder="" />
                </div>
              </div>

              {/* SPECIFICATION EXTRA FIELDS ROW 6 */}
              <div className="row">
                <div className="field">
                  <label>Water Resistant</label>
                  <input value={form.waterResistant} onChange={update("waterResistant")} placeholder="" />
                </div>
                <div className="field">
                  <label>With Fast Charging</label>
                  <input value={form.fastCharging} onChange={update("fastCharging")} placeholder="" />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Price (₹)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={update("price")}
                  />
                </div>

                <div className="field">
                  <label>MRP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.mrp}
                    onChange={update("mrp")}
                  />
                </div>
              </div>

              <div className="row">
                <div className="field">
                  <label>Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={update("stock")}
                  />
                </div>

                <div className="field">
                  <label>MOQ</label>
                  <input
                    type="number"
                    min="1"
                    value={form.moq}
                    onChange={update("moq")}
                  />
                </div>
              </div>

              <div className="field">
                <label>Overview / Description</label>
                <textarea
                  rows="3"
                  value={form.overview}
                  onChange={update("overview")}
                  placeholder="Write a brief overview of the product features..."
                />
              </div>

              <div className="field">
                <label>Product photos</label>
                <label className="btn btn-outline merchant-upload-btn">
                  <Upload size={15} />
                  {uploading ? "Uploading…" : "Choose photo(s)"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    hidden
                    disabled={uploading}
                  />
                </label>

                {images.length > 0 && (
                  <div className="merchant-thumbs">
                    {images.map((url) => (
                      <div className="merchant-thumb" key={url}>
                        <img src={url} alt="Product preview" />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="merchant-form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || uploading}
                >
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <div className="merchant-list">
              <h3>Your inventory listings ({products.length})</h3>

              {loading && <p className="merchant-empty">Loading…</p>}

              {!loading && products.length === 0 && (
                <p className="merchant-empty">No listings yet — add your first product.</p>
              )}

              {products.map((product) => {
                const pId = product._id || product.id;
                const displayImg =
                  (product.images && product.images.length > 0 && product.images[0]) ||
                  product.image;

                return (
                  <div className="card merchant-item" key={pId}>
                    {displayImg ? (
                      <img src={displayImg} alt={product.title || product.name} />
                    ) : (
                      <div className="merchant-no-image">No image</div>
                    )}

                    <div className="merchant-item-info">
                      <span className="merchant-item-title">
                        {product.title || product.name}
                      </span>
                      <span className="merchant-item-meta">
                        ₹{Number(product.price || 0).toLocaleString("en-IN")} · Stock {product.stock ?? 0}
                      </span>
                    </div>

                    <div className="merchant-item-actions">
                      <button
                        type="button"
                        onClick={() => startEdit(product)}
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pId)}
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
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