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

  const [selected, setSelected] = useState({});

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchProduct(id)
      .then((data) => {
        setProduct(data);
        setQty(1);
        setActiveImage(0);
        setSelected({});
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
  const mrp = Number(product.mrp || 0);

  const gallery =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [];

  const outOfStock = Number(product.stock || 0) <= 0;

  const handleAdd = () => {
    if (outOfStock) return;

    addToCart(product, qty);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;

    addToCart(product, qty);
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
                    {Number(product.stock).toLocaleString(
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

          {/* VARIANTS */}
          {product.variants && (
            <div className="pd-variants">
              {product.variants.storage?.length > 0 && (
                <VariantGroup
                  label="Storage"
                  options={product.variants.storage}
                  group="storage"
                  selected={selected}
                  onSelect={selectVariant}
                />
              )}

              {product.variants.colors?.length > 0 && (
                <VariantGroup
                  label="Colors"
                  options={product.variants.colors}
                  group="colors"
                  selected={selected}
                  onSelect={selectVariant}
                />
              )}

              {product.variants.boxType?.length > 0 && (
                <VariantGroup
                  label="Box Type"
                  options={product.variants.boxType}
                  group="boxType"
                  selected={selected}
                  onSelect={selectVariant}
                />
              )}

              {product.variants.activation?.length > 0 && (
                <VariantGroup
                  label="Activation Status"
                  options={product.variants.activation}
                  group="activation"
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

      {/* OVERVIEW */}
      <section className="pd-section">
        <h2>
          Overview
        </h2>

        <p className="pd-overview">
          {product.overview ||
            "Product information is not available."}
        </p>
      </section>

      {/* WARRANTY */}
      <section className="pd-section">
        <h2>
          Warranty and support
        </h2>

        <p className="pd-overview">
          {product.warranty ||
            "Warranty information is not available."}
        </p>

        <p className="pd-overview">
          For assistance, contact our support
          team at{" "}

          <a
            href="mailto:info@jcsglobal.example"
            className="pd-link"
          >
            info@jcsglobal.example
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

/* VARIANT COMPONENT */

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