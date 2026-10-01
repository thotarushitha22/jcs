import { Link } from "react-router-dom";
import { Megaphone, UserRound, Headphones } from "lucide-react";
import "./Footer.css";

/* ------------------------------------------------------------------
   EDIT THESE: your real company details and links.
   `to`   = page inside the site (no page reload)
   `href` = external link, mailto: or tel:
------------------------------------------------------------------- */
const COMPANY = {
  name: "JCS Group",
  addressLines: [
    "Current office road, 76-16-53,",
    "Bhavani Puram, RR Nagar,",
    "Vijayawada, Andhra Pradesh 520012",
  ],
  email: "tech.support@jcsglobal.in",
  phones: ["+91-9090007108", "0866-3511964"],
};

// Opens Google Maps with the address
const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(
    "JCS Group, current office road, 76-16-53, Bhavani Puram, RR Nagar, Vijayawada, Andhra Pradesh 520012"
  );

const SOCIAL = {
  facebook: "https://www.facebook.com/",
  x: "https://x.com/",
  youtube: "https://www.youtube.com/",
  instagram: "https://www.instagram.com/",
};

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Browse stock", to: "/" },
      { label: "Register as a buyer", to: "/register" },
      { label: "Sign in", to: "/login" },
      { label: "My account", to: "/account" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact support", to: "/support" },
      { label: "Track an order", to: "/orders" },
      { label: "My cart", to: "/cart" },
      { label: "My wishlist", to: "/wishlist" },
      { label: "Order reports", to: "/account/order-reports" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Cancellation & returns", to: "/account/policies" },
      { label: "Terms of use", to: "/account/policies" },
      { label: "Privacy", to: "/account/policies" },
      { label: "Security", to: "/account/policies" },
      {
        label: "Grievance redressal",
        href: `mailto:${COMPANY.email}?subject=Grievance`,
      },
    ],
  },
];

/* Payment card images.
   Put your image files in  public/payments/  and list them here, e.g.
   { name: "Visa", src: "/payments/visa.png" }
   Leave the list empty to hide the payment row. */
const PAYMENTS = [
  // { name: "Visa", src: "/payments/visa.png" },
  // { name: "Mastercard", src: "/payments/mastercard.png" },
  // { name: "UPI", src: "/payments/upi.png" },
];

function FooterLink({ link }) {
  if (link.to) {
    return <Link to={link.to}>{link.label}</Link>;
  }
  return (
    <a href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {link.label}
    </a>
  );
}

/* simple inline social icons */
function SocialIcon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "facebook") {
    return (
      <svg {...common}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg {...common}>
        <path d="M4 4l16 16M20 4L4 20" />
      </svg>
    );
  }
  if (name === "youtube") {
    return (
      <svg {...common}>
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      {/* ================= MAIN ROW ================= */}
      <div className="footer-main">
        {COLUMNS.map((col) => (
          <div className="footer-col" key={col.title}>
            <h4>{col.title}</h4>
            {col.links.map((link) => (
              <FooterLink key={link.label} link={link} />
            ))}
          </div>
        ))}

        {/* Contact us + social */}
        <div className="footer-col footer-contact">
          <h4>Contact us</h4>
          <p className="footer-contact-note">
            Feel free to reach out through any of the methods below.
          </p>
          {COMPANY.phones.map((phone) => (
            <a key={phone} href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
              {phone}
            </a>
          ))}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>

          <h4 className="footer-social-title">Social</h4>
          <div className="footer-social">
            <a href={SOCIAL.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
              <SocialIcon name="facebook" />
            </a>
            <a href={SOCIAL.x} target="_blank" rel="noreferrer" aria-label="X">
              <SocialIcon name="x" />
            </a>
            <a href={SOCIAL.youtube} target="_blank" rel="noreferrer" aria-label="YouTube">
              <SocialIcon name="youtube" />
            </a>
            <a href={SOCIAL.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
              <SocialIcon name="instagram" />
            </a>
          </div>
        </div>

        {/* Office address */}
        <div className="footer-col footer-office">
          <h4>Office address</h4>
          <p>{COMPANY.name},</p>
          {COMPANY.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <a href={MAP_URL} target="_blank" rel="noreferrer" className="footer-map-link">
            View on Google Maps
          </a>
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="footer-bottom">
        <a
          className="footer-bottom-link"
          href={`mailto:${COMPANY.email}?subject=Advertise with JCSGlobal`}
        >
          <Megaphone size={18} />
          Advertise
        </a>

        <Link to="/account" className="footer-bottom-link">
          <UserRound size={18} />
          My account
        </Link>

        <Link to="/support" className="footer-bottom-link">
          <Headphones size={18} />
          Help center
        </Link>

        <span className="footer-copy">
          © {new Date().getFullYear()} JCSGlobal. All prices exclude GST.
        </span>

        {PAYMENTS.length > 0 && (
          <div className="footer-payments" aria-label="Accepted payment methods">
            {PAYMENTS.map((p) => (
              <img key={p.name} src={p.src} alt={p.name} loading="lazy" />
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}