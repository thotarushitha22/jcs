import { Search, ShoppingCart, PackageSearch } from "lucide-react";
import "./HowItWorks.css";

const steps = [
  { icon: Search, title: "Browse Listings" },
  { icon: ShoppingCart, title: "Sign In and Place Order" },
  { icon: PackageSearch, title: "Track Delivery" },
];

export default function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="container hiw-inner">
        <h2>How It Works?</h2>
        <p className="hiw-sub">Get started in 3 simple steps</p>

        <div className="hiw-row">
          {steps.map(({ icon: Icon, title }, i) => (
            <div className="hiw-step" key={title}>
              {i > 0 && <span className="hiw-divider" />}
              <div className="hiw-icon"><Icon size={18} /></div>
              <h4>{title}</h4>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}