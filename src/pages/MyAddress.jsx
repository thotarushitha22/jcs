import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Trash2, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./MyAddress.css";

export default function MyAddress() {
  const { user } = useAuth();
  const storageKey = `jcs_addresses_${user?.id ?? "guest"}`;

  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm] = useState({ label: "", line: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(addresses));
  }, [addresses, storageKey]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = (e) => {
    e.preventDefault();
    const newAddr = { id: Date.now(), ...form, isDefault: addresses.length === 0 };
    setAddresses((prev) => [...prev, newAddr]);
    setForm({ label: "", line: "", city: "", state: "", pincode: "" });
  };

  const removeAddress = (id) => setAddresses((prev) => prev.filter((a) => a.id !== id));

  const setDefault = (id) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  return (
    <div className="page container myaddr">
      <div className="myaddr-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>My Address</span>
      </div>
      <h1>My Address</h1>

      <div className="myaddr-grid">
        <div className="myaddr-list">
          {addresses.length === 0 && <p className="myaddr-empty">No saved addresses yet — add one to speed up checkout.</p>}
          {addresses.map((a) => (
            <div className="card myaddr-item" key={a.id}>
              <div className="myaddr-item-icon"><MapPin size={16} /></div>
              <div className="myaddr-item-info">
                <div className="myaddr-item-head">
                  <strong>{a.label || "Address"}</strong>
                  {a.isDefault && <span className="badge badge-verified">Default</span>}
                </div>
                <span>{a.line}, {a.city}, {a.state} — {a.pincode}</span>
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
          <div className="field"><label>Label</label><input required value={form.label} onChange={update("label")} placeholder="Warehouse, Shop, etc." /></div>
          <div className="field"><label>Address line</label><input required value={form.line} onChange={update("line")} placeholder="Shop no, street, area" /></div>
          <div className="row">
            <div className="field"><label>City</label><input required value={form.city} onChange={update("city")} /></div>
            <div className="field"><label>State</label><input required value={form.state} onChange={update("state")} /></div>
          </div>
          <div className="field"><label>PIN code</label><input required value={form.pincode} onChange={update("pincode")} maxLength={6} /></div>
          <button className="btn btn-primary btn-block">Save address</button>
        </form>
      </div>
    </div>
  );
}