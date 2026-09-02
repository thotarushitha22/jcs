import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, MapPin, HelpCircle } from "lucide-react";
import { fetchProduct, fetchRelatedProducts } from "../api/products";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [pincode, setPincode] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  const [selected, setSelected] = useState({
    storage: "",
    colors: ""
  });

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchProduct(id)
      .then((data) => {
        const productData = {
          ...data,
          variants: data.variants || {
            storage: ["128 GB", "256 GB", "512 GB"],
            colors: ["Midnight Black", "Frost Silver", "Ocean Blue"]
          }
        };

        setProduct(productData);
        setQty(1);
        setActiveImage(0);
        
        const storageOptions = 
          productData.variants?.storage || 
          productData.variants?.gb || 
          (Array.isArray(productData.storage) ? productData.storage : productData.storage ? [productData.storage] : []);

        const colorOptions = 
          productData.variants?.colors || 
          productData.variants?.colour || 
          productData.variants?.colorOptions || 
          (Array.isArray(productData.colour) ? productData.colour : productData.colour ? [productData.colour] : []);
        
        setSelected({
          storage: storageOptions[0] || "",
          colors: colorOptions[0] || ""
        });
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    fetchRelatedProducts(id)
      .then((data) => {
        setRelated(data);
      })
      .catch(() => {
        setRelated([]);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="page container pd-loading">
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page container pd-loading">
        <p>
          That listing is not available anymore.{" "}
          <Link to="/">Back to browse</Link>
        </p>
      </div>
    );
  }

  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || product.mrpPrice || product.originalPrice || 0);

  const gallery = (() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    const singleImage = product.image || product.imageUrl || product.img;
    return singleImage ? [singleImage] : [];
  })();

  const outOfStock = Number(product.stock || 0) <= 0;

  const handleAdd = () => {
    if (outOfStock) return;
    addToCart({ ...product, selectedVariants: selected }, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addToCart({ ...product, selectedVariants: selected }, qty);
    navigate("/cart");
  };

  const increaseQuantity = () => {
    setQty((currentQty) => currentQty + 1);
  };

  const decreaseQuantity = () => {
    setQty((currentQty) => Math.max(1, currentQty - 1));
  };

  const checkDelivery = (event) => {
    event.preventDefault();
    if (/^[1-6][0-9]{5}$/.test(pincode)) {
      setDeliveryStatus("ok");
    } else {
      setDeliveryStatus("unavailable");
    }
  };

  const selectVariant = (group, value) => {
    setSelected((previous) => ({
      ...previous,
      [group]: value,
    }));
  };

  const prodOverview = product.overview || product.description || product.details || product.about;
  const prodColour = product.colour || product.color;
  const prodStorage = product.storage || product.storageCapacity || product.gb;
  const prodRam = product.ram || product.memory;

  const variantStorage = 
    product.variants?.storage || 
    product.variants?.gb || 
    (Array.isArray(product.storage) ? product.storage : product.storage ? [product.storage] : []);

  const variantColors = 
    product.variants?.colors || 
    product.variants?.colour || 
    product.variants?.colorOptions || 
    (Array.isArray(product.colour) ? product.colour : product.colour ? [product.colour] : []);

  // Category-based dynamic highlights
  const categoryLower = (product.category || "").toLowerCase();
  
  const getHighlights = () => {
    if (categoryLower.includes("laptop") || categoryLower.includes("notebook")) {
      return [
        { icon: "⚡", text: `${prodRam || "16 GB RAM"} | ${prodStorage || "512 GB SSD"}` },
        { icon: "💻", text: product.processor || "High Performance Processor" },
        { icon: "🖥️", text: product.screenSize || "15.6 inch Display" },
        { icon: "🔋", text: product.battery || "Long-lasting Battery Life" },
        { icon: "🪶", text: product.weight || "Lightweight & Portable Build" }
      ];
    } else if (categoryLower.includes("tv") || categoryLower.includes("television")) {
      return [
        { icon: "📺", text: product.screenSize || "55 inch 4K UHD Display" },
        { icon: "🔊", text: product.audio || "Dolby Audio & Surround Sound" },
        { icon: "🔌", text: product.ports || "Multiple HDMI & USB Ports" },
        { icon: "🌐", text: product.os || "Smart TV OS with Built-in Apps" }
      ];
    } else if (categoryLower.includes("accessory") || categoryLower.includes("accessories") || categoryLower.includes("audio")) {
      return [
        { icon: "🎧", text: product.connectivity || "Wireless Bluetooth Connectivity" },
        { icon: "🔋", text: product.battery || "Extended Playback Hours" },
        { icon: "🛡️", text: product.build || "Ergonomic & Durable Design" }
      ];
    } else {
      return [
        { icon: "⚡", text: `${prodRam || "4 GB RAM"} | ${prodStorage || "64 GB ROM"}` },
        { icon: "💻", text: product.processor || "Octa Core Processor" },
        { icon: "📷", text: product.rearCamera || "50MP + 2MP Rear Camera" },
        { icon: "📸", text: product.frontCamera || "8MP Front Camera" },
        { icon: "📱", text: product.screenSize || "6.7 inch display" },
        { icon: "🔋", text: product.battery || "5000 mAh Battery" }
      ];
    }
  };

  const dynamicHighlights = getHighlights();

  return (
    <main className="page pd">
      <Link to="/" className="pd-back">
        ← Back to browse
      </Link>

      <div className="pd-grid">
        {/* PRODUCT IMAGE */}
        <section className="pd-gallery">
          <div className="pd-image">
            {gallery[activeImage] ? (
              <img
                src={gallery[activeImage]}
                alt={product.title}
              />
            ) : (
              <div className="pd-no-image">
                Product image unavailable
              </div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="pd-thumbs">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`pd-thumb ${
                    index === activeImage
                      ? "pd-thumb-active"
                      : ""
                  }`}
                  onClick={() => setActiveImage(index)}
                  aria-label={`View product image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`${product.title} view ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* PRODUCT DETAILS */}
        <section className="pd-info">
          <div className="pd-title-row">
            {product.verified && (
              <span className="badge badge-verified">
                VERIFIED SUPPLIER
              </span>
            )}

            {outOfStock && (
              <span className="badge badge-rejected">
                OUT OF STOCK
              </span>
            )}
          </div>

          {product.brand && (
            <span className="pd-brand">
              {product.brand}
            </span>
          )}

          <h1 className="pd-title">
            {product.title}
          </h1>

          {product.rating && (
            <div className="pd-rating">
              <Star
                size={17}
                fill="currentColor"
              />

              <span>
                {product.rating}
              </span>

              {product.reviewCount && (
                <span className="pd-rating-count">
                  ({product.reviewCount} reviews)
                </span>
              )}
            </div>
          )}

          {/* PRICE */}
          <div className="pd-price-row">
            <span className="mono pd-price">
              ₹{price.toLocaleString("en-IN")}
            </span>

            {mrp > 0 && (
              <span className="mono pd-mrp">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}

            <span className="pd-per">
              per unit, excl. GST
            </span>
          </div>

          {/* PRODUCT IDS */}
          <div className="pd-ids mono">
            {product.sku && (
              <>
                SKU: {product.sku}
              </>
            )}

            {product.model && (
              <>
                {" · "}
                Model: {product.model}
              </>
            )}

            {product.gstPercent !== undefined && (
              <>
                {" · "}
                GST: {product.gstPercent}%
              </>
            )}
          </div>

          {/* OUT OF STOCK */}
          {outOfStock ? (
            <div className="pd-oos-banner">
              <strong>
                Currently out of stock.
              </strong>

              {" "}
              This product is temporarily unavailable.
              Please check again later.
            </div>
          ) : (
            <>
              {/* STOCK */}
              <div className="pd-specs">
                <div>
                  <span>In stock</span>

                  <b>
                    {Number(product.stock || 0).toLocaleString(
                      "en-IN"
                    )}{" "}
                    units
                  </b>
                </div>

                <div>
                  <span>Dispatch</span>

                  <b>
                    within 24 hrs
                  </b>
                </div>
              </div>

              {/* QUANTITY */}
              <div className="pd-qty">
                <label>
                  Quantity
                </label>

                <div className="pd-qty-controls">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <span className="mono">
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="pd-cta-row">
                <button
                  type="button"
                  className="btn btn-outline pd-cta"
                  onClick={handleAdd}
                >
                  {added
                    ? "Added to cart ✓"
                    : "Add to cart"}
                </button>

                <button
                  type="button"
                  className="btn btn-primary pd-cta"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </button>
              </div>
            </>
          )}

          {/* PINCODE */}
          <form
            className="pd-delivery"
            onSubmit={checkDelivery}
          >
            <MapPin size={17} />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter delivery pincode"
              value={pincode}
              maxLength={6}
              onChange={(event) => {
                const value =
                  event.target.value.replace(
                    /\D/g,
                    ""
                  );

                setPincode(value);
                setDeliveryStatus(null);
              }}
            />

            <button
              type="submit"
              className="btn btn-outline"
            >
              Check
            </button>
          </form>

          {deliveryStatus === "ok" && (
            <p className="pd-delivery-ok">
              Deliverable to {pincode}. Dispatch
              within 24 hours.
            </p>
          )}

          {deliveryStatus === "unavailable" && (
            <p className="pd-delivery-bad">
              Enter a valid 6-digit Indian pincode.
            </p>
          )}

          {/* HIGHLIGHTS BOX */}
          <div className="pd-highlights-box">
            <div className="pd-highlight-item">
              <span className="pd-highlight-icon">🛡️</span>
              <div>
                <strong>1 Year Warranty</strong>
                <p>Manufacturer assured</p>
              </div>
            </div>
            <div className="pd-highlight-item">
              <span className="pd-highlight-icon">🔄</span>
              <div>
                <strong>Easy Returns</strong>
                <p>7-day policy</p>
              </div>
            </div>
            <div className="pd-highlight-item">
              <span className="pd-highlight-icon">⚡</span>
              <div>
                <strong>Fast Dispatch</strong>
                <p>Ships in 24 hrs</p>
              </div>
            </div>
          </div>

          {/* INTERACTIVE VARIANTS */}
          {(variantStorage.length > 0 || variantColors.length > 0) && (
            <div className="pd-variants">
              {variantStorage.length > 0 && (
                <VariantGroup
                  label="Storage Capacity"
                  options={variantStorage}
                  group="storage"
                  selected={selected}
                  onSelect={selectVariant}
                />
              )}

              {variantColors.length > 0 && (
                <VariantGroup
                  label="Colour Options"
                  options={variantColors}
                  group="colors"
                  selected={selected}
                  onSelect={selectVariant}
                />
              )}
            </div>
          )}

          <p className="pd-note">
            Payment is secured at checkout.
            Orders are verified against your
            GST profile before dispatch.
          </p>
        </section>
      </div>

      {/* DYNAMIC PRODUCT HIGHLIGHTS LIST */}
      <section className="pd-section">
        <h2>Product highlights</h2>
        <div className="pd-highlights-list">
          {dynamicHighlights.map((highlight, index) => (
            <div key={index} className="pd-highlights-row">
              <span className="pd-highlight-icon">{highlight.icon}</span>
              <span>{highlight.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* OVERVIEW / DESCRIPTION */}
      <section className="pd-section">
        <h2>
          Overview / Description
        </h2>

        <p className="pd-overview">
          {prodOverview || "Engineered for optimal reliability and peak performance, this premium model features durable building architecture and high fidelity output designed for everyday enterprise and consumer workflows."}
        </p>
      </section>

      {/* SPECIFICATIONS */}
      <section className="pd-section">
        <h2>Specifications</h2>
        <div className="pd-spec-grid">
          {product.title && <div className="pd-spec-item"><strong>Product Title:</strong> {product.title}</div>}
          {product.brand && <div className="pd-spec-item"><strong>Brand:</strong> {product.brand}</div>}
          {product.category && <div className="pd-spec-item"><strong>Category:</strong> {product.category}</div>}
          {prodColour && <div className="pd-spec-item"><strong>Colour:</strong> {prodColour}</div>}
          {prodStorage && <div className="pd-spec-item"><strong>Storage Capacity:</strong> {prodStorage}</div>}
          {prodRam && <div className="pd-spec-item"><strong>RAM:</strong> {prodRam}</div>}
          {product.screenSize && <div className="pd-spec-item"><strong>Screen Size:</strong> {product.screenSize}</div>}
          {product.processor && <div className="pd-spec-item"><strong>Processor:</strong> {product.processor}</div>}
          {product.battery && <div className="pd-spec-item"><strong>Battery:</strong> {product.battery}</div>}
          {product.weight && <div className="pd-spec-item"><strong>Weight:</strong> {product.weight}</div>}
          {price > 0 && <div className="pd-spec-item"><strong>Price:</strong> ₹{price.toLocaleString("en-IN")}</div>}
          {mrp > 0 && <div className="pd-spec-item"><strong>MRP:</strong> ₹{mrp.toLocaleString("en-IN")}</div>}
          {product.stock !== undefined && <div className="pd-spec-item"><strong>Stock:</strong> {product.stock}</div>}
          {product.moq && <div className="pd-spec-item"><strong>MOQ:</strong> {product.moq}</div>}
        </div>
      </section>

      {/* WARRANTY AND SUPPORT */}
      <section className="pd-section">
        <h2>
          Warranty and support
        </h2>

        <p className="pd-overview">
          {product.warranty || "1 Year Manufacturer Warranty covering device hardware defects, functional malfunctions, and standard factory faults. Physical or liquid damages are excluded."}
        </p>

        <p className="pd-overview">
          For technical assistance or authorized service center routing, contact support at{" "}
          <a
            href="mailto:support@example.com"
            className="pd-link"
          >
            support@example.com
          </a>
          .
        </p>
      </section>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="pd-section">
          <h2>
            Related products
          </h2>

          <div className="grid">
            {related.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* RATINGS */}
      <section className="pd-section">
        <h2>
          Customer ratings
        </h2>

        <p className="pd-no-reviews">
          No customer ratings for this
          product yet.
        </p>
      </section>

      {/* QUESTIONS */}
      <section className="pd-section pd-qa">
        <div className="pd-qa-head">
          <h2>
            Questions &amp; answers
          </h2>

          <button
            type="button"
            className="btn btn-primary btn-sm"
          >
            <HelpCircle size={16} />
            Ask a question
          </button>
        </div>

        <p className="pd-no-reviews">
          No answered questions yet.
          Questions with answers will
          appear here.
        </p>
      </section>
    </main>
  );
}

function VariantGroup({
  label,
  options,
  group,
  selected,
  onSelect,
}) {
  return (
    <div className="pd-variant-group">
      <span className="pd-variant-label">
        {label}
      </span>

      <div className="pd-variant-options">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`pd-variant-chip ${
              selected[group] === option
                ? "pd-variant-chip-active"
                : ""
            }`}
            onClick={() =>
              onSelect(group, option)
            }
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}