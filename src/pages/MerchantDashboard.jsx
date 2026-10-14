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

// Same API address the wishlist uses. Change it if your backend runs elsewhere
// (for example "http://localhost:5000/api" while testing locally).
const API_BASE = "https://jcs-server-1.onrender.com/api";

/* =========================================================
   THE 10 TRACKING STOPS
   (the same list is used in the order page, merchant
   dashboard and admin dashboard)
========================================================= */

// The merchant can pick stops 1 to MERCHANT_LAST_STOP only.
// Later stops (hubs, out for delivery, delivered) are admin-only.
const MERCHANT_LAST_STOP = 4;

const ORDER_STOPS = [
  { status: "PENDING", label: "1. Order placed" },
  { status: "PAID", label: "2. Payment confirmed" },
  { status: "PROCESSING", label: "3. Packed & quality checked" },
  { status: "SHIPPED", label: "4. Shipped" },
  { status: "HUB_1", label: "5. Arrived at hub - Hyderabad" },
  { status: "HUB_2", label: "6. In transit - Nagpur" },
  { status: "HUB_3", label: "7. Arrived at hub - Surat" },
  { status: "HUB_4", label: "8. Arrived at hub - Delhi" },
  { status: "OUT_FOR_DELIVERY", label: "9. Out for delivery" },
  { status: "DELIVERED", label: "10. Delivered" },
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
  const value = String(raw || "PENDING")
    .trim()
    .toUpperCase();
  return STATUS_ALIASES[value] || value;
};

const stopLabel = (raw) => {
  const code = normalizeStopStatus(raw);
  if (code === "CANCELLED") return "Cancelled";
  const stop = ORDER_STOPS.find((s) => s.status === code);
  return stop ? stop.label : code;
};



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
   HELPER
   ORDER IDS

   The backend can call an order's id "orderId", "id",
   "order_id" or "_id". The admin dashboard checks them in
   this same order, so the merchant dashboard does too.
   (Before, "id" was never read, so the table made up fake
   numbers like JCS-81670 and the server answered
   "Order not found".)
========================================================= */

const stripJcs = (id) =>
  String(id ?? "")
    .trim()
    .replace(/^JCS-/i, "");

function orderIdCandidates(ord) {
  const list = [
    ord?.orderId,
    ord?.id,
    ord?.order_id,
    ord?._id,
    ord?.orderNumber,
    ord?.order_number,
  ]
    .map(stripJcs)
    .filter(Boolean);

  return [...new Set(list)];
}


/* =========================================================
   HELPER
   PRODUCT NAMES INSIDE AN ORDER

   Orders can list their products under different names
   (items, orderItems, products, cart...). This reads the
   common ones and returns e.g. ["Apple iPhone 18 Pro Max", "Charger x 2"].
========================================================= */

