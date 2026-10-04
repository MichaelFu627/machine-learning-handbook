export function HeroPlot() {
  const points = Array.from({ length: 24 }, (_, i) => ({
    x: 38 + i * 13.2,
    y: 240 - i * 5.8 + Math.sin(i * 4.6) * 29,
  }));
  return (
    <div className="hero-plot" aria-hidden="true">
      <div className="plot-topline">
        <span>
          <i /> LIVE IDEAS, NOT JUST EQUATIONS
        </span>
        <span>01 / ∞</span>
      </div>
      <svg viewBox="0 0 390 305">
        <defs>
          <pattern
            id="hero-grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke="#dce4df"
              strokeWidth=".6"
            />
          </pattern>
        </defs>
        <rect x="25" y="25" width="340" height="242" fill="url(#hero-grid)" />
        {points.map((p, i) => (
          <line
            key={"r" + i}
            x1={p.x}
            x2={p.x}
            y1={p.y}
            y2={240 - i * 5.8}
            stroke="#b6cabc"
            strokeDasharray="3 3"
          />
        ))}
        <line
          x1="27"
          y1="246"
          x2="367"
          y2="97"
          stroke="#255b4a"
          strokeWidth="2.4"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4.2"
            fill={i === 14 ? "#c66a47" : "#3f745e"}
            stroke="#fbfaf6"
            strokeWidth="1.5"
          />
        ))}
        <path
          d="M 223 65 Q 258 50 269 110"
          fill="none"
          stroke="#b8795c"
          strokeWidth="1"
        />
        <text
          x="143"
          y="59"
          fill="#8a674f"
          fontSize="14"
          fontFamily="Georgia"
          fontStyle="italic"
        >
          a little less error.
        </text>
        <text x="195" y="294" textAnchor="middle" fill="#85918a" fontSize="9">
          OBSERVE → EXPERIMENT → UNDERSTAND
        </text>
      </svg>
      <div className="plot-equation">
        <span>ŷ = β₀ + β₁x</span>
        <small>simple model, powerful idea</small>
      </div>
    </div>
  );
}
