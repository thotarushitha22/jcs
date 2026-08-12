import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./HeroCarousel.css";

const slides = [
  {
    id: "s1",
    eyebrow: "GST-VERIFIED · B2B ONLY",
    title: "Genuine stock, straight from verified suppliers.",
    sub: "Smartphones, tablets, TVs and accessories — bulk pricing, dispatch within 24 hours.",
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1400&q=80",
    cta: { label: "Browse listings", href: "/" },
  },
  {
    id: "s2",
    eyebrow: "SEASONAL DEALS",
    title: "Bulk pricing on flagship smartphones.",
    sub: "Lock in wholesale rates before the festive restock — limited lots available.",
    image: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=1400&q=80",
    cta: { label: "Shop smartphones", href: "/" },
  },
  {
    id: "s3",
    eyebrow: "SELL TO US",
    title: "Turn excess inventory into cash, fast.",
    sub: "Submit a lot, get KYC-verified, and go live within 48 hours.",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1400&q=80",
    cta: { label: "Start selling", href: "/sell" },
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const go = (i) => setActive((i + slides.length) % slides.length);

  useEffect(() => {
    timerRef.current = setInterval(() => go(active + 1), 5500);
    return () => clearInterval(timerRef.current);
  }, [active]);

  const slide = slides[active];

  return (
    <section className="hero-carousel">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`hc-slide ${i === active ? "hc-active" : ""}`}
          style={{ backgroundImage: `url(${s.image})` }}
        />
      ))}
      <div className="hc-overlay" />

      <div className="container hc-content">
        <span className="eyebrow mono">{slide.eyebrow}</span>
        <h1 className="hc-title">{slide.title}</h1>
        <p className="hc-sub">{slide.sub}</p>
        <a href={slide.cta.href} className="btn btn-primary">{slide.cta.label}</a>
      </div>

      <button className="hc-arrow hc-prev" onClick={() => go(active - 1)} aria-label="Previous slide">
        <ChevronLeft size={22} />
      </button>
      <button className="hc-arrow hc-next" onClick={() => go(active + 1)} aria-label="Next slide">
        <ChevronRight size={22} />
      </button>

      <div className="hc-dots">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`hc-dot ${i === active ? "hc-dot-active" : ""}`}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}