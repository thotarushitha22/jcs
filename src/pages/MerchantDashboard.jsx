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
  Calendar,
  IndianRupee,
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
  Cell,
} from "recharts";

import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

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

const API_BASE = "https://jcs-server-1.onrender.com/api";

const ORDER_STOPS = [
  { status: "PENDING", label: "Order Placed" },
  { status: "PAID", label: "Payment Confirmed" },
  { status: "PROCESSING", label: "Packing in Warehouse" },
  { status: "SHIPPED", label: "Dispatched" },
  { status: "HUB_1", label: "Arrived at hub - Hyderabad" },
  { status: "HUB_2", label: "In transit - Nagpur" },
  { status: "HUB_3", label: "Arrived at hub - Surat" },
  { status: "HUB_4", label: "Arrived at hub - Delhi" },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { status: "DELIVERED", label: "Delivered" },
];

const STATUS_ALIASES = {
  PLACED: "PENDING",
  CONFIRMED: "PROCESSING",
  ACCEPTED: "PROCESSING",
  PACKED: "PROCESSING",
  DISPATCHED: "SHIPPED",
  COMPLETED: "DELIVERED",
};

const normalizeStopStatus = (raw) => {
  const value = String(raw || "PENDING").trim().toUpperCase();
  return STATUS_ALIASES[value] || value;
};

const stopLabel = (raw) => {
  const code = normalizeStopStatus(raw);
  if (code === "CANCELLED") return "Cancelled";
  const stop = ORDER_STOPS.find((s) => s.status === code);
  return stop ? stop.label : code;
};

const customCategories = [
  { id: "smartphones", name: "Smartphones" },
  { id: "laptops", name: "Laptops" },
  { id: "tvs", name: "TVs" },
  { id: "accessories", name: "Accessories" },
];

const emptyForm = {
  title: "", brand: "", price: "", mrp: "", stock: "", moq: "1",
  categoryId: "", sku: "", model: "", gstPercent: "18", overview: "",
  warranty: "", highlights: "", colour: "", storage: "", ram: "",
  networkGen: "", simSlots: "", screenSize: "", rearCamera: "",
  frontCamera: "", securityFeatures: "", weight: "", waterResistant: "",
  fastCharging: "", processor: "", battery: "",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function textToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((i) => String(i).trim()).filter(Boolean);
  return String(value).split(/[,|\n]+/).map((i) => i.trim()).filter(Boolean);
}

