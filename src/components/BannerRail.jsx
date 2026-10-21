
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import "./BannerRail.css";

const AUTO_SLIDE_MS = 5000;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85";

const CAMPAIGNS = [
  {
    key: "dussehra",
    name: "Dussehra",
    start: "2026-10-11",
    end: "2026-10-21",
    theme: "warm",
    slides: [
      {
        eyebrow: "DUSSEHRA SPECIAL",
        title: "Celebrate Every New Beginning",
        offer: "Festive Electronics Deals",
        description: "Explore smartphones, laptops, TVs and accessories.",
        button: "Explore Deals",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "VIJAYADASHAMI OFFERS",
        title: "Upgrade Your Everyday",
        offer: "Discover Something Better",
        description: "Find technology for your home and business.",
        button: "Shop Electronics",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "FESTIVE SHOPPING",
        title: "More Choice. More Value.",
        offer: "Deals Across Top Categories",
        description: "Browse electronics for work, home and entertainment.",
        button: "View Products",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "FESTIVE COLLECTION",
        title: "Bring Home Better Technology",
        offer: "Smart Choices Start Here",
        description: "Discover products for your next upgrade.",
        button: "Explore Collection",
        image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "DUSSEHRA CELEBRATION",
        title: "Make Every Upgrade Count",
        offer: "Your Electronics Destination",
        description: "Explore the JCS Global electronics collection.",
        button: "Shop Now",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=85",
      },
    ],
  },
  {
    key: "diwali",
    name: "Diwali",
    start: "2026-10-25",
    end: "2026-11-10",
    theme: "diwali",
    slides: [
      {
        eyebrow: "HAPPY DIWALI",
        title: "Light Up Your World",
        offer: "Diwali Electronics Specials",
        description: "Celebrate brighter with new technology and entertainment.",
        button: "Shop Diwali Deals",
        image: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "FESTIVE TECH DEALS",
        title: "A Brighter Way to Upgrade",
        offer: "Explore Electronics for Everyone",
        description: "Discover technology for your home and business.",
        button: "Explore Deals",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "DIWALI GIFTING",
        title: "Give the Gift of Technology",
        offer: "Smart Gifts. Great Choices.",
        description: "Explore devices and useful tech accessories.",
        button: "Find Gifts",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "FESTIVE HOME UPGRADE",
        title: "Bring Entertainment Home",
        offer: "Discover TVs and More",
        description: "Find technology for relaxing, connecting and celebrating.",
        button: "View Collection",
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "DIWALI SPECIAL",
        title: "Celebrate with Smarter Tech",
        offer: "Your Festive Shopping Starts Here",
        description: "Shop electronics for every need with JCS Global.",
        button: "Shop Now",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=85",
      },
    ],
  },
  {
    key: "winter",
    name: "Winter",
    start: "2026-12-01",
    end: "2026-12-19",
    theme: "winter",
    slides: [
      {
        eyebrow: "WINTER COLLECTION",
        title: "Make This Season Smarter",
        offer: "Explore Winter Tech Picks",
        description: "Discover devices and accessories for work and travel.",
        button: "Explore Products",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "SEASONAL UPGRADE",
        title: "Stay Connected All Season",
        offer: "Technology for Every Day",
        description: "Explore smartphones and essential accessories.",
        button: "Shop Smartphones",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "WORK FROM ANYWHERE",
        title: "Power Up Your Productivity",
        offer: "Explore Laptops and More",
        description: "Find technology for your next big idea.",
        button: "Browse Laptops",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "HOME ENTERTAINMENT",
        title: "Make Time for Great Entertainment",
        offer: "Discover Your Next TV",
        description: "Explore entertainment products for home.",
        button: "Explore TVs",
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "WINTER TECH PICKS",
        title: "Find Your Next Favourite Device",
        offer: "Smart Choices at JCS Global",
        description: "Explore our electronics range for the season.",
        button: "Shop Now",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=85",
      },
    ],
  },
  {
    key: "newyear",
    name: "New Year",
    start: "2026-12-20",
    end: "2027-01-05",
    theme: "newyear",
    slides: [
      {
        eyebrow: "HAPPY NEW YEAR",
        title: "Start the Year with Something New",
        offer: "New Year Tech Picks",
        description: "Refresh your setup with electronics for work and entertainment.",
        button: "Explore Deals",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "NEW YEAR, NEW TECH",
        title: "Your Next Upgrade Starts Here",
        offer: "Discover the Latest Devices",
        description: "Explore smartphones and accessories for the year ahead.",
        button: "Shop Smartphones",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "FRESH START",
        title: "Power Your Next Big Idea",
        offer: "Laptops for Work and More",
        description: "Find devices to help you do more this year.",
        button: "Browse Laptops",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "NEW YEAR ENTERTAINMENT",
        title: "Make Room for More Fun",
        offer: "Explore TVs and Accessories",
        description: "Upgrade your entertainment experience for the new year.",
        button: "View Products",
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "HELLO, NEW POSSIBILITIES",
        title: "Make This Your Best Tech Year",
        offer: "Discover JCS Global",
        description: "Explore electronics for business and everyday life.",
        button: "Shop Now",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=85",
      },
    ],
  },
  {
    key: "republic",
    name: "Republic Day",
    start: "2027-01-20",
    end: "2027-01-27",
    theme: "republic",
    slides: [
      {
        eyebrow: "REPUBLIC DAY SPECIAL",
        title: "Celebrate Progress Through Technology",
        offer: "Republic Day Electronics Picks",
        description: "Explore devices that help you connect, create and grow.",
        button: "Explore Deals",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "SMARTER CHOICES",
        title: "Upgrade Your Digital World",
        offer: "Discover Smartphones",
        description: "Browse devices and accessories for everyday productivity.",
        button: "Shop Smartphones",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "BUILD YOUR FUTURE",
        title: "Technology That Moves You Forward",
        offer: "Explore Laptops and More",
        description: "Find technology for learning, work and business.",
        button: "Browse Laptops",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "MADE FOR ENTERTAINMENT",
        title: "Bring Everyone Together",
        offer: "Explore Home Electronics",
        description: "Discover products for your home and entertainment setup.",
        button: "View Collection",
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "REPUBLIC DAY COLLECTION",
        title: "Move Ahead with JCS Global",
        offer: "Your Electronics Destination",
        description: "Explore technology products for your business and home.",
        button: "Shop Now",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=85",
      },
    ],
  },
  {
    key: "holi",
    name: "Holi",
    start: "2027-03-14",
    end: "2027-03-23",
    theme: "holi",
    slides: [
      {
        eyebrow: "HAPPY HOLI",
        title: "Add More Colour to Your World",
        offer: "Holi Electronics Specials",
        description: "Celebrate the season with new devices and accessories.",
        button: "Explore Deals",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "COLOUR YOUR CELEBRATION",
        title: "Discover Your Next Favourite Device",
        offer: "Smartphones and Accessories",
        description: "Find everyday technology for work, travel and fun.",
        button: "Shop Smartphones",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "FESTIVE FUN",
        title: "Make Every Moment More Vibrant",
        offer: "Upgrade Your Entertainment",
        description: "Explore TVs and devices for sharing special moments.",
        button: "Explore TVs",
        image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "A FRESH NEW LOOK",
        title: "Refresh Your Tech Setup",
        offer: "Laptops and Everyday Essentials",
        description: "Find the right technology for your next project.",
        button: "Browse Products",
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=85",
      },
      {
        eyebrow: "HOLI SPECIAL",
        title: "Celebrate Colourfully with JCS Global",
        offer: "Explore the Electronics Collection",
        description: "Discover products for business and everyday use.",
        button: "Shop Now",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=85",
      },
    ],
  },
];

