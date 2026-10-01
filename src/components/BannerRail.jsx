import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveCampaign } from "./festivals";
import { getBanners } from "./banners";
import FestiveArt from "./FestiveArt";
import "./BannerRail.css";

export default function BannerRail() {
  const campaign = useMemo(() => getActiveCampaign(), []);
  const cards = useMemo(() => getBanners(campaign), [campaign]);
  const festive = campaign.id !== "default";

  const track = useRef(null);
  const paused = useRef(false);
  const [idx, setIdx] = useState(0);

  const step = () => {
    const k = track.current?.children;
    return k && k[1] ? k[1].offsetLeft - k[0].offsetLeft : 0;
  };
  const atEnd = () => {
    const t = track.current;
    return t.scrollLeft + t.clientWidth >= t.scrollWidth - 4;
  };
  const goTo = (i) => track.current?.scrollTo({ left: i * step(), behavior: "smooth" });

  const onScroll = () => {
    const t = track.current;
    if (!t || !step()) return;
    setIdx(atEnd() ? cards.length - 1 : Math.round(t.scrollLeft / step()));
  };

  const next = () => (atEnd() ? goTo(0) : goTo(Math.round(track.current.scrollLeft / step()) + 1));
  const prev = () => goTo(Math.max(0, Math.round(track.current.scrollLeft / step()) - 1));

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!paused.current) next(); }, 4500);
    return () => clearInterval(t);
  }, [cards]);

  return (
    <section
      className="br"
      aria-roledescription="carousel"
      aria-label="Offers"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      <div className="br-track" ref={track} onScroll={onScroll}>
        {cards.map((c) => (
          <a
            key={c.id}
            href={c.href}
            className={`br-card ${c.dark ? "br-dark" : "br-light"}`}
            style={{ background: `linear-gradient(120deg, ${c.bg[0]}, ${c.bg[1]})`, "--chip": c.accent }}
          >
            <div className="br-media" style={{ backgroundImage: `url(${c.image})`, backgroundColor: c.dark ? "#8fcfae" : c.bg[1] }} />
            {festive && <FestiveArt id={campaign.id} label={c.badge} />}
            <span className="br-chip">{c.chip}</span>
            <div className="br-copy">
              <h3 className="br-title">{c.title}</h3>
              <p className="br-offer">{c.price ? <b>{c.price}</b> : null} {c.offer}</p>
              <p className="br-sub">{c.sub}</p>
            </div>
          </a>
        ))}
      </div>

      <button className="br-arrow br-prev" onClick={prev} aria-label="Previous offers"><ChevronLeft size={22} /></button>
      <button className="br-arrow br-next" onClick={next} aria-label="Next offers"><ChevronRight size={22} /></button>

      <div className="br-dots">
        {cards.map((c, i) => (
          <button key={c.id} className={`br-dot ${i === idx ? "br-dot-on" : ""}`}
            onClick={() => goTo(i)} aria-label={`Go to offer ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}