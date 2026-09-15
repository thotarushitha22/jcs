import { useEffect, useState } from "react";
import {
  X,
  MapPin,
  LocateFixed,
  Search,
  Building2,
  CircleCheck,
} from "lucide-react";
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

  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [location, setLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("jcs_location");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /*
   * Save selected delivery location
   */
  const selectLocation = (label, gps = false, details = {}) => {
    const loc = {
      label,
      gps,
      city: details.city || "",
      state: details.state || "",
      pincode: details.pincode || "",
      displayName: details.displayName || label,
      latitude: details.latitude || null,
      longitude: details.longitude || null,
    };

    setLocation(loc);

    localStorage.setItem(
      "jcs_location",
      JSON.stringify(loc)
    );

    setOpen(false);
    setQuery("");
    setSearchResults([]);
  };

  /*
   * Auto-detect current location
   */
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
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          if (!res.ok) {
            throw new Error("Location lookup failed");
          }

          const data = await res.json();

          const address = data.address || {};

          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            "";

          const state = address.state || "";

          const pincode = address.postcode || "";

          const label = [city, state]
            .filter(Boolean)
            .join(", ");

          selectLocation(
            label || "Current location",
            true,
            {
              city,
              state,
              pincode,
              displayName: data.display_name || label,
              latitude,
              longitude,
            }
          );
        } catch (error) {
          console.error("Location detection error:", error);

          alert(
            "Couldn't determine your location. Please search for your delivery city or PIN code."
          );
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);

        setDetecting(false);

        alert(
          "Location access was denied. Please search for your delivery location instead."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  /*
   * Search real locations using OpenStreetMap Nominatim
   */
  useEffect(() => {
    const searchText = query.trim();

    if (!open || searchText.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=json` +
          `&addressdetails=1` +
          `&limit=8` +
          `&countrycodes=in` +
          `&q=${encodeURIComponent(searchText)}`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Location search failed");
        }

        const data = await response.json();

        setSearchResults(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Location search error:", error);
          setSearchResults([]);
        }
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  /*
   * Select result from real location search
   */
  const selectSearchResult = (result) => {
    const address = result.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      "";

    const state = address.state || "";

    const pincode = address.postcode || "";

    const label = [city, state]
      .filter(Boolean)
      .join(", ");

    selectLocation(
      label || result.display_name,
      false,
      {
        city,
        state,
        pincode,
        displayName: result.display_name,
        latitude: result.lat,
        longitude: result.lon,
      }
    );
  };

  /*
   * Local popular hubs
   */
  const filteredHubs = HUBS.filter(
    (hub) =>
      hub.city
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      hub.area
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  return (
    <>
      {/* NAVBAR LOCATION BUTTON */}

      <button
        className="nav-location"
        onClick={() => setOpen(true)}
        type="button"
      >
        <MapPin size={15} />

        <span>
          <small>Deliver to</small>

          <strong>
            {location?.label || "Select State/City"}
          </strong>
        </span>
      </button>

      {/* LOCATION MODAL */}

      {open && (
        <div
          className="loc-backdrop"
          onClick={() => setOpen(false)}
        >
          <div
            className="loc-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}

            <button
              className="loc-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
              type="button"
            >
              <X size={18} />
            </button>

            {/* HEADER */}

            <div className="loc-header">
              <div className="loc-header-icon">
                <MapPin size={20} />
              </div>

              <div>
                <h2>Select Delivery Location</h2>

                <p>
                  Choose where you want your wholesale
                  stock delivered.
                </p>
              </div>
            </div>

            {/* GPS */}

            <button
              className="loc-detect"
              onClick={detectCurrentLocation}
              disabled={detecting}
              type="button"
            >
              <LocateFixed size={18} />

              <span>
                <strong>
                  {detecting
                    ? "Detecting your location…"
                    : "Auto-Detect My Location"}
                </strong>

                <small>
                  Use your current GPS location
                </small>
              </span>
            </button>

            {/* CURRENT LOCATION */}

            {location && (
              <div className="loc-current">
                <span className="loc-current-label">
                  Currently Selected:
                </span>

                <span className="loc-current-dot" />

                <strong>
                  {location.label}
                </strong>

                {location.gps && (
                  <span className="loc-gps-badge">
                    <CircleCheck size={12} />
                    GPS Verified
                  </span>
                )}
              </div>
            )}

            {/* SEARCH */}

            <div className="loc-search">
              <Search size={16} />

              <input
                type="text"
                placeholder="Search city, area or PIN code…"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                autoFocus
              />
            </div>

            {/* SEARCH RESULTS */}

            {query.trim().length >= 2 && (
              <div className="loc-search-results">
                {searching && (
                  <div className="loc-search-loading">
                    Searching delivery locations…
                  </div>
                )}

                {!searching &&
                  searchResults.length === 0 && (
                    <div className="loc-empty">
                      No matching location found.
                      <br />
                      Try another city, area or PIN code.
                    </div>
                  )}

                {!searching &&
                  searchResults.map((result, index) => {
                    const address =
                      result.address || {};

                    const city =
                      address.city ||
                      address.town ||
                      address.village ||
                      address.municipality ||
                      address.county ||
                      "";

                    const state =
                      address.state || "";

                    const pincode =
                      address.postcode || "";

                    return (
                      <button
                        key={`${result.place_id}-${index}`}
                        className="loc-result"
                        onClick={() =>
                          selectSearchResult(result)
                        }
                        type="button"
                      >
                        <MapPin size={17} />

                        <span>
                          <strong>
                            {city ||
                              result.display_name}
                          </strong>

                          <small>
                            {[
                              address.suburb ||
                                address.neighbourhood,
                              state,
                              pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </small>
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* POPULAR HUBS */}

            {!query.trim() && (
              <>
                <div className="loc-section-label">
                  <Building2 size={14} />

                  Popular Hubs
                </div>

                <div className="loc-grid">
                  {filteredHubs.map((hub) => {
                    const isSelected =
                      location?.label?.startsWith(
                        hub.city
                      );

                    return (
                      <button
                        key={hub.city}
                        className={`loc-card ${
                          isSelected
                            ? "loc-card-active"
                            : ""
                        }`}
                        onClick={() =>
                          selectLocation(
                            `${hub.city}, India`,
                            false,
                            {
                              city: hub.city,
                              state: "",
                            }
                          )
                        }
                        type="button"
                      >
                        <strong>
                          {hub.city}
                        </strong>

                        <span>
                          {hub.area}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}