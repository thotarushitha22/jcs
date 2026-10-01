import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Trash2, Star, Home, Briefcase, Map, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./MyAddress.css";

export default function MyAddress() {
  const { user } = useAuth();
  
  // Create a reliable storage key supporting both user-specific and fallback storage
  const userId = user?.id || user?.userId || user?._id;
  const storageKey = userId ? `jcs_addresses_${userId}` : "jcs_addresses_guest";

  const [addresses, setAddresses] = useState(() => {
    // Check primary user/guest key first
    let saved = localStorage.getItem(storageKey);
    
    // If empty, check general fallback keys so addresses never get lost on refresh
    if (!saved || JSON.parse(saved || "[]").length === 0) {
      for (const key of [storageKey, "jcs_addresses", "addresses", "saved_addresses"]) {
        const data = localStorage.getItem(key);
        if (data && JSON.parse(data).length > 0) {
          saved = data;
          break;
        }
      }
    }
    return saved ? JSON.parse(saved) : [];
  });
  
  const [form, setForm] = useState({ 
    name: "", 
    type: "Home", 
    line: "", 
    city: "", 
    state: "", 
    pincode: "", 
    lat: 16.5062, 
    lng: 80.6480 // Default coordinates (e.g., Vijayawada center)
  });

  useEffect(() => {
    if (addresses.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(addresses));
      // Also update general fallback keys for cross-page compatibility with checkout
      localStorage.setItem("addresses", JSON.stringify(addresses));
    }
  }, [addresses, storageKey]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Simulate picking current location or using geolocation
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((f) => ({
            ...f,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          alert("GPS Location pinned successfully!");
        },
        () => {
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const newAddr = { id: Date.now(), ...form, isDefault: addresses.length === 0 };
    setAddresses((prev) => [...prev, newAddr]);
    setForm({ name: "", type: "Home", line: "", city: "", state: "", pincode: "", lat: 16.5062, lng: 80.6480 });
  };

  const removeAddress = (id) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (updated.length === 0) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem("addresses");
    }
  };

  const setDefault = (id) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  const getAddressIcon = (type) => {
    if (type === "Work") return <Briefcase size={16} />;
    if (type === "Home") return <Home size={16} />;
    return <Map size={16} />;
  };

  return (
    <div className="page container myaddr">
      <div className="myaddr-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>My Address</span>
      </div>
      <h1>My Address</h1>

      <div className={`myaddr-grid ${addresses.length === 0 ? "myaddr-grid-empty" : ""}`}>
        <div className="myaddr-list">
          {addresses.length === 0 && <p className="myaddr-empty">No saved addresses yet — add one to speed up checkout.</p>}
          {addresses.map((a) => (
            <div className="card myaddr-item" key={a.id}>
              <div className="myaddr-item-icon">{getAddressIcon(a.type)}</div>
              <div className="myaddr-item-info">
                <div className="myaddr-item-head">
                  <strong>{a.name || "Customer Name"}</strong>
                  <span className="badge">{a.type || "Home"}</span>
                  {a.isDefault && <span className="badge badge-verified">Default</span>}
                </div>
                <span>{a.line}, {a.city}, {a.state} — {a.pincode}</span>
                
                {/* Embedded Google Maps Preview Frame */}
                <div className="myaddr-map-preview">
                  <iframe
                    title={`map-${a.id}`}
                    width="100%"
                    height="110"
                    style={{ border: 0, borderRadius: "6px", marginTop: "8px" }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${a.lat},${a.lng}&z=15&output=embed`}
                  ></iframe>
                </div>
              </div>
              <div className="myaddr-item-actions">
                {!a.isDefault && (
                  <button onClick={() => setDefault(a.id)} aria-label="Set as default" title="Set as default">
                    <Star size={15} />
                  </button>
                )}
                <button onClick={() => removeAddress(a.id)} aria-label="Remove address" title="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form className="card myaddr-form" onSubmit={handleAdd}>
          <h3>Add a new address</h3>
          <div className="field">
            <label>User / Customer Name</label>
            <input required value={form.name} onChange={update("name")} placeholder="Enter full name" />
          </div>
          <div className="field">
            <label>Address Type</label>
            <select value={form.type} onChange={update("type")}>
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="field"><label>Address line</label><input required value={form.line} onChange={update("line")} placeholder="Shop no, street, area" /></div>
          <div className="row">
            <div className="field"><label>City</label><input required value={form.city} onChange={update("city")} /></div>
            <div className="field"><label>State</label><input required value={form.state} onChange={update("state")} /></div>
          </div>
          <div className="field">
            <label>PIN / Postal code</label>
            <input required value={form.pincode} onChange={update("pincode")} placeholder="Postal code" />
          </div>

          {/* Google Maps Location Pin Tool */}
          <div className="field">
            <label>Google Maps Pin Point</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button type="button" className="btn btn-secondary" onClick={handleDetectLocation} style={{ fontSize: "12px", padding: "8px 12px", display: "flex", gap: "6px", alignItems: "center" }}>
                <Compass size={14} /> Detect Current GPS Pin
              </button>
            </div>
            <div style={{ fontSize: "11px", color: "var(--slate)", marginTop: "6px" }}>
              Pinned Coords: {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
            </div>
            <div style={{ marginTop: "8px" }}>
              <iframe
                title="form-map-preview"
                width="100%"
                height="100"
                style={{ border: 0, borderRadius: "6px" }}
                src={`https://maps.google.com/maps?q=${form.lat},${form.lng}&z=14&output=embed`}
              ></iframe>
            </div>
          </div>

          <button className="btn btn-primary btn-block" style={{ marginTop: "12px" }}>Save address</button>
        </form>
      </div>
    </div>
  );
}