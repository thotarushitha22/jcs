import { useEffect, useState } from "react";
import { X, MapPin, LocateFixed, Search, Building2, CircleCheck } from "lucide-react";
import "./LocationPicker.css";

const HUBS = [
  { city: "Bengaluru", area: "Electronic City & Whitefield" },
  { city: "Mumbai", area: "BKC & Lower Parel" },
  { city: "Delhi NCR", area: "Cyber City & Noida" },
  { city: "Hyderabad", area: "HITEC City & Gachibowli" },
  { city: "Chennai", area: "OMR & Guindy" },
  { city: "Pune", area: "Hinjawadi & Kharadi" },
  { city: "Kolkata", area: "Salt Lake & Park Street" },
  { city: "Ahmedabad", area: "SG Highway & Prahladnagar" },
];

export default function LocationPicker() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("jcs_location");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const selectLocation = (label, gps = false) => {
    const loc = { label, gps };
    setLocation(loc);
    localStorage.setItem("jcs_location", JSON.stringify(loc));
    setOpen(false);
    setQuery("");
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Location access isn't supported in this browser.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.county;
          const state = data.address?.state;
          const label = [city, state].filter(Boolean).join(", ") || "Current location";
          selectLocation(label, true);
        } catch {
          alert("Couldn't determine your city — try picking a hub below instead.");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        alert("Location access was denied — pick a hub below instead.");
      }
    );
  };

  const filteredHubs = HUBS.filter(
    (h) => h.city.toLowerCase().includes(query.toLowerCase()) || h.area.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <button className="nav-location" onClick={() => setOpen(true)}>
        <MapPin size={15} />
        <span>
          <small>Deliver to</small>
          <strong>{location?.label || "Select State/City"}</strong>
        </span>
      </button>

      {open && (
        <div className="loc-backdrop" onClick={() => setOpen(false)}>
          <div className="loc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="loc-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>

            <div className="loc-header">
              <div className="loc-header-icon"><MapPin size={20} /></div>
              <div>
                <h2>Select Delivery Location</h2>
                <p>We dispatch wholesale stock to retail hubs and warehouses nationwide.</p>
              </div>
            </div>

            <button className="loc-detect" onClick={detectCurrentLocation} disabled={detecting}>
              <LocateFixed size={18} />
              <span>
                <strong>{detecting ? "Detecting your location…" : "Auto-Detect My Location"}</strong>
                <small>Using GPS &amp; IP geolocation</small>
              </span>
            </button>

            {location && (
              <div className="loc-current">
                <span className="loc-current-label">Currently Selected:</span>
                <span className="loc-current-dot" />
                <strong>{location.label}</strong>
                {location.gps && (
                  <span className="loc-gps-badge"><CircleCheck size={12} /> GPS Verified</span>
                )}
              </div>
            )}

            <div className="loc-search">
              <Search size={16} />
              <input
                placeholder="Search city, state or pincode…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="loc-section-label">
              <Building2 size={14} /> Popular Hubs
            </div>

            <div className="loc-grid">
              {filteredHubs.length === 0 && <p className="loc-empty">No matching cities.</p>}
              {filteredHubs.map((h) => {
                const isSelected = location?.label?.startsWith(h.city);
                return (
                  <button
                    key={h.city}
                    className={`loc-card ${isSelected ? "loc-card-active" : ""}`}
                    onClick={() => selectLocation(h.city)}
                  >
                    <strong>{h.city}</strong>
                    <span>{h.area}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}