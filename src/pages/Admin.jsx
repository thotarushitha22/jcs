import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchAllSellRequests, updateSellRequestStatus } from "../api/sellRequests";
import { fetchAllOrders, updateOrderStatus } from "../api/orders";
import "./Admin.css";

const SELL_STATUSES = ["submitted", "reviewing", "approved", "rejected"];
const ORDER_STATUSES = ["placed", "shipped", "delivered", "cancelled"];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("sell");

  const [sellRequests, setSellRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;
    Promise.all([fetchAllSellRequests(), fetchAllOrders()])
      .then(([sr, o]) => { setSellRequests(sr); setOrders(o); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
    return (
      <div className="page container">
        <p>You don't have access to this page.</p>
      </div>
    );
  }

  const handleSellStatus = async (id, status) => {
    const updated = await updateSellRequestStatus(id, status);
    setSellRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
  };

  const handleOrderStatus = async (id, status) => {
    const updated = await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)));
  };

  return (
    <div className="page container admin">
      <h1>Admin</h1>

      <div className="admin-tabs">
        <button className={tab === "sell" ? "active" : ""} onClick={() => setTab("sell")}>
          Sell Requests ({sellRequests.length})
        </button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
          Orders ({orders.length})
        </button>
      </div>

      {loading && <p className="admin-empty">Loading…</p>}

      {!loading && tab === "sell" && (
        <div className="admin-list">
          {sellRequests.length === 0 && <p className="admin-empty">No sell requests submitted yet.</p>}
          {sellRequests.map((r) => (
            <div className="card admin-row" key={r.id}>
              <div className="admin-row-info">
                <span className="admin-row-title">{r.productName}</span>
                <span className="admin-row-meta">Qty {r.quantity} · ₹{Number(r.expectedPrice).toLocaleString("en-IN")}/unit · {r.category}</span>
              </div>
              <select value={r.status} onChange={(e) => handleSellStatus(r.id, e.target.value)}>
                {SELL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === "orders" && (
        <div className="admin-list">
          {orders.length === 0 && <p className="admin-empty">No orders placed yet.</p>}
          {orders.map((o) => (
            <div className="card admin-row" key={o.id}>
              <div className="admin-row-info">
                <span className="admin-row-title">JCS-{String(o.id).padStart(5, "0")} — {o.buyer?.name}</span>
                <span className="admin-row-meta">
                  {o.items?.map((i) => `${i.product?.title} × ${i.qty}`).join(", ")} · ₹{Number(o.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>
              <select value={o.status} onChange={(e) => handleOrderStatus(o.id, e.target.value)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}