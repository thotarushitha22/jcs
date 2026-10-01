import { Link } from "react-router-dom";
import { Truck, PackageCheck, ShieldCheck, BadgeCheck } from "lucide-react";
import WishlistButton from "./WishlistButton";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const price = Number(product.price);
  const mrp = Number(product.mrp);
  const image = product.images?.[0] || product.image;

  const stock = Number(product.stock || 0);
  const isOutOfStock = stock <= 0;

  return (
    <div className="p-card card">
      {/* Image + wishlist */}
      <Link to={`/product/${product.id}`} className="p-image-wrap">
        <img src={image} alt={product.title} loading="lazy" />

        <div className="p-wishlist-overlay">
          <WishlistButton product={product} />
        </div>

        {isOutOfStock && <span className="p-stock-badge">Out of stock</span>}
      </Link>

      {/* Name + price + stock/delivery */}
      <div className="p-body">
        <Link to={`/product/${product.id}`} className="p-title">
          {product.title}
        </Link>

        <div className="p-price-row">
          <span className="p-price mono">
            ₹{price.toLocaleString("en-IN")}
          </span>

          {mrp > price && (
            <span className="p-mrp mono">₹{mrp.toLocaleString("en-IN")}</span>
          )}
        </div>

        {/* Highlights: same two chips on every card */}
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