function normalizeHighlights(value) {
  if (!value) return [];
  let parsed = value;
  if (typeof parsed === "string") {
    try { parsed = JSON.parse(parsed); } 
    catch {
      return parsed.split(/\n/).map((i) => i.trim()).filter(Boolean).map((text) => ({ icon: "✓", text }));
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => {
    if (typeof item === "string") return { icon: "✓", text: item.trim() };
    return { icon: item?.icon || "✓", text: item?.text || item?.value || item?.title || "" };
  }).filter((item) => item.text);
}

const stripJcs = (id) => String(id ?? "").trim().replace(/^JCS-/i, "");

function orderIdCandidates(ord) {
  const list = [ord?.orderId, ord?.id, ord?.order_id, ord?._id, ord?.orderNumber, ord?.order_number]
    .map(stripJcs).filter(Boolean);
  return [...new Set(list)];
}

function orderProductNames(ord) {
  let items = ord?.items ?? ord?.orderItems ?? ord?.order_items ?? ord?.products ?? ord?.cartItems ?? ord?.cart ?? ord?.lineItems ?? [];
  if (typeof items === "string") { try { items = JSON.parse(items); } catch { items = []; } }
  if (!Array.isArray(items)) items = items ? [items] : [];
  const names = items.map((item) => {
    if (typeof item === "string") return item;
    const name = item?.title || item?.name || item?.productName || item?.product_name || item?.product?.title || item?.product?.name || item?.Product?.title || item?.Product?.name || "";
    const qty = Number(item?.quantity ?? item?.qty ?? 1);
    return name ? (qty > 1 ? `${name} × ${qty}` : name) : "";
  }).filter(Boolean);
  if (names.length === 0) {
    const single = ord?.productName || ord?.productTitle || ord?.product_name || ord?.product?.title || ord?.product?.name || "";
    if (single) names.push(String(single));
  }
  return names;
}

export default function MerchantDashboard() {
  const { user } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = user || storedUser;
  const role = String(currentUser?.role || "").trim().toLowerCase();
  const isMerchant = role === "merchant" || role === "seller" || role === "admin";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [categories, setCategories] = useState(customCategories);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  // Form states
  const [form, setForm] = useState({ ...emptyForm });
  const [images, setImages] = useState([]);
  const [highlightRows, setHighlightRows] = useState([""]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const userEmailKey = currentUser?.email ? String(currentUser.email) : "guest";

  const updateHighlights = (rows) => {
    setHighlightRows(rows);
    setForm((current) => ({ ...current, highlights: rows.map((r) => r.trim()).filter(Boolean).join("\n") }));
  };
  const addHighlight = () => updateHighlights([...highlightRows, ""]);

  useEffect(() => {
    if (!currentUser || !currentUser.email) { setLoading(false); return; }
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
        if (!Array.isArray(rawOrders)) rawOrders = [rawOrders].filter(Boolean);

        const finalOrders = rawOrders.map((ord, idx) => {
          const amount = Number(ord.totalAmount || ord.total_amount || ord.totalPrice || ord.amount || ord.total || ord.price || 0);
          const status = String(ord.paymentStatus || ord.status || "Success");
          const idCandidates = orderIdCandidates(ord);
          const hasRealId = idCandidates.length > 0;
          const orderId = hasRealId ? `JCS-${idCandidates[0]}` : `JCS-${81670 + idx}`;
          const userName = ord.shippingAddress?.name || ord.shippingName || ord.buyer?.name || ord.user_name || ord.customerName || currentUser.name || "Customer";

          return {
            ...ord, order_id: orderId, _ids: idCandidates, local_only: !hasRealId,
            total_amount: amount, paymentStatus: status, user_name: userName,
            gateway: ord.paymentMethod || "JCS Global Cards",
          };
        });

        if (mounted) {
          setOrders(finalOrders);
          const sum = finalOrders.reduce((acc, curr) => {
            const rawPay = String(curr.paymentStatus || curr.status || "success").trim().toLowerCase();
            const isFailed = rawPay.includes("fail") || rawPay.includes("cancel") || rawPay.includes("declined");
            return !isFailed ? acc + Number(curr.total_amount || 0) : acc;
          }, 0);
          setTotalRevenue(sum);
        }

        const [catResult, prodResult] = await Promise.allSettled([fetchCategories(), fetchMyProducts()]);
        if (!mounted) return;

        if (catResult.status === "fulfilled") {
          const rawCats = catResult.value?.data || catResult.value || [];
          setCategories(Array.isArray(rawCats) && rawCats.length > 0 ? rawCats : customCategories);
        } else { setCategories(customCategories); }

        if (prodResult.status === "fulfilled") {
          const rawProds = prodResult.value?.data || prodResult.value || [];
          setProducts(Array.isArray(rawProds) ? rawProds : []);
        } else { setProducts([]); }
      } catch (err) {
        if (!mounted) return;
        setCategories(customCategories);
        setError(err?.response?.data?.message || "Could not load dashboard information.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [userEmailKey]);

  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    setUploading(true); setError(null);
    try {
      const uploadedUrls = await Promise.all(selectedFiles.map(async (file) => {
        try {
          const res = await uploadImage(file);
          let rawUrl = typeof res === "string" ? res : res?.url || res?.secure_url || res?.data?.url || res?.filePath || res?.path || "";
          if (rawUrl && rawUrl.startsWith("/")) {
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
            rawUrl = `${apiBase}${rawUrl}`;
          }
          if (!rawUrl || typeof rawUrl !== "string") rawUrl = URL.createObjectURL(file);
          return rawUrl;
        } catch (apiErr) { return URL.createObjectURL(file); }
      }));
      setImages((previous) => [...previous, ...uploadedUrls.filter(Boolean)]);
    } catch (err) { setError("Image upload failed. Please try again."); } 
    finally { setUploading(false); e.target.value = ""; }
  };

  const removeImage = (url) => setImages((previous) => previous.filter((image) => image !== url));

  const resetForm = () => {
    setForm({ ...emptyForm }); setImages([]); setHighlightRows([""]); setEditingId(null); setError(null);
  };

  const startEdit = (product) => {
    const realId = product._id || product.id;
    if (!realId) { alert("Error: Product identifier missing."); return; }
    setEditingId(realId); setActiveTab("products");

    let catId = product.category?.id || product.category?._id || product.categoryId || "";
    if (!catId && product.category) {
      const match = categories.find((c) => String(c.name).toLowerCase() === String(product.category).toLowerCase());
      if (match) catId = match.id || match._id;
    }

    const existingHighlights = normalizeHighlights(product.highlights);
    const highlightText = existingHighlights.map((item) => item.text).join("\n");
    setHighlightRows(existingHighlights.length > 0 ? existingHighlights.map((item) => item.text) : [""]);

    const variants = product.variants && typeof product.variants === "object" ? product.variants : {};
    const variantStorage = variants.storage || variants.storages || variants.storageCapacity || variants.storageCapacities || variants.gb || "";
    const variantColors = variants.colors || variants.colours || variants.colour || variants.color || variants.colorOptions || variants.colourOptions || "";
    const storageValue = Array.isArray(variantStorage) ? variantStorage.join(", ") : variantStorage || product.storage || "";
    const colourValue = Array.isArray(variantColors) ? variantColors.join(", ") : variantColors || product.colour || product.color || "";

    setForm({
      title: product.title || product.name || "", brand: product.brand || "",
      price: product.price ?? "", mrp: product.mrp ?? "", stock: product.stock ?? "", moq: product.moq ?? "1",
      categoryId: catId, sku: product.sku || "", model: product.model || "", gstPercent: product.gstPercent ?? "18",
      overview: product.overview || product.description || "", warranty: product.warranty || "",
      highlights: highlightText, colour: colourValue, storage: storageValue,
      simSlots: product.simSlots || "", waterResistant: product.waterResistant || "",
      securityFeatures: product.securityFeatures || "", fastCharging: product.fastCharging || "",
      networkGen: product.networkGen || "", screenSize: product.screenSize || "", weight: product.weight || "",
      rearCamera: product.rearCamera || "", frontCamera: product.frontCamera || "",
      ram: product.ram || "", processor: product.processor || "", battery: product.battery || "",
    });

    const existingImages = Array.isArray(product.images) && product.images.length > 0 ? product.images : product.image ? [product.image] : [];
    setImages(existingImages); setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null);
    if (images.length === 0) return setError("Add at least one product photo before submitting.");
    if (!form.categoryId) return setError("Please select a category.");
    if (!form.title.trim()) return setError("Please enter a product title.");
    if (!form.price || Number(form.price) < 0) return setError("Please enter a valid product price.");

    const storageOptions = textToArray(form.storage);
    const colourOptions = textToArray(form.colour);
    const highlightLines = String(form.highlights || "").split(/\n/).map((item) => item.replace(/^[•●*-]\s*/, "").trim()).filter(Boolean);
    const highlights = highlightLines.map((text) => ({ icon: "✓", text }));
    const variants = { storage: storageOptions, colors: colourOptions };
    const numericCategoryId = Number(form.categoryId);
    const categoryId = Number.isNaN(numericCategoryId) ? form.categoryId : numericCategoryId;

    const payload = {
      ...form, title: form.title.trim(), name: form.title.trim(),
      price: Number(form.price), mrp: Number(form.mrp) || Number(form.price),
      stock: Number(form.stock) || 0, moq: Number(form.moq) || 1, gstPercent: Number(form.gstPercent) || 18,
      categoryId, overview: String(form.overview || "").trim(), description: String(form.overview || "").trim(),
      highlights, variants, images, image: images[0] || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        const updatedItem = updated?.data || updated;
        const finalUpdatedItem = { ...updatedItem, ...payload, id: updatedItem?.id || editingId, _id: updatedItem?._id || editingId };
        setProducts((previous) => previous.map((product) => {
          const productId = product._id || product.id;
          return String(productId) === String(editingId) ? finalUpdatedItem : product;
        }));
      } else {
        const created = await createProduct(payload);
        const createdItem = created?.data || created;
        setProducts((previous) => [{ ...createdItem, ...payload }, ...previous]);
      }
      resetForm(); setActiveTab("products");
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Could not save this listing.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this listing? This can't be undone.")) return;
    try {
      await deleteProduct(id);
      setProducts((previous) => previous.filter((product) => {
        const productId = product._id || product.id;
        return String(productId) !== String(id);
      }));
      if (String(editingId) === String(id)) resetForm();
    } catch (err) { alert(err?.response?.data?.message || "Could not delete this listing."); }
  };

  const openTab = (tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const boxKeys = (tab) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTab(tab); } };

  const revenueChartData = orders.map((ord, idx) => ({
    name: ord.order_id ? `#${String(ord.order_id).slice(-5)}` : `Order #${idx + 1}`,
    revenue: Number(ord.total_amount || ord.amount || 0),
  }));

  const categoryCounts = products.reduce((acc, p) => {
    const rawCatId = p.categoryId || p.category?.id || p.category?._id || p.category || "Uncategorized";
    const foundCat = categories.find((c) => String(c.id) === String(rawCatId) || String(c.name).toLowerCase() === String(rawCatId).toLowerCase());
    const catName = foundCat ? foundCat.name : String(rawCatId);
    acc[catName] = (acc[catName] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.keys(categoryCounts).length > 0
    ? Object.keys(categoryCounts).map((key) => ({ name: key, value: categoryCounts[key] }))
    : [{ name: "Smartphones", value: 4 }, { name: "Laptops", value: 3 }, { name: "Accessories", value: 6 }];

  if (!currentUser || !currentUser.email) return <Navigate to="/login" replace />;
  if (!isMerchant) return <Navigate to="/" replace />;

  return (
    <div className="merchant-layout">
      <aside className="merchant-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-icon">MD</div>
          <div>
            <span className="brand-name">Merchant</span>
            <span className="brand-sub">Dashboard</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
            <LayoutDashboard size={16} /> DASHBOARD
          </button>
          <button className={`nav-item ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
            <ShoppingBag size={16} /> ORDERS
          </button>
          <button className={`nav-item ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
            <Package size={16} /> MANAGE PRODUCTS
          </button>
        </nav>
      </aside>

      <main className="merchant-main">
        <header className="merchant-header">
          <h2>Merchant Dashboard</h2>
          <div className="header-actions">
            <button className="icon-btn" aria-label="Notifications"><Bell size={16} /></button>
            <div className="location-badge"><MapPin size={16} /></div>
          </div>
        </header>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <>
            <section className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <div className="metric-card">
                <div className="metric-icon today"><IndianRupee size={18} /></div>
                <div><span className="metric-label">Total Revenue</span><h3 className="metric-value">₹{totalRevenue.toLocaleString("en-IN")}</h3></div>
              </div>
              <div className="metric-card metric-card-link" role="button" tabIndex={0} style={{ cursor: "pointer" }} onClick={() => openTab("orders")} onKeyDown={boxKeys("orders")}>
                <div className="metric-icon week"><ShoppingBag size={18} /></div>
                <div><span className="metric-label">Orders</span><h3 className="metric-value">{orders.length}</h3><span className="metric-hint">View all orders →</span></div>
              </div>
              <div className="metric-card metric-card-link" role="button" tabIndex={0} style={{ cursor: "pointer" }} onClick={() => openTab("products")} onKeyDown={boxKeys("products")}>
                <div className="metric-icon products"><Package size={18} /></div>
                <div><span className="metric-label">Manage Products</span><h3 className="metric-value">{products.length}</h3><span className="metric-hint">Add or edit listings →</span></div>
              </div>
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div className="card" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "15px", marginBottom: "4px" }}>Revenue Overview</h3>
                <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>Incoming sales progression</p>
                <div style={{ width: "100%", height: "240px" }}>
                  <ResponsiveContainer>
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="name" fontSize={11} stroke="#888" /><YAxis fontSize={11} stroke="#888" /><Tooltip />
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
                      <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie><Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <section className="transactions-section card">
              <div className="tx-header-title"><h3>Customer Orders & Delivery Management</h3></div>
              <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>Overview of recent customer orders.</p>
              <div className="table-responsive">
                <table className="merchant-table">
                  <thead><tr><th>Customer Name</th><th>Order No</th><th>Amount</th><th>Gateway</th></tr></thead>
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

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="card transactions-section">
            <h3>All Customer Orders ({orders.length})</h3>
            <p className="text-muted" style={{ fontSize: "12px", marginBottom: "16px" }}>
              View the status of your incoming customer orders. Note: Physical packing and dispatch are handled by the Warehouse and Logistics team.
            </p>

            <div className="table-responsive">
              <table className="merchant-table">
                <thead>
                  <tr>
                    <th>Order Reference</th>
                    <th>Customer Name</th>
                    <th>Product(s)</th>
                    <th>Total Amount</th>
                    <th>Payment Status</th>
                    <th>Order Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((o, idx) => {
                      const current = normalizeStopStatus(o.status);
                      const isCancelled = current === "CANCELLED";
                      
                      return (
                        <tr key={idx}>
                          <td><strong>{o.order_id}</strong></td>
                          <td>{o.user_name}</td>
                          <td style={{ maxWidth: "260px" }}>
                            {orderProductNames(o).length > 0
                              ? orderProductNames(o).map((name, n) => <div key={n} style={{ fontSize: "13px" }}>{name}</div>)
                              : "—"}
                          </td>
                          <td className="mono">₹{Number(o.total_amount || 0).toLocaleString("en-IN")}</td>
                          <td>
                            <span style={{ color: "#10b981", fontWeight: 500 }}>{o.paymentStatus}</span>
                          </td>
                          
                          {/* UPDATED FULFILMENT COLUMN */}
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span 
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  width: "fit-content",
                                  textTransform: "uppercase",
                                  backgroundColor: isCancelled ? "#fef2f2" : ["PENDING", "PAID"].includes(current) ? "#fef3c7" : current === "PROCESSING" ? "#e0e7ff" : "#dcfce7",
                                  color: isCancelled ? "#dc2626" : ["PENDING", "PAID"].includes(current) ? "#b45309" : current === "PROCESSING" ? "#4338ca" : "#16a34a"
                                }}
                              >
                                {stopLabel(current)}
                              </span>
                              
                              {["PENDING", "PAID"].includes(current) && (
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Warehouse is packing</span>
                              )}
                              {current === "PROCESSING" && (
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Ready for dispatch</span>
                              )}
                              {!["PENDING", "PAID", "PROCESSING", "CANCELLED"].includes(current) && (
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Handled by Logistics</span>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="6" className="merchant-empty">No orders found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div className="merchant-grid">
            <form className="card merchant-form" onSubmit={handleSubmit}>
              <h3>{editingId ? "Edit listing" : "Add a new product"}</h3>
              {error && <p className="merchant-error">{error}</p>}

              <div className="field"><label>Product title</label><input required value={form.title} onChange={update("title")} placeholder="Enter product title..." /></div>

              <div className="row">
                <div className="field"><label>Brand</label><input value={form.brand} onChange={update("brand")} placeholder="Enter brand..." /></div>
                <div className="field">
                  <label>Category</label>
                  <select required value={form.categoryId} onChange={update("categoryId")}>
                    <option value="">Select category</option>
                    {categories.map((category) => {
                      const catId = category.id || category._id || category.slug;
                      const catName = category.name || category.title;
                      return <option key={catId} value={catId}>{catName}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="field"><label>Colour Options</label><input value={form.colour} onChange={update("colour")} placeholder="Midnight Black, Ocean Blue, Pearl White" /><small>Enter multiple colours separated by comma.</small></div>
                <div className="field"><label>Storage Capacity</label><input value={form.storage} onChange={update("storage")} placeholder="4/128 GB, 8/128 GB, 8/256 GB" /><small>Enter multiple storage options separated by comma.</small></div>
              </div>

              <div className="row">
                <div className="field"><label>RAM</label><input value={form.ram} onChange={update("ram")} placeholder="8 GB" /></div>
                <div className="field"><label>Broadband Generation</label><input value={form.networkGen} onChange={update("networkGen")} placeholder="5G / Wi-Fi 6" /></div>
              </div>

              <div className="row">
                <div className="field"><label>SIM Slots</label><input value={form.simSlots} onChange={update("simSlots")} placeholder="Dual SIM" /></div>
                <div className="field"><label>Screen Size</label><input value={form.screenSize} onChange={update("screenSize")} placeholder='10.9 inch' /></div>
              </div>

              <div className="row">
                <div className="field"><label>Rear Camera Resolution</label><input value={form.rearCamera} onChange={update("rearCamera")} placeholder="50MP Rear Camera" /></div>
                <div className="field"><label>Front Camera Resolution</label><input value={form.frontCamera} onChange={update("frontCamera")} placeholder="13MP Front Camera" /></div>
              </div>

              <div className="row">
                <div className="field"><label>Security Features</label><input value={form.securityFeatures} onChange={update("securityFeatures")} placeholder="Face Unlock / Fingerprint" /></div>
                <div className="field"><label>Weight</label><input value={form.weight} onChange={update("weight")} placeholder="523 g" /></div>
              </div>

              <div className="row">
                <div className="field"><label>Water Resistant</label><input value={form.waterResistant} onChange={update("waterResistant")} placeholder="IP68" /></div>
                <div className="field"><label>With Fast Charging</label><input value={form.fastCharging} onChange={update("fastCharging")} placeholder="45W Fast Charging" /></div>
              </div>

              <div className="row">
                <div className="field"><label>Processor</label><input value={form.processor} onChange={update("processor")} placeholder="Exynos / Snapdragon / Intel..." /></div>
                <div className="field"><label>Battery</label><input value={form.battery} onChange={update("battery")} placeholder="8000 mAh" /></div>
              </div>

              <div className="row">
                <div className="field"><label>Price (₹)</label><input required type="number" min="0" value={form.price} onChange={update("price")} placeholder="27999" /></div>
                <div className="field"><label>MRP (₹)</label><input type="number" min="0" value={form.mrp} onChange={update("mrp")} placeholder="32999" /></div>
              </div>

              <div className="row">
                <div className="field"><label>Stock</label><input type="number" min="0" value={form.stock} onChange={update("stock")} placeholder="88" /></div>
                <div className="field"><label>MOQ</label><input type="number" min="1" value={form.moq} onChange={update("moq")} placeholder="1" /></div>
              </div>

              <div className="row">
                <div className="field"><label>SKU</label><input value={form.sku} onChange={update("sku")} placeholder="JCS-P6-TABS9FE" /></div>
                <div className="field"><label>Model</label><input value={form.model} onChange={update("model")} placeholder="SM-X510" /></div>
              </div>

              <div className="row">
                <div className="field"><label>GST (%)</label><input type="number" min="0" value={form.gstPercent} onChange={update("gstPercent")} /></div>
                <div className="field"><label>Warranty</label><input value={form.warranty} onChange={update("warranty")} placeholder="1 Year Manufacturer Warranty" /></div>
              </div>

              <div className="field">
                <label>Product Highlights</label>
                <div className="highlight-list">
                  {highlightRows.map((row, index) => (
                    <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input style={{ flex: 1 }} value={row} placeholder={index === 0 ? "e.g. 10.9 inch display" : "Add another highlight"} onChange={(e) => updateHighlights(highlightRows.map((r, i) => i === index ? e.target.value : r))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }} />
                      {highlightRows.length > 1 && <button type="button" className="btn btn-outline" aria-label="Remove highlight" onClick={() => updateHighlights(highlightRows.filter((_, i) => i !== index))}><X size={14} /></button>}
                    </div>
                  ))}
                  <button type="button" className="btn btn-outline" onClick={addHighlight}>+ Add highlight</button>
                </div>
                <small>Click “+ Add highlight” for each point. These will appear in Product Details.</small>
              </div>

              <div className="field">
                <label>Overview / Description</label>
                <textarea rows="6" value={form.overview} onChange={update("overview")} placeholder="Write a detailed overview of the product, features, performance and usage..." />
                <small>This text will appear under Overview / Description on Product Details.</small>
              </div>

              <div className="field">
                <label>Product photos</label>
                <label className="btn btn-outline merchant-upload-btn">
                  <Upload size={15} /> {uploading ? "Uploading…" : "Choose photo(s)"}
                  <input type="file" accept="image/*" multiple onChange={handleFileSelect} hidden disabled={uploading} />
                </label>
                {images.length > 0 && (
                  <div className="merchant-thumbs">
                    {images.map((url, index) => (
                      <div className="merchant-thumb" key={`${url}-${index}`}>
                        <img src={url} alt={`Product preview ${index + 1}`} />
                        <button type="button" onClick={() => removeImage(url)} aria-label="Remove image"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="merchant-form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
                </button>
                {editingId && <button type="button" className="btn btn-outline" onClick={resetForm} disabled={saving}>Cancel edit</button>}
              </div>
            </form>

            <div className="merchant-list">
              <h3>Your inventory listings ({products.length})</h3>
              {loading && <p className="merchant-empty">Loading…</p>}
              {!loading && products.length === 0 && <p className="merchant-empty">No listings yet — add your first product.</p>}
              {products.map((product) => {
                const pId = product._id || product.id;
                const displayImg = product.images && product.images.length > 0 ? product.images[0] : product.image;
                return (
                  <div className="card merchant-item" key={pId}>
                    {displayImg ? <img src={displayImg} alt={product.title || product.name || "Product"} /> : <div className="merchant-no-image">No image</div>}
                    <div className="merchant-item-info">
                      <span className="merchant-item-title">{product.title || product.name}</span>
                      <span className="merchant-item-meta">₹{Number(product.price || 0).toLocaleString("en-IN")} {" · "} Stock {product.stock ?? 0}</span>
                      {normalizeHighlights(product.highlights).length > 0 && (
                        <span className="merchant-item-meta" style={{ marginTop: "4px" }}>{normalizeHighlights(product.highlights).length} product highlights</span>
                      )}
                    </div>
                    <div className="merchant-item-actions">
                      <button type="button" onClick={() => startEdit(product)} aria-label="Edit"><Pencil size={15} /></button>
                      <button type="button" onClick={() => handleDelete(pId)} aria-label="Delete"><Trash2 size={15} /></button>
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