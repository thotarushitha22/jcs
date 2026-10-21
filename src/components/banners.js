
const IMG = {
  phones:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1400&q=85",
  laptop:
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1400&q=85",
  audio:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&q=85",
  electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1400&q=85",
  winter:
    "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1400&q=85",
};

const makeBanner = (data) => ({
  href: "/",
  dark: false,
  ...data,
});

const REGULAR = [
  makeBanner({
    id: "main",
    eyebrow: "YOUR TRUSTED ELECTRONICS PARTNER",
    title: "Top Brands. Best Prices. Only for Businesses.",
    offer: "Your trusted B2B electronics marketplace",
    sub: "Discover smartphones, laptops, TVs and accessories at wholesale prices.",
    chip: "B2B WHOLESALE",
    image: IMG.electronics,
    bg: ["#eff6ff", "#bfdbfe"],
    accent: "#facc15",
    cta: "Shop Now",
  }),

  makeBanner({
    id: "phones",
    eyebrow: "SMARTPHONES & TABLETS",
    title: "Smartphones for Your Business",
    offer: "Better choice for your next restock",
    sub: "Explore mobile phones and tablets from available suppliers.",
    chip: "MOBILES & TABLETS",
    image: IMG.phones,
    bg: ["#10264a", "#1d4ed8"],
    accent: "#facc15",
    dark: true,
    cta: "Explore Phones",
  }),

  makeBanner({
    id: "laptops",
    eyebrow: "BUSINESS COMPUTING",
    title: "Power Your Business with Technology",
    offer: "Laptops for every business need",
    sub: "Browse computing products and business electronics.",
    chip: "LAPTOPS",
    image: IMG.laptop,
    bg: ["#e0f2fe", "#60a5fa"],
    accent: "#1d4ed8",
    cta: "Explore Laptops",
  }),

  makeBanner({
    id: "accessories",
    eyebrow: "COMPLETE YOUR PRODUCT RANGE",
    title: "Everything Your Customers Need",
    offer: "Accessories and audio essentials",
    sub: "Discover headphones, audio products and other electronics accessories.",
    chip: "ACCESSORIES",
    image: IMG.audio,
    bg: ["#172554", "#334155"],
    accent: "#facc15",
    dark: true,
    cta: "Browse Accessories",
  }),
];

const SEASONAL = {
  default: makeBanner({
    id: "stock-up",
    eyebrow: "BUILT FOR BUSINESS",
    title: "Ready to Restock? Start Here.",
    offer: "Source electronics in one place",
    sub: "Explore product listings, stock availability and supplier details.",
    chip: "BUSINESS ESSENTIALS",
    image: IMG.electronics,
    bg: ["#eff6ff", "#bfdbfe"],
    accent: "#1d4ed8",
    cta: "Browse Products",
  }),

  dussehra: makeBanner({
    id: "dussehra",
    eyebrow: "FESTIVE BUSINESS COLLECTION",
    title: "Get Your Store Ready for the Festive Season",
    offer: "Plan your next electronics restock",
    sub: "Explore smartphones, tablets, TVs and accessories for your business.",
    chip: "DUSSEHRA SPECIAL",
    image: IMG.electronics,
    bg: ["#451a03", "#c2410c"],
    accent: "#fde047",
    dark: true,
    cta: "Explore Products",
  }),

  diwali: makeBanner({
    id: "diwali",
    eyebrow: "FESTIVE WHOLESALE COLLECTION",
    title: "Light Up Your Sales This Diwali",
    offer: "Make the festive season count",
    sub: "Explore electronics for your store's festive inventory.",
    chip: "DIWALI SPECIAL",
    image: IMG.electronics,
    bg: ["#251044", "#7c2d12"],
    accent: "#fbbf24",
    dark: true,
    cta: "Shop Diwali Deals",
  }),

  winter: makeBanner({
    id: "winter",
    eyebrow: "WINTER BUSINESS COLLECTION",
    title: "Stay Ahead This Winter Season",
    offer: "Fresh opportunities for your business",
    sub: "Discover smartphones, laptops and accessories for your next restock.",
    chip: "WINTER COLLECTION",
    image: IMG.winter,
    bg: ["#eff6ff", "#7dd3fc"],
    accent: "#1d4ed8",
    cta: "Shop Now",
  }),

  newyear: makeBanner({
    id: "newyear",
    eyebrow: "A NEW YEAR FOR YOUR BUSINESS",
    title: "New Year. Bigger Opportunities.",
    offer: "Start the year with smarter sourcing",
    sub: "Find electronics to support your next business goals.",
    chip: "NEW YEAR SPECIAL",
    image: IMG.electronics,
    bg: ["#0f172a", "#1d4ed8"],
    accent: "#facc15",
    dark: true,
    cta: "Explore Products",
  }),

  republic: makeBanner({
    id: "republic",
    eyebrow: "REPUBLIC DAY COLLECTION",
    title: "Start the Year with Smarter Sourcing",
    offer: "Business-ready electronics",
    sub: "Explore wholesale electronics listings for your store.",
    chip: "REPUBLIC DAY",
    image: IMG.phones,
    bg: ["#10264a", "#166534"],
    accent: "#facc15",
    dark: true,
    cta: "Explore Products",
  }),

  holi: makeBanner({
    id: "holi",
    eyebrow: "A FRESH SEASON FOR BUSINESS",
    title: "Colour Your Sales This Holi",
    offer: "Bring fresh energy to your business",
    sub: "Explore mobile phones, electronics and accessories.",
    chip: "HOLI SPECIAL",
    image: IMG.phones,
    bg: ["#831843", "#7c3aed"],
    accent: "#f9a8d4",
    dark: true,
    cta: "Explore Products",
  }),
};

export function getBanners(campaign) {
  const campaignId = campaign?.id || "default";
  const seasonalBanner = SEASONAL[campaignId] || SEASONAL.default;

  // An active festival becomes slide 1.
  // The remaining four slides are regular JCS Global banners.
  return [
    {
      ...seasonalBanner,
      id: `season-${campaignId}`,
    },
    ...REGULAR,
  ];
}
