import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMe } from "../api/auth";
import "./AccountInfo.css";

export default function AccountInfo() {
  const { user: cachedUser } = useAuth();
  const [user, setUser] = useState(cachedUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page container"><p>Loading…</p></div>;
  }

  return (
    <div className="page container acc-info">
      <div className="acc-info-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>Account Information</span>
      </div>
      <h1>Account Information</h1>

      <div className="card acc-info-card">
        <div className="acc-info-row">
          <span>Business name</span>
          <strong>{user?.name}</strong>
        </div>
        <div className="acc-info-row">
          <span>Email</span>
          <strong>{user?.email}</strong>
        </div>
        <div className="acc-info-row">
          <span>Account type</span>
          <strong className="acc-info-capitalize">{user?.role}</strong>
        </div>
        <div className="acc-info-row">
          <span>GSTIN</span>
          <strong>{user?.gstNumber || "Not provided"}</strong>
        </div>
        <div className="acc-info-row">
          <span>KYC status</span>
          <span className={`badge badge-${user?.kycStatus === "verified" ? "verified" : user?.kycStatus === "rejected" ? "rejected" : "pending"}`}>
            {user?.kycStatus}
          </span>
        </div>
      </div>

      <p className="acc-info-note">
        Need to update these details? Contact <a href="mailto:info@jcsglobal.example">support</a> —
        profile edits go through verification to keep your GST details accurate.
      </p>
    </div>
  );
}