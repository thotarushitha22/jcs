import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/orders";
import "./Checkout.css";

const UPI_RE = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [placing, setPlacing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);

  const gst = Math.round(subtotal * 0.18);

  const [form, setForm] = useState({
    shippingName: "",
    shippingGstin: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPincode: "",
    shippingPhone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState("");

  const update = (key) => (e) => {
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));
  };

  const updatePhone = (e) => {
    const digitsOnly = e.target.value
      .replace(/\D/g, "")
      .slice(0, 10);

    setForm((f) => ({
      ...f,
      shippingPhone: digitsOnly,
    }));
  };

  const updatePincode = (e) => {
    const digitsOnly = e.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setForm((f) => ({
      ...f,
      shippingPincode: digitsOnly,
    }));

    if (digitsOnly.length === 0) {
      setPincodeStatus("");
    } else if (/^[1-9][0-9]{5}$/.test(digitsOnly)) {
      setPincodeStatus("valid");
    } else {
      setPincodeStatus("invalid");
    }
  };

  const submitOrder = async () => {
    setPlacing(true);
    try {
      const payload = {
        items: items.map(({ product, qty }) => ({
          productId: product.id,
          qty,
        })),
        ...form,
        paymentMethod,
      };

      await createOrder(payload);
      clearCart();

      navigate("/orders", {
        state: {
          justPlaced: true,
          paymentMethod,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not place the order. Please try again."
      );
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    if (form.shippingPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    // Validate PIN code
    if (!/^[1-9][0-9]{5}$/.test(form.shippingPincode)) {
      setPincodeStatus("invalid");
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (paymentMethod === "upi") {
      if (!UPI_RE.test(upiId.trim())) {
        setError("Please enter a valid UPI ID, e.g. yourname@bank.");
        return;
      }
      // Simulate a payment gateway confirmation step — no real payment
      // provider is wired in, this just gives the flow a real "paid" moment.
      setProcessingPayment(true);
      setTimeout(() => {
        setProcessingPayment(false);
        submitOrder();
      }, 1400);
      return;
    }

    submitOrder();
  };

  if (items.length === 0) {
    return (
      <div className="page container">
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="page container checkout">
      <h1>Checkout</h1>

      <form
        className="checkout-grid"
        onSubmit={handlePlaceOrder}
      >
        <div className="checkout-form card">

          <h3>Shipping details</h3>

          <div className="field">
            <label>
  Business / consignee name <span className="required">*</span>
</label>

            <input
              required
              placeholder="ABC Retail Pvt Ltd"
              value={form.shippingName}
              onChange={update("shippingName")}
            />
          </div>

          <div className="field">
            <label>
  GSTIN <span className="required">*</span>
</label>

            <input
              required
              placeholder="27ABCDE1234F1Z5"
              value={form.shippingGstin}
              onChange={update("shippingGstin")}
            />
          </div>

          <div className="field">
            <label>
  Address line <span className="required">*</span>
</label>

            <input
              required
              placeholder="Shop no, street, area"
              value={form.shippingAddress}
              onChange={update("shippingAddress")}
            />
          </div>

          <div className="row">

            <div className="field">
              <label>
  City <span className="required">*</span>
</label>

              <input
                required
                value={form.shippingCity}
                onChange={update("shippingCity")}
              />
            </div>

            <div className="field">
              <label>
  PIN code <span className="required">*</span>
</label>

              <input
                required
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                value={form.shippingPincode}
                onChange={updatePincode}
              />

              {pincodeStatus === "valid" && (
                <span className="pincode-valid">
                  ✓ Valid PIN code
                </span>
              )}

              {pincodeStatus === "invalid" && (
                <span className="pincode-invalid">
                  ✕ Enter a valid 6-digit PIN code
                </span>
              )}
            </div>

          </div>

          <div className="field">
           <label>
  Phone (for WhatsApp order updates) <span className="required">*</span>
</label>

            <input
              required
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              maxLength={10}
              value={form.shippingPhone}
              onChange={updatePhone}
            />

            <span className="field-hint">
              {form.shippingPhone.length}/10 digits
            </span>
          </div>

          <h3>Payment method</h3>

          <div className="pay-options">

            <label className={`pay-option ${paymentMethod === "upi" ? "pay-option-active" : ""}`}>

              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "upi"}
                onChange={() =>
                  setPaymentMethod("upi")
                }
              />

              <span>
                <strong>
                  UPI / Cards / Netbanking
                </strong>

                <small>
                  Pay now — instant confirmation.
                </small>
              </span>

            </label>

            {paymentMethod === "upi" && (
              <div className="upi-field">
                <label>UPI ID <span className="required">*</span></label>
                <input
                  placeholder="yourname@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            <label className={`pay-option ${paymentMethod === "cod" ? "pay-option-active" : ""}`}>

              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "cod"}
                onChange={() =>
                  setPaymentMethod("cod")
                }
              />

              <span>
                <strong>
                  Cash on Delivery
                </strong>

                <small>
                  Pay when your order is delivered.
                </small>
              </span>

            </label>

            <label className={`pay-option ${paymentMethod === "credit" ? "pay-option-active" : ""}`}>

              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "credit"}
                onChange={() =>
                  setPaymentMethod("credit")
                }
              />

              <span>
                <strong>
                  Credit terms
                </strong>

                <small>
                  Available for approved accounts.
                </small>
              </span>

            </label>

          </div>

        </div>

        <aside className="checkout-summary card">

          <h3>Order summary</h3>

          {items.map(({ product, qty }) => (

            <div
              className="checkout-item"
              key={product.id}
            >

              <span>
                {product.title} × {qty}
              </span>

              <span className="mono">
                ₹
                {(
                  Number(product.price) * qty
                ).toLocaleString("en-IN")}
              </span>

            </div>

          ))}

          <div className="summary-line">

            <span>Subtotal</span>

            <span className="mono">
              ₹
              {subtotal.toLocaleString(
                "en-IN"
              )}
            </span>

          </div>

          <div className="summary-line">

            <span>GST (18%)</span>

            <span className="mono">
              ₹
              {gst.toLocaleString(
                "en-IN"
              )}
            </span>

          </div>

          <div className="summary-line summary-total">

            <span>Total</span>

            <span className="mono">
              ₹
              {(subtotal + gst).toLocaleString(
                "en-IN"
              )}
            </span>

          </div>

          {error && (
            <p className="checkout-error">
              {error}
            </p>
          )}

          <button
            className="btn btn-primary btn-block"
            disabled={placing || processingPayment}
          >
            {processingPayment ? (
              <><Loader2 size={15} className="spin" /> Confirming payment…</>
            ) : placing ? (
              "Placing order…"
            ) : paymentMethod === "cod" ? (
              "Place COD Order"
            ) : paymentMethod === "upi" ? (
              `Pay ₹${(subtotal + gst).toLocaleString("en-IN")} & place order`
            ) : (
              "Place order"
            )}
          </button>

        </aside>

      </form>
    </div>
  );
}