// Works out festival dates for ANY year, so nothing needs updating each year.
//  - Hindu festivals: computed from the sun and moon (new-moon months, tithis, adhika months).
//  - Eid / Bakrid: from the Islamic calendar built into the browser (Intl).
//  - Fixed-date festivals (New Year, Sankranti, Republic Day...) are handled in festivals.js.
// Accuracy is within a day. If a date differs from your panchang, fix it in OVERRIDES (festivals.js).

const R = Math.PI / 180;
const sin = (d) => Math.sin(d * R);
const norm = (d) => ((d % 360) + 360) % 360;
const IST = 5.5;                                  // hours ahead of UTC

const jdUTC = (y, m, d, hUTC = 0) => Date.UTC(y, m - 1, d) / 86400000 + 2440587.5 + hUTC / 24;

function sunLong(J) {                             // tropical, degrees
  const T = (J - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T;
  const M = 357.52911 + 35999.05029 * T;
  const C = (1.914602 - 0.004817 * T) * sin(M) + 0.019993 * sin(2 * M) + 0.000289 * sin(3 * M);
  return norm(L0 + C - 0.00569 - 0.00478 * sin(125.04 - 1934.136 * T));
}

function moonLong(J) {                            // tropical, degrees (Meeus, main terms)
  const T = (J - 2451545) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = 297.8501921 + 445267.1114034 * T;
  const M = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  const F = 93.272095 + 483202.0175233 * T;
  const s =
    6.288774 * sin(Mp) + 1.274027 * sin(2 * D - Mp) + 0.658314 * sin(2 * D) + 0.213618 * sin(2 * Mp) -
    0.185116 * sin(M) - 0.114332 * sin(2 * F) + 0.058793 * sin(2 * D - 2 * Mp) +
    0.057066 * sin(2 * D - M - Mp) + 0.053322 * sin(2 * D + Mp) + 0.045758 * sin(2 * D - M) -
    0.040923 * sin(M - Mp) - 0.03472 * sin(D) - 0.030383 * sin(M + Mp) + 0.015327 * sin(2 * D - 2 * F) -
    0.012528 * sin(Mp + 2 * F) + 0.01098 * sin(Mp - 2 * F) + 0.010675 * sin(4 * D - Mp) +
    0.010034 * sin(3 * Mp) + 0.008548 * sin(4 * D - 2 * Mp) - 0.007888 * sin(2 * D + M - Mp) -
    0.006766 * sin(2 * D + M) - 0.005163 * sin(D - Mp);
  return norm(Lp + s);
}

const elong = (J) => norm(moonLong(J) - sunLong(J));          // 0-360, 12 degrees = 1 tithi
const ayanamsa = (J) => 23.853 + 0.013969 * ((J - 2451545) / 365.25);   // Lahiri
const rashi = (J) => Math.floor(norm(sunLong(J) - ayanamsa(J)) / 30);   // 0 = Mesha

function newMoonNear(J) {                         // refine to the nearest new moon
  let t = J;
  for (let i = 0; i < 8; i++) {
    let e = elong(t); if (e > 180) e -= 360;
    t -= e / 12.19;
  }
  return t;
}

// Lunar month (amanta) at time J: 0 = Chaitra ... 11 = Phalguna, plus adhika flag.
function lunarMonth(J) {
  const prev = newMoonNear(J - elong(J) / 12.19);
  const next = newMoonNear(prev + 29.53);
  const r0 = rashi(prev), r1 = rashi(next);
  return { idx: (r0 + 1) % 12, adhika: r0 === r1 };
}

const pad = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
export const addDays = (s, n) => {
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
};

/* Find the day in `year` when a tithi falls.
   month: 0 Chaitra, 1 Vaishakha, ... 5 Bhadrapada, 6 Ashwin, 11 Phalguna
   tithi: 1-15 shukla (waxing), 16-29 krishna, 30 amavasya
   hour: IST hour at which the tithi must be running (6 = sunrise, 12 = noon, 14 = afternoon, 18.5 = evening) */
export function tithiDay(year, { month, tithi, hour = 6 }) {
  const at = (s) => { const [y, m, d] = s.split("-").map(Number); return jdUTC(y, m, d, hour - IST); };
  const lo = 12 * (tithi - 1), hi = 12 * tithi;
  let fallback = null;
  for (let s = iso(year, 1, 1); s <= iso(year, 12, 31); s = addDays(s, 1)) {
    const J = at(s);
    const e = elong(J);
    if (Math.floor(e / 12) + 1 === tithi) {
      const mth = lunarMonth(J);
      if (mth.idx === month && !mth.adhika) return s;
    } else if (!fallback) {
      // The tithi may start and end between two sunrises (a "skipped" tithi): use the day it starts.
      const J2 = at(addDays(s, 1));
      const d1 = ((e - lo + 540) % 360) - 180, d2 = ((elong(J2) - lo + 540) % 360) - 180;
      if (d1 <= 0 && d2 >= 12) {
        const mth = lunarMonth(J2);
        if (mth.idx === month && !mth.adhika) fallback = s;
      }
    }
  }
  return fallback;
}

/* Islamic calendar via Intl. Returns every Gregorian date in `year` on which the
   Hijri date is (hMonth, hDay). Returns [] if the browser has no Islamic calendar. */
export function hijriDays(year, hMonth, hDay) {
  try {
    const f = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", timeZone: "UTC" });
    const out = [];
    for (let s = iso(year, 1, 1); s <= iso(year, 12, 31); s = addDays(s, 1)) {
      const [y, m, d] = s.split("-").map(Number);
      const p = f.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
      const mm = +p.find((x) => x.type === "month").value, dd = +p.find((x) => x.type === "day").value;
      if (mm === hMonth && dd === hDay) out.push(s);
    }
    return out;
  } catch { return []; }
}