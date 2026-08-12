import { Link } from "react-router-dom";
import "./CtaBanner.css";

export default function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="container cta-inner">
        <h2>Ready to grow your retail electronics business?</h2>
        <p>Join thousands of retailers who trust JCSGlobal to source fast, buy smart, and stay ahead.</p>
        <Link to="/register" className="btn btn-primary">Get started today</Link>
      </div>
    </section>
  );
}