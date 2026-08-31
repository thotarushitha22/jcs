import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Truck, PackageCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const colors = product.variants?.colors || [];
  const [selectedColor, setSelectedColor] = useState(colors[0] || "");

  const price = Number(product.price);
  const mrp = Number(product.mrp);

  const image = product.images?.[0] || product.image;

  const discountPct =
    mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const storage = product.variants?.storage || [];
  const stock = Number(product.stock || 0);
  const isOutOfStock = stock <= 0;

  // Standardized description so every card occupies the same vertical height
  const description =
    product.description ||
    "High-performance device featuring advanced technology, sleek styling, and complete manufacturer warranty.";

  // Helper check for active user authentication
  const checkUserAuth = () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token && !storedUser) {
      alert("Please sign in to place an order or add items to your cart.");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    // Check if signed in first
    if (!checkUserAuth()) return;

    const productToAdd = selectedColor
      ? { ...product, selectedColor }
      : product;
    addToCart(productToAdd, quantity);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    // Check if signed in first
    if (!checkUserAuth()) return;

    const productToAdd = selectedColor
      ? { ...product, selectedColor }
      : product;
    addToCart(productToAdd, quantity);
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

        {/* Color Variants Selection */}
        {colors.length > 0 && (
          <div className="p-color-picker">
            <span className="p-color-label">Color:</span>
            <div className="p-color-options">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`p-color-chip ${
                    selectedColor === color ? "active" : ""
                  }`}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description to fill vertical space uniformly */}
        <p className="p-desc">
          {description}
        </p>

        {/* Stock and delivery */}
        <div className="p-info-row">
          <span
            className={
              isOutOfStock
                ? "p-stock p-stock-out"
                : "p-stock"
            }
          >
            <PackageCheck size={11} />
            {isOutOfStock
              ? "Out of stock"
              : `${stock.toLocaleString("en-IN")} in stock`}
          </span>

          {!isOutOfStock && (
            <span className="p-dispatch">
              <Truck size={11} />
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
            type="button"
            className="btn btn-outline p-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            Add to Cart
          </button>

          <button
            type="button"
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