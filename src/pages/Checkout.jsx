import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert, QrCode, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [placing, setPlacing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [error, setError] = useState(null);

  const gst = Math.round(subtotal * 0.18);
  const totalPrice = subtotal + gst;

  const [form, setForm] = useState({
    shippingName: "",
    shippingGstin: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPincode: "",
    shippingPhone: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay_sandbox");
  const [pincodeStatus, setPincodeStatus] = useState("");

  const update = (key) => (e) => {
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
    }));
  };

  const updatePhone = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({
      ...f,
      shippingPhone: digitsOnly,
    }));
  };

  const updatePincode = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
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
    
    const isPaid = paymentMethod === "razorpay_sandbox";
    const statusText = isPaid ? "PAID" : "PENDING";
    const paymentLabel = isPaid ? "Razorpay Sandbox QR" : paymentMethod === "cod" ? "Cash on Delivery" : "Credit Terms";

    const payload = {
      order_id: "JCS-" + paymentMethod.toUpperCase() + "-" + Math.floor(10000 + Math.random() * 90000),
      orderItems: items.map(({ product, qty }) => ({
        product: product.id || product._id,
        title: product.title || product.name,
        name: product.title || product.name,
        qty: qty,
        price: product.price,
        image: product.image || (product.images ? product.images[0] : "")
      })),
      items: items.map(({ product, qty }) => ({
        title: product.title || product.name,
        qty: qty,
        price: product.price
      })),
      shippingAddress: {
        name: form.shippingName,
        gstin: form.shippingGstin,
        address: form.shippingAddress,
        city: form.shippingCity,
        pincode: form.shippingPincode,
        phone: form.shippingPhone
      },
      paymentMethod: paymentLabel,
      status: statusText,
      paymentStatus: statusText,
      totalAmount: totalPrice,
      totalPrice,
      itemsPrice: subtotal,
      taxPrice: gst,
      shippingPrice: 0,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/orders", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn("Backend API sync failed, saving order locally as fallback:", err);
    }

    try {
      const existingLocalOrders = JSON.parse(localStorage.getItem("orders") || "[]");
      existingLocalOrders.unshift(payload);
      localStorage.setItem("orders", JSON.stringify(existingLocalOrders));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    clearCart();
    setPlacing(false);

    navigate("/orders", {
      state: {
        justPlaced: true,
        paymentMethod: paymentLabel,
        sandbox: isPaid,
      },
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.shippingPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(form.shippingPincode)) {
      setPincodeStatus("invalid");
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (paymentMethod === "razorpay_sandbox") {
      setShowQrModal(true);
      return;
    }

    submitOrder();
  };

  const simulateQrPaymentCompletion = () => {
    setQrScanned(true);
    setProcessingPayment(true);
    setTimeout(() => {
      setShowQrModal(false);
      setProcessingPayment(false);
      submitOrder();
    }, 1500);
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
      {paymentMethod === "razorpay_sandbox" && (
        <div className="sandbox-banner" style={{ background: "#fef3c7", border: "1px solid #f59e0b", padding: "10px 16px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#92400e", fontSize: "14px" }}>
          <ShieldAlert size={18} />
          <span><strong>Sandbox Razorpay QR Active:</strong> Test environment enabled. Scan the simulated QR code to complete payment and mark order as PAID.</span>
        </div>
      )}

      <h1>Checkout</h1>

      <form className="checkout-grid" onSubmit={handlePlaceOrder}>
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
              GSTIN <span className="optional" style={{ fontWeight: "normal", color: "#6b7280" }}>(Optional)</span>
            </label>
            <input
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
                <span className="pincode-valid">✓ Valid PIN code</span>
              )}
              {pincodeStatus === "invalid" && (
                <span className="pincode-invalid">✕ Enter a valid 6-digit PIN code</span>
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
            <label className={`pay-option ${paymentMethod === "razorpay_sandbox" ? "pay-option-active" : ""}`}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "razorpay_sandbox"}
                onChange={() => setPaymentMethod("razorpay_sandbox")}
              />
              <span>
                <strong>Razorpay Test QR (Sandbox)</strong>
                <small>Scan simulated UPI QR code to complete transaction instantly.</small>
              </span>
            </label>

            <label className={`pay-option ${paymentMethod === "cod" ? "pay-option-active" : ""}`}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <span>
                <strong>Cash on Delivery</strong>
                <small>Pay when your order is delivered.</small>
              </span>
            </label>

            <label className={`pay-option ${paymentMethod === "credit" ? "pay-option-active" : ""}`}>
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "credit"}
                onChange={() => setPaymentMethod("credit")}
              />
              <span>
                <strong>Credit terms</strong>
                <small>Available for approved accounts.</small>
              </span>
            </label>
          </div>

        </div>

        <aside className="checkout-summary card">
          <h3>Order summary</h3>

          {items.map(({ product, qty }) => (
            <div className="checkout-item" key={product.id || product._id}>
              <span>{product.title || product.name} × {qty}</span>
              <span className="mono">₹{(Number(product.price) * qty).toLocaleString("en-IN")}</span>
            </div>
          ))}

          <div className="summary-line">
            <span>Subtotal</span>
            <span className="mono">₹{subtotal.toLocaleString("en-IN")}</span>
          </div>

          <div className="summary-line">
            <span>GST (18%)</span>
            <span className="mono">₹{gst.toLocaleString("en-IN")}</span>
          </div>

          <div className="summary-line summary-total">
            <span>Total</span>
            <span className="mono">₹{totalPrice.toLocaleString("en-IN")}</span>
          </div>

          {error && (
            <p className="checkout-error">{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={placing || processingPayment}
          >
            {processingPayment ? (
              <><Loader2 size={15} className="spin" /> Verifying Payment…</>
            ) : placing ? (
              "Placing order…"
            ) : paymentMethod === "cod" ? (
              "Place COD Order"
            ) : paymentMethod === "credit" ? (
              "Place Order with Credit Terms"
            ) : (
              `Pay ₹${totalPrice.toLocaleString("en-IN")} via Razorpay QR`
            )}
          </button>
        </aside>
      </form>

      {showQrModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div className="card" style={{ background: "#fff", maxWidth: "400px", width: "100%", padding: "24px", textAlign: "center", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontWeight: "bold", fontSize: "16px", color: "#1f2937" }}>Razorpay Sandbox QR</span>
              <span style={{ fontSize: "12px", background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "4px" }}>PAID MODE TEST</span>
            </div>

            <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "16px" }}>
              Scan the QR code below using any UPI app to simulate a successful paid transaction.
            </p>

            <div style={{ background: "#f3f4f6", padding: "20px", borderRadius: "8px", display: "inline-block", marginBottom: "16px", border: "1px dashed #d1d5db" }}>
              {qrScanned ? (
                <div style={{ padding: "40px 20px", color: "#059669" }}>
                  <CheckCircle2 size={48} style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontWeight: "bold" }}>Payment Successful!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <QrCode size={140} color="#111827" />
                  <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#6b7280" }}>upi://pay?pa=razorpay.test@icici&am={totalPrice}</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px", color: "#111827" }}>
              Amount: ₹{totalPrice.toLocaleString("en-IN")}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn"
                style={{ flex: 1, background: "#f3f4f6", color: "#374151" }}
                onClick={() => setShowQrModal(false)}
                disabled={processingPayment}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={simulateQrPaymentCompletion}
                disabled={processingPayment || qrScanned}
              >
                {processingPayment ? <><Loader2 size={14} className="spin" /> Confirming...</> : "Simulate Scan & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}