import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ShieldAlert, CheckCircle2, MapPin } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import "./Checkout.css";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [placing, setPlacing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [savedAddressLabel, setSavedAddressLabel] = useState("");
  const [form, setForm] = useState({
    shippingName: "",
    shippingGstin: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingPincode: "",
    shippingPhone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("razorpay_sandbox");
  const [pincodeStatus, setPincodeStatus] = useState("");

  const gst = Math.round(Number(subtotal || 0) * 0.18);
  const totalPrice = Number(subtotal || 0) + gst;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector(
        `script[src="${RAZORPAY_SCRIPT}"]`
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    loadShippingDetails();
  }, [user]);

  const loadShippingDetails = () => {
    try {
      let userData = user || {};
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        userData = { ...storedUser, ...userData };
      } catch (e) {
        console.warn("Unable to read stored user");
      }

      const userId = userData?.id || userData?.userId || userData?._id;
      const profileName =
        userData?.businessName ||
        userData?.merchantName ||
        userData?.company ||
        userData?.name ||
        userData?.fullName ||
        "";
      const profileGstin =
        userData?.gstin || userData?.gstNumber || userData?.GSTIN || "";
      const profilePhone =
        userData?.phone ||
        userData?.mobile ||
        userData?.mobileNumber ||
        userData?.contactNumber ||
        "";
      const profileAddress = userData?.address || userData?.street || "";
      const profileCity = userData?.city || "";
      const profileState = userData?.state || "";
      const profilePincode =
        userData?.pincode || userData?.pin || userData?.zip || "";

      let addresses = [];
      if (userId) {
        const storageKey = `jcs_addresses_${userId}`;
        const savedAddresses = localStorage.getItem(storageKey);
        if (savedAddresses) {
          try {
            const parsed = JSON.parse(savedAddresses);
            if (Array.isArray(parsed)) {
              addresses = parsed;
            }
          } catch (e) {
            console.warn("Could not read saved addresses");
          }
        }
      }

      const defaultAddress =
        addresses.find((address) => address?.isDefault === true) ||
        addresses[0] ||
        null;

      const finalAddress = defaultAddress?.line || profileAddress || "";
      const finalCity = defaultAddress?.city || profileCity || "";
      const finalState = defaultAddress?.state || profileState || "";
      const finalPincode = defaultAddress?.pincode || profilePincode || "";

      setForm({
        shippingName: profileName,
        shippingGstin: profileGstin,
        shippingAddress: finalAddress,
        shippingCity: finalCity,
        shippingState: finalState,
        shippingPincode: String(finalPincode),
        shippingPhone: String(profilePhone),
      });

      if (defaultAddress) {
        setSavedAddressLabel(defaultAddress.label || "Default address");
      }

      if (/^[1-9][0-9]{5}$/.test(String(finalPincode))) {
        setPincodeStatus("valid");
      }
      setProfileLoaded(true);
    } catch (err) {
      console.error("Failed to load shipping details:", err);
      setProfileLoaded(true);
    }
  };

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const updatePhone = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, shippingPhone: digitsOnly }));
  };

  const updatePincode = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, shippingPincode: digitsOnly }));
    if (digitsOnly.length === 0) {
      setPincodeStatus("");
    } else if (/^[1-9][0-9]{5}$/.test(digitsOnly)) {
      setPincodeStatus("valid");
    } else {
      setPincodeStatus("invalid");
    }
  };

  const getToken = () => {
    let token =
      localStorage.getItem("token") || localStorage.getItem("jcs_token");
    if (!token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        token = storedUser?.token;
      } catch (e) {
        console.warn("Could not read user token");
      }
    }
    return token;
  };

  const createJCSOrder = async ({
    paymentStatus,
    paymentMethodLabel,
    razorpayOrderId = null,
    razorpayPaymentId = null,
  }) => {
    const generatedOrderId =
      "JCS-" +
      paymentMethodLabel.toUpperCase().replace(/\s+/g, "-") +
      "-" +
      Math.floor(10000 + Math.random() * 90000);

    const orderItems = items.map(({ product, qty }) => ({
      product: product.id || product._id,
      title: product.title || product.name || "Product",
      name: product.title || product.name || "Product",
      qty: Number(qty),
      price: Number(product.price),
      image:
        product.image ||
        (product.images && product.images.length > 0
          ? product.images[0]
          : ""),
    }));

    const payload = {
      id: generatedOrderId,
      order_id: generatedOrderId,
      orderItems,
      items: items.map(({ product, qty }) => ({
        title: product.title || product.name || "Product",
        qty: Number(qty),
        price: Number(product.price),
      })),
      shippingName: form.shippingName.trim(),
      shippingGstin: form.shippingGstin.trim(),
      shippingAddress: form.shippingAddress.trim(),
      shippingCity: form.shippingCity.trim(),
      shippingState: form.shippingState.trim(),
      shippingPincode: form.shippingPincode.trim(),
      shippingPhone: form.shippingPhone.trim(),
      paymentMethod: paymentMethodLabel,
      paymentStatus,
      status: paymentStatus === "PAID" ? "PAID" : "PENDING",
      razorpayOrderId,
      razorpayPaymentId,
      totalAmount: Number(totalPrice),
      totalPrice: Number(totalPrice),
      itemsPrice: Number(subtotal),
      taxPrice: Number(gst),
      shippingPrice: 0,
      createdAt: new Date().toISOString(),
    };

    const token = getToken();
    if (!token) {
      throw new Error("You are not logged in. Please login again.");
    }

    console.log("====================================");
    console.log("CREATING JCS ORDER");
    console.log("Order ID:", generatedOrderId);
    console.log("Payment:", paymentMethodLabel);
    console.log("Payment Status:", paymentStatus);
    console.log("Razorpay Order:", razorpayOrderId);
    console.log("Razorpay Payment:", razorpayPaymentId);
    console.log("Order payload:", payload);

    const response = await api.post("/orders", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("ORDER SAVED:", response.data);

    try {
      const existingLocalOrders = JSON.parse(
        localStorage.getItem("orders") || "[]"
      );
      const backendOrder = response.data || {};
      const savedOrder = {
        ...payload,
        ...backendOrder,
        order_id:
          backendOrder.order_id || backendOrder.orderId || generatedOrderId,
        id: backendOrder.id || generatedOrderId,
      };
      const updatedOrders = [
        savedOrder,
        ...existingLocalOrders.filter(
          (order) =>
            order.order_id !== generatedOrderId &&
            order.id !== generatedOrderId
        ),
      ];
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      window.dispatchEvent(new Event("storage"));
    } catch (localErr) {
      console.warn("Local order cache error:", localErr);
    }

    return response.data;
  };

  const startRazorpayPayment = async () => {
    setError(null);
    setSuccessMessage("");
    setProcessingPayment(true);

    try {
      if (!totalPrice || Number(totalPrice) <= 0) {
        throw new Error("Invalid order amount.");
      }

      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        throw new Error(
          "Razorpay Checkout could not be loaded. Please check your internet connection."
        );
      }
      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable.");
      }

      console.log("Creating Razorpay Test Order...");
      console.log("Amount:", totalPrice);

      const createResponse = await api.post("/payment/create-order", {
        amount: Number(totalPrice),
        currency: "INR",
        receipt: `JCS-${Date.now()}`,
      });

      console.log("Razorpay create-order response:", createResponse.data);

      const razorpayData = createResponse.data;

      if (!razorpayData?.success) {
        throw new Error(
          razorpayData?.message || "Unable to create Razorpay order."
        );
      }
      if (!razorpayData?.order?.id) {
        throw new Error(
          "Razorpay order ID was not returned by the server."
        );
      }
      if (!razorpayData?.keyId) {
        throw new Error(
          "Razorpay Test Key ID was not returned by the server."
        );
      }

      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.order.amount,
        currency: razorpayData.order.currency || "INR",
        name: "JCS Global",
        description: "JCS Global Order",
        order_id: razorpayData.order.id,
        prefill: {
          name: form.shippingName,
          email: user?.email || "",
          contact: form.shippingPhone,
        },
        notes: {
          shippingName: form.shippingName,
          shippingAddress: form.shippingAddress,
          shippingCity: form.shippingCity,
          shippingState: form.shippingState,
          shippingPincode: form.shippingPincode,
          gstin: form.shippingGstin || "",
        },
        theme: { color: "#111827" },
        modal: {
          ondismiss: () => {
            console.log("Razorpay checkout closed.");
            setProcessingPayment(false);
          },
        },
        handler: async function (razorpayResponse) {
          console.log("====================================");
          console.log("RAZORPAY PAYMENT SUCCESS");
          console.log(razorpayResponse);

          try {
            setSuccessMessage("Payment received. Verifying...");

            const verifyResponse = await api.post("/payment/verify", {
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            });

            console.log("Verification response:", verifyResponse.data);

            const verifyData = verifyResponse.data;

            if (!verifyData?.success || !verifyData?.verified) {
              throw new Error(
                verifyData?.message ||
                  "Razorpay payment verification failed."
              );
            }

            setSuccessMessage(
              "Payment verified. Creating your order..."
            );

            await createJCSOrder({
              paymentStatus: "PAID",
              paymentMethodLabel: "Razorpay Test",
              razorpayOrderId:
                razorpayResponse.razorpay_order_id,
              razorpayPaymentId:
                razorpayResponse.razorpay_payment_id,
            });

            clearCart();
            setProcessingPayment(false);
            setPlacing(false);
            setSuccessMessage(
              "Payment successful! Your order has been placed."
            );

            setTimeout(() => {
              navigate("/orders", {
                state: {
                  justPlaced: true,
                  paymentMethod: "Razorpay Test",
                  paymentStatus: "PAID",
                  razorpayOrderId:
                    razorpayResponse.razorpay_order_id,
                  razorpayPaymentId:
                    razorpayResponse.razorpay_payment_id,
                },
              });
            }, 1200);
          } catch (verifyError) {
            console.error(
              "PAYMENT VERIFICATION FAILED:",
              verifyError
            );
            console.error(
              "Backend response:",
              verifyError?.response?.data
            );
            setProcessingPayment(false);
            setPlacing(false);
            setError(
              verifyError?.response?.data?.message ||
                verifyError.message ||
                "Payment verification failed."
            );
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("RAZORPAY PAYMENT FAILED:", response);
        setProcessingPayment(false);
        setPlacing(false);
        setError(
          response?.error?.description ||
            "Razorpay payment failed."
        );
      });

      console.log("Opening Razorpay Test Checkout...");
      razorpay.open();
    } catch (err) {
      console.error("====================================");
      console.error("RAZORPAY CHECKOUT ERROR");
      console.error("Status:", err?.response?.status);
      console.error("Backend response:", err?.response?.data);
      console.error("Message:", err.message);
      console.error("====================================");
      setProcessingPayment(false);
      setPlacing(false);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to start Razorpay payment."
      );
    }
  };

  const submitNonRazorpayOrder = async () => {
    setPlacing(true);
    setError(null);

    try {
      const paymentStatus =
        paymentMethod === "cod" ? "PENDING" : "PENDING";
      const paymentLabel =
        paymentMethod === "cod"
          ? "Cash on Delivery"
          : "Credit Terms";

      await createJCSOrder({
        paymentStatus,
        paymentMethodLabel: paymentLabel,
      });

      clearCart();
      setPlacing(false);

      navigate("/orders", {
        state: {
          justPlaced: true,
          paymentMethod: paymentLabel,
          paymentStatus,
        },
      });
    } catch (err) {
      console.error("ORDER CREATION FAILED:", err);
      console.error("Backend response:", err?.response?.data);
      setPlacing(false);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Unable to place order."
      );
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");

    if (!form.shippingName.trim()) {
      setError("Please enter the shipping name.");
      return;
    }

    if (!form.shippingAddress.trim()) {
      setError("Please enter the shipping address.");
      return;
    }

    if (!form.shippingCity.trim()) {
      setError("Please enter the city.");
      return;
    }

    if (form.shippingPhone.length !== 10) {
      setError(
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(form.shippingPincode)) {
      setPincodeStatus("invalid");
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    if (paymentMethod === "razorpay_sandbox") {
      await startRazorpayPayment();
      return;
    }

    await submitNonRazorpayOrder();
  };

  if (!items || items.length === 0) {
    return (
      <div className="page container">
        <p>Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="page container checkout">
      {paymentMethod === "razorpay_sandbox" && (
        <div
          className="sandbox-banner"
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            padding: "10px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#92400e",
            fontSize: "14px",
          }}
        >
          <ShieldAlert size={18} />
          <span>
            <strong>Razorpay Test Mode:</strong> This is a sandbox
            payment. No real money will be charged.
          </span>
        </div>
      )}

      <h1>Checkout</h1>

      <form
        className="checkout-grid"
        onSubmit={handlePlaceOrder}
      >
        <div className="checkout-form card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "18px",
            }}
          >
            <div>
              <h3>Shipping details</h3>
              {savedAddressLabel && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  <MapPin size={14} />
                  <span>{savedAddressLabel}</span>
                </div>
              )}
            </div>
            <Link
              to="/account/address"
              className="btn"
              style={{
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Manage Address
            </Link>
          </div>

          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "10px 12px",
              marginBottom: "18px",
              color: "#1e40af",
              fontSize: "13px",
            }}
          >
            <MapPin
              size={15}
              style={{
                verticalAlign: "middle",
                marginRight: "6px",
              }}
            />
            Shipping details are automatically loaded from your
            Profile / saved address.
          </div>

          <div className="field">
            <label>
              Business / consignee name{" "}
              <span className="required">*</span>
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
              GSTIN{" "}
              <span
                style={{
                  fontWeight: "normal",
                  color: "#6b7280",
                }}
              >
                (Optional)
              </span>
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
              <label>State</label>
              <input
                value={form.shippingState}
                onChange={update("shippingState")}
              />
            </div>
          </div>

          <div className="row">
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
            <div className="field">
              <label>
                Phone <span className="required">*</span>
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
          </div>

          {!form.shippingAddress && !savedAddressLabel && (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "15px",
              }}
            >
              <strong>No saved address found.</strong>
              <p style={{ margin: "5px 0 10px", fontSize: "13px" }}>
                Add your shipping address in My Address first.
              </p>
              <Link
                to="/account/address"
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                Add Address
              </Link>
            </div>
          )}

          <h3>Payment method</h3>

          <div className="pay-options">
            <label
              className={`pay-option ${
                paymentMethod === "razorpay_sandbox"
                  ? "pay-option-active"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="pay"
                checked={paymentMethod === "razorpay_sandbox"}
                onChange={() =>
                  setPaymentMethod("razorpay_sandbox")
                }
              />
              <span>
                <strong>Razorpay Test Payment</strong>
                <small>
                  UPI, Cards and other Razorpay test payment
                  methods.
                </small>
              </span>
            </label>

            <label
              className={`pay-option ${
                paymentMethod === "cod"
                  ? "pay-option-active"
                  : ""
              }`}
            >
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

            <label
              className={`pay-option ${
                paymentMethod === "credit"
                  ? "pay-option-active"
                  : ""
              }`}
            >
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
            <div
              className="checkout-item"
              key={product.id || product._id}
            >
              <span>
                {product.title || product.name} × {qty}
              </span>
              <span className="mono">
                ₹
                {(
                  Number(product.price) * Number(qty)
                ).toLocaleString("en-IN")}
              </span>
            </div>
          ))}

          <div className="summary-line">
            <span>Subtotal</span>
            <span className="mono">
              ₹{Number(subtotal).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="summary-line">
            <span>GST (18%)</span>
            <span className="mono">
              ₹{gst.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="summary-line summary-total">
            <span>Total</span>
            <span className="mono">
              ₹{totalPrice.toLocaleString("en-IN")}
            </span>
          </div>

          {successMessage && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#047857",
                padding: "10px",
                borderRadius: "8px",
                marginTop: "12px",
                fontSize: "13px",
              }}
            >
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          {error && <p className="checkout-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={
              placing || processingPayment || !profileLoaded
            }
          >
            {processingPayment ? (
              <>
                <Loader2 size={15} className="spin" /> Processing
                Payment…
              </>
            ) : placing ? (
              "Placing order…"
            ) : paymentMethod === "cod" ? (
              "Place COD Order"
            ) : paymentMethod === "credit" ? (
              "Place Order with Credit Terms"
            ) : (
              `Pay ₹${totalPrice.toLocaleString(
                "en-IN"
              )} via Razorpay`
            )}
          </button>

          {paymentMethod === "razorpay_sandbox" && (
            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "10px",
              }}
            >
              🔒 Razorpay Test Mode
              <br />
              No real money will be charged.
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}