const DEFAULT_SLIDES = [
  {
    eyebrow: "WELCOME TO JCS GLOBAL",
    title: "Technology for Every Business",
    offer: "Explore Our Electronics Collection",
    description: "Discover smartphones, laptops, TVs and accessories.",
    button: "Explore Products",
    image: FALLBACK_IMAGE,
  },
  {
    eyebrow: "SMARTPHONE COLLECTION",
    title: "Find Your Next Smartphone",
    offer: "Explore Devices and Accessories",
    description: "Discover technology for staying connected every day.",
    button: "Shop Smartphones",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=85",
  },
  {
    eyebrow: "HOME ENTERTAINMENT",
    title: "Bring Entertainment Home",
    offer: "Discover TVs and More",
    description: "Explore products for your home and business.",
    button: "Explore TVs",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=85",
  },
  {
    eyebrow: "WORK SMARTER",
    title: "Power Your Everyday Productivity",
    offer: "Explore Laptops and Accessories",
    description: "Find the technology you need to get more done.",
    button: "Browse Laptops",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=85",
  },
  {
    eyebrow: "JCS GLOBAL COLLECTION",
    title: "Your Next Upgrade Starts Here",
    offer: "Explore Electronics Today",
    description: "Browse products for work, home and entertainment.",
    button: "Shop Now",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1600&q=85",
  },
];

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSelectedDate() {
  const params = new URLSearchParams(window.location.search);
  const previewDate = params.get("previewDate");

  if (previewDate && /^\d{4}-\d{2}-\d{2}$/.test(previewDate)) {
    const parsed = new Date(`${previewDate}T12:00:00`);

    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === previewDate
    ) {
      return previewDate;
    }
  }

  return getLocalDateString();
}

