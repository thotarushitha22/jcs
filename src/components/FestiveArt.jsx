// Festive decoration drawn as inline SVG. It sits on top of the phone photo.
const Diya = ({ x, y, k }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    <circle cy="-34" r="38" fill="#fbbf24" opacity=".25" />
    <path d="M-30 0Q0 34 30 0Z" fill="#b45309" />
    <path d="M-30 0H30" stroke="#f59e0b" strokeWidth="4" />
    <path d="M0 -8Q-13 -30 0 -56Q13 -30 0 -8Z" fill="#fbbf24" />
    <path d="M0 -10Q-5 -26 0 -40Q5 -26 0 -10Z" fill="#fff7d6" />
  </g>
);

const Marigold = ({ x, y, k }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`}>
    {[0, 45, 90, 135].map((a) => (
      <ellipse key={a} rx="26" ry="9" transform={`rotate(${a})`} fill="#f59e0b" />
    ))}
    <circle r="9" fill="#b45309" />
  </g>
);

const Lights = ({ colors }) => (
  <>
    <path d="M10 30Q250 100 490 30" fill="none" stroke="#ffffff55" strokeWidth="2" />
    {Array.from({ length: 11 }, (_, i) => {
      const t = i / 10, x = 10 + 480 * t, y = 38 + 140 * t * (1 - t), c = colors[i % colors.length];
      return (
        <g key={i}>
          <circle cx={x} cy={y} r="14" fill={c} opacity=".25" />
          <circle cx={x} cy={y} r="7" fill={c} />
        </g>
      );
    })}
  </>
);

const Splash = ({ x, y, r, c }) => <circle cx={x} cy={y} r={r} fill={c} opacity=".75" />;


// Dussehra scene: flaming arrow, ten-headed effigy, garland and fireworks.
const Head = ({ x, y, r }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M${-r} ${-r * .6}L${-r * .6} ${-r * 1.5}L0 ${-r * .9}L${r * .6} ${-r * 1.5}L${r} ${-r * .6}Z`} fill="#fbbf24" />
    <circle r={r} fill="#f97316" />
    <circle cx={-r * .38} cy={-r * .15} r={r * .14} fill="#1b0a02" />
    <circle cx={r * .38} cy={-r * .15} r={r * .14} fill="#1b0a02" />
    <path d={`M${-r * .5} ${r * .35}Q0 ${r * .7} ${r * .5} ${r * .35}`} stroke="#1b0a02" strokeWidth="2" fill="none" />
  </g>
);
const Burst = ({ x, y, k, c }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`} stroke={c} strokeWidth="3" strokeLinecap="round">
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i * Math.PI) / 5;
      return <line key={i} x1={Math.cos(a) * 10} y1={Math.sin(a) * 10} x2={Math.cos(a) * (i % 2 ? 24 : 34)} y2={Math.sin(a) * (i % 2 ? 24 : 34)} />;
    })}
    <circle r="4" fill={c} stroke="none" />
  </g>
);
const DussehraScene = () => (
  <>
    <circle cx="345" cy="290" r="130" fill="#f97316" opacity=".28" />
    <path d="M20 25Q250 105 480 25" fill="none" stroke="#f59e0b" strokeWidth="3" />
    {[0.1, 0.3, 0.5, 0.7, 0.9].map((t) => (
      <Marigold key={t} x={20 + 460 * t} y={25 + 160 * t * (1 - t) + 8} k={0.7} />
    ))}
    <Burst x={420} y={105} k={0.8} c="#fde047" />
    <Burst x={170} y={95} k={0.55} c="#fb7185" />
    <Burst x={470} y={190} k={0.4} c="#a7f3d0" />

    {/* effigy */}
    <g transform="translate(345 320)">
      <rect x="-30" y="-80" width="22" height="80" fill="#7c2d12" />
      <rect x="8" y="-80" width="22" height="80" fill="#7c2d12" />
      <path d="M-46 -80H46L38 -170H-38Z" fill="#dc2626" />
      <rect x="-40" y="-130" width="80" height="10" fill="#fbbf24" />
      <line x1="-38" y1="-160" x2="-82" y2="-118" stroke="#fbbf24" strokeWidth="11" strokeLinecap="round" />
      <line x1="38" y1="-160" x2="82" y2="-128" stroke="#fbbf24" strokeWidth="11" strokeLinecap="round" />
      <line x1="82" y1="-128" x2="98" y2="-205" stroke="#e5e7eb" strokeWidth="5" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((k) => <Head key={`a${k}`} x={-48 + 24 * k} y={-196} r={14} />)}
      {[0, 1, 2, 3, 4].map((k) => <Head key={`b${k}`} x={-48 + 24 * k} y={-226} r={11} />)}
      <path d="M-20 -150Q-34 -178 -16 -206Q-4 -178 -20 -150Z" fill="#fde047" opacity=".9" />
      <path d="M20 -140Q8 -164 24 -186Q36 -162 20 -140Z" fill="#f97316" opacity=".9" />
    </g>

    {/* bow and flaming arrow */}
    <path d="M70 105Q0 200 70 295" fill="none" stroke="#fde047" strokeWidth="6" strokeLinecap="round" />
    <path d="M70 105L70 295" stroke="#ffffffaa" strokeWidth="2" />
    <line x1="70" y1="200" x2="292" y2="172" stroke="#fde68a" strokeWidth="4" strokeLinecap="round" />
    <path d="M286 172Q300 154 322 172Q300 190 286 172Z" fill="#f97316" />
    <path d="M292 172Q302 163 312 172Q302 181 292 172Z" fill="#fff7d6" />
    {[[250, 160, 3], [225, 150, 2.5], [200, 188, 2.5], [265, 190, 2]].map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r} fill="#fde047" opacity=".85" />
    ))}
  </>
);

export default function FestiveArt({ id, label }) {
  let body = null;
  if (id === "diwali")
    body = (<><Lights colors={["#fbbf24", "#fb7185", "#fde68a", "#f97316"]} />
      <Diya x={90} y={330} k={1.3} /><Diya x={250} y={345} k={.85} /><Diya x={410} y={335} k={1.1} /></>);
  else if (id === "dussehra") body = <DussehraScene />;
  else if (id === "holi")
    body = (<><Splash x={80} y={90} r={70} c="#ec4899" /><Splash x={430} y={80} r={55} c="#22c55e" />
      <Splash x={440} y={290} r={80} c="#f59e0b" /><Splash x={70} y={300} r={60} c="#38bdf8" /><Splash x={250} y={40} r={30} c="#a78bfa" /></>);
  else if (id === "bbd")
    body = (<g transform="translate(405 272) scale(0.4) translate(-250 -180)">
      <polygon fill="#ffd23f" points="250,10 285,70 350,40 345,110 415,120 375,180 430,230 360,250 370,320 305,290 270,350 235,295 170,330 170,260 100,250 140,200 80,150 150,130 140,60 205,80" />
      <text x="250" y="198" textAnchor="middle" fontFamily="Arial" fontWeight="900"
        fontSize={(label || "SALE").length > 5 ? 38 : 52} fill="#0b1f4d">{label || "SALE"}</text></g>);
  else if (id === "xmas-ny")
    body = (<>{[60, 130, 440].map((x, j) => (
      <g key={x} transform={`translate(${x} ${300 - j * 10})`}>
        <path d="M0 -70L30 -20H-30ZM0 -40L40 20H-40ZM0 -10L50 60H-50Z" fill="#16a34a" />
        <rect x="-6" y="60" width="12" height="16" fill="#92400e" /><circle cy="-76" r="6" fill="#fde047" />
      </g>))}
      {Array.from({ length: 24 }, (_, j) => <circle key={j} cx={(j * 97) % 500} cy={(j * 53) % 360} r="3" fill="#fff" opacity=".7" />)}</>);
  else if (id === "republic")
    body = (<g transform="rotate(-14 250 180)">
      <rect x="40" y="40" width="420" height="90" fill="#ff9933" /><rect x="40" y="130" width="420" height="90" fill="#fff" />
      <rect x="40" y="220" width="420" height="90" fill="#138808" />
      <circle cx="250" cy="175" r="34" fill="none" stroke="#000080" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, j) => (
        <line key={j} x1="250" y1="175" x2={250 + 34 * Math.cos(j * Math.PI / 6)} y2={175 + 34 * Math.sin(j * Math.PI / 6)} stroke="#000080" strokeWidth="2" />))}
    </g>);
  if (!body) return null;
  return <svg className="hc-art" viewBox="0 0 500 360" aria-hidden="true">{body}</svg>;
}