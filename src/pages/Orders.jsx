import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fetchMyOrders } from "../api/orders";
import "./Orders.css";

export default function Orders() {
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.response?.data?.message || "Could not load your orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page container orders">
      <h1>Your orders</h1>
      {justPlaced && <div className="order-toast">Order placed — you'll get WhatsApp updates as it ships.</div>}

      {loading && <p className="orders-empty">Loading your orders…</p>}
      {error && <p className="orders-empty">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="orders-empty">No orders yet — once you place one, it'll show up here.</p>
      )}

      <div className="orders-list">
        {orders.map((o) => {
          const firstItem = o.items?.[0];
          const extraCount = (o.items?.length || 0) - 1;

          return (
            <div className="card order-row" key={o.id}>
              <div className="order-thumb">
                <img src={firstItem?.product?.images?.[0] || firstItem?.product?.image} alt={firstItem?.product?.title} />
              </div>

              <div className="order-row-info">
                <span className="mono order-id">JCS-{String(o.id).padStart(5, "0")}</span>
                <span className="order-date">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>

              <span className="order-items-text">
                {firstItem?.product?.title} × {firstItem?.qty}
                {extraCount > 0 && ` +${extraCount} more`}
              </span>

              <span className="mono order-total">₹{Number(o.totalAmount).toLocaleString("en-IN")}</span>

              <span className={`badge order-status status-${o.status}`}>{o.status}</span>

              <span className={`badge pay-badge ${o.paymentStatus === "paid" ? "pay-badge-paid" : "pay-badge-pending"}`}>
                {o.paymentStatus === "paid" ? "Paid" : "Payment pending"}
              </span>

              <Link to={`/orders/${o.id}`} className="order-track-link">
                Track <ArrowRight size={13} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}