function getActiveCampaign(dateString) {
  return (
    CAMPAIGNS.find(
      (campaign) =>
        dateString >= campaign.start && dateString <= campaign.end
    ) || null
  );
}

export default function BannerRail() {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(getSelectedDate);

  const activeCampaign = useMemo(
    () => getActiveCampaign(selectedDate),
    [selectedDate]
  );

  const slides = activeCampaign?.slides || DEFAULT_SLIDES;

  const updateDate = useCallback(() => {
    setSelectedDate(getSelectedDate());
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", updateDate);
    const timer = window.setInterval(updateDate, 60000);

    return () => {
      window.removeEventListener("popstate", updateDate);
      window.clearInterval(timer);
    };
  }, [updateDate]);

  useEffect(() => {
    setActiveIndex(0);
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [activeCampaign?.key]);

  const goToSlide = useCallback(
    (index) => {
      const nextIndex = (index + slides.length) % slides.length;
      setActiveIndex(nextIndex);

      if (trackRef.current) {
        trackRef.current.scrollTo({
          left: trackRef.current.clientWidth * nextIndex,
          behavior: "smooth",
        });
      }
    },
    [slides.length]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % slides.length;

        if (trackRef.current) {
          trackRef.current.scrollTo({
            left: trackRef.current.clientWidth * nextIndex,
            behavior: "smooth",
          });
        }

        return nextIndex;
      });
    }, AUTO_SLIDE_MS);

    return () => window.clearInterval(timer);
  }, [slides.length, activeCampaign?.key]);

  const handleScroll = () => {
    if (!trackRef.current) return;

    const width = trackRef.current.clientWidth;
    if (!width) return;

    const index = Math.round(trackRef.current.scrollLeft / width);
    setActiveIndex(Math.min(index, slides.length - 1));
  };

  return (
    <section
      className={`br br-theme-${activeCampaign?.theme || "default"}`}
      aria-label={
        activeCampaign
          ? `${activeCampaign.name} promotional banners`
          : "JCS Global promotional banners"
      }
    >
      <div className="br-track" ref={trackRef} onScroll={handleScroll}>
        {slides.map((slide, index) => (
          <article
            className="br-card"
            key={`${activeCampaign?.key || "default"}-${index}`}
          >
            <div className="br-media">
              <img
                src={slide.image}
                alt={slide.title}
                loading={index === 0 ? "eager" : "lazy"}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />

              <div className="br-overlay" />

              <div className="br-brand">
                <span className="br-logo">JCS</span>
                <span className="br-global">GLOBAL</span>
              </div>

              <div className="br-copy">
                <span className="br-chip">
                  <Sparkles size={13} />
                  {slide.eyebrow}
                </span>

                <p className="br-eyebrow">{slide.offer}</p>
                <h2 className="br-title">{slide.title}</h2>
                <p className="br-sub">{slide.description}</p>

                <button
                  className="br-cta"
                  type="button"
                  onClick={() => {
                    window.location.href = "/products";
                  }}
                >
                  <ShoppingBag size={16} />
                  {slide.button}
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="br-slide-count">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(slides.length).padStart(2, "0")}
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        className="br-arrow br-prev"
        type="button"
        aria-label="Previous banner"
        onClick={() => goToSlide(activeIndex - 1)}
      >
        <ChevronLeft size={22} />
      </button>

      <button
        className="br-arrow br-next"
        type="button"
        aria-label="Next banner"
        onClick={() => goToSlide(activeIndex + 1)}
      >
        <ChevronRight size={22} />
      </button>

      <div className="br-dots" aria-label="Choose banner">
        {slides.map((slide, index) => (
          <button
            key={`${slide.eyebrow}-${index}`}
            type="button"
            className={`br-dot ${activeIndex === index ? "br-dot-on" : ""}`}
            aria-label={`Show banner ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
