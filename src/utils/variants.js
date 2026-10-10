// Helpers for grouping separate listings (one per storage/colour) of the same phone.

const norm = (v) => String(v || "").trim().toLowerCase();
const normKey = (v) => norm(v).replace(/\s+/g, "");
const firstOf = (v) => (Array.isArray(v) ? v[0] : v) || "";

// Common misspellings in listings, merged into one colour chip
const COLOUR_FIXES = { sliver: "Silver" };
const fixColour = (c) => COLOUR_FIXES[norm(c)] || c;

export const storageOf = (p) =>
  String(firstOf(p.variants?.storage) || p.storage || "").trim();

export const colourOf = (p) =>
  String(
    firstOf(p.variants?.colors) || firstOf(p.variants?.colour) || p.colour || p.color || ""
  ).trim();

export const imageOf = (p) => {
  const img = p.images?.[0] || p.image || "";
  return typeof img === "object" && img !== null ? img.url || img.src || "" : img;
};

export const toGb = (label) => {
  const m = String(label).match(/([\d.]+)\s*(tb|gb)/i);
  if (!m) return 0;
  return parseFloat(m[1]) * (m[2].toLowerCase() === "tb" ? 1024 : 1);
};

// Listings with the same brand + model belong together. No model => never grouped.
export const groupKey = (p) =>
  norm(p.brand) && norm(p.model) ? `${norm(p.brand)}|${norm(p.model)}` : null;

/**
 * Build de-duplicated storage and colour options from sibling listings.
 * Each option points at ONE listing: storage prefers the listing with the
 * current colour, colour prefers the listing with the current storage.
 */
export function buildOptions(siblings, current) {
  const curSt = normKey(storageOf(current));
  const curCo = norm(fixColour(colourOf(current)));
  const storage = new Map();
  const colour = new Map();

  siblings.forEach((p) => {
    const st = storageOf(p);
    const co = fixColour(colourOf(p));

    if (st) {
      const k = normKey(st);
      const prev = storage.get(k);
      if (!prev || (norm(fixColour(colourOf(p))) === curCo && norm(fixColour(colourOf(prev.product))) !== curCo)) {
        storage.set(k, { key: k, label: st, product: p, active: k === curSt });
      }
    }
    if (co) {
      const k = norm(co);
      const prev = colour.get(k);
      if (!prev || (normKey(storageOf(p)) === curSt && normKey(storageOf(prev.product)) !== curSt)) {
        colour.set(k, { key: k, label: co, product: p, active: k === curCo });
      }
    }
  });

  return {
    storage: [...storage.values()].sort((a, b) => toGb(a.label) - toGb(b.label)),
    colour: [...colour.values()],
  };
}

/**
 * Collapse listings of the same phone into ONE entry (keeps list order).
 * The entry is the cheapest in-stock listing, plus `siblings` (all listings).
 */
export function groupProducts(list) {
  const order = [];
  const groups = new Map();

  list.forEach((p, i) => {
    const key = groupKey(p);
    if (!key) {
      order.push({ single: p });
      return;
    }
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push({ key });
    }
    groups.get(key).push(p);
  });

  return order.map((o) => {
    if (o.single) return o.single;
    const members = groups.get(o.key);
    if (members.length === 1) return members[0];
    const inStock = members.filter((m) => Number(m.stock || 0) > 0);
    const pool = inStock.length ? inStock : members;
    const rep = pool.reduce((a, b) => (Number(b.price) < Number(a.price) ? b : a));
    const brand = String(rep.brand || "").trim();
    const model = String(rep.model || "").trim();
    const title = norm(model).startsWith(norm(brand)) ? model : `${brand} ${model}`.trim();
    return { ...rep, title, siblings: members };
  });
}

const COLOUR_CSS = {
  silver: "#c7cbd1", burgundy: "#800020", black: "#111827", white: "#f8fafc",
  blue: "#2563eb", red: "#dc2626", green: "#16a34a", gold: "#d4af37",
  gray: "#9ca3af", grey: "#9ca3af", pink: "#f472b6", purple: "#7c3aed",
  titanium: "#8b8d90", orange: "#f97316", yellow: "#facc15", teal: "#14b8a6",
};

// Swatch colour for a colour name (matches the first known colour word in the name)
export const colourToCss = (label) => {
  const words = String(label || "").toLowerCase().split(/[^a-z]+/);
  for (const w of words) if (COLOUR_CSS[w]) return COLOUR_CSS[w];
  return "#9ca3af";
};