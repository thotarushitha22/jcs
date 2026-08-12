import { PackageCheck, Truck, Home, Ban } from "lucide-react";
import "./OrderTracker.css";

const STEPS = [
  { key: "placed", label: "Order Placed", icon: PackageCheck },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function OrderTracker({ status, placedAt }) {
  if (status === "cancelled") {
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

  const currentIndex = STEPS.findIndex((s) => s.key === status);

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
              {i < STEPS.length - 1 && <div className={`tracker-line ${i < currentIndex ? "tracker-line-done" : ""}`} />}
            </div>
            <div className="tracker-label">
              <strong className={done ? "" : "tracker-label-pending"}>{step.label}</strong>
              {isCurrent && placedAt && step.key === "placed" && (
                <span>{new Date(placedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}