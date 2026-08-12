import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createSellRequest, fetchMySellRequests } from "../api/sellRequests";
import "./Sell.css";

export default function Sell() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchMySellRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.target;
    try {
      const newRequest = await createSellRequest({
        productName: form.productName.value,
        category: form.category.value,
        quantity: Number(form.quantity.value),
        expectedPrice: Number(form.expectedPrice.value),
      });
      setRequests((prev) => [newRequest, ...prev]);
      setSubmitted(true);
      form.reset();
      setTimeout(() => setSubmitted(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page container sell">
      <div className="sell-header">
        <h1>Sell to JCSGlobal</h1>
        <p>Submit bulk stock for review. Once KYC-verified, listings go live within 48 hours.</p>
        <span className={`badge badge-${user?.kycStatus === "verified" ? "verified" : "pending"}`}>
          KYC: {user?.kycStatus ?? "not started"}
        </span>
      </div>

      <div className="sell-grid">
        <form className="card sell-form" onSubmit={handleSubmit}>
          <h3>New sell request</h3>
          <div className="field"><label>Product name</label><input name="productName" required placeholder="e.g. Redmi Note 13, lot of 100" /></div>
          <div className="row">
            <div className="field"><label>Category</label>
              <select name="category"><option>Smartphones</option><option>Tablets</option><option>TVs</option><option>Accessories</option></select>
            </div>
            <div className="field"><label>Quantity</label><input name="quantity" type="number" required min="1" placeholder="100" /></div>
          </div>
          <div className="field"><label>Expected price per unit (₹)</label><input name="expectedPrice" type="number" required min="0" /></div>
          <div className="field"><label>Product photos</label><input type="file" multiple accept="image/*" disabled /></div>
          <div className="field"><label>KYC document (GST certificate / ID)</label><input type="file" accept="image/*,.pdf" disabled /></div>
          {error && <p className="sell-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Submitting…" : submitted ? "Submitted ✓" : "Submit for review"}
          </button>
        </form>

        <div className="sell-history">
          <h3>Your requests</h3>
          {loading && <p className="sell-empty">Loading…</p>}
          {!loading && requests.length === 0 && <p className="sell-empty">No sell requests yet.</p>}
          {requests.map((r) => (
            <div className="card sell-req" key={r.id}>
              <span>{r.productName}</span>
              <span className={`badge badge-${r.status === "approved" ? "verified" : r.status === "rejected" ? "rejected" : "pending"}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}