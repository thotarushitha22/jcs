import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

export default function Cart() {
  const { items, updateQty, removeFromCart, subtotal } = useCart();
  const navigate = useNavigate();
  const gst = Math.round(subtotal * 0.18);

  if (items.length === 0) {
    return (
      <div className="page container cart-empty">
        <h2>Your cart is empty</h2>
        <p>Browse verified stock and add items in your minimum order quantity.</p>
        <Link to="/" className="btn btn-primary">Browse listings</Link>
      </div>
    );
  }

  return (
    <div className="page container cart">
      <h1>Your cart</h1>

      <div className="cart-grid">
        <div className="cart-items">
          {items.map(({ product, qty }) => {
            const price = Number(product.price);
            const image = product.images?.[0] || product.image;
            return (
              <div className="cart-row card" key={product.id}>
                <img src={image} alt={product.title} />
                <div className="cart-row-info">
                  <span className="cart-row-brand">{product.brand}</span>
                  <span className="cart-row-title">{product.title}</span>
                  <span className="mono cart-row-price">₹{price.toLocaleString("en-IN")} / unit</span>
                </div>
                <div className="cart-row-qty">
                  <button onClick={() => updateQty(product.id, Math.max(product.moq, qty - 1))}>−</button>
                  <span className="mono">{qty}</span>
                  <button onClick={() => updateQty(product.id, qty + 1)}>+</button>
                </div>
                <span className="mono cart-row-total">₹{(price * qty).toLocaleString("en-IN")}</span>
                <button className="cart-row-remove" onClick={() => removeFromCart(product.id)}>Remove</button>
              </div>
            );
          })}
        </div>

        <aside className="cart-summary card">
          <h3>Order summary</h3>
          <div className="summary-line"><span>Subtotal</span><span className="mono">₹{subtotal.toLocaleString("en-IN")}</span></div>
          <div className="summary-line"><span>GST (18%)</span><span className="mono">₹{gst.toLocaleString("en-IN")}</span></div>
          <div className="summary-line summary-total"><span>Total</span><span className="mono">₹{(subtotal + gst).toLocaleString("en-IN")}</span></div>
          <button className="btn btn-primary btn-block" onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </button>
        </aside>
      </div>
    </div>
  );
}