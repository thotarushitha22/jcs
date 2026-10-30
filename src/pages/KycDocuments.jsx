import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Tesseract from "tesseract.js"; // <-- Import OCR Engine

export default function KycDocuments() {
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    const saved = localStorage.getItem("jcs_kyc_documents");
    return saved ? JSON.parse(saved) : [];
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    localStorage.setItem("jcs_kyc_documents", JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  const status = uploadedFiles.length > 0 ? "VERIFIED" : "PENDING";

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsScanning(true);
    setScanProgress(0);
    const newUploads = [];

    for (const file of files) {
      // 1. Check if it's an image (OCR only works on images, not PDFs in browser)
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image (JPG/PNG) for automatic scanning. PDFs cannot be scanned.");
        continue;
      }

      try {
        toast.loading("Scanning document...", { id: "ocr_scan" });

        // 2. Run OCR Engine
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setScanProgress(Math.round(m.progress * 100));
            }
          }
        });

        // 3. Get extracted text
        const text = result.data.text.toUpperCase().replace(/\s+/g, " "); // Remove weird spaces

        // 4. Validate Patterns
        // PAN Regex: 5 Letters, 4 Numbers, 1 Letter (e.g. ABCDE1234F)
        const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
        // GST Regex: 2 Numbers, 10 Characters, 1 Letter, 1 Number, Z, 1 Number (e.g. 22AAAAA0000A1Z5)
        const gstRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/;

        let detectedType = "";
        let isValid = false;

        if (panRegex.test(text)) {
          detectedType = "PAN Card";
          isValid = true;
        } else if (gstRegex.test(text)) {
          detectedType = "GST Certificate";
          isValid = true;
        }

        toast.dismiss("ocr_scan");

        // 5. Handle Result
        if (isValid) {
          const fileUrl = URL.createObjectURL(file);
          newUploads.push({
            id: Date.now() + Math.random(),
            name: file.name,
            type: detectedType,
            size: (file.size / 1024).toFixed(1) + " KB",
            url: fileUrl,
            date: new Date().toLocaleDateString(),
          });
          toast.success(`Valid ${detectedType} detected!`);
        } else {
          toast.error(`Invalid Document: Could not detect a valid PAN or GST number in this image.`);
        }

      } catch (err) {
        toast.dismiss("ocr_scan");
        console.error(err);
        toast.error("Failed to scan document. Please try again.");
      }
    }

    if (newUploads.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newUploads]);
    }

    setIsScanning(false);
    e.target.value = ""; 
  };

  const handleRemove = (idToRemove) => {
    if (!window.confirm("Are you sure you want to remove this document?")) return;
    setUploadedFiles((prev) => prev.filter((doc) => doc.id !== idToRemove));
    toast.success("Document removed.");
  };

  return (
    <div className="page container account" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      
      <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
        <Link to="/account" style={{ color: "#2563eb", textDecoration: "none" }}>My Account</Link>
        <span style={{ margin: "0 8px" }}>›</span>
        <span>KYC Documents</span>
      </div>

      <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", marginBottom: "24px" }}>
        KYC Documents
      </h1>

      {/* Status Card */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <span style={{ fontSize: "16px", color: "#334155" }}>Verification status</span>
        <span style={{ 
          background: status === "PENDING" ? "#fef3c7" : "#dcfce7", 
          color: status === "PENDING" ? "#92400e" : "#166534",
          padding: "6px 16px", 
          borderRadius: "20px", 
          fontSize: "13px", 
          fontWeight: "700",
          display: "flex", alignItems: "center", gap: "6px"
        }}>
          {status === "VERIFIED" && <CheckCircle2 size={14} />}
          {status}
        </span>
      </div>

      {/* Upload Card */}
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Upload a document</h2>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
          Upload a clear image (JPG/PNG) of your PAN Card or GST Certificate. Our system will automatically scan and verify it.
        </p>

        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: isScanning ? "not-allowed" : "pointer", background: "#f8fafc", fontWeight: "600", color: "#334155", opacity: isScanning ? 0.7 : 1 }}>
          {isScanning ? <Loader2 size={18} className="spin" /> : <Upload size={18} />}
          {isScanning ? `Scanning... ${scanProgress}%` : "Choose image to scan"}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileUpload} 
            disabled={isScanning}
            style={{ display: "none" }} 
          />
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", fontSize: "12px", color: "#64748b" }}>
          <AlertCircle size={14} /> 
          <span>Note: The image must clearly show the PAN number (e.g. ABCDE1234F) or GSTIN (e.g. 22AAAAA0000A1Z5) for verification to succeed.</span>
        </div>
      </div>

      {/* Uploaded Documents List */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>
            Verified Documents ({uploadedFiles.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {uploadedFiles.map((file) => (
              <div key={file.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", background: "#dcfce7", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#166534" }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>{file.name}</div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                      <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
                        {file.type}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{file.size}</span>
                    </div>
                  </div>
                </div>
                
                <button onClick={() => handleRemove(file.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}