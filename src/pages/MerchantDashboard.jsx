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
   CUSTOM CATEGORIES
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

  /*
    Main product description
  */
  overview: "",

  /*
    Warranty
  */
  warranty: "",

  /*
    Product highlights.

    Enter one highlight per line.
  */
  highlights: "",

  /*
    Product variants.

    These can contain multiple values separated
    by comma or new line.
  */
  colour: "",
  storage: "",

  /*
    Specifications
  */
  ram: "",
  networkGen: "",
  simSlots: "",
  screenSize: "",
  rearCamera: "",
  frontCamera: "",
  securityFeatures: "",
  weight: "",
  waterResistant: "",
  fastCharging: "",
  processor: "",
  battery: "",
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
   HELPER
   CONVERT TEXT TO ARRAY

   Example:

   "128GB, 256GB"

   becomes:

   ["128GB", "256GB"]

   Also supports:

   128GB
   256GB
========================================================= */

function textToArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[,|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}


/* =========================================================
   HELPER
   NORMALIZE EXISTING HIGHLIGHTS

   Supports:

   ["8GB RAM", "128GB Storage"]

   OR

   [
     { text: "8GB RAM", icon: "✓" }
   ]

   OR

   JSON string.
========================================================= */

function normalizeHighlights(value) {
  if (!value) {
    return [];
  }

  let parsed = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return parsed
        .split(/\n/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text) => ({
          icon: "✓",
          text,
        }));
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (typeof item === "string") {
        return {
          icon: "✓",
          text: item.trim(),
        };
      }

      return {
        icon: item?.icon || "✓",
        text:
          item?.text ||
          item?.value ||
          item?.title ||
          "",
      };
    })
    .filter((item) => item.text);
}


/* =========================================================
   COMPONENT
========================================================= */

