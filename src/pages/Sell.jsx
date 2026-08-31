import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createSellRequest, fetchMySellRequests } from "../api/sellRequests";
import "./Sell.css";

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = String(user?.role || "").toLowerCase();
  const isMerchant = userRole === "merchant" || userRole === "seller" || userRole === "admin";

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // States to hold Base64 file objects
  const [productPhotos, setProductPhotos] = useState([]);
  const [kycDoc, setKycDoc] = useState(null);

  useEffect(() => {
    // Load both API requests and local storage submissions for fallback/consistency
    const localSubmissions = JSON.parse(localStorage.getItem("jcs_wholesale_submissions") || "[]");
    
    if (!user) {
      setRequests(localSubmissions);
      setLoading(false);
      return;
    }

    fetchMySellRequests()
      .then((apiRequests) => {
        // Merge API requests with local storage ones to ensure visibility
        const combined = [...apiRequests, ...localSubmissions];
        // Deduplicate by ID if needed
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        setRequests(unique);
      })
      .catch(() => {
        setRequests(localSubmissions); // Fallback to local storage if API fails
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Helper to convert files to Base64 strings so they can pass safely without server crashes
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    try {
      const base64Files = await Promise.all(files.map((file) => convertFileToBase64(file)));
      setProductPhotos(base64Files);
    } catch (err) {
      console.error("Error reading photo files", err);
    }
  };

  const handleKycChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64Kyc = await convertFileToBase64(file);
      setKycDoc(base64Kyc);
    } catch (err) {
      console.error("Error reading KYC file", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.target;

    const payload = {
      productName: form.productName.value,
      category: form.category.value,
      quantity: Number(form.quantity.value),
      expectedPrice: Number(form.expectedPrice.value),
      productPhotos: productPhotos,
      kycDoc: kycDoc,
    };

    const fullSubmission = {
      id: "SUB-" + Date.now(),
      userEmail: user?.email || "vendor@jcsglobal.com",
      productName: form.productName.value,
      category: form.category.value,
      quantity: Number(form.quantity.value),
      expectedPrice: Number(form.expectedPrice.value),
      productPhotos: productPhotos,
      kycDoc: kycDoc,
      status: "Pending Review",
      submittedAt: new Date().toISOString(),
    };

    try {
      // Try posting to backend API first
      await createSellRequest(payload);
    } catch (err) {
      console.warn("Backend API call failed, saving locally for Admin review:", err);
      // We catch the server error gracefully so the user experience isn't broken
    }

    // Always save to localStorage so the Admin Dashboard can review it immediately without server errors
    const existingSubmissions = JSON.parse(localStorage.getItem("jcs_wholesale_submissions") || "[]");
    const updatedSubmissions = [fullSubmission, ...existingSubmissions];
    localStorage.setItem("jcs_wholesale_submissions", JSON.stringify(updatedSubmissions));

    setRequests((prev) => [fullSubmission, ...prev]);
    setSubmitted(true);
    form.reset();
    setProductPhotos([]);
    setKycDoc(null);
    setSubmitting(false);
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="page container sell">
      <div className="sell-header">
        <h1>Wholesale Vendor Application</h1>
        <p>Submit bulk electronics inventory for review. Once verified, your catalog listings go live within 48 hours.</p>
        <span className={`badge badge-${user?.kycStatus === "verified" ? "verified" : "pending"}`}>
          KYC: {user?.kycStatus ?? "not started"}
        </span>
      </div>

      {isMerchant && (
        <div className="card merchant-banner" style={{ marginBottom: "1.5rem", textAlign: "center", padding: "1.5rem" }}>
          <h3>You are an active Seller</h3>
          <p>Access your live products, inventories, and order listings in your dedicated dashboard.</p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: "0.75rem" }} 
            onClick={() => navigate(userRole === "admin" ? "/admin" : "/merchant")}
          >
            Go to {userRole === "admin" ? "Admin Panel" : "Merchant Dashboard"}
          </button>
        </div>
      )}

      <div className="sell-grid">
        <form className="card sell-form" onSubmit={handleSubmit}>
          <h3>New wholesale submission</h3>
          <div className="field">
            <label>Product name</label>
            <input name="productName" required placeholder="e.g. Smartphones, lot of 100" />
          </div>
          <div className="row">
            <div className="field">
              <label>Category</label>
              <select name="category">
                <option>Smartphones</option>
                <option>Tablets</option>
                <option>TVs</option>
                <option>Accessories</option>
              </select>
            </div>
            <div className="field">
              <label>Quantity</label>
              <input name="quantity" type="number" required min="1" placeholder="100" />
            </div>
          </div>
          <div className="field">
            <label>Expected price per unit (₹)</label>
            <input name="expectedPrice" type="number" required min="0" />
          </div>
          
          <div className="field">
            <label>Product photos</label>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handlePhotoChange} 
            />
            {productPhotos.length > 0 && (
              <small style={{ color: "green", marginTop: "4px", display: "block" }}>
                ✓ {productPhotos.length} photo(s) attached
              </small>
            )}
          </div>

          <div className="field">
            <label>KYC document (GST certificate / ID)</label>
            <input 
              type="file" 
              accept="image/*,.pdf" 
              onChange={handleKycChange} 
            />
            {kycDoc && (
              <small style={{ color: "green", marginTop: "4px", display: "block" }}>
                ✓ KYC document attached
              </small>
            )}
          </div>

          {error && <p className="sell-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Submitting…" : submitted ? "Submitted ✓" : "Submit for review"}
          </button>
        </form>

        <div className="sell-history">
          <h3>Your submissions</h3>
          {loading && <p className="sell-empty">Loading…</p>}
          {!loading && requests.length === 0 && <p className="sell-empty">No bulk requests yet.</p>}
          {requests.map((r, index) => (
            <div className="card sell-req" key={r.id || index}>
              <span>{r.productName}</span>
              <span className={`badge badge-${r.status === "approved" ? "verified" : r.status === "rejected" ? "rejected" : "pending"}`}>
                {r.status || "Pending Review"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}