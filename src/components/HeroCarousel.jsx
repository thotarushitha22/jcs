import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveCampaign } from "./festivals";
import FestiveArt from "./FestiveArt";
import "./HeroCarousel.css";

export default function HeroCarousel() {
  // Picks today's festival or sale once, when the page loads.
  const campaign = useMemo(() => getActiveCampaign(), []);
  const slides = campaign.slides;
  const festive = campaign.id !== "default";

  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  const go = (i) => setActive((i + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return;
    timerRef.current = setInterval(() => go(active + 1), 5500);
    return () => clearInterval(timerRef.current);
  }, [active, slides.length]);

  const slide = slides[active];
  const theme = campaign.theme;
  const vars = theme && { "--hc-from": theme.from, "--hc-to": theme.to, "--hc-accent": theme.accent };

  return (
    <section className={`hero-carousel ${festive ? "hc-festive" : ""}`} style={vars}>
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`hc-slide ${i === active ? "hc-active" : ""}`}
          style={{ backgroundImage: `url(${s.image || campaign.image})` }}
        />
      ))}
      {festive && <div className="hc-tint" />}
      <div className="hc-overlay" />
      {festive && <FestiveArt id={campaign.id} />}

      <div className="container hc-content">
        <span className="eyebrow mono">{slide.eyebrow}</span>
        <h1 className="hc-title">{slide.title}</h1>
        <p className="hc-sub">{slide.sub}</p>
        <a href={slide.cta.href} className="btn btn-primary">{slide.cta.label}</a>
      </div>

      {slides.length > 1 && (
        <>
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
        </>
      )}
    </section>
  );
}