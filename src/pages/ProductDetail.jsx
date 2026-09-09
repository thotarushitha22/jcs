import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, MapPin, HelpCircle } from "lucide-react";

import {
  fetchProduct,
  fetchRelatedProducts,
} from "../api/products";

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
    colors: "",
  });


  /* =========================================================
     LOAD PRODUCT
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    fetchProduct(id)
      .then((data) => {
        if (!mounted) return;

        if (!data) {
          throw new Error("Product not found");
        }

        const productData = {
          ...data,
          images: normalizeImages(data.images),

          // DO NOT create fake variants
          variants:
            data.variants &&
            typeof data.variants === "object"
              ? data.variants
              : null,
        };

        setProduct(productData);
        setQty(1);
        setActiveImage(0);

        const storageOptions = getStorageOptions(productData);
        const colorOptions = getColorOptions(productData);

        setSelected({
          storage: storageOptions[0] || "",
          colors: colorOptions[0] || "",
        });
      })
      .catch((err) => {
        if (!mounted) return;

        console.error("Product loading error:", err);
        setError(err.message || "Failed to load product");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });


    /* =========================================================
       LOAD RELATED PRODUCTS
    ========================================================= */

    fetchRelatedProducts(id)
      .then((data) => {
        if (!mounted) return;

        setRelated(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Related products error:", err);

        if (mounted) {
          setRelated([]);
        }
      });


    return () => {
      mounted = false;
    };
  }, [id]);


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="page container pd-loading">
        Loading product...
      </div>
    );
  }


  /* =========================================================
     ERROR
  ========================================================= */

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


  /* =========================================================
     BASIC PRODUCT DATA
  ========================================================= */

  const price = Number(product.price || 0);

  const mrp = Number(
    product.mrp ||
    product.mrpPrice ||
    product.originalPrice ||
    0
  );


  /* =========================================================
     IMAGES
  ========================================================= */

  const gallery = (() => {
    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return product.images;
    }

    const singleImage =
      product.image ||
      product.imageUrl ||
      product.img;

    return singleImage ? [singleImage] : [];
  })();


  /* =========================================================
     STOCK
  ========================================================= */

  const outOfStock =
    Number(product.stock || 0) <= 0;


  /* =========================================================
     PRODUCT FIELDS
  ========================================================= */

  const prodOverview =
    product.overview ||
    product.description ||
    product.details ||
    product.about ||
    "";

  const prodColour =
    product.colour ||
    product.color ||
    "";

  const prodStorage =
    product.storage ||
    product.storageCapacity ||
    product.gb ||
    "";

  const prodRam =
    product.ram ||
    product.memory ||
    "";

  const prodScreenSize =
    product.screenSize ||
    "";

  const prodRearCamera =
    product.rearCamera ||
    "";

  const prodFrontCamera =
    product.frontCamera ||
    "";

  const prodNetwork =
    product.networkGen ||
    "";

  const prodSim =
    product.simSlots ||
    "";

  const prodSecurity =
    product.securityFeatures ||
    "";

  const prodWeight =
    product.weight ||
    "";

  const prodWaterResistance =
    product.waterResistant ||
    "";

  const prodFastCharging =
    product.fastCharging ||
    "";

  const prodProcessor =
    product.processor ||
    "";

  const prodBattery =
    product.battery ||
    "";

  const prodWarranty =
    product.warranty ||
    "";


  /* =========================================================
     CATEGORY
  ========================================================= */

  const categoryName =
    typeof product.category === "object"
      ? product.category?.name || ""
      : product.category || "";

  const categoryLower =
    String(categoryName).toLowerCase();


  /* =========================================================
     VARIANTS
  ========================================================= */

  const variantStorage =
    getStorageOptions(product);

  const variantColors =
    getColorOptions(product);


  /* =========================================================
     HIGHLIGHTS
  ========================================================= */

  const dynamicHighlights =
    getProductHighlights(product);


  /* =========================================================
     ADD TO CART
  ========================================================= */

  const handleAdd = () => {
    if (outOfStock) return;

    addToCart(
      {
        ...product,
        selectedVariants: selected,
      },
      qty
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };


  /* =========================================================
     BUY NOW
  ========================================================= */

  const handleBuyNow = () => {
    if (outOfStock) return;

    addToCart(
      {
        ...product,
        selectedVariants: selected,
      },
      qty
    );

    navigate("/cart");
  };


  /* =========================================================
     QUANTITY
  ========================================================= */

  const increaseQuantity = () => {
    setQty(
      (currentQty) => currentQty + 1
    );
  };


  const decreaseQuantity = () => {
    setQty(
      (currentQty) =>
        Math.max(1, currentQty - 1)
    );
  };


  /* =========================================================
     DELIVERY
  ========================================================= */

  const checkDelivery = (event) => {
    event.preventDefault();

    if (/^[1-6][0-9]{5}$/.test(pincode)) {
      setDeliveryStatus("ok");
    } else {
      setDeliveryStatus("unavailable");
    }
  };


  /* =========================================================
     VARIANT SELECT
  ========================================================= */

  const selectVariant = (group, value) => {
    setSelected((previous) => ({
      ...previous,
      [group]: value,
    }));
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="page pd">

      {/* BACK */}
      <Link
        to="/"
        className="pd-back"
      >
        ← Back to browse
      </Link>


      <div className="pd-grid">

        {/* =================================================
            PRODUCT IMAGE
        ================================================= */}

        <section className="pd-gallery">

          <div className="pd-image">

            {gallery[activeImage] ? (
              <img
                src={gallery[activeImage]}
                alt={product.title || "Product"}
              />
            ) : (
              <div className="pd-no-image">
                Product image unavailable
              </div>
            )}

          </div>


          {gallery.length > 1 && (
            <div className="pd-thumbs">

              {gallery.map(
                (image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={`pd-thumb ${
                      index === activeImage
                        ? "pd-thumb-active"
                        : ""
                    }`}
                    onClick={() =>
                      setActiveImage(index)
                    }
                    aria-label={`View product image ${
                      index + 1
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title || "Product"} view ${
                        index + 1
                      }`}
                    />
                  </button>
                )
              )}

            </div>
          )}

        </section>


        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

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


          {/* BRAND */}

          {product.brand && (
            <span className="pd-brand">
              {product.brand}
            </span>
          )}


          {/* TITLE */}

          <h1 className="pd-title">
            {product.title}
          </h1>


          {/* RATING */}

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

            {product.gstPercent !== undefined &&
              product.gstPercent !== null && (
                <>
                  {" · "}
                  GST: {product.gstPercent}%
                </>
              )}

          </div>


          {/* STOCK */}

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

              <div className="pd-specs">

                <div>
                  <span>In stock</span>

                  <b>
                    {Number(
                      product.stock || 0
                    ).toLocaleString("en-IN")}{" "}
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


          {/* DELIVERY */}

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
              Deliverable to {pincode}.
              Dispatch within 24 hours.
            </p>
          )}


          {deliveryStatus === "unavailable" && (
            <p className="pd-delivery-bad">
              Enter a valid 6-digit Indian pincode.
            </p>
          )}


          {/* =================================================
              ACTUAL PRODUCT HIGHLIGHTS
          ================================================= */}

          {dynamicHighlights.length > 0 && (
            <div className="pd-highlights-box">

              {dynamicHighlights
                .slice(0, 3)
                .map(
                  (highlight, index) => (
                    <div
                      className="pd-highlight-item"
                      key={`${highlight.text}-${index}`}
                    >

                      <span className="pd-highlight-icon">
                        {highlight.icon}
                      </span>

                      <div>

                        <strong>
                          {highlight.text}
                        </strong>

                        <p>
                          Product specification
                        </p>

                      </div>

                    </div>
                  )
                )}

            </div>
          )}


          {/* =================================================
              VARIANTS
          ================================================= */}

          {(variantStorage.length > 0 ||
            variantColors.length > 0) && (

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


      {/* =====================================================
          PRODUCT HIGHLIGHTS
      ===================================================== */}

      <section className="pd-section">

        <h2>
          Product highlights
        </h2>

        <div className="pd-highlights-list">

          {dynamicHighlights.length > 0 ? (

            dynamicHighlights.map(
              (highlight, index) => (

                <div
                  key={`${highlight.text}-${index}`}
                  className="pd-highlights-row"
                >

                  <span className="pd-highlight-icon">
                    {highlight.icon}
                  </span>

                  <span>
                    {highlight.text}
                  </span>

                </div>

              )
            )

          ) : (

            <div className="pd-highlights-row">
              <span className="pd-highlight-icon">
                ✓
              </span>

              <span>
                No product highlights provided.
              </span>
            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      <section className="pd-section">

        <h2>
          Overview / Description
        </h2>

        <p className="pd-overview">

          {prodOverview ? (
            prodOverview
          ) : (
            "No product overview provided by the merchant."
          )}

        </p>

      </section>


      {/* =====================================================
          SPECIFICATIONS
      ===================================================== */}

      <section className="pd-section">

        <h2>
          Specifications
        </h2>

        <div className="pd-spec-grid">

          {product.title && (
            <div className="pd-spec-item">
              <strong>Product Title:</strong>{" "}
              {product.title}
            </div>
          )}

          {product.brand && (
            <div className="pd-spec-item">
              <strong>Brand:</strong>{" "}
              {product.brand}
            </div>
          )}

          {categoryName && (
            <div className="pd-spec-item">
              <strong>Category:</strong>{" "}
              {categoryName}
            </div>
          )}

          {prodColour && (
            <div className="pd-spec-item">
              <strong>Colour:</strong>{" "}
              {prodColour}
            </div>
          )}

          {prodStorage && (
            <div className="pd-spec-item">
              <strong>Storage Capacity:</strong>{" "}
              {prodStorage}
            </div>
          )}

          {prodRam && (
            <div className="pd-spec-item">
              <strong>RAM:</strong>{" "}
              {prodRam}
            </div>
          )}

          {prodNetwork && (
            <div className="pd-spec-item">
              <strong>Network:</strong>{" "}
              {prodNetwork}
            </div>
          )}

          {prodSim && (
            <div className="pd-spec-item">
              <strong>SIM Slots:</strong>{" "}
              {prodSim}
            </div>
          )}

          {prodScreenSize && (
            <div className="pd-spec-item">
              <strong>Screen Size:</strong>{" "}
              {prodScreenSize}
            </div>
          )}

          {prodRearCamera && (
            <div className="pd-spec-item">
              <strong>Rear Camera:</strong>{" "}
              {prodRearCamera}
            </div>
          )}

          {prodFrontCamera && (
            <div className="pd-spec-item">
              <strong>Front Camera:</strong>{" "}
              {prodFrontCamera}
            </div>
          )}

          {prodSecurity && (
            <div className="pd-spec-item">
              <strong>Security:</strong>{" "}
              {prodSecurity}
            </div>
          )}

          {prodWaterResistance && (
            <div className="pd-spec-item">
              <strong>Water Resistant:</strong>{" "}
              {prodWaterResistance}
            </div>
          )}

          {prodFastCharging && (
            <div className="pd-spec-item">
              <strong>Fast Charging:</strong>{" "}
              {prodFastCharging}
            </div>
          )}

          {prodProcessor && (
            <div className="pd-spec-item">
              <strong>Processor:</strong>{" "}
              {prodProcessor}
            </div>
          )}

          {prodBattery && (
            <div className="pd-spec-item">
              <strong>Battery:</strong>{" "}
              {prodBattery}
            </div>
          )}

          {prodWeight && (
            <div className="pd-spec-item">
              <strong>Weight:</strong>{" "}
              {prodWeight}
            </div>
          )}

          {price > 0 && (
            <div className="pd-spec-item">
              <strong>Price:</strong>{" "}
              ₹{price.toLocaleString("en-IN")}
            </div>
          )}

          {mrp > 0 && (
            <div className="pd-spec-item">
              <strong>MRP:</strong>{" "}
              ₹{mrp.toLocaleString("en-IN")}
            </div>
          )}

          {product.stock !== undefined && (
            <div className="pd-spec-item">
              <strong>Stock:</strong>{" "}
              {product.stock}
            </div>
          )}

          {product.moq && (
            <div className="pd-spec-item">
              <strong>MOQ:</strong>{" "}
              {product.moq}
            </div>
          )}

        </div>

      </section>


      {/* =====================================================
          WARRANTY
      ===================================================== */}

      <section className="pd-section">

        <h2>
          Warranty and support
        </h2>

        <p className="pd-overview">

          {prodWarranty ? (
            prodWarranty
          ) : (
            "No warranty information provided by the merchant."
          )}

        </p>

        <p className="pd-overview">

          For technical assistance or authorized
          service center routing, contact support at{" "}

          <a
            href="mailto:support@example.com"
            className="pd-link"
          >
            support@example.com
          </a>

          .

        </p>

      </section>


      {/* =====================================================
          RELATED PRODUCTS
      ===================================================== */}

      {related.length > 0 && (

        <section className="pd-section">

          <h2>
            Related products
          </h2>

          <div className="grid">

            {related.map(
              (relatedProduct) => (

                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                />

              )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          RATINGS
      ===================================================== */}

      <section className="pd-section">

        <h2>
          Customer ratings
        </h2>

        <p className="pd-no-reviews">
          No customer ratings for this
          product yet.
        </p>

      </section>


      {/* =====================================================
          QUESTIONS
      ===================================================== */}

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


/* =========================================================
   NORMALIZE IMAGES
========================================================= */

function normalizeImages(images) {
  if (!images) {
    return [];
  }

  if (Array.isArray(images)) {
    return images.filter(Boolean);
  }

  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }

      return parsed ? [parsed] : [];
    } catch {
      return images ? [images] : [];
    }
  }

  return [];
}


/* =========================================================
   STORAGE OPTIONS
========================================================= */

function getStorageOptions(product) {
  const variants = product?.variants;

  if (
    variants &&
    Array.isArray(variants.storage)
  ) {
    return variants.storage.filter(Boolean);
  }

  if (
    variants &&
    Array.isArray(variants.gb)
  ) {
    return variants.gb.filter(Boolean);
  }

  const storage =
    product?.storage ||
    product?.storageCapacity ||
    product?.gb;

  if (Array.isArray(storage)) {
    return storage.filter(Boolean);
  }

  return storage
    ? [storage]
    : [];
}


/* =========================================================
   COLOR OPTIONS
========================================================= */

function getColorOptions(product) {
  const variants = product?.variants;

  if (
    variants &&
    Array.isArray(variants.colors)
  ) {
    return variants.colors.filter(Boolean);
  }

  if (
    variants &&
    Array.isArray(variants.colour)
  ) {
    return variants.colour.filter(Boolean);
  }

  if (
    variants &&
    Array.isArray(variants.colorOptions)
  ) {
    return variants.colorOptions.filter(Boolean);
  }

  const colour =
    product?.colour ||
    product?.color;

  if (Array.isArray(colour)) {
    return colour.filter(Boolean);
  }

  return colour
    ? [colour]
    : [];
}


/* =========================================================
   PRODUCT HIGHLIGHTS
========================================================= */

function getProductHighlights(product) {

  /* -------------------------------------------------------
     1. USE EXPLICIT MERCHANT HIGHLIGHTS FIRST
  ------------------------------------------------------- */

  if (
    Array.isArray(product?.highlights) &&
    product.highlights.length > 0
  ) {

    return product.highlights
      .map((item) => {

        if (typeof item === "string") {
          return {
            icon: "✓",
            text: item,
          };
        }

        return {
          icon: item?.icon || "✓",
          text:
            item?.text ||
            item?.value ||
            item?.title ||
            "",
        };

      })
      .filter(
        (item) => item.text
      );
  }


  /* -------------------------------------------------------
     2. BUILD HIGHLIGHTS FROM REAL PRODUCT DATA
  ------------------------------------------------------- */

  const highlights = [];

  const ram =
    product?.ram ||
    product?.memory;

  const storage =
    product?.storage ||
    product?.storageCapacity ||
    product?.gb;

  const category =
    typeof product?.category === "object"
      ? product?.category?.name || ""
      : product?.category || "";

  const categoryLower =
    String(category).toLowerCase();


  /* RAM + STORAGE */

  if (ram || storage) {
    highlights.push({
      icon: "⚡",
      text: [
        ram,
        storage,
      ]
        .filter(Boolean)
        .join(" | "),
    });
  }


  /* PROCESSOR */

  if (product?.processor) {
    highlights.push({
      icon: "💻",
      text: product.processor,
    });
  }


  /* SCREEN */

  if (product?.screenSize) {
    highlights.push({
      icon:
        categoryLower.includes("tv")
          ? "📺"
          : "🖥️",
      text: product.screenSize,
    });
  }


  /* REAR CAMERA */

  if (product?.rearCamera) {
    highlights.push({
      icon: "📷",
      text: product.rearCamera,
    });
  }


  /* FRONT CAMERA */

  if (product?.frontCamera) {
    highlights.push({
      icon: "📸",
      text: product.frontCamera,
    });
  }


  /* BATTERY */

  if (product?.battery) {
    highlights.push({
      icon: "🔋",
      text: product.battery,
    });
  }


  /* NETWORK */

  if (product?.networkGen) {
    highlights.push({
      icon: "📶",
      text: product.networkGen,
    });
  }


  /* SIM */

  if (product?.simSlots) {
    highlights.push({
      icon: "📱",
      text: product.simSlots,
    });
  }


  /* SECURITY */

  if (product?.securityFeatures) {
    highlights.push({
      icon: "🔐",
      text: product.securityFeatures,
    });
  }


  /* WATER RESISTANT */

  if (product?.waterResistant) {
    highlights.push({
      icon: "💧",
      text: product.waterResistant,
    });
  }


  /* FAST CHARGING */

  if (product?.fastCharging) {
    highlights.push({
      icon: "⚡",
      text: product.fastCharging,
    });
  }


  /* WEIGHT */

  if (product?.weight) {
    highlights.push({
      icon: "⚖️",
      text: product.weight,
    });
  }


  return highlights;
}


/* =========================================================
   VARIANT GROUP
========================================================= */

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

        {options.map(
          (option) => (

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

          )
        )}

      </div>

    </div>
  );
}