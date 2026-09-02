import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./Orders.css";

export default function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // API URL
  // =========================================================
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "https://jcs-server-1.onrender.com/api";

  // =========================================================
  // GET TOKEN
  // =========================================================
  const getToken = () => {
    try {
      const directToken = localStorage.getItem("token");

      if (directToken) {
        return directToken;
      }

      const user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      return user?.token || "";
    } catch (error) {
      console.warn("Unable to get token", error);
      return "";
    }
  };

  // =========================================================
  // FETCH ORDER FROM BACKEND
  // =========================================================
  const fetchOrder = useCallback(async () => {
    try {
      setError("");

      const token = getToken();

      const response = await axios.get(
        `${API_BASE_URL}/orders/${encodeURIComponent(id)}`,
        {
          headers: {
            Authorization: token
              ? `Bearer ${token}`
              : "",
          },
        }
      );

      const backendOrder =
        response.data?.order ||
        response.data;

      if (!backendOrder) {
        throw new Error("Order not found");
      }

      console.log("Customer order from backend:", backendOrder);

      setOrder(backendOrder);
      setLoading(false);

      // Keep localStorage synchronized as a cache
      try {
        const existingOrders = JSON.parse(
          localStorage.getItem("orders") || "[]"
        );

        const index = existingOrders.findIndex(
          (o) =>
            String(
              o.id ||
                o.order_id ||
                o.orderId
            ).trim() === String(id).trim()
        );

        if (index >= 0) {
          existingOrders[index] = {
            ...existingOrders[index],
            ...backendOrder,
          };
        } else {
          existingOrders.push(backendOrder);
        }

        localStorage.setItem(
          "orders",
          JSON.stringify(existingOrders)
        );
      } catch (storageError) {
        console.warn(
          "Could not update local storage",
          storageError
        );
      }
    } catch (err) {
      console.error(
        "Backend order fetch failed:",
        err
      );

      // =====================================================
      // LOCAL STORAGE FALLBACK
      // =====================================================
      try {
        const localOrders = JSON.parse(
          localStorage.getItem("orders") || "[]"
        );

        const localOrder = localOrders.find(
          (o) =>
            String(
              o.id ||
                o.order_id ||
                o.orderId
            ).trim() === String(id).trim()
        );

        if (localOrder) {
          console.log(
            "Using local order as fallback:",
            localOrder
          );

          setOrder(localOrder);
          setLoading(false);
          return;
        }
      } catch (storageError) {
        console.warn(
          "Local storage error:",
          storageError
        );
      }

      setError(
        "Unable to load order details."
      );

      setLoading(false);
    }
  }, [id, API_BASE_URL]);

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
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page">
        <p>Order not found.</p>
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
    "PAID";

  const status = String(rawStatus)
    .trim()
    .toUpperCase();

  const isShipped = [
    "SHIPPED",
    "DISPATCHED",
    "DELIVERED",
    "COMPLETED",
    "OUT_FOR_DELIVERY",
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
        title:
          "65W GaN Fast Charger — Bulk Pack",
        qty: 1,
        price: 899,
      },
    ];
  }

  // =========================================================
  // AMOUNTS
  // =========================================================
  const rawTotal = Number(
    order.totalAmount ||
      order.total_amount ||
      1061
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
      return "kluniversity";
    }

    if (typeof value === "object") {
      return (
        value.name ||
        value.username ||
        value.email ||
        "kluniversity"
      );
    }

    return String(value);
  };

  // =========================================================
  // ADDRESS
  // =========================================================
  const formatAddress = (value) => {
    if (!value) {
      return "Vijayawada, madhuranagar, road-21-13-72";
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
        "Vijayawada, madhuranagar, road-21-13-72"
      );
    }

    return String(value);
  };

  const customerName = formatName(
    order.shippingName ||
      order.customerName ||
      order.user
  );

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
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )
    : "02 September 2026";

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
          justifyContent:
            "space-between",
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
          onClick={() =>
            window.print()
          }
          style={{
            padding: "6px 12px",
            background: "#f1f5f9",
            border:
              "1px solid #cbd5e1",
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
          justifyContent:
            "space-between",
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
                : "#e0f2fe",
            color:
              status === "DELIVERED" ||
              status === "COMPLETED"
                ? "#065f46"
                : "#0369a1",
            fontSize: "14px",
            fontWeight: "700",
          }}
        >
          {status}
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
            "PAID"}
        </span>

        <span
          style={{
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          via{" "}
          {order.paymentMethod ||
            "Razorpay Sandbox QR"}
        </span>
      </div>

      {/* TRACKING */}
      <div
        className="card"
        style={{
          padding: "30px",
          background: "#fff",
          borderRadius: "8px",
          border:
            "1px solid #e2e8f0",
          marginBottom: "25px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            position: "relative",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          {/* ORDER PLACED */}
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius:
                  "50%",
                background: "#10b981",
                color: "#fff",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
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
              flexDirection:
                "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius:
                  "50%",
                background: isShipped
                  ? "#10b981"
                  : "#cbd5e1",
                color: "#fff",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
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
              flexDirection:
                "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius:
                  "50%",
                background: isDelivered
                  ? "#10b981"
                  : "#cbd5e1",
                color: "#fff",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
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
          gridTemplateColumns:
            "2fr 1fr",
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
            border:
              "1px solid #e2e8f0",
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

          {itemsList.map(
            (item, idx) => {
              const title =
                typeof item.title ===
                "string"
                  ? item.title
                  : item.name ||
                    "Product Item";

              const qty = Number(
                item.qty ??
                  item.quantity ??
                  1
              );

              const price = Number(
                item.price ||
                  899
              );

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    paddingBottom:
                      "10px",
                    marginBottom:
                      "10px",
                    borderBottom:
                      "1px solid #eee",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight:
                          "600",
                      }}
                    >
                      {title}
                    </div>

                    <div
                      style={{
                        fontSize:
                          "13px",
                        color:
                          "#64748b",
                      }}
                    >
                      Qty: {qty} × ₹
                      {price.toLocaleString(
                        "en-IN"
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      fontWeight:
                        "600",
                    }}
                  >
                    ₹
                    {(
                      qty * price
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </div>
                </div>
              );
            }
          )}

          {/* TOTALS */}
          <div
            style={{
              marginTop: "15px",
              display: "flex",
              flexDirection:
                "column",
              gap: "6px",
              fontSize: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                color: "#64748b",
              }}
            >
              <span>
                Subtotal:
              </span>

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
                justifyContent:
                  "space-between",
                color: "#64748b",
              }}
            >
              <span>
                GST (18%):
              </span>

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
                justifyContent:
                  "space-between",
                marginTop: "8px",
                paddingTop: "8px",
                borderTop:
                  "1px solid #eee",
                fontSize: "16px",
                fontWeight: "700",
                color: "#111827",
              }}
            >
              <span>
                Total Amount:
              </span>

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
            border:
              "1px solid #e2e8f0",
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
              margin:
                "0 0 6px 0",
              fontWeight: "600",
              fontSize: "15px",
            }}
          >
            {customerName}
          </p>

          <p
            style={{
              margin:
                "0 0 4px 0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            ✉{" "}
            {order.shippingEmail ||
              order.email ||
              "thota@gmail.com"}
          </p>

          <hr
            style={{
              border: "0",
              borderTop:
                "1px solid #eee",
              margin: "10px 0",
            }}
          />

          <p
            style={{
              margin:
                "0 0 4px 0",
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

      {/* AUTO REFRESH MESSAGE */}
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