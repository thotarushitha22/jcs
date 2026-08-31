import { PackageCheck, Truck, Home, Ban } from "lucide-react";
import "./OrderTracker.css";

const STEPS = [
  { key: "placed", label: "Order Placed", icon: PackageCheck },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderTracker({ status }) {
  const normalizedStatus = String(status || "pending").toLowerCase();

  if (normalizedStatus === "cancelled") {
    return (
      <div className="tracker tracker-cancelled">
        <Ban size={20} />
        <div>
          <strong>Order cancelled</strong>
          <span>This order was cancelled and will not be shipped.</span>
        </div>
      </div>
    );
  }

  // Map backend / admin status values to tracker step keys
  let currentKey = "placed";
  if (normalizedStatus === "shipped") {
    currentKey = "shipped";
  } else if (normalizedStatus === "delivered") {
    currentKey = "delivered";
  } else if (normalizedStatus === "processing" || normalizedStatus === "pending") {
    currentKey = "placed";
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentKey);

  return (
    <div className="tracker">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div className="tracker-step" key={step.key}>
            <div className="tracker-node">
              <div className={`tracker-icon ${done ? "tracker-icon-done" : ""} ${isCurrent ? "tracker-icon-current" : ""}`}>
                <Icon size={16} />
              </div>
              {i < STEPS.length - 1 && (
                <div className={`tracker-line ${i < currentIndex ? "tracker-line-done" : ""}`} />
              )}
            </div>
            <div className="tracker-label">
              <strong className={done ? "" : "tracker-label-pending"}>{step.label}</strong>
            </div>
          </div>
        );
      })}
    </div>
  );
}