import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import "./Orders.css";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");

        const backendOrders = Array.isArray(response.data)
          ? response.data
          : response.data?.orders || [];

        console.log("Customer orders received from backend:", backendOrders);

        if (isMounted) {
          setOrders(backendOrders);
          setError("");
        }
      } catch (err) {
        console.error(
          "Customer orders fetch failed:",
          err.response?.data || err.message
        );

        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load your orders. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    // Refresh every 3 seconds so admin status changes appear
    const interval = setInterval(fetchOrders, 3000);

    // Refresh when customer returns to the tab
    const handleFocus = () => {
      fetchOrders();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (loading) {
    return (
      <div className="container page">
        <p>Loading your orders…</p>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="container page">
        <h2>Your orders</h2>

        <p
          className="no-orders"
          style={{
            marginTop: "20px",
            color: "#b91c1c",
          }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="container page">
      <h2>Your orders</h2>

      {orders.length === 0 ? (
        <p
          className="no-orders"
          style={{
            marginTop: "20px",
            color: "#666",
          }}
        >
          No orders found for your account — once you place one, it'll show up
          here.
        </p>
      ) : (
        <div
          className="orders-list"
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {orders.map((order) => {
            const rawId = String(
              order.order_id || order.id || order._id || ""
            );

            if (!rawId) return null;

            const displayId = rawId.replace(/^JCS-/i, "");

            // Normalize backend status
            const orderStatus = String(
              order.status || order.paymentStatus || "PENDING"
            ).toUpperCase();

            const paymentMethodStr = String(
              order.paymentMethod ||
                order.payment_method ||
                order.payment_method_title ||
                "Cash on Delivery"
            );

            const isOnlinePaid =
              paymentMethodStr.toLowerCase().includes("razorpay") ||
              orderStatus === "PAID" ||
              rawId.toUpperCase().includes("RAZORPAY_SANDBOX");

            const isDelivered =
              orderStatus === "DELIVERED" ||
              orderStatus === "COMPLETED";

            const isPaid = isOnlinePaid || isDelivered;

            const badgeText = isPaid ? "PAID" : "PENDING";

            const rawTotal =
              order.totalAmount ??
              order.totalPrice ??
              order.grandTotal ??
              0;

            const calculatedTotal =
              Number(rawTotal) === 0 && Array.isArray(order.items)
                ? order.items.reduce(
                    (sum, item) =>
                      sum +
                      Number(item.price || 0) *
                        Number(item.qty ?? item.quantity ?? 1),
                    0
                  )
                : rawTotal;

            const total = Number(calculatedTotal).toLocaleString("en-IN");

            return (
              <div
                key={order.id || order._id || order.order_id}
                className="card order-card"
                style={{
                  padding: "20px",
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {/* HEADER */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "12px",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "16px",
                      }}
                    >
                      <Link
                        to={`/orders/${rawId}`}
                        style={{
                          color: "#2563eb",
                          textDecoration: "none",
                        }}
                      >
                        Order JCS-{displayId}
                      </Link>
                    </h3>

                    <span
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      Placed on{" "}
                      {order.createdAt &&
                      !isNaN(new Date(order.createdAt))
                        ? new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "Recent"}
                    </span>

                    {/* PAYMENT */}
                    <div
                      style={{
                        marginTop: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: isPaid ? "#d1fae5" : "#fef3c7",
                          color: isPaid ? "#065f46" : "#92400e",
                        }}
                      >
                        {badgeText}
                      </span>

                      <span
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        via {paymentMethodStr}
                      </span>
                    </div>
                  </div>

                  {/* ORDER STATUS */}
                  <div>
                    <span
                      className={`badge status-${orderStatus.toLowerCase()}`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        background:
                          orderStatus === "DELIVERED" ||
                          orderStatus === "COMPLETED"
                            ? "#d1fae5"
                            : orderStatus === "SHIPPED" ||
                              orderStatus === "OUT_FOR_DELIVERY"
                            ? "#e0f2fe"
                            : orderStatus === "CANCELLED"
                            ? "#fee2e2"
                            : orderStatus === "PROCESSING"
                            ? "#dbeafe"
                            : "#fef3c7",
                        color:
                          orderStatus === "DELIVERED" ||
                          orderStatus === "COMPLETED"
                            ? "#065f46"
                            : orderStatus === "SHIPPED" ||
                              orderStatus === "OUT_FOR_DELIVERY"
                            ? "#0369a1"
                            : orderStatus === "CANCELLED"
                            ? "#991b1b"
                            : orderStatus === "PROCESSING"
                            ? "#1d4ed8"
                            : "#92400e",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {orderStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                {/* PRODUCTS */}
                <div style={{ marginBottom: "15px" }}>
                  <h4
                    style={{
                      fontSize: "14px",
                      marginBottom: "8px",
                      color: "#334155",
                    }}
                  >
                    Ordered Products
                  </h4>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {Array.isArray(order.items) &&
                    order.items.length > 0 ? (
                      order.items.map((item, idx) => {
                        const title =
                          item.product?.title ||
                          item.title ||
                          item.name ||
                          "Product item";

                        const qty = item.qty ?? item.quantity ?? 1;
                        const price = Number(item.price || 0);

                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "#f8fafc",
                              padding: "10px",
                              borderRadius: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              {title}{" "}
                              <span
                                style={{
                                  color: "#64748b",
                                  fontSize: "13px",
                                }}
                              >
                                × {qty}
                              </span>
                            </span>

                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "600",
                              }}
                            >
                              ₹{(qty * price).toLocaleString("en-IN")}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                        }}
                      >
                        Product details unavailable
                      </span>
                    )}
                  </div>
                </div>

                {/* FOOTER */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #eee",
                    paddingTop: "12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                      }}
                    >
                      Total Amount:{" "}
                    </span>

                    <strong style={{ fontSize: "15px" }}>
                      ₹{total}
                    </strong>
                  </div>

                  <Link
                    to={`/orders/${rawId}`}
                    className="btn btn-sm"
                    style={{
                      padding: "6px 14px",
                      background: "#0f172a",
                      color: "#fff",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontSize: "13px",
                    }}
                  >
                    View Tracking & Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}