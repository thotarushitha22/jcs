import { categories } from "../data/mockProducts";
import "./StockTicker.css";

// The signature element: a manifest-style ticker that reads like a warehouse
// dispatch board, not a marketing banner. Reinforces "bulk stock, verified supply".
export default function StockTicker() {
  const track = [...categories, ...categories]; // duplicate for seamless loop

  return (
    <div className="ticker">
      <div className="ticker-track">
        {track.map((c, i) => (
          <span className="ticker-item mono" key={i}>
            <span className="ticker-dot" />
            {c.name}
            <b>{String(c.count).padStart(3, "0")}</b>
            <span className="ticker-label">SKUs&nbsp;in&nbsp;stock</span>
          </span>
        ))}
      </div>
    </div>
  );
}