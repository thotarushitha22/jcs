import { Link, useParams } from "react-router-dom";
import "./AccountStub.css";

const copy = {
  "order-reports": { title: "Order Reports", text: "Generate and export filtered order reports." },
  "info": { title: "Account Information", text: "Check your account information." },
  "kyc": { title: "KYC Documents", text: "View or update your verification documents." },
  "address": { title: "My Address", text: "Manage your saved delivery locations." },
  "policies": { title: "Policies", text: "View all our policies and terms." },
};

export default function AccountStub() {
  const { section } = useParams();
  const info = copy[section] ?? { title: "Account", text: "" };

  return (
    <div className="page container stub">
      <div className="stub-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>{info.title}</span>
      </div>
      <h1>{info.title}</h1>

      <div className="card stub-card">
        <p>{info.text}</p>
        <p className="stub-note">This section is coming soon — it'll connect to the backend once that's built.</p>
      </div>
    </div>
  );
}