import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { fetchMyOrders } from "../api/orders";
import "./OrderReports.css";

export default function OrderReports() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetchMyOrders()
      .then((res) => {
        // Defensive array extraction to handle any API response wrapper format
        const orderData = Array.isArray(res) ? res : (res?.data || res?.orders || []);
        setOrders(Array.isArray(orderData) ? orderData : []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      const created = new Date(o.createdAt);
      if (from && created < new Date(from)) return false;
      if (to && created > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [orders, status, from, to]);

  const totalValue = filtered.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const exportCsv = () => {
    const rows = [
      ["Order ID", "Date", "Items", "Total (₹)", "Status"],
      ...filtered.map((o) => [
        `JCS-${String(o.id || o._id || "0").padStart(5, "0")}`,
        new Date(o.createdAt).toLocaleDateString("en-IN"),
        o.items?.map((i) => `${i.product?.title || i.title} x${i.qty || i.quantity}`).join("; "),
        Number(o.totalAmount || 0).toFixed(2),
        o.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jcsglobal-order-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page container reports">
      <div className="reports-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>Order Reports</span>
      </div>
      <h1>Order Reports</h1>

      <div className="card reports-filters">
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="placed">Placed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="field">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary reports-export" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="reports-summary">
        <span className="mono">{filtered.length} orders</span>
        <span className="mono">₹{totalValue.toLocaleString("en-IN")} total</span>
      </div>

      {loading && <p className="reports-empty">Loading…</p>}
      {!loading && filtered.length === 0 && <p className="reports-empty">No orders match these filters.</p>}

      <div className="reports-table">
        {filtered.map((o) => (
          <div className="card reports-row" key={o.id || o._id}>
            <span className="mono">JCS-{String(o.id || o._id || "0").padStart(5, "0")}</span>
            <span>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</span>
            <span className="reports-items">{o.items?.map((i) => `${i.product?.title || i.title || "Item"} × ${i.qty || i.quantity || 1}`).join(", ")}</span>
            <span className="mono">₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</span>
            <span className={`badge order-status status-${o.status}`}>{o.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}