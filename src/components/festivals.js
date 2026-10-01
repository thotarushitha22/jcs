// Festival / sale calendar for the hero carousel.
// - start/end are inclusive, format YYYY-MM-DD.
// - Diwali, Dussehra, Holi move every year. Check the dates against a panchang each year.
// - Big Billion Days dates are only placeholders until the sale is officially announced.
// - If two windows overlap, the higher "priority" wins.
// - "image" (optional) is a photo URL. Set it on a campaign or on a single slide.

const PHONE_A = "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1400&q=80";
const PHONE_B = "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=1400&q=80";
const SELL    = "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1400&q=80";

export const DEFAULT_CAMPAIGN = {
  id: "default",
  slides: [
    { id: "d1", eyebrow: "GST-VERIFIED · B2B ONLY", title: "Genuine stock, straight from verified suppliers.",
      sub: "Smartphones, tablets, TVs and accessories — bulk pricing, dispatch within 24 hours.",
      image: PHONE_A, cta: { label: "Browse listings", href: "/" } },
    { id: "d2", eyebrow: "SEASONAL DEALS", title: "Bulk pricing on flagship smartphones.",
      sub: "Lock in wholesale rates before the festive restock — limited lots available.",
      image: PHONE_B, cta: { label: "Shop smartphones", href: "/" } },
    { id: "d3", eyebrow: "SELL TO US", title: "Turn excess inventory into cash, fast.",
      sub: "Submit a lot, get KYC-verified, and go live within 48 hours.",
      image: SELL, cta: { label: "Start selling", href: "/sell" } },
  ],
};

export const CAMPAIGNS = [
  { id: "bbd", priority: 5, start: "2026-09-28", end: "2026-10-05",
    theme: { from: "#0b1f4d", to: "#1d4ed8", accent: "#ffd23f" },
    slides: [
      { id: "b1", eyebrow: "BIG BILLION DAYS · B2B WINDOW", title: "Festive-season stock at sale-week prices.",
        sub: "Smartphones, TVs and accessories in bulk. GST invoice on every order.",
        image: PHONE_A, cta: { label: "Shop the sale", href: "/" } },
      { id: "b2", eyebrow: "LIMITED STOCK", title: "Lock your festive inventory now.",
        sub: "Verified suppliers, dispatch within 24 hours.",
        image: PHONE_B, cta: { label: "Browse listings", href: "/" } },
    ] },
  { id: "dussehra", priority: 4, start: "2026-10-11", end: "2026-10-21",
    theme: { from: "#4a1203", to: "#c2410c", accent: "#fde047" },
    slides: [
      { id: "du1", eyebrow: "NAVRATRI TO DUSSEHRA", title: "Start the festive season with full shelves.",
        sub: "Bulk pricing on mobiles, tablets and TVs from GST-verified suppliers.",
        image: PHONE_A, cta: { label: "Browse listings", href: "/" } },
      { id: "du2", eyebrow: "FAST DISPATCH", title: "Order today, ship within 24 hours.",
        sub: "Get stock to your store before the Diwali rush.",
        image: PHONE_B, cta: { label: "Shop smartphones", href: "/" } },
    ] },
  { id: "diwali", priority: 4, start: "2026-10-25", end: "2026-11-10",
    theme: { from: "#2a0a3d", to: "#b45309", accent: "#fbbf24" },
    slides: [
      { id: "di1", eyebrow: "DIWALI WHOLESALE", title: "Light up your sales this Diwali.",
        sub: "Festive bulk deals on smartphones, TVs and accessories.",
        image: PHONE_A, cta: { label: "Shop Diwali deals", href: "/" } },
      { id: "di2", eyebrow: "GIFTING SEASON", title: "Top gifting picks, priced for resellers.",
        sub: "Earbuds, smartwatches and power banks in bulk.",
        image: PHONE_B, cta: { label: "View gifting range", href: "/" } },
      { id: "di3", eyebrow: "BEFORE DHANTERAS", title: "Restock before the weekend rush.",
        sub: "Verified suppliers. Dispatch within 24 hours.",
        image: SELL, cta: { label: "Browse listings", href: "/" } },
    ] },
  { id: "xmas-ny", priority: 3, start: "2026-12-20", end: "2027-01-02",
    theme: { from: "#052e2b", to: "#0f766e", accent: "#fca5a5" },
    slides: [
      { id: "x1", eyebrow: "YEAR-END CLEARANCE", title: "Close the year with better margins.",
        sub: "Clearance lots from verified suppliers. Bulk pricing applies.",
        image: PHONE_A, cta: { label: "See clearance", href: "/" } },
    ] },
  { id: "republic", priority: 3, start: "2027-01-20", end: "2027-01-27",
    theme: { from: "#7c2d12", to: "#166534", accent: "#ffffff" },
    slides: [
      { id: "r1", eyebrow: "REPUBLIC DAY SALE", title: "Republic Day deals for resellers.",
        sub: "Bulk pricing on TVs, tablets and accessories.",
        image: PHONE_B, cta: { label: "Shop the sale", href: "/" } },
    ] },
  { id: "holi", priority: 3, start: "2027-03-14", end: "2027-03-23",
    theme: { from: "#5b0f3f", to: "#7c3aed", accent: "#fde68a" },
    slides: [
      { id: "h1", eyebrow: "HOLI OFFERS", title: "Colour your margins this Holi.",
        sub: "Phones, speakers and accessories in bulk.",
        image: PHONE_A, cta: { label: "Browse Holi deals", href: "/" } },
    ] },
];

// Local date as YYYY-MM-DD (avoids the UTC off-by-one that toISOString() causes in India).
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Test any date by opening the site with ?previewDate=2026-11-05
export function getActiveCampaign(now = new Date()) {
  const preview = new URLSearchParams(window.location.search).get("previewDate");
  const today = /^\d{4}-\d{2}-\d{2}$/.test(preview || "") ? preview : ymd(now);
  const live = CAMPAIGNS.filter((c) => today >= c.start && today <= c.end)
    .sort((a, b) => b.priority - a.priority);
  return live[0] || DEFAULT_CAMPAIGN;
}