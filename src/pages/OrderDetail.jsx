import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import "./Orders.css";

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH ORDER FROM BACKEND
  // Backend is the source of truth.
  // =========================================================
  const fetchOrder = useCallback(async () => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      /*
       * IMPORTANT:
       * Do NOT remove "JCS-" here.
       *
       * The backend resolver can search:
       * - order_id
       * - database id
       * - numeric ID
       *
       * Example:
       * JCS-RAZORPAY_SANDBOX-45178
       *
       * should be sent exactly as it is.
       */

      const orderIdentifier = String(id).trim();

      console.log(
        "Fetching customer order:",
        orderIdentifier
      );

      /*
       * api.js baseURL:
       *
       * https://jcs-server-1.onrender.com/api
       *
       * Therefore:
       *
       * /orders/:id
       */

      const response = await api.get(
        `/orders/${encodeURIComponent(orderIdentifier)}`
      );

      console.log(
        "Customer order response:",
        response.data
      );

      const backendOrder =
        response.data?.order ||
        response.data?.data ||
        response.data;

      if (!backendOrder) {
        throw new Error("Order not found");
      }

      console.log(
        "Latest order from backend:",
        backendOrder
      );

      // =====================================================
      // BACKEND IS THE SOURCE OF TRUTH
      // =====================================================

      setOrder(backendOrder);
      setLoading(false);

      /*
       * IMPORTANT:
       *
       * We do NOT use localStorage as a fallback.
       *
       * This prevents an old order belonging to another
       * customer from appearing in OrderDetails.
       *
       * The backend has already verified ownership.
       */
    } catch (err) {
      console.error(
        "Backend order fetch failed:",
        err
      );

      setOrder(null);

      setError(
        err.response?.data?.message ||
          "Unable to load order details."
      );

      setLoading(false);
    }
  }, [id]);

  // =========================================================
  // INITIAL FETCH + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    fetchOrder();

    // Refresh every 3 seconds
    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    // Refresh when browser tab gets focus
    const handleFocus = () => {
      fetchOrder();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      clearInterval(interval);

      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [fetchOrder]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="container page">
        <p>Loading order details...</p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error && !order) {
    return (
      <div className="container page">
        <p style={{ color: "red" }}>
          {error}
        </p>

        <button
          onClick={fetchOrder}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try Again
        </button>

        <div style={{ marginTop: "15px" }}>
          <Link
            to="/orders"
            style={{
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            ← Back to orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page">
        <p>Order not found.</p>

        <Link
          to="/orders"
          style={{
            color: "#2563eb",
            textDecoration: "none",
          }}
        >
          ← Back to orders
        </Link>
      </div>
    );
  }

  // =========================================================
  // STATUS
  // =========================================================

  const rawStatus =
    order.status ||
    order.orderStatus ||
    order.shippingStatus ||
    "PENDING";

  const status = String(rawStatus)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const isShipped = [
    "SHIPPED",
    "DISPATCHED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
  ].includes(status);

  const isDelivered = [
    "DELIVERED",
    "COMPLETED",
  ].includes(status);

  // =========================================================
  // ITEMS
  // =========================================================

  let itemsList = order.items;

  if (typeof itemsList === "string") {
    try {
      itemsList = JSON.parse(itemsList);
    } catch {
      itemsList = [];
    }
  }

  if (
    !Array.isArray(itemsList) ||
    itemsList.length === 0
  ) {
    itemsList = [
      {
        title: "Product Item",
        qty: 1,
        price: 0,
      },
    ];
  }

  // =========================================================
  // AMOUNTS
  // =========================================================

  const rawTotal = Number(
    order.totalAmount ??
      order.total_amount ??
      order.totalPrice ??
      order.total ??
      0
  );

  const rawSubtotal =
    Math.round(
      (rawTotal / 1.18) * 100
    ) / 100;

  const rawTax =
    Math.round(
      (rawTotal - rawSubtotal) * 100
    ) / 100;

  // =========================================================
  // CUSTOMER NAME
  // =========================================================

  const formatName = (value) => {
    if (!value) {
      return "Customer";
    }

    if (typeof value === "object") {
      return (
        value.name ||
        value.username ||
        value.email ||
        "Customer"
      );
    }

    return String(value);
  };

  const customerName = formatName(
    order.shippingName ||
      order.customerName ||
      order.buyer_name ||
      order.user
  );

  // =========================================================
  // ADDRESS
  // =========================================================

  const formatAddress = (value) => {
    if (!value) {
      return "Address not available";
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      return (
        [
          value.address,
          value.street,
          value.city,
          value.pincode,
        ]
          .filter(Boolean)
          .join(", ") ||
        "Address not available"
      );
    }

    return String(value);
  };

  const shippingAddressText =
    formatAddress(
      order.shippingAddress ||
        order.address
    );

  // =========================================================
  // DATE
  // =========================================================

  const formattedDate = order.createdAt
    ? new Date(
        order.createdAt
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Date unavailable";

  // =========================================================
  // DISPLAY STATUS
  // =========================================================

  const displayStatus = {
    PENDING: "PENDING",
    PAID: "PAID",
    PROCESSING: "PROCESSING",
    CONFIRMED: "CONFIRMED",
    ACCEPTED: "ACCEPTED",
    SHIPPED: "SHIPPED",
    DISPATCHED: "DISPATCHED",
    OUT_FOR_DELIVERY: "OUT FOR DELIVERY",
    DELIVERED: "DELIVERED",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      className="container page"
      style={{ padding: "20px" }}
    >

      {/* TOP */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to="/orders"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          ← Back to orders
        </Link>

        <button
          onClick={() => window.print()}
          style={{
            padding: "6px 12px",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          🖨 Print Invoice
        </button>
      </div>

      {/* ORDER HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "15px",
          marginBottom: "15px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
            }}
          >
            Order{" "}
            {order.orderId ||
              order.order_id ||
              order.id}
          </h2>

          <span
            style={{
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            Placed on {formattedDate}
          </span>
        </div>

        {/* CURRENT STATUS */}

        <span
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            background:
              status === "DELIVERED" ||
              status === "COMPLETED"
                ? "#d1fae5"
                : status === "CANCELLED"
                ? "#fee2e2"
                : "#e0f2fe",
            color:
              status === "DELIVERED" ||
              status === "COMPLETED"
                ? "#065f46"
                : status === "CANCELLED"
                ? "#991b1b"
                : "#0369a1",
            fontSize: "14px",
            fontWeight: "700",
          }}
        >
          {displayStatus[status] || status}
        </span>
      </div>

      {/* PAYMENT */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "25px",
        }}
      >
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "700",
            background: "#d1fae5",
            color: "#065f46",
          }}
        >
          {order.paymentStatus ||
            (order.status === "paid"
              ? "PAID"
              : "PAYMENT")}
        </span>

        <span
          style={{
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          via{" "}
          {order.paymentMethod ||
            order.payment_method_title ||
            "Payment"}
        </span>
      </div>

      {/* TRACKING */}

      <div
        className="card"
        style={{
          padding: "30px",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          marginBottom: "25px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            position: "relative",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >

          {/* ORDER PLACED */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                background: "#10b981",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>

            <span
              style={{
                fontSize: "13px",
                marginTop: "8px",
                fontWeight: "600",
              }}
            >
              Order Placed
            </span>
          </div>

          {/* SHIPPED */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                background:
                  isShipped
                    ? "#10b981"
                    : "#cbd5e1",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>

            <span
              style={{
                fontSize: "13px",
                marginTop: "8px",
                fontWeight: "600",
              }}
            >
              Shipped
            </span>
          </div>

          {/* DELIVERED */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                background:
                  isDelivered
                    ? "#10b981"
                    : "#cbd5e1",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              ✓
            </div>

            <span
              style={{
                fontSize: "13px",
                marginTop: "8px",
                fontWeight: "600",
              }}
            >
              Delivered
            </span>
          </div>

        </div>
      </div>

      {/* DETAILS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
        }}
      >

        {/* ITEMS */}

        <div
          className="card"
          style={{
            padding: "20px",
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              marginBottom: "15px",
            }}
          >
            Items
          </h3>

          {itemsList.map((item, idx) => {

            const title =
              typeof item.title === "string"
                ? item.title
                : item.name ||
                  item.productName ||
                  "Product Item";

            const qty = Number(
              item.qty ??
                item.quantity ??
                1
            );

            const price = Number(
              item.price ??
                item.unitPrice ??
                0
            );

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "10px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                    }}
                  >
                    {title}
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Qty: {qty} × ₹
                    {price.toLocaleString("en-IN")}
                  </div>
                </div>

                <div
                  style={{
                    fontWeight: "600",
                  }}
                >
                  ₹
                  {(
                    qty * price
                  ).toLocaleString("en-IN")}
                </div>
              </div>
            );
          })}

          {/* TOTALS */}

          <div
            style={{
              marginTop: "15px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#64748b",
              }}
            >
              <span>Subtotal:</span>

              <span>
                ₹
                {rawSubtotal.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#64748b",
              }}
            >
              <span>GST (18%):</span>

              <span>
                ₹
                {rawTax.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: "1px solid #eee",
                fontSize: "16px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              <span>Total Amount:</span>

              <span>
                ₹
                {rawTotal.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* CUSTOMER */}

        <div
          className="card"
          style={{
            padding: "20px",
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              marginBottom: "15px",
            }}
          >
            Customer & Shipping
          </h3>

          <p
            style={{
              margin: "0 0 6px 0",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            {customerName}
          </p>

          <p
            style={{
              margin: "0 0 4px 0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            ✉{" "}
            {order.shippingEmail ||
              order.shipping_email ||
              order.buyer_email ||
              order.email ||
              "Email not available"}
          </p>

          <hr
            style={{
              border: "0",
              borderTop: "1px solid #eee",
              margin: "10px 0",
            }}
          />

          <p
            style={{
              margin: "0 0 4px 0",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Shipping Address:
          </p>

          <p
            style={{
              margin: "0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {shippingAddressText}
          </p>
        </div>
      </div>

      {/* AUTO REFRESH */}

      <div
        style={{
          marginTop: "15px",
          textAlign: "center",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        Order status updates automatically.
      </div>

    </div>
  );
}