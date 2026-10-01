import { getCountdown } from "./festivals";

// Banner cards for the card-style rail.
// Which set shows is decided by the same calendar as festivals.js.
// Add or remove cards freely: the dots and arrows adjust by themselves.
// Optional fields per card: price ("From ₹X"), href, image, badge (Big Billion Days only).

// Site colours (taken from the navbar and sidebar). Change these 5 values to retune every card.
const SITE = { deep: "#163a2d", mid: "#1f5c43", bright: "#2b8a5e", pale: "#dfeadf", paler: "#c8dcca" };

const A = "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=900&q=80";
const B = "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=900&q=80";
const S = "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=900&q=80";

// Everyday cards (when no festival is on). dark:true means white text.
const DEFAULT_CARDS = [
  { id: "n1", bg: [SITE.pale, SITE.paler], dark: false, accent: "#fde047", chip: "B2B only",
    title: "Genuine stock from verified suppliers", offer: "Bulk pricing from 10 units", sub: "Dispatch within 24 hours", image: A, href: "/" },
  { id: "n2", bg: [SITE.deep, SITE.mid], dark: true, accent: "#fde047", chip: "New lots",
    title: "Flagship smartphones at wholesale rates", offer: "Limited lots available", sub: "GST invoice on every order", image: B, href: "/" },
  { id: "n4", bg: [SITE.deep, "#0f2a20"], dark: true, accent: "#fde047", chip: "Ready stock",
    title: "Tablets, TVs and accessories", offer: "Ships from verified suppliers", sub: "Track every order", image: A, href: "/" },
  { id: "n5", bg: ["#f3f0dc", "#e4dfb8"], dark: false, accent: SITE.bright, chip: "GST invoice",
    title: "Every order comes with a GST invoice", offer: "Claim your input credit", sub: "No paperwork chasing", image: B, href: "/" },
  { id: "n6", bg: [SITE.pale, SITE.paler], dark: false, accent: "#fde047", chip: "Support",
    title: "Need help with a bulk order?", offer: "Talk to our team", sub: "We reply within a day", image: S, href: "/support" },
];

// Festival cards: green backgrounds to match the site. Tag colour and artwork come from the festival theme in festivals.js.
const FEST = {
  bbd: [
    { badge: "SALE", chip: "Sale week", title: "Festive stock at sale-week prices", offer: "Bulk rates on phones and TVs", sub: "GST invoice on every order", image: A },
    { badge: "EARLY", chip: "Early access", title: "Lock inventory before it sells out", offer: "Limited festive lots", sub: "Verified suppliers only", image: B },
    { badge: "24H", chip: "24h dispatch", title: "Order today, ships within 24 hours", offer: "Restock before the rush", sub: "Track from your dashboard", image: A },
    { badge: "BULK", chip: "Bulk deals", title: "More units, better rate", offer: "Tiered pricing from 10 units", sub: "Phones, tablets and TVs", image: B },
    { badge: "NEW", chip: "New lots", title: "Fresh lots added every day", offer: "Flagship smartphones", sub: "Check back daily", image: A },
    ],
  dussehra: [
    { chip: "Navratri to Vijayadashami", title: "Victory season starts with full shelves", offer: "Bulk pricing on phones and tablets", sub: "GST-verified suppliers", image: A },
    { chip: "Auspicious start", title: "Start a new range on Vijayadashami", offer: "Dispatch within 24 hours", sub: "Verified suppliers", image: B },
    { chip: "Burn the backlog", title: "Clear dead stock before Dussehra", offer: "Go live within 48 hours", sub: "KYC-verified sellers", image: S, href: "/sell" },
    { chip: "Festive restock", title: "Be ready before the Diwali rush", offer: "Ships within 24 hours", sub: "Order now", image: A },
    { chip: "Bulk deals", title: "Stock the best-sellers in bulk", offer: "Tiered pricing from 10 units", sub: "Phones, tablets and TVs", image: B },
    { chip: "GST invoice", title: "Buy festive stock, claim your credit", offer: "GST invoice on every order", sub: "Verified suppliers", image: A },
  ],
  diwali: [
    { chip: "Diwali wholesale", title: "Light up your sales this Diwali", offer: "Festive bulk deals on phones and TVs", sub: "GST invoice on every order", image: A },
    { chip: "Gifting season", title: "Top gifting picks for resellers", offer: "Earbuds, smartwatches, power banks", sub: "Bulk pricing", image: B },
    { chip: "Before Dhanteras", title: "Restock before the weekend rush", offer: "Dispatch within 24 hours", sub: "Verified suppliers", image: A },
    { chip: "Bulk deals", title: "Corporate gifting in bulk", offer: "Orders from 50 units", sub: "Ask for a quote", image: B, href: "/support" },
    { chip: "Smart TVs", title: "Big screens for the festive season", offer: "TVs at wholesale rates", sub: "Ready stock", image: A },
    ],
  "xmas-ny": [
    { chip: "Year-end", title: "Close the year with better margins", offer: "Clearance lots in bulk", sub: "Verified suppliers", image: A },
    { chip: "New year", title: "Plan your January stock now", offer: "Bulk pricing applies", sub: "Dispatch within 24 hours", image: B },
    { chip: "Gifting", title: "Gifts that sell: audio and wearables", offer: "Bulk pricing", sub: "Ready stock", image: A },
    ],
  republic: [
    { chip: "Republic Day", title: "Republic Day deals for resellers", offer: "Bulk pricing on TVs and tablets", sub: "GST invoice on every order", image: B },
    { chip: "Ready stock", title: "Stock up this long weekend", offer: "Ships within 24 hours", sub: "Verified suppliers", image: A },
    { chip: "Smart TVs", title: "Big-screen deals in bulk", offer: "TVs at wholesale rates", sub: "Limited lots", image: B },
    ],
  holi: [
    { chip: "Holi offers", title: "Colour your margins this Holi", offer: "Phones, speakers and accessories", sub: "Bulk pricing", image: A },
    { chip: "Fast dispatch", title: "Order today, ships within 24 hours", offer: "Verified suppliers", sub: "Track every order", image: B },
    { chip: "Splash-ready", title: "Rugged phones and covers in bulk", offer: "Accessories at wholesale rates", sub: "Ready stock", image: A },
    ],
};

export function getBanners(campaign) {
  const cards = FEST[campaign.id];
  if (!cards || !campaign.theme) return DEFAULT_CARDS;
  const { accent } = campaign.theme;   // festival colour: used for the tag and artwork
  const countdown = getCountdown(campaign);
  return cards.map((c, i) => ({
    id: `${campaign.id}-${i}`, dark: true, accent, href: "/",
    bg: i % 3 === 2 ? [SITE.mid, SITE.bright] : i % 2 ? [SITE.mid, SITE.deep] : [SITE.deep, SITE.mid], ...c,
    chip: i === 0 && countdown ? countdown : c.chip,   // first card shows the countdown
  }));
}