function orderProductNames(ord) {
  let items =
    ord?.items ??
    ord?.orderItems ??
    ord?.order_items ??
    ord?.products ??
    ord?.cartItems ??
    ord?.cart ??
    ord?.lineItems ??
    [];

  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }

  if (!Array.isArray(items)) {
    items = items ? [items] : [];
  }

  const names = items
    .map((item) => {
      if (typeof item === "string") return item;

      const name =
        item?.title ||
        item?.name ||
        item?.productName ||
        item?.product_name ||
        item?.product?.title ||
        item?.product?.name ||
        item?.Product?.title ||
        item?.Product?.name ||
        "";

      const qty = Number(item?.quantity ?? item?.qty ?? 1);

      return name ? (qty > 1 ? `${name} × ${qty}` : name) : "";
    })
    .filter(Boolean);

  if (names.length === 0) {
    const single =
      ord?.productName ||
      ord?.productTitle ||
      ord?.product_name ||
      ord?.product?.title ||
      ord?.product?.name ||
      "";

    if (single) names.push(String(single));
  }

  return names;
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

  /* =========================================================
     ORDER FULFILMENT - the merchant can set stops 1 to 4 only
  ========================================================= */

  const [updatingOrder, setUpdatingOrder] =
    useState("");

  const cleanOrderId = (id) =>
    String(id || "")
      .trim()
      .replace(/^JCS-/i, "");

  const handleFulfilment = async (
    order,
    newStatus
  ) => {
    if (
      newStatus === "SHIPPED" &&
      !window.confirm(
        "Mark this order as shipped? After this, the next stops are handled by the admin."
      )
    ) {
      return;
    }

    // This order has no real id, so the server cannot know it.
    if (order.local_only || !(order._ids?.length)) {
      toast.error(
        "This order is not saved on the server, so its status can't be changed here."
      );
      return;
    }

    try {
      setUpdatingOrder(order.order_id);

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(
            "token"
          )}`,
        },
      };

      // Try each id the order can have. Stop at the first success,
      // and move on to the next id only when the server says "not found".
      let lastError = null;
      let saved = false;

      for (const id of order._ids) {
        try {
          await axios.put(
            `${API_BASE}/orders/${encodeURIComponent(
              id
            )}/status`,
            { status: newStatus },
            config
          );

          saved = true;
          break;
        } catch (err) {
          lastError = err;

          if (err.response?.status !== 404) {
            throw err;
          }
        }
      }

      if (!saved) {
        console.warn(
          "Order not found. Ids tried:",
          order._ids
        );

        throw lastError;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === order.order_id
            ? { ...o, status: newStatus }
            : o
        )
      );

      toast.success(
        `Order moved to: ${stopLabel(newStatus)}`
      );
    } catch (err) {
      toast.error(
        err.response?.status === 404
          ? `Order not found on the server (tried: ${(
              order._ids || []
            ).join(", ")})`
          : err.response?.data?.message ||
              "Could not update the order"
      );
    } finally {
      setUpdatingOrder("");
    }
  };

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

  // Product highlights are edited as separate rows (one input per highlight)
  const [highlightRows, setHighlightRows] =
    useState([""]);

  const updateHighlights = (rows) => {
    setHighlightRows(rows);

    setForm((current) => ({
      ...current,
      highlights: rows
        .map((row) => row.trim())
        .filter(Boolean)
        .join("\n"),
    }));
  };

  const addHighlight = () =>
    updateHighlights([...highlightRows, ""]);


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


        // Shows what the server sends for orders (open the Console to read it)
        console.log(
          "MERCHANT ORDERS:",
          rawOrders.length,
          "orders. First one:",
          rawOrders[0],
          "| id fields found:",
          rawOrders[0]
            ? orderIdCandidates(rawOrders[0])
            : []
        );

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


              // real ids from the server (never used for API calls when made up)
              const idCandidates =
                orderIdCandidates(ord);

              const hasRealId =
                idCandidates.length > 0;

              const orderId = hasRealId
                ? `JCS-${idCandidates[0]}`
                : `JCS-${81670 + idx}`;


              const userName =
                ord.shippingAddress
                  ?.name ||
                ord.shippingName ||
                ord.buyer?.name ||
                ord.user_name ||
                ord.customerName ||
                currentUser.name ||
                "Customer";


              return {
                ...ord,

                order_id:
                  orderId,

                // ids to try when updating this order on the server
                _ids:
                  idCandidates,

                // true = no real id: the order only exists in this browser
                local_only:
                  !hasRealId,

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

    setHighlightRows([""]);

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

      setHighlightRows(
        existingHighlights.length > 0
          ? existingHighlights.map((item) => item.text)
          : [""]
      );


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
     OPEN A SECTION FROM A DASHBOARD BOX
  ========================================================= */

  const openTab = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const boxKeys = (tab) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openTab(tab);
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
            MD
          </div>

          <div>

            <span className="brand-name">
              Merchant
            </span>

            <span className="brand-sub">
              Dashboard
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

            <section
              className="metrics-grid"
              style={{
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >

              {/* BOX 1: REVENUE */}

              <div className="metric-card">

                <div className="metric-icon today">
                  <IndianRupee size={18} />
                </div>

                <div>
                  <span className="metric-label">
                    Total Revenue
                  </span>

                  <h3 className="metric-value">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </h3>
                </div>

              </div>


              {/* BOX 2: ORDERS (opens the Orders section) */}

              <div
                className="metric-card metric-card-link"
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => openTab("orders")}
                onKeyDown={boxKeys("orders")}
              >

                <div className="metric-icon week">
                  <ShoppingBag size={18} />
                </div>

                <div>
                  <span className="metric-label">
                    Orders
                  </span>

                  <h3 className="metric-value">
                    {orders.length}
                  </h3>

                  <span className="metric-hint">
                    View all orders →
                  </span>
                </div>

              </div>


              {/* BOX 3: MANAGE PRODUCTS (opens the Products section) */}

              <div
                className="metric-card metric-card-link"
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => openTab("products")}
                onKeyDown={boxKeys("products")}
              >

                <div className="metric-icon products">
                  <Package size={18} />
                </div>

                <div>
                  <span className="metric-label">
                    Manage Products
                  </span>

                  <h3 className="metric-value">
                    {products.length}
                  </h3>

                  <span className="metric-hint">
                    Add or edit listings →
                  </span>
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
                      Product(s)
                    </th>

                    <th>
                      Total Amount
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Fulfilment
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

                          <td style={{ maxWidth: "260px" }}>
                            {orderProductNames(o).length > 0
                              ? orderProductNames(o).map((name, n) => (
                                  <div
                                    key={n}
                                    style={{ fontSize: "13px" }}
                                  >
                                    {name}
                                  </div>
                                ))
                              : "—"}
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

                          <td>

                            {(() => {
                              const current =
                                normalizeStopStatus(
                                  o.status
                                );

                              const busy =
                                updatingOrder ===
                                o.order_id;

                              const cancelled =
                                current === "CANCELLED";

                              const currentIndex =
                                ORDER_STOPS.findIndex(
                                  (stop) =>
                                    stop.status === current
                                );

                              // stops the merchant may choose
                              const merchantStops =
                                ORDER_STOPS.slice(
                                  0,
                                  MERCHANT_LAST_STOP
                                );

                              // locked once shipped (or later), or cancelled
                              const locked =
                                cancelled ||
                                o.local_only ||
                                currentIndex >=
                                  MERCHANT_LAST_STOP - 1;

                              return (
                                <div className="fulfillment-actions">
                                  <select
                                    value={current}
                                    disabled={
                                      locked || busy
                                    }
                                    onChange={(e) =>
                                      handleFulfilment(
                                        o,
                                        e.target.value
                                      )
                                    }
                                    style={{
                                      minWidth: "230px",
                                      padding: "6px 8px",
                                      border:
                                        "1px solid #cbd5e1",
                                      borderRadius: "6px",
                                      background: locked
                                        ? "#f1f5f9"
                                        : "#ffffff",
                                      color: "#0f172a",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      cursor: locked
                                        ? "not-allowed"
                                        : "pointer",
                                    }}
                                  >
                                    {merchantStops.map(
                                      (stop) => (
                                        <option
                                          key={stop.status}
                                          value={stop.status}
                                        >
                                          {stop.label}
                                        </option>
                                      )
                                    )}

                                    {currentIndex >=
                                      MERCHANT_LAST_STOP && (
                                      <option value={current}>
                                        {stopLabel(current)}
                                      </option>
                                    )}

                                    {cancelled && (
                                      <option value="CANCELLED">
                                        Cancelled
                                      </option>
                                    )}
                                  </select>

                                  {busy && (
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        color: "#64748b",
                                      }}
                                    >
                                      Saving…
                                    </span>
                                  )}

                                  {locked && !busy && (
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        color: "#64748b",
                                      }}
                                    >
                                      {cancelled
                                        ? "Order cancelled"
                                        : o.local_only
                                        ? "Not saved on server"
                                        : "Next stops: admin"}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}

                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="6"
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

                <div className="highlight-list">

                  {highlightRows.map((row, index) => (

                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >

                      <input
                        style={{ flex: 1 }}
                        value={row}
                        placeholder={
                          index === 0
                            ? "e.g. 10.9 inch display"
                            : "Add another highlight"
                        }
                        onChange={(e) =>
                          updateHighlights(
                            highlightRows.map((r, i) =>
                              i === index ? e.target.value : r
                            )
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addHighlight();
                          }
                        }}
                      />

                      {highlightRows.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          aria-label="Remove highlight"
                          onClick={() =>
                            updateHighlights(
                              highlightRows.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <X size={14} />
                        </button>
                      )}

                    </div>

                  ))}

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={addHighlight}
                  >
                    + Add highlight
                  </button>

                </div>

                <small>
                  Click “+ Add highlight” for each point.
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