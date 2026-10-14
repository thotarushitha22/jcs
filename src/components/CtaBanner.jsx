import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./CtaBanner.css";

// Where "Get started today" leads: the Smartphones (mobiles) list on the home page
const MOBILES_PATH = "/?category=smartphones";

export default function CtaBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    let storedUser = {};
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      storedUser = {};
    }

    const currentUser = user || storedUser;
    const token = localStorage.getItem("token");
    const signedIn = Boolean(token && currentUser?.email);

    if (signedIn) {
      // already signed in: go straight to the mobiles
      navigate(MOBILES_PATH);
    } else {
      // not signed in: sign in first, then come back to the mobiles
      navigate("/login", { state: { from: MOBILES_PATH } });
    }
  };

  return (
    <section className="cta-banner">
      <div className="container cta-inner">
        <h2>Ready to grow your retail electronics business?</h2>
        <p>Join thousands of retailers who trust JCSGlobal to source fast, buy smart, and stay ahead.</p>
        <button type="button" className="btn btn-primary" onClick={handleGetStarted}>
          Get started today
        </button>
      </div>
    </section>
  );
}