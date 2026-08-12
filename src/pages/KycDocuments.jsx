import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Upload, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./KycDocuments.css";

export default function KycDocuments() {
  const { user } = useAuth();
  const storageKey = `jcs_kyc_docs_${user?.id ?? "guest"}`;

  const [docs, setDocs] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(docs));
  }, [docs, storageKey]);

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newDocs = files.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: (f.size / 1024).toFixed(0) + " KB",
      uploadedAt: new Date().toISOString(),
    }));
    setDocs((prev) => [...newDocs, ...prev]);
    e.target.value = "";
  };

  const removeDoc = (id) => setDocs((prev) => prev.filter((d) => d.id !== id));

  return (
    <div className="page container kyc">
      <div className="kyc-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>KYC Documents</span>
      </div>
      <h1>KYC Documents</h1>

      <div className="card kyc-status">
        <span>Verification status</span>
        <span className={`badge badge-${user?.kycStatus === "verified" ? "verified" : user?.kycStatus === "rejected" ? "rejected" : "pending"}`}>
          {user?.kycStatus ?? "pending"}
        </span>
      </div>

      <div className="card kyc-upload">
        <h3>Upload a document</h3>
        <p>GST certificate, business PAN, or ID proof — PDF or image.</p>
        <label className="btn btn-outline kyc-upload-btn">
          <Upload size={15} /> Choose file(s)
          <input type="file" accept="image/*,.pdf" multiple onChange={handleFile} hidden />
        </label>
        <p className="kyc-note">Files listed here are tracked on this device for now — full document storage is coming soon.</p>
      </div>

      <h3 className="kyc-list-heading">Uploaded documents</h3>
      {docs.length === 0 ? (
        <p className="kyc-empty">No documents uploaded yet.</p>
      ) : (
        <div className="kyc-list">
          {docs.map((d) => (
            <div className="card kyc-item" key={d.id}>
              <FileText size={18} />
              <div className="kyc-item-info">
                <span className="kyc-item-name">{d.name}</span>
                <span className="kyc-item-meta">{d.size} · {new Date(d.uploadedAt).toLocaleDateString("en-IN")}</span>
              </div>
              <button className="kyc-remove" onClick={() => removeDoc(d.id)} aria-label="Remove document">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}