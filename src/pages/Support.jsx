import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import "./Support.css";

export default function Support() {
  return (
    <div className="page container support">
      <div className="support-crumb">
        <Link to="/">My Account</Link> <span>›</span> <span>Help and Support</span>
      </div>
      <h1>Help and Support</h1>

      <div className="card support-card">
        <h3>Contact us</h3>

        <div className="support-row">
          <MessageSquare size={18} />
          <div>
            <span className="support-label">Chat support</span>
            <span className="support-value">Available Mon–Sat, 9:00 AM – 7:00 PM</span>
          </div>
        </div>

        <div className="support-row">
          <Mail size={18} />
          <div>
            <span className="support-label">Email</span>
            <a className="support-value support-link" href="mailto:info@jcsglobal.example">info@jcsglobal.example</a>
          </div>
        </div>

        <div className="support-row">
          <Phone size={18} />
          <div>
            <span className="support-label">Phone</span>
            <span className="support-value">+91 88770 07777</span>
          </div>
        </div>

        <div className="support-row">
          <MapPin size={18} />
          <div>
            <span className="support-label">Address</span>
            <span className="support-value">2nd Floor, Office No. 203, Business Square, Pune, Maharashtra 411037</span>
          </div>
        </div>
      </div>
    </div>
  );
}