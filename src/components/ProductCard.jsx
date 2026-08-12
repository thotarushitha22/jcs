import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck, PackageCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Quantity state
  const [quantity, setQuantity] = useState(1);

  const price = Number(product.price);
  const mrp = Number(product.mrp);

  const image = product.images?.[0] || product.image;

  const discountPct =
    mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const colors = product.variants?.colors || [];
  const storage = product.variants?.storage || [];

  const stock = Number(product.stock || 0);
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    addToCart(product, quantity);
    navigate("/cart");
  };

  const decreaseQuantity = () => {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1)
    );
  };

  const increaseQuantity = () => {
    setQuantity((currentQuantity) =>
      currentQuantity + 1
    );
  };

  return (
    <div className="p-card card">

      {/* Product image */}
      <Link
        to={`/product/${product.id}`}
        className="p-image-wrap"
      >
        <img
          src={image}
          alt={product.title}
          loading="lazy"
        />

        {product.verified && (
          <span className="badge badge-verified p-badge">
            Verified supplier
          </span>
        )}

        {isOutOfStock && (
          <span className="p-stock-badge">
            Out of stock
          </span>
        )}
      </Link>

      {/* Product information */}
      <div className="p-body">

        {/* Brand */}
        {product.brand && (
          <span className="p-brand">
            {product.brand}
          </span>
        )}

        {/* Product title */}
        <Link
          to={`/product/${product.id}`}
          className="p-title"
        >
          {product.title}
        </Link>

        {/* Price */}
        <div className="p-price-row">

          <span className="p-price mono">
            ₹{price.toLocaleString("en-IN")}
          </span>

          {mrp > 0 && (
            <span className="p-mrp mono">
              ₹{mrp.toLocaleString("en-IN")}
            </span>
          )}

          {discountPct > 0 && (
            <span className="p-discount">
              {discountPct}% off
            </span>
          )}

        </div>

        {/* Product variants */}
        <div className="p-meta">

          {colors.length > 0 && (
            <span>
              Colors: {colors[0]}
              {colors.length > 1
                ? ` +${colors.length - 1} more`
                : ""}
            </span>
          )}

          {storage.length > 0 && (
            <span>
              Storage: {storage[0]}
              {storage.length > 1
                ? ` +${storage.length - 1} more`
                : ""}
            </span>
          )}

          {!colors.length && !storage.length && (
            <span>
              Product details available
            </span>
          )}

        </div>

        {/* Stock and delivery */}
        <div className="p-info-row">

          <span
            className={
              isOutOfStock
                ? "p-stock p-stock-out"
                : "p-stock"
            }
          >
            <PackageCheck size={13} />

            {isOutOfStock
              ? "Out of stock"
              : `${stock.toLocaleString("en-IN")} in stock`}
          </span>

          {!isOutOfStock && (
            <span className="p-dispatch">
              <Truck size={13} />
              24 hrs
            </span>
          )}

        </div>

        {/* Quantity */}
        <div className="p-quantity">

          <span className="p-quantity-label">
            Quantity
          </span>

          <div className="p-quantity-controls">

            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={
                isOutOfStock || quantity === 1
              }
              aria-label="Decrease quantity"
            >
              −
            </button>

            <span>
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={isOutOfStock}
              aria-label="Increase quantity"
            >
              +
            </button>

          </div>

        </div>

        {/* Buttons */}
        <div className="p-actions">

          <button
            className="btn btn-outline p-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            Add to Cart
          </button>

          <button
            className="btn btn-primary p-btn"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
          >
            {isOutOfStock
              ? "Unavailable"
              : "Buy Now"}
          </button>

        </div>

      </div>

    </div>
  );
}