export default function MerchantDashboard() {
  const { user } = useAuth();

  const storedUser = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const currentUser =
    user || storedUser;


  /* =======================================================
     USER / ROLE
  ======================================================= */

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
     TABS
  ======================================================= */

  const [activeTab, setActiveTab] =
    useState("dashboard");


  /* =======================================================
     PRODUCTS / CATEGORIES
  ======================================================= */

  const [categories, setCategories] =
    useState(customCategories);

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  /* =======================================================
     ORDERS
  ======================================================= */

  const [orders, setOrders] =
    useState([]);

  const [totalRevenue, setTotalRevenue] =
    useState(0);


  /* =======================================================
     PRODUCT FORM
  ======================================================= */

  const [form, setForm] =
    useState({
      ...emptyForm,
    });

  const [images, setImages] =
    useState([]);


  /* =======================================================
     PRODUCT ACTION STATES
  ======================================================= */

  const [uploading, setUploading] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState(null);


  /* =======================================================
     USER EMAIL KEY
  ======================================================= */

  const userEmailKey =
    currentUser?.email
      ? String(currentUser.email)
      : "guest";


  /* =========================================================
     LOAD DASHBOARD DATA
  ========================================================= */

  useEffect(() => {
    /*
      Do not attempt API requests when
      there is no logged-in user.
    */

    if (
      !currentUser ||
      !currentUser.email
    ) {
      setLoading(false);
      return;
    }

    let mounted = true;


    const loadData = async () => {
      try {
        setError(null);


        /* =================================================
           LOAD ORDERS
        ================================================= */

        let rawOrders = [];

        try {
          const res =
            await fetchMerchantOrders();

          rawOrders =
            Array.isArray(res)
              ? res
              : res?.data ||
                res?.orders ||
                JSON.parse(
                  localStorage.getItem(
                    "orders"
                  ) || "[]"
                );

        } catch (e) {
          rawOrders =
            JSON.parse(
              localStorage.getItem(
                "orders"
              ) || "[]"
            );
        }


        if (!Array.isArray(rawOrders)) {
          rawOrders = [
            rawOrders,
          ].filter(Boolean);
        }


        /* =================================================
           NORMALIZE ORDERS
        ================================================= */

        const finalOrders =
          rawOrders.map(
            (ord, idx) => {

              const amount =
                Number(
                  ord.totalAmount ||
                    ord.total_amount ||
                    ord.totalPrice ||
                    ord.amount ||
                    ord.total ||
                    ord.price ||
                    0
                );


              const status =
                String(
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
                currentUser.name ||
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


        if (mounted) {
          setOrders(
            finalOrders
          );


          /* ===============================================
             TOTAL REVENUE
          =============================================== */

          const sum =
            finalOrders.reduce(
              (acc, curr) => {

                const rawPay =
                  String(
                    curr.paymentStatus ||
                      curr.status ||
                      "success"
                  )
                    .trim()
                    .toLowerCase();


                const isFailed =
                  rawPay.includes(
                    "fail"
                  ) ||
                  rawPay.includes(
                    "cancel"
                  ) ||
                  rawPay.includes(
                    "declined"
                  );


                return !isFailed
                  ? acc +
                      Number(
                        curr.total_amount ||
                          0
                      )
                  : acc;

              },
              0
            );


          setTotalRevenue(sum);
        }


        /* =================================================
           LOAD CATEGORIES + PRODUCTS
        ================================================= */

        const [
          catResult,
          prodResult,
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
          catResult.status ===
          "fulfilled"
        ) {
          const rawCats =
            catResult.value?.data ||
            catResult.value ||
            [];


          setCategories(
            Array.isArray(rawCats) &&
              rawCats.length > 0
              ? rawCats
              : customCategories
          );

        } else {
          setCategories(
            customCategories
          );
        }


        /* =================================================
           PRODUCTS
        ================================================= */

        if (
          prodResult.status ===
          "fulfilled"
        ) {
          const rawProds =
            prodResult.value?.data ||
            prodResult.value ||
            [];


          setProducts(
            Array.isArray(rawProds)
              ? rawProds
              : []
          );

        } else {
          setProducts([]);
        }

      } catch (err) {

        if (!mounted) {
          return;
        }

        setCategories(
          customCategories
        );

        setError(
          err?.response?.data
            ?.message ||
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


  /* =========================================================
     UPDATE FORM
  ========================================================= */

  const update =
    (key) =>
    (e) => {

      setForm(
        (current) => ({
          ...current,
          [key]:
            e.target.value,
        })
      );

    };


  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  const handleFileSelect =
    async (e) => {

      const selectedFiles =
        Array.from(
          e.target.files || []
        );


      if (
        selectedFiles.length ===
        0
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

                  const res =
                    await uploadImage(
                      file
                    );


                  let rawUrl =
                    typeof res ===
                    "string"
                      ? res
                      : res?.url ||
                        res?.secure_url ||
                        res?.data?.url ||
                        res?.filePath ||
                        res?.path ||
                        "";


                  /*
                    If backend returns a
                    relative path, convert
                    it to absolute API URL.
                  */

                  if (
                    rawUrl &&
                    rawUrl.startsWith(
                      "/"
                    )
                  ) {

                    const apiBase =
                      import.meta.env
                        .VITE_API_URL ||
                      "http://localhost:5000";


                    rawUrl =
                      `${apiBase}${rawUrl}`;
                  }


                  /*
                    Fallback local preview
                  */

                  if (
                    !rawUrl ||
                    typeof rawUrl !==
                      "string"
                  ) {

                    rawUrl =
                      URL.createObjectURL(
                        file
                      );
                  }


                  return rawUrl;

                } catch (
                  apiErr
                ) {

                  /*
                    Local preview if
                    upload API fails.
                  */

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

      } catch (err) {

        setError(
          "Image upload failed. Please try again."
        );

      } finally {

        setUploading(false);

        /*
          Allows selecting the
          same file again.
        */

        e.target.value = "";
      }

    };


  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

  const removeImage = (
    url
  ) => {

    setImages(
      (previous) =>
        previous.filter(
          (image) =>
            image !== url
        )
    );

  };


  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {

    setForm({
      ...emptyForm,
    });

    setImages([]);

    setEditingId(null);

    setError(null);

  };


  /* =========================================================
     EDIT PRODUCT
  ========================================================= */

  const startEdit =
    (product) => {

      const realId =
        product._id ||
        product.id;


      if (!realId) {

        alert(
          "Error: Product identifier missing."
        );

        return;
      }


      setEditingId(realId);

      setActiveTab(
        "products"
      );


      /* =================================================
         CATEGORY
      ================================================= */

      let catId =
        product.category?.id ||
        product.category?._id ||
        product.categoryId ||
        "";


      if (
        !catId &&
        product.category
      ) {

        const match =
          categories.find(
            (c) =>
              String(
                c.name
              ).toLowerCase() ===
              String(
                product.category
              ).toLowerCase()
          );


        if (match) {
          catId =
            match.id ||
            match._id;
        }

      }


      /* =================================================
         HIGHLIGHTS
      ================================================= */

      const existingHighlights =
        normalizeHighlights(
          product.highlights
        );


      const highlightText =
        existingHighlights
          .map(
            (item) =>
              item.text
          )
          .join("\n");


      /* =================================================
         VARIANTS
      ================================================= */

      const variants =
        product.variants &&
        typeof product.variants ===
          "object"
          ? product.variants
          : {};


      const variantStorage =
        variants.storage ||
        variants.storages ||
        variants.storageCapacity ||
        variants.storageCapacities ||
        variants.gb ||
        "";


      const variantColors =
        variants.colors ||
        variants.colours ||
        variants.colour ||
        variants.color ||
        variants.colorOptions ||
        variants.colourOptions ||
        "";


      /*
        If variants do not exist,
        use direct product fields.
      */

      const storageValue =
        Array.isArray(
          variantStorage
        )
          ? variantStorage.join(
              ", "
            )
          : variantStorage ||
            product.storage ||
            "";


      const colourValue =
        Array.isArray(
          variantColors
        )
          ? variantColors.join(
              ", "
            )
          : variantColors ||
            product.colour ||
            product.color ||
            "";


      /* =================================================
         SET FORM
      ================================================= */

      setForm({

        title:
          product.title ||
          product.name ||
          "",


        brand:
          product.brand ||
          "",


        price:
          product.price ??
          "",


        mrp:
          product.mrp ??
          "",


        stock:
          product.stock ??
          "",


        moq:
          product.moq ??
          "1",


        categoryId:
          catId,


        sku:
          product.sku ||
          "",


        model:
          product.model ||
          "",


        gstPercent:
          product.gstPercent ??
          "18",


        /*
          Overview
        */

        overview:
          product.overview ||
          product.description ||
          "",


        /*
          Warranty
        */

        warranty:
          product.warranty ||
          "",


        /*
          Merchant highlights
        */

        highlights:
          highlightText,


        /*
          Variants
        */

        colour:
          colourValue,


        storage:
          storageValue,


        /*
          Specifications
        */

        simSlots:
          product.simSlots ||
          "",


        waterResistant:
          product.waterResistant ||
          "",


        securityFeatures:
          product.securityFeatures ||
          "",


        fastCharging:
          product.fastCharging ||
          "",


        networkGen:
          product.networkGen ||
          "",


        screenSize:
          product.screenSize ||
          "",


        weight:
          product.weight ||
          "",


        rearCamera:
          product.rearCamera ||
          "",


        frontCamera:
          product.frontCamera ||
          "",


        ram:
          product.ram ||
          "",


        processor:
          product.processor ||
          "",


        battery:
          product.battery ||
          "",

      });


      /* =================================================
         EXISTING IMAGES
      ================================================= */

      const existingImages =
        Array.isArray(
          product.images
        ) &&
        product.images.length >
          0
          ? product.images
          : product.image
          ? [product.image]
          : [];


      setImages(
        existingImages
      );


      setError(null);


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    };


  /* =========================================================
     SUBMIT PRODUCT
  ========================================================= */

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      setError(null);


      /* =================================================
         VALIDATION
      ================================================= */

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
          "Please enter a product title."
        );

        return;
      }


      if (
        !form.price ||
        Number(form.price) <
          0
      ) {

        setError(
          "Please enter a valid product price."
        );

        return;
      }


      /* =================================================
         STORAGE OPTIONS
      ================================================= */

      const storageOptions =
        textToArray(
          form.storage
        );


      /* =================================================
         COLOUR OPTIONS
      ================================================= */

      const colourOptions =
        textToArray(
          form.colour
        );


      /* =================================================
         PRODUCT HIGHLIGHTS
      ================================================= */

      const highlightLines =
        String(
          form.highlights || ""
        )
          .split(/\n/)
          .map(
            (item) =>
              item
                .replace(
                  /^[•●*-]\s*/,
                  ""
                )
                .trim()
          )
          .filter(Boolean);


      const highlights =
        highlightLines.map(
          (text) => ({
            icon: "✓",
            text,
          })
        );


      /* =================================================
         VARIANTS OBJECT
      ================================================= */

      const variants = {
        storage:
          storageOptions,

        colors:
          colourOptions,
      };


      /* =================================================
         CATEGORY ID
      ================================================= */

      const numericCategoryId =
        Number(
          form.categoryId
        );


      const categoryId =
        Number.isNaN(
          numericCategoryId
        )
          ? form.categoryId
          : numericCategoryId;


      /* =================================================
         FINAL PAYLOAD
      ================================================= */

      const payload = {

        /*
          Existing fields
        */

        ...form,


        /*
          Product title
        */

        title:
          form.title.trim(),

        name:
          form.title.trim(),


        /*
          Price
        */

        price:
          Number(
            form.price
          ),


        mrp:
          Number(form.mrp) ||
          Number(form.price),


        /*
          Inventory
        */

        stock:
          Number(
            form.stock
          ) || 0,


        moq:
          Number(
            form.moq
          ) || 1,


        /*
          GST
        */

        gstPercent:
          Number(
            form.gstPercent
          ) || 18,


        /*
          Category
        */

        categoryId,


        /*
          =================================================
          OVERVIEW
          =================================================
        */

        overview:
          String(
            form.overview || ""
          ).trim(),


        /*
          =================================================
          DESCRIPTION
          =================================================

          Save the same merchant overview
          into description as well.

          This makes ProductDetail compatible
          with either field.
        */

        description:
          String(
            form.overview || ""
          ).trim(),


        /*
          =================================================
          HIGHLIGHTS
          =================================================
        */

        highlights,


        /*
          =================================================
          VARIANTS
          =================================================
        */

        variants,


        /*
          =================================================
          IMAGES
          =================================================
        */

        images,

        image:
          images[0] ||
          null,

      };


      console.log(
        "Submitting merchant product:",
        payload
      );


      setSaving(true);


      try {

        /* =================================================
           UPDATE
        ================================================= */

        if (editingId) {

          const updated =
            await updateProduct(
              editingId,
              payload
            );


          const updatedItem =
            updated?.data ||
            updated;


          /*
            Merge payload into the
            local response as a fallback
            if backend does not return
            all newly-added fields.
          */

          const finalUpdatedItem = {
            ...updatedItem,

            ...payload,

            id:
              updatedItem?.id ||
              editingId,

            _id:
              updatedItem?._id ||
              editingId,
          };


          setProducts(
            (previous) =>
              previous.map(
                (product) => {

                  const productId =
                    product._id ||
                    product.id;


                  return String(
                    productId
                  ) ===
                    String(
                      editingId
                    )
                    ? finalUpdatedItem
                    : product;

                }
              )
          );


        } else {

          /* =================================================
             CREATE
          ================================================= */

          const created =
            await createProduct(
              payload
            );


          const createdItem =
            created?.data ||
            created;


          const finalCreatedItem = {
            ...createdItem,

            ...payload,
          };


          setProducts(
            (previous) => [
              finalCreatedItem,
              ...previous,
            ]
          );

        }


        /*
          Reset form after successful
          create/update.
        */

        resetForm();


        /*
          Stay on products tab.
        */

        setActiveTab(
          "products"
        );


      } catch (err) {

        console.error(
          "Product save error:",
          err
        );


        setError(
          err?.response?.data
            ?.message ||
            err?.response?.data
              ?.error ||
            err?.message ||
            "Could not save this listing."
        );

      } finally {

        setSaving(false);

      }

    };


  /* =========================================================
     DELETE PRODUCT
  ========================================================= */

  const handleDelete =
    async (id) => {

      const confirmed =
        window.confirm(
          "Remove this listing? This can't be undone."
        );


      if (!confirmed) {
        return;
      }


      try {

        await deleteProduct(
          id
        );


        setProducts(
          (previous) =>
            previous.filter(
              (product) => {

                const productId =
                  product._id ||
                  product.id;


                return String(
                  productId
                ) !==
                  String(id);

              }
            )
        );


        if (
          String(
            editingId
          ) ===
          String(id)
        ) {

          resetForm();

        }

      } catch (err) {

        alert(
          err?.response?.data
            ?.message ||
            "Could not delete this listing."
        );

      }

    };


  /* =========================================================
     REVENUE CHART DATA
  ========================================================= */

  const revenueChartData =
    orders.map(
      (ord, idx) => ({

        name:
          ord.order_id
            ? `#${String(
                ord.order_id
              ).slice(-5)}`
            : `Order #${
                idx + 1
              }`,

        revenue:
          Number(
            ord.total_amount ||
              ord.amount ||
              0
          ),

      })
    );


  /* =========================================================
     CATEGORY COUNTS
  ========================================================= */

  const categoryCounts =
    products.reduce(
      (acc, p) => {

        const rawCatId =
          p.categoryId ||
          p.category?.id ||
          p.category?._id ||
          p.category ||
          "Uncategorized";


        const foundCat =
          categories.find(
            (c) =>
              String(c.id) ===
                String(
                  rawCatId
                ) ||
              String(
                c.name
              ).toLowerCase() ===
                String(
                  rawCatId
                ).toLowerCase()
          );


        const catName =
          foundCat
            ? foundCat.name
            : String(
                rawCatId
              );


        acc[catName] =
          (acc[catName] || 0) +
          1;


        return acc;

      },
      {}
    );


  /* =========================================================
     PIE CHART DATA
  ========================================================= */

  const pieChartData =
    Object.keys(
      categoryCounts
    ).length > 0

      ? Object.keys(
          categoryCounts
        ).map(
          (key) => ({
            name: key,
            value:
              categoryCounts[
                key
              ],
          })
        )

      : [
          {
            name: "Smartphones",
            value: 4,
          },
          {
            name: "Laptops",
            value: 3,
          },
          {
            name: "Accessories",
            value: 6,
          },
        ];


  /* =========================================================
     LOGIN REDIRECT
  ========================================================= */

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


  /* =========================================================
     ROLE REDIRECT
  ========================================================= */

  if (!isMerchant) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="merchant-layout">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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

            <Package
              size={16}
            />

            MANAGE PRODUCTS

          </button>

        </nav>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="merchant-main">

        {/* ===================================================
            HEADER
        =================================================== */}

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


        {/* ===================================================
            DASHBOARD TAB
        =================================================== */}

        {activeTab ===
          "dashboard" && (

          <>

            {/* =================================================
                METRICS
            ================================================= */}

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

            </section>


            {/* =================================================
                CHARTS
            ================================================= */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
                marginBottom:
                  "24px",
              }}
            >

              {/* =================================================
                  REVENUE
              ================================================= */}

              <div
                className="card"
                style={{
                  padding:
                    "20px",
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
                        fontSize={
                          11
                        }
                        stroke="#888"
                      />


                      <YAxis
                        fontSize={
                          11
                        }
                        stroke="#888"
                      />


                      <Tooltip />


                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3b82f6"
                        fillOpacity={
                          1
                        }
                        fill="url(#colorRev)"
                      />

                    </AreaChart>

                  </ResponsiveContainer>

                </div>

              </div>


              {/* =================================================
                  INVENTORY
              ================================================= */}

              <div
                className="card"
                style={{
                  padding:
                    "20px",
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
                        outerRadius={
                          75
                        }
                        innerRadius={
                          40
                        }
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

                </div>

              </div>

            </div>


            {/* =================================================
                TRANSACTIONS
            ================================================= */}

            <section className="transactions-section card">

              <div className="tx-header-title">

                <h3>
                  Customer Orders & Delivery Management
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

                    {orders.map(
                      (
                        ord,
                        i
                      ) => (

                        <tr
                          key={i}
                        >

                          <td>
                            {
                              ord.user_name
                            }
                          </td>

                          <td>
                            {
                              ord.order_id
                            }
                          </td>

                          <td className="mono">
                            ₹
                            {Number(
                              ord.total_amount ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          <td>
                            {
                              ord.gateway
                            }
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </>

        )}


        {/* ===================================================
            ORDERS TAB
        =================================================== */}

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
                        o,
                        idx
                      ) => (

                        <tr
                          key={
                            idx
                          }
                        >

                          <td>
                            <strong>
                              {
                                o.order_id
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              o.user_name
                            }
                          </td>

                          <td className="mono">
                            ₹
                            {Number(
                              o.total_amount ||
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
                                o.paymentStatus
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


        {/* ===================================================
            PRODUCTS MANAGEMENT
        =================================================== */}

        {activeTab ===
          "products" && (

          <div className="merchant-grid">

            {/* =================================================
                PRODUCT FORM
            ================================================= */}

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


              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <p className="merchant-error">
                  {error}
                </p>
              )}


              {/* =================================================
                  PRODUCT TITLE
              ================================================= */}

              <div className="field">

                <label>
                  Product title
                </label>

                <input
                  required
                  value={
                    form.title
                  }
                  onChange={
                    update(
                      "title"
                    )
                  }
                  placeholder="Enter product title..."
                />

              </div>


              {/* =================================================
                  BRAND + CATEGORY
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    Brand
                  </label>

                  <input
                    value={
                      form.brand
                    }
                    onChange={
                      update(
                        "brand"
                      )
                    }
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
                    onChange={
                      update(
                        "categoryId"
                      )
                    }
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

                        const catId =
                          category.id ||
                          category._id ||
                          category.slug;


                        const catName =
                          category.name ||
                          category.title;


                        return (

                          <option
                            key={
                              catId
                            }
                            value={
                              catId
                            }
                          >
                            {
                              catName
                            }
                          </option>

                        );

                      }
                    )}

                  </select>

                </div>

              </div>


              {/* =================================================
                  COLOUR + STORAGE
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    Colour Options
                  </label>

                  <input
                    value={
                      form.colour
                    }
                    onChange={
                      update(
                        "colour"
                      )
                    }
                    placeholder="Midnight Black, Ocean Blue, Pearl White"
                  />

                  <small>
                    Enter multiple colours separated by comma.
                  </small>

                </div>


                <div className="field">

                  <label>
                    Storage Capacity
                  </label>

                  <input
                    value={
                      form.storage
                    }
                    onChange={
                      update(
                        "storage"
                      )
                    }
                    placeholder="4/128 GB, 8/128 GB, 8/256 GB"
                  />

                  <small>
                    Enter multiple storage options separated by comma.
                  </small>

                </div>

              </div>


              {/* =================================================
                  RAM + NETWORK
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    RAM
                  </label>

                  <input
                    value={
                      form.ram
                    }
                    onChange={
                      update(
                        "ram"
                      )
                    }
                    placeholder="8 GB"
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
                    onChange={
                      update(
                        "networkGen"
                      )
                    }
                    placeholder="5G / Wi-Fi 6"
                  />

                </div>

              </div>


              {/* =================================================
                  SIM + SCREEN
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    SIM Slots
                  </label>

                  <input
                    value={
                      form.simSlots
                    }
                    onChange={
                      update(
                        "simSlots"
                      )
                    }
                    placeholder="Dual SIM"
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
                    onChange={
                      update(
                        "screenSize"
                      )
                    }
                    placeholder='10.9 inch'
                  />

                </div>

              </div>


              {/* =================================================
                  REAR + FRONT CAMERA
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    Rear Camera Resolution
                  </label>

                  <input
                    value={
                      form.rearCamera
                    }
                    onChange={
                      update(
                        "rearCamera"
                      )
                    }
                    placeholder="50MP Rear Camera"
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
                    onChange={
                      update(
                        "frontCamera"
                      )
                    }
                    placeholder="13MP Front Camera"
                  />

                </div>

              </div>


              {/* =================================================
                  SECURITY + WEIGHT
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    Security Features
                  </label>

                  <input
                    value={
                      form.securityFeatures
                    }
                    onChange={
                      update(
                        "securityFeatures"
                      )
                    }
                    placeholder="Face Unlock / Fingerprint"
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
                    onChange={
                      update(
                        "weight"
                      )
                    }
                    placeholder="523 g"
                  />

                </div>

              </div>


              {/* =================================================
                  WATER + FAST CHARGING
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    Water Resistant
                  </label>

                  <input
                    value={
                      form.waterResistant
                    }
                    onChange={
                      update(
                        "waterResistant"
                      )
                    }
                    placeholder="IP68"
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
                    onChange={
                      update(
                        "fastCharging"
                      )
                    }
                    placeholder="45W Fast Charging"
                  />

                </div>

              </div>


              {/* =================================================
                  PROCESSOR + BATTERY
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    Processor
                  </label>

                  <input
                    value={
                      form.processor
                    }
                    onChange={
                      update(
                        "processor"
                      )
                    }
                    placeholder="Exynos / Snapdragon / Intel..."
                  />

                </div>


                <div className="field">

                  <label>
                    Battery
                  </label>

                  <input
                    value={
                      form.battery
                    }
                    onChange={
                      update(
                        "battery"
                      )
                    }
                    placeholder="8000 mAh"
                  />

                </div>

              </div>


              {/* =================================================
                  PRICE + MRP
              ================================================= */}

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
                    onChange={
                      update(
                        "price"
                      )
                    }
                    placeholder="27999"
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
                    onChange={
                      update(
                        "mrp"
                      )
                    }
                    placeholder="32999"
                  />

                </div>

              </div>


              {/* =================================================
                  STOCK + MOQ
              ================================================= */}

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
                    onChange={
                      update(
                        "stock"
                      )
                    }
                    placeholder="88"
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
                    onChange={
                      update(
                        "moq"
                      )
                    }
                    placeholder="1"
                  />

                </div>

              </div>


              {/* =================================================
                  SKU + MODEL
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    SKU
                  </label>

                  <input
                    value={
                      form.sku
                    }
                    onChange={
                      update(
                        "sku"
                      )
                    }
                    placeholder="JCS-P6-TABS9FE"
                  />

                </div>


                <div className="field">

                  <label>
                    Model
                  </label>

                  <input
                    value={
                      form.model
                    }
                    onChange={
                      update(
                        "model"
                      )
                    }
                    placeholder="SM-X510"
                  />

                </div>

              </div>


              {/* =================================================
                  GST + WARRANTY
              ================================================= */}

              <div className="row">

                <div className="field">

                  <label>
                    GST (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.gstPercent
                    }
                    onChange={
                      update(
                        "gstPercent"
                      )
                    }
                  />

                </div>


                <div className="field">

                  <label>
                    Warranty
                  </label>

                  <input
                    value={
                      form.warranty
                    }
                    onChange={
                      update(
                        "warranty"
                      )
                    }
                    placeholder="1 Year Manufacturer Warranty"
                  />

                </div>

              </div>


              {/* =================================================
                  PRODUCT HIGHLIGHTS
              ================================================= */}

              <div className="field">

                <label>
                  Product Highlights
                </label>

                <textarea
                  rows="7"
                  value={
                    form.highlights
                  }
                  onChange={
                    update(
                      "highlights"
                    )
                  }
                  placeholder={`10.9 inch display
8GB RAM
256GB storage
8000mAh battery
45W fast charging`}
                />

                <small>
                  Enter one product highlight per line.
                  These will appear in Product Details.
                </small>

              </div>


              {/* =================================================
                  OVERVIEW
              ================================================= */}

              <div className="field">

                <label>
                  Overview / Description
                </label>

                <textarea
                  rows="6"
                  value={
                    form.overview
                  }
                  onChange={
                    update(
                      "overview"
                    )
                  }
                  placeholder="Write a detailed overview of the product, features, performance and usage..."
                />

                <small>
                  This text will appear under Overview / Description on Product Details.
                </small>

              </div>


              {/* =================================================
                  PRODUCT PHOTOS
              ================================================= */}

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
                    onChange={
                      handleFileSelect
                    }
                    hidden
                    disabled={
                      uploading
                    }
                  />

                </label>


                {/* =================================================
                    IMAGE PREVIEWS
                ================================================= */}

                {images.length >
                  0 && (

                  <div className="merchant-thumbs">

                    {images.map(
                      (
                        url,
                        index
                      ) => (

                        <div
                          className="merchant-thumb"
                          key={`${url}-${index}`}
                        >

                          <img
                            src={url}
                            alt={`Product preview ${
                              index +
                              1
                            }`}
                          />


                          <button
                            type="button"
                            onClick={() =>
                              removeImage(
                                url
                              )
                            }
                            aria-label="Remove image"
                          >

                            <X
                              size={
                                12
                              }
                            />

                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* =================================================
                  FORM ACTIONS
              ================================================= */}

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


            {/* =================================================
                INVENTORY LIST
            ================================================= */}

            <div className="merchant-list">

              <h3>
                Your inventory listings (
                {products.length})
              </h3>


              {loading && (

                <p className="merchant-empty">
                  Loading…
                </p>

              )}


              {!loading &&
                products.length ===
                  0 && (

                <p className="merchant-empty">
                  No listings yet — add your first product.
                </p>

              )}


              {products.map(
                (product) => {

                  const pId =
                    product._id ||
                    product.id;


                  const displayImg =
                    product.images &&
                    product.images.length >
                      0
                      ? product.images[
                          0
                        ]
                      : product.image;


                  return (

                    <div
                      className="card merchant-item"
                      key={
                        pId
                      }
                    >

                      {/* =========================================
                          PRODUCT IMAGE
                      ========================================= */}

                      {displayImg ? (

                        <img
                          src={
                            displayImg
                          }
                          alt={
                            product.title ||
                            product.name ||
                            "Product"
                          }
                        />

                      ) : (

                        <div className="merchant-no-image">
                          No image
                        </div>

                      )}


                      {/* =========================================
                          PRODUCT INFORMATION
                      ========================================= */}

                      <div className="merchant-item-info">

                        <span className="merchant-item-title">

                          {
                            product.title ||
                            product.name
                          }

                        </span>


                        <span className="merchant-item-meta">

                          ₹
                          {Number(
                            product.price ||
                              0
                          ).toLocaleString(
                            "en-IN"
                          )}

                          {" · "}

                          Stock{" "}
                          {
                            product.stock ??
                            0
                          }

                        </span>


                        {/* =======================================
                            HIGHLIGHT PREVIEW
                        ======================================= */}

                        {normalizeHighlights(
                          product.highlights
                        ).length >
                          0 && (

                          <span
                            className="merchant-item-meta"
                            style={{
                              marginTop:
                                "4px",
                            }}
                          >

                            {
                              normalizeHighlights(
                                product.highlights
                              ).length
                            }{" "}
                            product highlights

                          </span>

                        )}

                      </div>


                      {/* =========================================
                          ACTIONS
                      ========================================= */}

                      <div className="merchant-item-actions">

                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              product
                            )
                          }
                          aria-label="Edit"
                        >

                          <Pencil
                            size={
                              15
                            }
                          />

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              pId
                            )
                          }
                          aria-label="Delete"
                        >

                          <Trash2
                            size={
                              15
                            }
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