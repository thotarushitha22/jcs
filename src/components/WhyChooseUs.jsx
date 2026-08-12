import { ShieldCheck, UserCheck, MessageCircle, Tag, Headphones, Truck } from "lucide-react";
import "./WhyChooseUs.css";

const features = [
  { icon: ShieldCheck, title: "100% Genuine Products", text: "Every device comes sealed with brand verification. No grey market stock.", tint: "green" },
  { icon: UserCheck, title: "Verified Buyers Only", text: "Access is restricted to GST-verified retailers — so you buy with confidence.", tint: "blue" },
  { icon: MessageCircle, title: "Order Updates on WhatsApp", text: "From payment confirmation to delivery tracking, we keep you in the loop.", tint: "green" },
  { icon: Tag, title: "Clear, Transparent Pricing", text: "What you see is what you pay — no hidden charges, no confusion.", tint: "amber" },
  { icon: Headphones, title: "Dedicated Account Support", text: "You'll have a real person you can reach, not just an inbox or a bot.", tint: "violet" },
  { icon: Truck, title: "Fast, Reliable Dispatch", text: "Most orders ship within 24 hours. You'll always know when it's on the way.", tint: "amber" },
];

export default function WhyChooseUs() {
  return (
    <section className="why-us">
      <div className="container">
        <h2>What Makes JCSGlobal a Retailer's Favorite</h2>
        <p className="why-sub">Empowering retailers with smart commerce, seamless logistics, and trusted support.</p>

        <div className="why-grid">
          {features.map(({ icon: Icon, title, text, tint }) => (
            <div className={`why-card why-card-${tint}`} key={title}>
              <div className={`why-icon why-icon-${tint}`}><Icon size={20} /></div>
              <div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}