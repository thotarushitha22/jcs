import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrder } from "../api/orders";
import OrderTracker from "../components/OrderTracker";
import "./OrderDetail.css";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.response?.data?.message || "Could not load this order."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page container"><p>Loading order…</p></div>;
  if (error || !order) {
    return (
      <div className="page container">
        <p>{error || "Order not found."} <Link to="/orders">Back to orders</Link></p>
      </div>
    );
  }

  return (
    <div className="page container orderdetail">
      <Link to="/orders" className="orderdetail-back">← Back to orders</Link>

      <div className="orderdetail-head">
        <div>
          <h1>Order JCS-{String(order.id).padStart(5, "0")}</h1>
          <span className="orderdetail-date">
            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>
        <span className={`badge order-status status-${order.status}`}>{order.status}</span>
      </div>

      <div className="orderdetail-payment">
        <span className={`badge pay-badge ${order.paymentStatus === "paid" ? "pay-badge-paid" : "pay-badge-pending"}`}>
          {order.paymentStatus === "paid" ? "Paid" : "Payment pending"}
        </span>
        <span className="orderdetail-payment-method">
          via {order.paymentMethod === "upi" ? "UPI / Cards / Netbanking" : order.paymentMethod === "credit" ? "Credit terms" : "Cash on Delivery"}
        </span>
      </div>

      <div className="card orderdetail-tracker-card">
        <OrderTracker status={order.status} placedAt={order.createdAt} />
      </div>

      <div className="orderdetail-grid">
        <div className="card orderdetail-items">
          <h3>Items</h3>
          {order.items?.map((i) => (
            <div className="orderdetail-item" key={i.id}>
              <img src={i.product?.images?.[0] || i.product?.image} alt={i.product?.title} />
              <div className="orderdetail-item-info">
                <span>{i.product?.title}</span>
                <span className="orderdetail-item-qty">Qty {i.qty} × ₹{Number(i.priceAtPurchase).toLocaleString("en-IN")}</span>
              </div>
              <span className="mono">₹{(i.qty * Number(i.priceAtPurchase)).toLocaleString("en-IN")}</span>
            </div>
          ))}
          <div className="orderdetail-total">
            <span>Total</span>
            <span className="mono">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="card orderdetail-shipping">
          <h3>Shipping details</h3>
          <p><strong>{order.shippingName}</strong></p>
          <p>{order.shippingAddress}</p>
          <p>{order.shippingCity} — {order.shippingPincode}</p>
          <p>{order.shippingPhone}</p>
          {order.shippingGstin && <p className="orderdetail-gstin">GSTIN: {order.shippingGstin}</p>}
        </div>
      </div>
    </div>
  );
}