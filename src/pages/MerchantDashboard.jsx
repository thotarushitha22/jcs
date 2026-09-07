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

/* =========================================================
   DEFAULT CATEGORIES
========================================================= */

const customCategories = [
  {
    id: "smartphones",
    name: "Smartphones",
  },
  {
    id: "laptops",
    name: "Laptops",
  },
  {
    id: "tvs",
    name: "TVs",
  },
  {
    id: "accessories",
    name: "Accessories",
  },
];

/* =========================================================
   EMPTY PRODUCT FORM
========================================================= */

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

/* =========================================================
   CHART COLORS
========================================================= */

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

/* =========================================================
   COMPONENT
========================================================= */

export default function MerchantDashboard() {
  const { user } = useAuth();

  /* =======================================================
     USER
  ======================================================= */

  let storedUser = {};

  try {
    storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    storedUser = {};
  }

  const currentUser = user || storedUser;

  const role = String(
    currentUser?.role || ""
  )
    .trim()
    .toLowerCase();

  const isMerchant =
    role === "merchant" ||
    role === "seller" ||
    role === "admin";

  /* =======================================================
     STATE
  ======================================================= */

  const [activeTab, setActiveTab] =
    useState("dashboard");

  const [categories, setCategories] =
    useState(customCategories);

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [orders, setOrders] =
    useState([]);

  const [totalRevenue, setTotalRevenue] =
    useState(0);

  const [form, setForm] =
    useState(emptyForm);

  const [images, setImages] =
    useState([]);

  const [uploading, setUploading] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState(null);

  /* =======================================================
     USER KEY
  ======================================================= */

  const userEmailKey =
    currentUser?.email
      ? String(currentUser.email)
      : "guest";

  /* =======================================================
     LOAD DASHBOARD
     
     IMPORTANT:
     useEffect MUST be before conditional returns.
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        /* =================================================
           ORDERS
        ================================================= */

        let rawOrders = [];

        try {
          const result =
            await fetchMerchantOrders();

          if (Array.isArray(result)) {
            rawOrders = result;
          } else if (
            Array.isArray(result?.orders)
          ) {
            rawOrders = result.orders;
          } else if (
            Array.isArray(result?.data)
          ) {
            rawOrders = result.data;
          } else {
            rawOrders = [];
          }
        } catch (orderError) {
          console.warn(
            "Orders API failed:",
            orderError
          );

          try {
            rawOrders = JSON.parse(
              localStorage.getItem(
                "orders"
              ) || "[]"
            );
          } catch {
            rawOrders = [];
          }
        }

        if (!Array.isArray(rawOrders)) {
          rawOrders = [];
        }

        const finalOrders =
          rawOrders.map(
            (ord, idx) => {
              const amount = Number(
                ord.totalAmount ||
                  ord.total_amount ||
                  ord.totalPrice ||
                  ord.amount ||
                  ord.total ||
                  ord.price ||
                  0
              );

              const status = String(
                ord.paymentStatus ||
                  ord.status ||
                  "Success"
              );

              const orderId =
                ord.order_id ||
                ord.orderId ||
                ord._id ||
                `JCS-${81670 + idx}`;

              const userName =
                ord.shippingAddress
                  ?.name ||
                ord.user_name ||
                ord.customerName ||
                "Customer";

              return {
                ...ord,

                order_id:
                  orderId,

                total_amount:
                  amount,

                paymentStatus:
                  status,

                user_name:
                  userName,

                gateway:
                  ord.paymentMethod ||
                  "JCS Global Cards",
              };
            }
          );

        if (!mounted) {
          return;
        }

        setOrders(finalOrders);

        /* =================================================
           REVENUE
        ================================================= */

        const revenue =
          finalOrders.reduce(
            (total, order) => {
              const status =
                String(
                  order.paymentStatus ||
                    order.status ||
                    "success"
                )
                  .trim()
                  .toLowerCase();

              const failed =
                status.includes("fail") ||
                status.includes("cancel") ||
                status.includes(
                  "declined"
                );

              if (failed) {
                return total;
              }

              return (
                total +
                Number(
                  order.total_amount || 0
                )
              );
            },
            0
          );

        setTotalRevenue(revenue);

        /* =================================================
           CATEGORIES + MERCHANT PRODUCTS
        ================================================= */

        const [
          categoryResult,
          productResult,
        ] = await Promise.allSettled([
          fetchCategories(),
          fetchMyProducts(),
        ]);

        if (!mounted) {
          return;
        }

        /* =================================================
           CATEGORIES
        ================================================= */

        if (
          categoryResult.status ===
          "fulfilled"
        ) {
          const categoryResponse =
            categoryResult.value;

          const categoryList =
            Array.isArray(
              categoryResponse
            )
              ? categoryResponse
              : categoryResponse
                  ?.categories ||
                categoryResponse?.data ||
                [];

          if (
            Array.isArray(categoryList) &&
            categoryList.length > 0
          ) {
            setCategories(
              categoryList
            );
          } else {
            setCategories(
              customCategories
            );
          }
        } else {
          setCategories(
            customCategories
          );
        }

        /* =================================================
           MERCHANT PRODUCTS
        ================================================= */

        if (
          productResult.status ===
          "fulfilled"
        ) {
          const productResponse =
            productResult.value;

          let productList = [];

          if (
            Array.isArray(
              productResponse
            )
          ) {
            productList =
              productResponse;
          } else if (
            Array.isArray(
              productResponse?.products
            )
          ) {
            productList =
              productResponse.products;
          } else if (
            Array.isArray(
              productResponse?.data
            )
          ) {
            productList =
              productResponse.data;
          }

          console.log(
            "MY MERCHANT PRODUCTS:",
            productList
          );

          setProducts(
            Array.isArray(productList)
              ? productList
              : []
          );
        } else {
          console.error(
            "Merchant products failed:",
            productResult.reason
          );

          setProducts([]);
        }
      } catch (dashboardError) {
        console.error(
          "Dashboard loading error:",
          dashboardError
        );

        if (!mounted) {
          return;
        }

        setError(
          dashboardError?.response
            ?.data?.message ||
            "Could not load dashboard information."
        );
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

  /* =======================================================
     REDIRECTS
  ======================================================= */

  if (
    !currentUser ||
    !currentUser.email
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isMerchant) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /* =======================================================
     FORM UPDATE
  ======================================================= */

  const update = (key) => (e) => {
    setForm((current) => ({
      ...current,
      [key]: e.target.value,
    }));
  };

  /* =======================================================
     IMAGE UPLOAD
  ======================================================= */

  const handleFileSelect = async (
    e
  ) => {
    const selectedFiles =
      Array.from(
        e.target.files || []
      );

    if (
      selectedFiles.length === 0
    ) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedUrls =
        await Promise.all(
          selectedFiles.map(
            async (file) => {
              try {
                const result =
                  await uploadImage(
                    file
                  );

                let url =
                  typeof result ===
                  "string"
                    ? result
                    : result?.url ||
                      result?.secure_url ||
                      result?.data?.url ||
                      result?.filePath ||
                      result?.path ||
                      "";

                if (
                  url &&
                  url.startsWith("/")
                ) {
                  const base =
                    import.meta.env
                      .VITE_API_URL ||
                    "https://jcs-server-1.onrender.com";

                  const cleanBase =
                    base.replace(
                      /\/+$/,
                      ""
                    );

                  url =
                    `${cleanBase}${url}`;
                }

                if (!url) {
                  url =
                    URL.createObjectURL(
                      file
                    );
                }

                return url;
              } catch (uploadError) {
                console.error(
                  "Image upload error:",
                  uploadError
                );

                return URL.createObjectURL(
                  file
                );
              }
            }
          )
        );

      const validUrls =
        uploadedUrls.filter(
          Boolean
        );

      setImages(
        (previous) => [
          ...previous,
          ...validUrls,
        ]
      );
    } catch (uploadError) {
      console.error(
        "Image upload failed:",
        uploadError
      );

      setError(
        "Image upload failed. Please try again."
      );
    } finally {
      setUploading(false);

      e.target.value = "";
    }
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage = (
    imageUrl
  ) => {
    setImages(
      (previous) =>
        previous.filter(
          (image) =>
            image !== imageUrl
        )
    );
  };

  /* =======================================================
     RESET FORM
  ======================================================= */

  const resetForm = () => {
    setForm({
      ...emptyForm,
    });

    setImages([]);

    setEditingId(null);

    setError(null);
  };

  /* =======================================================
     EDIT PRODUCT
  ======================================================= */

  const startEdit = (
    product
  ) => {
    const productId =
      product?._id ||
      product?.id;

    if (!productId) {
      alert(
        "Error: Product identifier missing."
      );

      return;
    }

    console.log(
      "Editing product:",
      product
    );

    setEditingId(
      productId
    );

    setActiveTab(
      "products"
    );

    /* =====================================================
       CATEGORY
    ===================================================== */

    let categoryId =
      product?.categoryId ||
      product?.category?.id ||
      product?.category?._id ||
      "";

    if (
      !categoryId &&
      typeof product?.category ===
        "string"
    ) {
      const foundCategory =
        categories.find(
          (category) =>
            String(
              category.name || ""
            ).toLowerCase() ===
            String(
              product.category
            ).toLowerCase()
        );

      if (foundCategory) {
        categoryId =
          foundCategory.id ||
          foundCategory._id ||
          foundCategory.slug;
      }
    }

    /* =====================================================
       IMAGES
    ===================================================== */

    let existingImages = [];

    if (
      Array.isArray(
        product?.images
      )
    ) {
      existingImages =
        product.images.filter(
          Boolean
        );
    } else if (
      typeof product?.images ===
      "string"
    ) {
      try {
        const parsed =
          JSON.parse(
            product.images
          );

        if (
          Array.isArray(parsed)
        ) {
          existingImages =
            parsed.filter(
              Boolean
            );
        }
      } catch {
        existingImages = [];
      }
    }

    if (
      existingImages.length ===
        0 &&
      product?.image
    ) {
      existingImages = [
        product.image,
      ];
    }

    /* =====================================================
       FORM
    ===================================================== */

    setForm({
      title:
        product?.title ||
        product?.name ||
        "",

      brand:
        product?.brand || "",

      price:
        product?.price ?? "",

      mrp:
        product?.mrp ?? "",

      stock:
        product?.stock ?? "",

      moq:
        product?.moq ?? "1",

      categoryId:
        categoryId,

      sku:
        product?.sku || "",

      model:
        product?.model || "",

      gstPercent:
        product?.gstPercent ??
        product?.gst ??
        "18",

      overview:
        product?.overview ||
        product?.description ||
        "",

      warranty:
        product?.warranty || "",

      simSlots:
        product?.simSlots || "",

      colour:
        product?.colour ||
        product?.color ||
        "",

      waterResistant:
        product?.waterResistant ||
        "",

      securityFeatures:
        product?.securityFeatures ||
        "",

      fastCharging:
        product?.fastCharging ||
        "",

      networkGen:
        product?.networkGen ||
        product?.broadbandGeneration ||
        "",

      screenSize:
        product?.screenSize ||
        "",

      weight:
        product?.weight || "",

      storage:
        product?.storage ||
        product?.storageCapacity ||
        "",

      rearCamera:
        product?.rearCamera ||
        product?.rearCameraResolution ||
        "",

      frontCamera:
        product?.frontCamera ||
        product?.frontCameraResolution ||
        "",

      ram:
        product?.ram || "",
    });

    setImages(
      existingImages
    );

    setError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =======================================================
     SUBMIT PRODUCT
  ======================================================= */

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    setError(null);

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      images.length === 0
    ) {
      setError(
        "Add at least one product photo before submitting."
      );

      return;
    }

    if (
      !form.categoryId
    ) {
      setError(
        "Please select a category."
      );

      return;
    }

    if (
      !form.title.trim()
    ) {
      setError(
        "Product title is required."
      );

      return;
    }

    if (
      !form.price ||
      Number(form.price) < 0
    ) {
      setError(
        "Please enter a valid product price."
      );

      return;
    }

    /* =====================================================
       PAYLOAD
       
       Backend expects:
       title
       price
       stock
       category
       brand
       description
       image
       merchantId
    ===================================================== */

    const payload = {
      title:
        form.title.trim(),

      name:
        form.title.trim(),

      brand:
        form.brand.trim(),

      price:
        Number(form.price),

      mrp:
        Number(form.mrp) ||
        Number(form.price),

      stock:
        Number(form.stock) || 0,

      moq:
        Number(form.moq) || 1,

      categoryId:
        form.categoryId,

      // IMPORTANT backend field
      category:
        form.categoryId,

      sku:
        form.sku,

      model:
        form.model,

      gstPercent:
        Number(
          form.gstPercent
        ) || 18,

      overview:
        form.overview,

      // IMPORTANT backend field
      description:
        form.overview,

      warranty:
        form.warranty,

      simSlots:
        form.simSlots,

      colour:
        form.colour,

      waterResistant:
        form.waterResistant,

      securityFeatures:
        form.securityFeatures,

      fastCharging:
        form.fastCharging,

      networkGen:
        form.networkGen,

      screenSize:
        form.screenSize,

      weight:
        form.weight,

      storage:
        form.storage,

      rearCamera:
        form.rearCamera,

      frontCamera:
        form.frontCamera,

      ram:
        form.ram,

      images:
        images,

      // IMPORTANT backend field
      image:
        images[0] || null,
    };

    console.log(
      "Submitting product:",
      payload
    );

    setSaving(true);

    try {
      /* ===================================================
         UPDATE
      =================================================== */

      if (editingId) {
        const response =
          await updateProduct(
            editingId,
            payload
          );

        console.log(
          "Update response:",
          response
        );

        const updatedProduct =
          response?.product ||
          response?.data?.product ||
          response?.data ||
          response;

        if (
          !updatedProduct ||
          typeof updatedProduct !==
            "object"
        ) {
          throw new Error(
            "Invalid product returned by server."
          );
        }

        setProducts(
          (previous) =>
            previous.map(
              (product) => {
                const id =
                  product?._id ||
                  product?.id;

                return String(
                  id
                ) ===
                  String(
                    editingId
                  )
                  ? updatedProduct
                  : product;
              }
            )
        );

        alert(
          response?.message ||
            "Product updated successfully."
        );
      }

      /* ===================================================
         CREATE
      =================================================== */

      else {
        const response =
          await createProduct(
            payload
          );

        console.log(
          "Create response:",
          response
        );

        const createdProduct =
          response?.product ||
          response?.data?.product ||
          response?.data ||
          response;

        if (
          !createdProduct ||
          typeof createdProduct !==
            "object"
        ) {
          throw new Error(
            "Invalid product returned by server."
          );
        }

        setProducts(
          (previous) => [
            createdProduct,
            ...previous,
          ]
        );

        alert(
          response?.message ||
            "Product added successfully."
        );
      }

      resetForm();
    } catch (saveError) {
      console.error(
        "Product save error:",
        saveError
      );

      setError(
        saveError?.response
          ?.data?.message ||
          saveError?.message ||
          "Could not save this listing."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  const handleDelete = async (
    id
  ) => {
    if (!id) {
      alert(
        "Product ID is missing."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Remove this listing? This can't be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      console.log(
        "Deleting product:",
        id
      );

      await deleteProduct(
        id
      );

      setProducts(
        (previous) =>
          previous.filter(
            (product) => {
              const productId =
                product?._id ||
                product?.id;

              return (
                String(
                  productId
                ) !==
                String(id)
              );
            }
          )
      );

      if (
        String(editingId) ===
        String(id)
      ) {
        resetForm();
      }

      alert(
        "Product deleted successfully."
      );
    } catch (deleteError) {
      console.error(
        "Delete product error:",
        deleteError
      );

      alert(
        deleteError?.response
          ?.data?.message ||
          "Could not delete this listing."
      );
    }
  };

  /* =======================================================
     REVENUE CHART
  ======================================================= */

  const revenueChartData =
    orders.map(
      (order, index) => ({
        name: order.order_id
          ? `#${String(
              order.order_id
            ).slice(-5)}`
          : `Order #${
              index + 1
            }`,

        revenue:
          Number(
            order.total_amount ||
              order.amount ||
              0
          ),
      })
    );

  /* =======================================================
     CATEGORY COUNTS
  ======================================================= */

  const categoryCounts =
    products.reduce(
      (acc, product) => {
        const rawCategory =
          product?.categoryId ||
          product?.category?.id ||
          product?.category?._id ||
          product?.category ||
          "Uncategorized";

        const foundCategory =
          categories.find(
            (category) =>
              String(
                category.id ||
                  category._id ||
                  category.slug
              ) ===
                String(
                  rawCategory
                ) ||
              String(
                category.name || ""
              ).toLowerCase() ===
                String(
                  rawCategory
                ).toLowerCase()
          );

        const categoryName =
          foundCategory
            ? foundCategory.name
            : String(
                rawCategory
              );

        acc[
          categoryName
        ] =
          (acc[
            categoryName
          ] || 0) + 1;

        return acc;
      },
      {}
    );

  const pieChartData =
    Object.keys(
      categoryCounts
    ).length > 0
      ? Object.keys(
          categoryCounts
        ).map(
          (name) => ({
            name,
            value:
              categoryCounts[
                name
              ],
          })
        )
      : [];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="merchant-layout">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="merchant-sidebar">

        <div className="sidebar-brand">

          <div className="brand-logo-icon">
            JC
          </div>

          <div>
            <span className="brand-name">
              JCS Global
            </span>

            <span className="brand-sub">
              Business
            </span>
          </div>

        </div>

        <nav className="sidebar-nav">

          <button
            className={`nav-item ${
              activeTab ===
              "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                "dashboard"
              )
            }
          >
            <LayoutDashboard
              size={16}
            />

            DASHBOARD
          </button>

          <button
            className={`nav-item ${
              activeTab ===
              "orders"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                "orders"
              )
            }
          >
            <ShoppingBag
              size={16}
            />

            ORDERS
          </button>

          <button
            className={`nav-item ${
              activeTab ===
              "products"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveTab(
                "products"
              )
            }
          >
            <Package size={16} />

            MANAGE PRODUCTS
          </button>

        </nav>
      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="merchant-main">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="merchant-header">

          <h2>
            Merchant Dashboard
          </h2>

          <div className="header-actions">

            <button
              className="icon-btn"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>

            <div className="location-badge">
              <MapPin size={16} />
            </div>

          </div>

        </header>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activeTab ===
          "dashboard" && (
          <>
            <section className="metrics-grid">

              <div className="metric-card">

                <div className="metric-icon today">
                  <Calendar
                    size={18}
                  />
                </div>

                <div>
                  <span className="metric-label">
                    Total Revenue
                  </span>

                  <h3 className="metric-value">
                    ₹
                    {totalRevenue.toLocaleString(
                      "en-IN"
                    )}
                  </h3>
                </div>

              </div>

              <div className="metric-card">

                <div className="metric-icon week">
                  <Calendar
                    size={18}
                  />
                </div>

                <div>
                  <span className="metric-label">
                    Total Orders
                  </span>

                  <h3 className="metric-value">
                    {orders.length}
                  </h3>
                </div>

              </div>

              <div className="metric-card">

                <div className="metric-icon week">
                  <Package
                    size={18}
                  />
                </div>

                <div>
                  <span className="metric-label">
                    My Products
                  </span>

                  <h3 className="metric-value">
                    {products.length}
                  </h3>
                </div>

              </div>

            </section>

            {/* =============================================
                CHARTS
            ============================================= */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
                marginBottom:
                  "24px",
              }}
            >

              <div
                className="card"
                style={{
                  padding: "20px",
                }}
              >

                <h3
                  style={{
                    fontSize:
                      "15px",
                    marginBottom:
                      "4px",
                  }}
                >
                  Revenue Overview
                </h3>

                <p
                  className="text-muted"
                  style={{
                    fontSize:
                      "12px",
                    marginBottom:
                      "16px",
                  }}
                >
                  Incoming sales progression
                </p>

                <div
                  style={{
                    width:
                      "100%",
                    height:
                      "240px",
                  }}
                >

                  <ResponsiveContainer>

                    <AreaChart
                      data={
                        revenueChartData
                      }
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0,
                      }}
                    >

                      <defs>

                        <linearGradient
                          id="colorRev"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={
                              0.8
                            }
                          />

                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={
                              0
                            }
                          />
                        </linearGradient>

                      </defs>

                      <XAxis
                        dataKey="name"
                        fontSize={11}
                        stroke="#888"
                      />

                      <YAxis
                        fontSize={11}
                        stroke="#888"
                      />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorRev)"
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                </div>

              </div>

              <div
                className="card"
                style={{
                  padding: "20px",
                }}
              >

                <h3
                  style={{
                    fontSize:
                      "15px",
                    marginBottom:
                      "4px",
                  }}
                >
                  Inventory Distribution
                </h3>

                <p
                  className="text-muted"
                  style={{
                    fontSize:
                      "12px",
                    marginBottom:
                      "16px",
                  }}
                >
                  Products categorized by type
                </p>

                <div
                  style={{
                    width:
                      "100%",
                    height:
                      "240px",
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
                  }}
                >

                  {pieChartData.length >
                  0 ? (
                    <ResponsiveContainer>

                      <PieChart>

                        <Pie
                          data={
                            pieChartData
                          }
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={40}
                          label={({
                            name,
                            percent,
                          }) =>
                            `${name}: ${(
                              percent *
                              100
                            ).toFixed(
                              0
                            )}%`
                          }
                        >

                          {pieChartData.map(
                            (
                              entry,
                              index
                            ) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  CHART_COLORS[
                                    index %
                                      CHART_COLORS.length
                                  ]
                                }
                              />
                            )
                          )}

                        </Pie>

                        <Tooltip />

                      </PieChart>

                    </ResponsiveContainer>
                  ) : (
                    <p className="merchant-empty">
                      No products yet.
                    </p>
                  )}

                </div>

              </div>

            </div>

            {/* =============================================
                ORDERS
            ============================================= */}

            <section className="transactions-section card">

              <div className="tx-header-title">
                <h3>
                  Customer Orders &
                  Delivery Management
                </h3>
              </div>

              <p
                className="text-muted"
                style={{
                  fontSize:
                    "12px",
                  marginBottom:
                    "16px",
                }}
              >
                Overview of recent customer orders.
              </p>

              <div className="table-responsive">

                <table className="merchant-table">

                  <thead>
                    <tr>
                      <th>
                        Customer Name
                      </th>

                      <th>
                        Order No
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Gateway
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {orders.length >
                    0 ? (
                      orders.map(
                        (
                          order,
                          index
                        ) => (
                          <tr
                            key={
                              order.order_id ||
                              index
                            }
                          >

                            <td>
                              {
                                order.user_name
                              }
                            </td>

                            <td>
                              {
                                order.order_id
                              }
                            </td>

                            <td className="mono">
                              ₹
                              {Number(
                                order.total_amount ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </td>

                            <td>
                              {
                                order.gateway
                              }
                            </td>

                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="merchant-empty"
                        >
                          No orders found.
                        </td>
                      </tr>
                    )}

                  </tbody>

                </table>

              </div>

            </section>
          </>
        )}

        {/* =================================================
            ORDERS TAB
        ================================================= */}

        {activeTab ===
          "orders" && (
          <div className="card transactions-section">

            <h3>
              All Customer Orders (
              {orders.length})
            </h3>

            <p
              className="text-muted"
              style={{
                fontSize:
                  "12px",
                marginBottom:
                  "16px",
              }}
            >
              View and manage all incoming customer orders.
            </p>

            <div className="table-responsive">

              <table className="merchant-table">

                <thead>

                  <tr>

                    <th>
                      Order Reference
                    </th>

                    <th>
                      Customer Name
                    </th>

                    <th>
                      Total Amount
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {orders.length >
                  0 ? (
                    orders.map(
                      (
                        order,
                        index
                      ) => (
                        <tr
                          key={
                            order.order_id ||
                            index
                          }
                        >

                          <td>
                            <strong>
                              {
                                order.order_id
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              order.user_name
                            }
                          </td>

                          <td className="mono">
                            ₹
                            {Number(
                              order.total_amount ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          <td>
                            <span
                              style={{
                                color:
                                  "#10b981",
                                fontWeight:
                                  500,
                              }}
                            >
                              {
                                order.paymentStatus
                              }
                            </span>
                          </td>

                        </tr>
                      )
                    )
                  ) : (
                    <tr>

                      <td
                        colSpan="4"
                        className="merchant-empty"
                      >
                        No orders found.
                      </td>

                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

        {/* =================================================
            PRODUCTS TAB
        ================================================= */}

        {activeTab ===
          "products" && (
          <div className="merchant-grid">

            {/* =============================================
                PRODUCT FORM
            ============================================= */}

            <form
              className="card merchant-form"
              onSubmit={
                handleSubmit
              }
            >

              <h3>
                {editingId
                  ? "Edit listing"
                  : "Add a new product"}
              </h3>

              {error && (
                <p className="merchant-error">
                  {error}
                </p>
              )}

              {/* TITLE */}

              <div className="field">

                <label>
                  Product title
                </label>

                <input
                  required
                  value={
                    form.title
                  }
                  onChange={update(
                    "title"
                  )}
                  placeholder="Enter product title..."
                />

              </div>

              {/* BRAND / CATEGORY */}

              <div className="row">

                <div className="field">

                  <label>
                    Brand
                  </label>

                  <input
                    value={
                      form.brand
                    }
                    onChange={update(
                      "brand"
                    )}
                    placeholder="Enter brand..."
                  />

                </div>

                <div className="field">

                  <label>
                    Category
                  </label>

                  <select
                    required
                    value={
                      form.categoryId
                    }
                    onChange={update(
                      "categoryId"
                    )}
                  >

                    <option
                      value=""
                    >
                      Select category
                    </option>

                    {categories.map(
                      (
                        category
                      ) => {

                        const id =
                          category.id ||
                          category._id ||
                          category.slug;

                        const name =
                          category.name ||
                          category.title;

                        return (
                          <option
                            key={id}
                            value={id}
                          >
                            {name}
                          </option>
                        );
                      }
                    )}

                  </select>

                </div>

              </div>

              {/* COLOUR / STORAGE */}

              <div className="row">

                <div className="field">

                  <label>
                    Colour
                  </label>

                  <input
                    value={
                      form.colour
                    }
                    onChange={update(
                      "colour"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    Storage Capacity
                  </label>

                  <input
                    value={
                      form.storage
                    }
                    onChange={update(
                      "storage"
                    )}
                  />

                </div>

              </div>

              {/* RAM / NETWORK */}

              <div className="row">

                <div className="field">

                  <label>
                    RAM
                  </label>

                  <input
                    value={
                      form.ram
                    }
                    onChange={update(
                      "ram"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    Broadband Generation
                  </label>

                  <input
                    value={
                      form.networkGen
                    }
                    onChange={update(
                      "networkGen"
                    )}
                  />

                </div>

              </div>

              {/* SIM / SCREEN */}

              <div className="row">

                <div className="field">

                  <label>
                    SIM Slots
                  </label>

                  <input
                    value={
                      form.simSlots
                    }
                    onChange={update(
                      "simSlots"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    Screen Size
                  </label>

                  <input
                    value={
                      form.screenSize
                    }
                    onChange={update(
                      "screenSize"
                    )}
                  />

                </div>

              </div>

              {/* REAR / FRONT CAMERA */}

              <div className="row">

                <div className="field">

                  <label>
                    Rear Camera Resolution
                  </label>

                  <input
                    value={
                      form.rearCamera
                    }
                    onChange={update(
                      "rearCamera"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    Front Camera Resolution
                  </label>

                  <input
                    value={
                      form.frontCamera
                    }
                    onChange={update(
                      "frontCamera"
                    )}
                  />

                </div>

              </div>

              {/* SECURITY / WEIGHT */}

              <div className="row">

                <div className="field">

                  <label>
                    Security Features
                  </label>

                  <input
                    value={
                      form.securityFeatures
                    }
                    onChange={update(
                      "securityFeatures"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    Weight
                  </label>

                  <input
                    value={
                      form.weight
                    }
                    onChange={update(
                      "weight"
                    )}
                  />

                </div>

              </div>

              {/* WATER / FAST CHARGING */}

              <div className="row">

                <div className="field">

                  <label>
                    Water Resistant
                  </label>

                  <input
                    value={
                      form.waterResistant
                    }
                    onChange={update(
                      "waterResistant"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    With Fast Charging
                  </label>

                  <input
                    value={
                      form.fastCharging
                    }
                    onChange={update(
                      "fastCharging"
                    )}
                  />

                </div>

              </div>

              {/* PRICE / MRP */}

              <div className="row">

                <div className="field">

                  <label>
                    Price (₹)
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    value={
                      form.price
                    }
                    onChange={update(
                      "price"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    MRP (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.mrp
                    }
                    onChange={update(
                      "mrp"
                    )}
                  />

                </div>

              </div>

              {/* STOCK / MOQ */}

              <div className="row">

                <div className="field">

                  <label>
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.stock
                    }
                    onChange={update(
                      "stock"
                    )}
                  />

                </div>

                <div className="field">

                  <label>
                    MOQ
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={
                      form.moq
                    }
                    onChange={update(
                      "moq"
                    )}
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="field">

                <label>
                  Overview / Description
                </label>

                <textarea
                  rows="3"
                  value={
                    form.overview
                  }
                  onChange={update(
                    "overview"
                  )}
                  placeholder="Write a brief overview of the product features..."
                />

              </div>

              {/* PHOTOS */}

              <div className="field">

                <label>
                  Product photos
                </label>

                <label className="btn btn-outline merchant-upload-btn">

                  <Upload
                    size={15}
                  />

                  {uploading
                    ? "Uploading…"
                    : "Choose photo(s)"}

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={
                      uploading
                    }
                    onChange={
                      handleFileSelect
                    }
                  />

                </label>

                {images.length >
                  0 && (
                  <div className="merchant-thumbs">

                    {images.map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          className="merchant-thumb"
                          key={`${image}-${index}`}
                        >

                          <img
                            src={image}
                            alt="Product preview"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                image
                              )
                            }
                            aria-label="Remove image"
                          >
                            <X
                              size={12}
                            />
                          </button>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

              {/* FORM BUTTONS */}

              <div className="merchant-form-actions">

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    saving ||
                    uploading
                  }
                >
                  {saving
                    ? "Saving…"
                    : editingId
                    ? "Save changes"
                    : "Add product"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={
                      resetForm
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel edit
                  </button>
                )}

              </div>

            </form>

            {/* =============================================
                INVENTORY LIST
            ============================================= */}

            <div className="merchant-list">

              <h3>
                Your inventory listings (
                {products.length})
              </h3>

              {loading && (
                <p className="merchant-empty">
                  Loading your products…
                </p>
              )}

              {!loading &&
                products.length ===
                  0 && (
                  <div className="card merchant-empty">

                    <Package
                      size={30}
                    />

                    <p>
                      No listings yet —
                      add your first
                      product.
                    </p>

                  </div>
                )}

              {!loading &&
                products.length >
                  0 &&
                products.map(
                  (product) => {
                    const productId =
                      product?._id ||
                      product?.id;

                    let displayImage =
                      "";

                    if (
                      Array.isArray(
                        product?.images
                      ) &&
                      product.images
                        .length >
                        0
                    ) {
                      displayImage =
                        product.images[0];
                    }

                    if (
                      !displayImage &&
                      typeof product?.images ===
                        "string"
                    ) {
                      try {
                        const parsed =
                          JSON.parse(
                            product.images
                          );

                        if (
                          Array.isArray(
                            parsed
                          ) &&
                          parsed.length >
                            0
                        ) {
                          displayImage =
                            parsed[0];
                        }
                      } catch {
                        displayImage =
                          "";
                      }
                    }

                    if (
                      !displayImage
                    ) {
                      displayImage =
                        product?.image ||
                        product?.image_url ||
                        product?.imageUrl ||
                        "";
                    }

                    return (
                      <div
                        className="card merchant-item"
                        key={
                          productId
                        }
                      >

                        {/* IMAGE */}

                        {displayImage ? (
                          <img
                            src={
                              displayImage
                            }
                            alt={
                              product?.title ||
                              product?.name ||
                              "Product"
                            }
                          />
                        ) : (
                          <div className="merchant-no-image">
                            No image
                          </div>
                        )}

                        {/* INFORMATION */}

                        <div className="merchant-item-info">

                          <span className="merchant-item-title">

                            {product?.title ||
                              product?.name ||
                              "Untitled product"}

                          </span>

                          <span className="merchant-item-meta">

                            ₹
                            {Number(
                              product?.price ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}

                            {" · "}

                            Stock{" "}
                            {product?.stock ??
                              0}

                          </span>

                          {/* APPROVAL STATUS */}

                          {product?.approvalStatus && (
                            <span
                              style={{
                                display:
                                  "inline-block",
                                marginTop:
                                  "5px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "600",
                                color:
                                  String(
                                    product.approvalStatus
                                  ).toUpperCase() ===
                                  "APPROVED"
                                    ? "#10b981"
                                    : String(
                                        product.approvalStatus
                                      ).toUpperCase() ===
                                      "REJECTED"
                                    ? "#ef4444"
                                    : "#f59e0b",
                              }}
                            >
                              {String(
                                product.approvalStatus
                              ).toUpperCase()}
                            </span>
                          )}

                        </div>

                        {/* ACTIONS */}

                        <div className="merchant-item-actions">

                          <button
                            type="button"
                            onClick={() =>
                              startEdit(
                                product
                              )
                            }
                            aria-label="Edit product"
                            title="Edit product"
                          >
                            <Pencil
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                productId
                              )
                            }
                            aria-label="Delete product"
                            title="Delete product"
                          >
                            <Trash2
                              size={15}
                            />
                          </button>

                        </div>

                      </div>
                    );
                  }
                )}

            </div>

          </div>
        )}

      </main>
    </div>
  );
}