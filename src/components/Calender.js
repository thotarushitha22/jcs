const IMG = {
  main: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&q=90",
  phones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&q=90",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1600&q=90",
  audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=90",
  dussehra: "https://images.unsplash.com/photo-1604608672516-8c5c6b5e5c30?w=1600&q=90",
  diwali: "https://images.unsplash.com/photo-1603905179139-d6f4f6e0b7d1?w=1600&q=90",
  winter: "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1600&q=90",
  newyear: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=1600&q=90",
  republic: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=90",
  holi: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1600&q=90",
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
    image: IMG.main,
    bg: ["#eff6ff", "#60a5fa"],
    overlay: "rgba(239,246,255,0.97)",
    accent: "#0758d5",
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
    overlay: "rgba(16,38,74,0.96)",
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
    overlay: "rgba(224,242,254,0.97)",
    accent: "#0758d5",
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
    bg: ["#172554", "#475569"],
    overlay: "rgba(23,37,84,0.96)",
    accent: "#facc15",
    dark: true,
    cta: "Browse Accessories",
  }),
];

const SEASONAL = {
  default: makeBanner({
    id: "default",
    eyebrow: "BUILT FOR BUSINESS",
    title: "Ready to Restock? Start Here.",
    offer: "Source electronics in one place",
    sub: "Explore product listings, stock availability and supplier details.",
    chip: "BUSINESS ESSENTIALS",
    image: IMG.main,
    bg: ["#eff6ff", "#93c5fd"],
    overlay: "rgba(239,246,255,0.97)",
    accent: "#0758d5",
    cta: "Browse Products",
  }),

  dussehra: makeBanner({
    id: "dussehra",
    eyebrow: "FESTIVE BUSINESS COLLECTION",
    title: "Get Your Store Ready for Dussehra",
    offer: "Celebrate new opportunities for your business",
    sub: "Explore smartphones, laptops, TVs and accessories for your festive inventory.",
    chip: "DUSSEHRA SPECIAL",
    image: IMG.dussehra,
    bg: ["#451a03", "#c2410c"],
    overlay: "rgba(69,26,3,0.96)",
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
    image: IMG.diwali,
    bg: ["#1e1045", "#7c2d12"],
    overlay: "rgba(30,16,69,0.95)",
    accent: "#ffc928",
    dark: true,
    cta: "Shop Diwali Deals",
  }),

  holi: makeBanner({
    id: "holi",
    eyebrow: "A FRESH SEASON FOR BUSINESS",
    title: "Colour Your Sales This Holi",
    offer: "Bring fresh energy to your business",
    sub: "Explore mobile phones, electronics and accessories.",
    chip: "HOLI SPECIAL",
    image: IMG.holi,
    bg: ["#fce7f3", "#c4b5fd"],
    overlay: "rgba(252,231,243,0.96)",
    accent: "#db2777",
    cta: "Shop Holi Deals",
  }),

  winter: makeBanner({
    id: "winter",
    eyebrow: "WINTER BUSINESS COLLECTION",
    title: "Stay Ahead This Winter Season",
    offer: "Fresh opportunities for your business",
    sub: "Discover smartphones, laptops and accessories for your next restock.",
    chip: "WINTER COLLECTION",
    image: IMG.winter,
    bg: ["#e0f2fe", "#7dd3fc"],
    overlay: "rgba(224,242,254,0.96)",
    accent: "#0758d5",
    cta: "Shop Now",
  }),

  newyear: makeBanner({
    id: "newyear",
    eyebrow: "A NEW YEAR FOR YOUR BUSINESS",
    title: "New Year. Bigger Opportunities.",
    offer: "Start the year with smarter sourcing",
    sub: "Find electronics to support your next business goals.",
    chip: "NEW YEAR",
    image: IMG.newyear,
    bg: ["#0f172a", "#312e81"],
    overlay: "rgba(15,23,42,0.96)",
    accent: "#facc15",
    dark: true,
    cta: "Explore Products",
  }),

  republic: makeBanner({
    id: "republic",
    eyebrow: "REPUBLIC DAY COLLECTION",
    title: "Power Your Business with New Possibilities",
    offer: "Business-ready electronics",
    sub: "Explore wholesale electronics listings for your store.",
    chip: "REPUBLIC DAY",
    image: IMG.republic,
    bg: ["#f0fdf4", "#fed7aa"],
    overlay: "rgba(240,253,244,0.97)",
    accent: "#15803d",
    cta: "Explore Products",
  }),
};

export function getBanners(campaign) {
  const campaignId = campaign?.id || "default";
  const seasonalBanner = SEASONAL[campaignId] || SEASONAL.default;

  return [
    ...REGULAR,
    {
      ...seasonalBanner,
      id: `season-${campaignId}`,
    },
  ];
}