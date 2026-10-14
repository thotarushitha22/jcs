import { useState } from "react";
import { Link } from "react-router-dom";
import { Truck, PackageCheck, ShieldCheck, BadgeCheck } from "lucide-react";
import WishlistButton from "./WishlistButton";
import { buildOptions, colourToCss, imageOf } from "../utils/variants";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  // The listing picked by clicking a colour swatch (null = the card's default listing)
  const [picked, setPicked] = useState(null);
  const current = picked || product;

  const price = Number(current.price);
  const mrp = Number(current.mrp);
  const image = imageOf(current);
  const currentId = current.id || current._id;

  const stock = Number(current.stock || 0);
  const isOutOfStock = stock <= 0;

  // Several listings of the same phone were merged into this one card
  const variants = Array.isArray(product.siblings) ? product.siblings : [];
  const options = variants.length > 1 ? buildOptions(variants, current) : null;
  const prices = variants.map((v) => Number(v.price)).filter((n) => !Number.isNaN(n));
  const showFrom =
    !picked && prices.length > 1 && Math.min(...prices) !== Math.max(...prices);

  return (
    <div className="p-card card">
      {/* Image + wishlist */}
      <Link to={`/product/${currentId}`} className="p-image-wrap">
        <img src={image} alt={product.title} loading="lazy" />

        <div className="p-wishlist-overlay">
          <WishlistButton product={current} />
        </div>

        {isOutOfStock && <span className="p-stock-badge">Out of stock</span>}
      </Link>

      {/* Name + price + stock/delivery */}
      <div className="p-body">
        <Link to={`/product/${currentId}`} className="p-title">
          {product.title}
        </Link>

        <div className="p-price-row">
          {showFrom && <span className="p-from">From</span>}
          <span className="p-price mono">
            ₹{price.toLocaleString("en-IN")}
          </span>

          {mrp > price && (
            <span className="p-mrp mono">₹{mrp.toLocaleString("en-IN")}</span>
          )}

          {options && options.colour.length > 0 && (
            <span className="p-swatches">
              {options.colour.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  className={`p-swatch ${o.active ? "p-swatch-active" : ""}`}
                  title={o.label}
                  aria-label={o.label}
                  aria-pressed={o.active}
                  style={{ background: colourToCss(o.label) }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPicked(o.product);
                  }}
                />
              ))}
            </span>
          )}
        </div>

        {/* Merged cards: storage options take the place of the two tags (same height) */}
        {options && options.storage.length > 0 ? (
          <div className="p-tags">
            {options.storage.map((o) => (
              <Link
                key={o.key}
                to={`/product/${o.product.id || o.product._id}`}
                className={`p-tag p-tag-link ${o.active ? "p-tag-active" : ""}`}
              >
                {o.label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-tags">
            <span className="p-tag">
              <ShieldCheck size={12} />
              Warranty
            </span>
            <span className="p-tag">
              <BadgeCheck size={12} />
              Free delivery
            </span>
          </div>
        )}

        {/* Same row on every card, pinned to the bottom */}
        <div className="p-info-row">
          <span className={isOutOfStock ? "p-stock p-stock-out" : "p-stock"}>
            <PackageCheck size={13} />
            {isOutOfStock
              ? "Out of stock"
              : `${stock.toLocaleString("en-IN")} in stock`}
          </span>

          <span className="p-dispatch">
            <Truck size={13} />
            {isOutOfStock ? "Unavailable" : "Ships in 24 hrs"}
          </span>
        </div>
      </div>
    </div>
  );
}