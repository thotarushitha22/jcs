import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Mail, Bell } from "lucide-react";
import "./NotificationPreferences.css";

const channels = [
  { icon: MessageCircle, name: "WhatsApp", text: "Receive instant notifications on your WhatsApp number. Get order updates, delivery status, and important alerts directly in your WhatsApp messages.", tint: "green" },
  { icon: Mail, name: "Email", text: "Stay updated via email notifications sent to your registered email address. Receive order confirmations, invoices, and promotional offers.", tint: "amber" },
  { icon: Bell, name: "Push notifications", text: "Get real-time push notifications on your device. Receive instant alerts for order updates, new offers, and important announcements even when the app is closed.", tint: "violet" },
];

export default function NotificationPreferences() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="page container notif">
      <div className="notif-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>Notification Preferences</span>
      </div>
      <h1>Notification Preferences</h1>
      <p className="notif-sub">Manage your notification preferences.</p>

      <div className="card notif-card">
        <div className="notif-master">
          <div>
            <h4>Notifications</h4>
            <p>When ON: Email, WhatsApp and Push notifications are enabled. When OFF: All notifications are disabled across all channels.</p>
          </div>
          <button
            className={`toggle ${enabled ? "toggle-on" : ""}`}
            onClick={() => setEnabled((v) => !v)}
            aria-label="Toggle all notifications"
          >
            <span className="toggle-dot" />
          </button>
        </div>
      </div>

      <h3 className="notif-heading">Notification channels</h3>
      <p className="notif-heading-sub">We use the following channels to keep you informed about your orders, updates, and special offers:</p>

      <div className="notif-channels">
        {channels.map(({ icon: Icon, name, text, tint }) => (
          <div className={`notif-channel notif-channel-${tint}`} key={name}>
            <div className={`notif-channel-icon notif-channel-icon-${tint}`}><Icon size={18} /></div>
            <div>
              <h4>{name}</h4>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}