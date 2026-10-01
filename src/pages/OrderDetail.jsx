import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import "./Orders.css";
import "./OrderDetail.css";


// =========================================================
// SHIPMENT TRACKING - 10 STOPS
// Edit the places below to match your real delivery route.
// =========================================================

const TRACKING_STOPS = [
  { title: "Order placed", place: "JCSGlobal, Vijayawada" },
  { title: "Payment confirmed", place: "Secure checkout" },
  { title: "Packed & quality checked", place: "JCS warehouse, Vijayawada" },
  { title: "Shipped", place: "Vijayawada dispatch centre" },
  { title: "Arrived at hub", place: "Hyderabad, Telangana" },
  { title: "In transit", place: "Nagpur, Maharashtra" },
  { title: "Arrived at hub", place: "Surat, Gujarat" },
  { title: "Arrived at hub", place: "Delhi" },
  { title: "Out for delivery", place: "Local delivery partner" },
  { title: "Delivered", place: "" }, // filled with the shipping address
];

/*
 * DEMO MODE
 * Your orders do not store courier locations yet, so while an order is
 * "SHIPPED" the hub stops move forward automatically (one hub every
 * HOURS_PER_HUB hours after shipping).
 * Set SIMULATE_TRANSIT to false to move stops only when the order status
 * changes (Shipped -> Out for delivery -> Delivered).
 */
const SIMULATE_TRANSIT = true;
const HOURS_PER_HUB = 3;

const HOUR = 60 * 60 * 1000;

// =========================================================
// INVOICE - seller details (shown at the top of the printed invoice)
// =========================================================

const SELLER = {
  name: "JCS Group (JCSGlobal)",
  addressLines: [
    "Current office road, 76-16-53,",
    "Bhavani Puram, RR Nagar,",
    "Vijayawada, Andhra Pradesh 520012",
  ],
  email: "tech.support@jcsglobal.in",
  phone: "+91-9090007108",
  gstin: "", // add your GSTIN here to show it on the invoice
};

const formatStopTime = (ms) =>
  new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

