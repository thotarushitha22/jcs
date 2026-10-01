import React from "react";
import "./Invoice.css";

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-modal-backdrop">
      <div className="invoice-container">
        {/* Action Buttons (Hidden during print) */}
        <div className="invoice-actions no-print">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨 Print Invoice
          </button>
          <button className="btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Formal Tax Invoice Layout */}
        <div className="invoice-document" id="printable-invoice">
          <div className="invoice-header">
            <div>
              <h1 className="invoice-company-name">JCS Global</h1>
              <p className="invoice-company-details">
                B2B Marketplace & Distribution<br />
                India | Support: support@jcsglobal.com
              </p>
            </div>
            <div className="invoice-title-box">
              <h2>TAX INVOICE</h2>
              <p><strong>Order ID:</strong> {order.order_id || order.id}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className="badge-paid">{order.paymentStatus || "PAID"}</span></p>
            </div>
          </div>

          <hr className="invoice-divider" />

          <div className="invoice-addresses">
            <div className="address-box">
              <h4>Billed / Shipped To:</h4>
              <p><strong>{order.shippingName}</strong></p>
              {order.shippingGstin && <p><strong>GSTIN:</strong> {order.shippingGstin}</p>}
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
              <p><strong>Phone:</strong> {order.shippingPhone}</p>
            </div>
            <div className="address-box payment-info">
              <h4>Payment Details:</h4>
              <p><strong>Method:</strong> {order.paymentMethod || "Razorpay Test"}</p>
              {order.razorpayPaymentId && <p><strong>Payment ID:</strong> {order.razorpayPaymentId}</p>}
              <p><strong>Supply State:</strong> {order.shippingState || "Andhra Pradesh"}</p>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.orderItems || order.items || []).map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.title || item.name}</td>
                  <td>{item.qty}</td>
                  <td>₹{Number(item.price).toLocaleString("en-IN")}</td>
                  <td>₹{(Number(item.price) * Number(item.qty)).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-totals">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>₹{Number(order.itemsPrice || order.totalAmount * 0.8475 || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="totals-row">
              <span>GST (18%):</span>
              <span>₹{Number(order.taxPrice || order.totalAmount * 0.1525 || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="totals-row grand-total">
              <span>Total Amount:</span>
              <span>₹{Number(order.totalAmount || order.totalPrice || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="invoice-footer-note">
            <p>This is a computer-generated invoice and does not require a physical signature.</p>
            <p>Thank you for doing business with JCS Global!</p>
          </div>
        </div>
      </div>
    </div>
  );
}