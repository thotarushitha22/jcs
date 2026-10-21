import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Package, Truck } from "lucide-react";
import "./Policies.css";

const POLICIES = {
  terms: {
    label: "Terms of Service",
    icon: FileText,
    updated: "Last updated: 1 July 2026",
    sections: [
      {
        heading: "1. Who can use JCSGlobal",
        body: "JCSGlobal is a business-to-business (B2B) wholesale marketplace. Accounts are restricted to registered retailers, resellers, and businesses with a valid GST registration. Access to wholesale pricing is unlocked only after your account passes GST/KYC verification.",
      },
      {
        heading: "2. Orders and pricing",
        body: "All prices shown exclude GST unless stated otherwise. GST is calculated at checkout based on the applicable rate for each product. Prices, stock levels, and minimum order quantities are subject to change without prior notice and are confirmed only once an order is placed.",
      },
      {
        heading: "3. Payment",
        body: "Payment is required at checkout via the supported payment methods, or through approved credit terms for eligible accounts. Orders are processed only after payment confirmation, except where credit terms have been explicitly extended to your account.",
      },
      {
        heading: "4. Account responsibilities",
        body: "You're responsible for keeping your login credentials secure and for the accuracy of the business, GST, and contact details on your account. JCSGlobal may suspend accounts found to be sharing counterfeit information or engaging in fraudulent activity.",
      },
      {
        heading: "5. Limitation of liability",
        body: "JCSGlobal is not liable for indirect or consequential losses arising from delayed shipments, stock unavailability, or third-party courier issues, beyond the value of the affected order.",
      },
    ],
  },
  privacy: {
    label: "Privacy Policy",
    icon: ShieldCheck,
    updated: "Last updated: 1 July 2026",
    sections: [
      {
        heading: "1. Information we collect",
        body: "We collect the business details you provide at signup (name, email, phone, GSTIN), order and shipping information, and basic usage data to operate the marketplace and prevent fraud.",
      },
      {
        heading: "2. How we use your information",
        body: "Your information is used to process orders, verify your GST/KYC status, send order and delivery updates (including via WhatsApp and email), and improve the marketplace experience. We do not sell your data to third parties.",
      },
      {
        heading: "3. Data sharing",
        body: "Limited order and shipping data is shared with logistics and payment partners solely to fulfill your orders. Any KYC documents you upload are used only for verification purposes and are not shared beyond that.",
      },
      {
        heading: "4. Data retention",
        body: "Account and order data is retained for as long as your account is active and as required to meet tax, accounting, and legal obligations.",
      },
      {
        heading: "5. Your rights",
        body: "You can request a copy of your data or ask us to correct or delete it (subject to legal retention requirements) by contacting support.",
      },
    ],
  },
  returns: {
    label: "Return & Refund Policy",
    icon: Package,
    updated: "Last updated: 1 July 2026",
    sections: [
      {
        heading: "1. Eligibility for returns",
        body: "Returns are accepted for verifiably defective, damaged, or mis-shipped items, reported within 48 hours of delivery. Devices must be returned in original packaging with all accessories included.",
      },
      {
        heading: "2. Non-returnable items",
        body: "Bulk consumables (screen guards, cables, and similar accessory lots), refurbished devices sold \"as-is,\" and any item explicitly marked non-returnable at checkout cannot be returned.",
      },
      {
        heading: "3. How to request a return",
        body: "Contact support with your order ID, the affected items, and photos of the issue. Our team will confirm eligibility and arrange a pickup or replacement.",
      },
      {
        heading: "4. Refund timelines",
        body: "Approved refunds are processed to the original payment method within 5–7 business days of the returned item passing quality inspection. Credit-term accounts receive a credit note instead of a cash refund.",
      },
    ],
  },
  shipping: {
    label: "Shipping Policy",
    icon: Truck,
    updated: "Last updated: 1 July 2026",
    sections: [
      {
        heading: "1. Dispatch times",
        body: "Orders are typically dispatched within 24 hours of payment confirmation, subject to stock availability. Bulk orders exceeding standard stock levels may require additional processing time — you'll be notified if this applies.",
      },
      {
        heading: "2. Delivery estimates",
        body: "Delivery timelines depend on your pincode and are shown at checkout after the serviceability check. Metro regions typically receive orders within 2–4 business days; other regions may take longer.",
      },
      {
        heading: "3. Freight and bulk shipments",
        body: "Large-volume orders (TVs, pallet quantities) may ship via freight logistics rather than standard courier. Our support team will coordinate delivery scheduling directly for these orders.",
      },
      {
        heading: "4. Order tracking",
        body: "You'll receive WhatsApp and email updates as your order moves from placed → shipped → delivered. Tracking details are also available under My Orders at any time.",
      },
    ],
  },
};

const TABS = Object.keys(POLICIES);

export default function Policies() {
  const [active, setActive] = useState("terms");
  const policy = POLICIES[active];

  // jump to one section of the current policy
  const goToSection = (index) => {
    document
      .getElementById(`policy-${active}-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // open another policy from the side panel
  const openPolicy = (key) => {
    setActive(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page container policies">
      <div className="policies-crumb">
        <Link to="/account">My Account</Link> <span>›</span> <span>Policies</span>
      </div>
      <h1>Policies</h1>
      <p className="policies-sub">Everything covering how orders, returns, shipping, and your data work on JCSGlobal.</p>

      <div className="policies-tabs">
        {TABS.map((key) => (
          <button
            key={key}
            className={active === key ? "active" : ""}
            onClick={() => setActive(key)}
          >
            {POLICIES[key].label}
          </button>
        ))}
      </div>

      <div className="policies-layout">
        {/* MAIN POLICY TEXT */}
        <div className="card policies-content">
          <span className="policies-updated">{policy.updated}</span>
          {policy.sections.map((s, index) => (
            <div
              className="policies-section"
              id={`policy-${active}-${index}`}
              key={s.heading}
            >
              <h3>{s.heading}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>

        {/* SIDE PANEL */}
        <aside className="policies-side">
          {/* 1. ON THIS PAGE */}
          <div className="card policies-side-card">
            <h4 className="policies-side-title">On this page</h4>

            <ul className="policies-toc">
              {policy.sections.map((s, index) => (
                <li key={s.heading}>
                  <button type="button" onClick={() => goToSection(index)}>
                    {s.heading}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. LEGAL PAGES */}
          <div className="card policies-side-card">
            <h4 className="policies-side-title">Legal pages</h4>

            <ul className="policies-links">
              {TABS.map((key) => {
                const Icon = POLICIES[key].icon;

                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={active === key ? "active" : ""}
                      onClick={() => openPolicy(key)}
                    >
                      <Icon size={16} />
                      <span>{POLICIES[key].label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}