function TrackingTimeline({ order, status, destination }) {
  const total = TRACKING_STOPS.length;

  if (status === "CANCELLED") {
    return (
      <div className="trk-card trk-cancelled">
        <h3>Shipment tracking</h3>
        <p>This order was cancelled.</p>
      </div>
    );
  }

  const created = order.createdAt
    ? new Date(order.createdAt).getTime()
    : Date.now();

  const updated = order.updatedAt
    ? new Date(order.updatedAt).getTime()
    : created;

  const shippedRaw = order.shippedAt
    ? new Date(order.shippedAt).getTime()
    : updated;

  const shipAt = Math.max(shippedRaw, created + 5 * 60 * 1000);

  const times = [
    created,
    created + 2 * 60 * 1000,
    created + (shipAt - created) / 2,
    shipAt,
    shipAt + 1 * HOURS_PER_HUB * HOUR,
    shipAt + 2 * HOURS_PER_HUB * HOUR,
    shipAt + 3 * HOURS_PER_HUB * HOUR,
    shipAt + 4 * HOURS_PER_HUB * HOUR,
    shipAt + 5 * HOURS_PER_HUB * HOUR,
    status === "DELIVERED" || status === "COMPLETED"
      ? Math.max(updated, shipAt + 6 * HOURS_PER_HUB * HOUR)
      : shipAt + 6 * HOURS_PER_HUB * HOUR,
  ];

  const hoursSinceShip = (Date.now() - shipAt) / HOUR;

  const hubsDone = SIMULATE_TRANSIT
    ? Math.min(4, Math.max(0, Math.floor(hoursSinceShip / HOURS_PER_HUB)))
    : 0;

  let done = 1; // stops completed

  if (status === "DELIVERED" || status === "COMPLETED") {
    done = total;
  } else if (status === "OUT_FOR_DELIVERY") {
    done = 9;
  } else if (status === "SHIPPED" || status === "DISPATCHED") {
    done = 4 + hubsDone;
  } else if (
    ["PROCESSING", "CONFIRMED", "ACCEPTED"].includes(status)
  ) {
    done = 3;
  } else if (status === "PAID") {
    done = 2;
  }

  return (
    <div className="trk-card">
      <div className="trk-head">
        <h3>Shipment tracking</h3>
        <span className="trk-progress">
          {done} of {total} stops completed
        </span>
      </div>

      <ol className="trk-list">
        {TRACKING_STOPS.map((stop, index) => {
          const isDone = index < done;
          const isCurrent = isDone && index === done - 1 && done < total;

          const state = isCurrent ? "current" : isDone ? "done" : "todo";

          const place =
            index === total - 1 ? destination : stop.place;

          return (
            <li key={index} className={`trk-stop ${state}`}>
              <span className="trk-dot">
                {isDone ? "✓" : index + 1}
              </span>

              <div className="trk-text">
                <strong>{stop.title}</strong>
                {place && <span className="trk-place">{place}</span>}
                {isDone && (
                  <span className="trk-time">
                    {formatStopTime(Math.min(times[index], Date.now()))}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

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
  // PRINT INVOICE
  // =========================================================

  const orderNumber =
    order.orderId ||
    order.order_id ||
    order.id;

  const customerEmail =
    order.shippingEmail ||
    order.shipping_email ||
    order.buyer_email ||
    order.email ||
    "";

  const paymentLabel =
    order.paymentStatus ||
    (order.status === "paid" ? "PAID" : "PENDING");

  const handlePrintInvoice = () => {
    const previousTitle = document.title;
    document.title = `Invoice-${orderNumber}`;

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div
      className="container page orderdetail-root"
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
          onClick={handlePrintInvoice}
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

      <TrackingTimeline
        order={order}
        status={status}
        destination={shippingAddressText}
      />

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

      {/* =====================================================
          PRINTABLE INVOICE
          Hidden on screen. Only this is printed.
      ===================================================== */}

      <div className="invoice-print">

        <div className="inv-top">
          <div>
            <h1 className="inv-brand">JCS Global</h1>
            <div className="inv-seller">
              <strong>{SELLER.name}</strong>
              {SELLER.addressLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
              <div>{SELLER.email} | {SELLER.phone}</div>
              {SELLER.gstin && <div>GSTIN: {SELLER.gstin}</div>}
            </div>
          </div>

          <div className="inv-meta">
            <h2>TAX INVOICE</h2>
            <div><span>Invoice no:</span> INV-{orderNumber}</div>
            <div><span>Order no:</span> {orderNumber}</div>
            <div><span>Date:</span> {formattedDate}</div>
            <div>
              <span>Payment:</span>{" "}
              {String(paymentLabel).toUpperCase()}
              {" "}
              ({order.paymentMethod ||
                order.payment_method_title ||
                "Online"})
            </div>
          </div>
        </div>

        <div className="inv-parties">
          <div>
            <h4>Bill to</h4>
            <strong>{customerName}</strong>
            {customerEmail && <div>{customerEmail}</div>}
          </div>

          <div>
            <h4>Ship to</h4>
            <strong>{customerName}</strong>
            <div>{shippingAddressText}</div>
          </div>
        </div>

        <table className="inv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th className="num">Qty</th>
              <th className="num">Unit price</th>
              <th className="num">Amount</th>
            </tr>
          </thead>

          <tbody>
            {itemsList.map((item, idx) => {
              const title =
                typeof item.title === "string"
                  ? item.title
                  : item.name ||
                    item.productName ||
                    "Product Item";

              const qty = Number(
                item.qty ?? item.quantity ?? 1
              );

              const price = Number(
                item.price ?? item.unitPrice ?? 0
              );

              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{title}</td>
                  <td className="num">{qty}</td>
                  <td className="num">
                    ₹{price.toLocaleString("en-IN")}
                  </td>
                  <td className="num">
                    ₹{(qty * price).toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="inv-totals">
          <div>
            <span>Subtotal</span>
            <span>₹{rawSubtotal.toLocaleString("en-IN")}</span>
          </div>
          <div>
            <span>GST (18%)</span>
            <span>₹{rawTax.toLocaleString("en-IN")}</span>
          </div>
          <div className="inv-grand">
            <span>Total amount</span>
            <span>₹{rawTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="inv-foot">
          <p>Thank you for your order.</p>
          <p>
            This is a computer-generated invoice and does not
            require a signature.
          </p>
        </div>

      </div>

    </div>
  );
}