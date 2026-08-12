import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-row">
        <div>
          <div className="footer-brand">
            <span className="brand-mark">JCS</span> Global
          </div>
          <p className="footer-tag">Wholesale marketplace for GST-verified retailers.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Marketplace</h4>
            <a href="/">Browse stock</a>
            <a href="/sell">Sell to JCSGlobal</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="/orders">Track an order</a>
            <a href="mailto:support@jcsglobal.example">Contact support</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom mono">© {new Date().getFullYear()} JCSGlobal. All prices exclude GST.</div>
    </footer>
  );
}