import { Link } from "react-router-dom";
import { Package, FileBarChart2, ShieldCheck, FileText, MapPin, Bell, Headphones, ClipboardList } from "lucide-react";
import "./Account.css";

const sections = [
  { icon: Package, title: "My Orders", text: "Your recent and past orders, all in one place", to: "/orders", tint: "amber" },
  { icon: Package, title: "Selling History", text: "Track your sell requests and their status", to: "/sell", tint: "amber" },
  { icon: FileBarChart2, title: "Order Reports", text: "Generate and export filtered order reports", to: "/account/order-reports", tint: "blue" },
  { icon: ShieldCheck, title: "Account Information", text: "Check your account information", to: "/account/info", tint: "rose" },
  { icon: FileText, title: "KYC Documents", text: "View or update your verification documents", to: "/account/kyc", tint: "violet" },
  { icon: MapPin, title: "My Address", text: "Manage your saved delivery locations", to: "/account/address", tint: "rose" },
  { icon: Bell, title: "Notification Preferences", text: "Manage your communication preferences", to: "/account/notifications", tint: "green" },
  { icon: Headphones, title: "Help & Support", text: "Get answers or contact the support team", to: "/support", tint: "violet" },
  { icon: ClipboardList, title: "Policies", text: "View all our policies and terms", to: "/account/policies", tint: "violet" },
];

export default function Account() {
  return (
    <div className="page container account">
      <span className="account-crumb">My Account</span>
      <h1>My Account</h1>

      <div className="account-grid">
        {sections.map(({ icon: Icon, title, text, to, tint }) => (
          <Link to={to} className="account-card card" key={title}>
            <div className={`account-icon account-icon-${tint}`}><Icon size={20} /></div>
            <div>
              <h4>{title}</h4>
              <p>{text}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}