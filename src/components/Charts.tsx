"use client";
import { useId } from "react";
import { Point } from "@/lib/engine";
export const COLORS = ["#347660", "#c87953", "#6f79a5", "#b69b43", "#9b6382"];
export type Bounds = [number, number, number, number];
export function Scatter({
  points,
  bounds = [0, 10, 0, 10],
  line,
  residuals = false,
  centers,
  colors,
  grid,
  gridSize = 42,
  onMove,
  trajectory,
  title,
  xLabel = "x₁",
  yLabel = "x₂",
  support = [],
  quadratic = false,
}: {
  points: Point[];
  bounds?: Bounds;
  line?: { slope: number; intercept: number };
  residuals?: boolean;
  centers?: Point[];
  colors?: string[];
  grid?: number[];
  gridSize?: number;
  onMove?: (index: number, point: Point) => void;
  trajectory?: Point[];
  title: string;
  xLabel?: string;
  yLabel?: string;
  support?: Point[];
  quadratic?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const [xmin, xmax, ymin, ymax] = bounds;
  const x = (v: number) => 44 + ((v - xmin) / (xmax - xmin)) * 532,
    y = (v: number) => 310 - ((v - ymin) / (ymax - ymin)) * 284;
  const move = (event: React.PointerEvent<SVGCircleElement>, i: number) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !onMove)
      return;
    const rect = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * 600,
      py = ((event.clientY - rect.top) / rect.height) * 350;
    onMove(i, {
      ...points[i],
      x: Math.max(
        xmin,
        Math.min(xmax, xmin + ((px - 44) / 532) * (xmax - xmin)),
      ),
      y: Math.max(
        ymin,
        Math.min(ymax, ymin + ((310 - py) / 284) * (ymax - ymin)),
      ),
    });
  };
  return (
    <svg
      className="scatter-chart"
      viewBox="0 0 600 350"
      role={onMove ? "group" : "img"}
      aria-labelledby={`${id}-title`}
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x="44" y="26" width="532" height="284" />
        </clipPath>
      </defs>
      <rect x="44" y="26" width="532" height="284" fill="#fafbf7" />
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <line
            x1={44 + i * 106.4}
            x2={44 + i * 106.4}
            y1="26"
            y2="310"
            stroke="#e2e8e0"
          />
          <line
            x1="44"
            x2="576"
            y1={26 + i * 56.8}
            y2={26 + i * 56.8}
            stroke="#e2e8e0"
          />
          <text x={44 + i * 106.4} y="330" textAnchor="middle">
            {(xmin + (i / 5) * (xmax - xmin)).toFixed(1)}
          </text>
          <text x="34" y={314 - i * 56.8} textAnchor="end">
            {(ymin + (i / 5) * (ymax - ymin)).toFixed(1)}
          </text>
        </g>
      ))}
      <g clipPath={`url(#${id}-clip)`}>
        {quadratic &&
          [2, 8, 20, 40, 80, 140, 220, 320].map((v) => (
            <ellipse
              key={v}
              cx={x(0)}
              cy={y(0)}
              rx={(Math.sqrt(v) / (xmax - xmin)) * 532}
              ry={(Math.sqrt(v / 2) / (ymax - ymin)) * 284}
              stroke="#c1d2b6"
              fill="none"
              strokeWidth="1"
            />
          ))}
        {grid?.map((v, i) => {
          const n = gridSize;
          return (
            <rect
              key={i}
              x={44 + ((i % n) * 532) / (n - 1) - 532 / (n - 1) / 2}
              y={310 - (Math.floor(i / n) * 284) / (n - 1) - 284 / (n - 1) / 2}
              width={532 / (n - 1) + 0.4}
              height={284 / (n - 1) + 0.4}
              fill={v ? COLORS[1] : COLORS[0]}
              opacity=".105"
            />
          );
        })}
        {line &&
          residuals &&
          points.map((p, i) => (
            <line
              key={i}
              x1={x(p.x)}
              x2={x(p.x)}
              y1={y(p.y)}
              y2={y(line.intercept + line.slope * p.x)}
              stroke="#c08e76"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}
        {line && (
          <line
            x1={x(xmin)}
            y1={y(line.intercept + line.slope * xmin)}
            x2={x(xmax)}
            y2={y(line.intercept + line.slope * xmax)}
            stroke="#215c47"
            strokeWidth="2.6"
          />
        )}
        {trajectory && (
          <polyline
            points={trajectory
              .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
              .map((p) => `${x(p.x)},${y(p.y)}`)
              .join(" ")}
            fill="none"
            stroke={COLORS[0]}
            strokeWidth="2"
          />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(p.x)}
            cy={y(p.y)}
            r={onMove ? 5 : 3.8}
            fill={
              p.validation ? "#fbfaf6" : colors?.[i] || COLORS[p.label ?? 0]
            }
            stroke={colors?.[i] || COLORS[p.label ?? 0]}
            strokeWidth={p.validation ? 1.8 : 1}
            opacity=".9"
            tabIndex={onMove ? 0 : undefined}
            role={onMove ? "button" : undefined}
            aria-label={
              onMove
                ? `${title}: ${i + 1}, x=${p.x.toFixed(2)}, y=${p.y.toFixed(2)}`
                : undefined
            }
            style={onMove ? { cursor: "grab", touchAction: "none" } : undefined}
            onPointerDown={
              onMove
                ? (e) => e.currentTarget.setPointerCapture(e.pointerId)
                : undefined
            }
            onPointerMove={onMove ? (e) => move(e, i) : undefined}
            onPointerUp={
              onMove
                ? (e) => e.currentTarget.releasePointerCapture(e.pointerId)
                : undefined
            }
            onKeyDown={
              onMove
                ? (e) => {
                    if (
                      ![
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                      ].includes(e.key)
                    )
                      return;
                    e.preventDefault();
                    const dx =
                        e.key === "ArrowLeft"
                          ? -0.1
                          : e.key === "ArrowRight"
                            ? 0.1
                            : 0,
                      dy =
                        e.key === "ArrowDown"
                          ? -0.1
                          : e.key === "ArrowUp"
                            ? 0.1
                            : 0;
                    onMove(i, {
                      ...p,
                      x: Math.max(xmin, Math.min(xmax, p.x + dx)),
                      y: Math.max(ymin, Math.min(ymax, p.y + dy)),
                    });
                  }
                : undefined
            }
          >
            <title>{`#${i + 1}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`}</title>
          </circle>
        ))}
        {support.map((p, i) => (
          <circle
            key={"s" + i}
            cx={x(p.x)}
            cy={y(p.y)}
            r="7"
            fill="none"
            stroke="#203f35"
            strokeWidth="1"
          />
        ))}
        {centers?.map((p, i) => (
          <g key={i}>
            <circle
              cx={x(p.x)}
              cy={y(p.y)}
              r="9"
              fill="#fff"
              stroke={COLORS[i]}
              strokeWidth="2"
            />
            <path
              d={`M${x(p.x) - 4} ${y(p.y)}h8 M${x(p.x)} ${y(p.y) - 4}v8`}
              stroke={COLORS[i]}
              strokeWidth="2"
            />
          </g>
        ))}
      </g>
      <text x="310" y="348" textAnchor="middle">
        {xLabel}
      </text>
      <text x="12" y="165" transform="rotate(-90 12 165)" textAnchor="middle">
        {yLabel}
      </text>
    </svg>
  );
}
export function LineChart({
  series,
  title,
  labels,
}: {
  series: number[][];
  title: string;
  labels?: string[];
}) {
  const id = useId(),
    values = series.flat().filter(Number.isFinite);
  const min = Math.min(0, ...values),
    max = Math.max(1e-8, ...values),
    range = max - min || 1;
  return (
    <div className="line-chart">
      <div className="chart-subtitle">{title}</div>
      <svg viewBox="0 0 600 145" role="img" aria-labelledby={id}>
        <title id={id}>{title}</title>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <line
              x1="45"
              x2="580"
              y1={15 + i * 48}
              y2={15 + i * 48}
              stroke="#e0e5dd"
            />
            <text x="38" y={19 + i * 48} textAnchor="end">
              {(max - (i / 2) * range).toPrecision(3)}
            </text>
          </g>
        ))}
        {series.map((s, j) => (
          <polyline
            key={j}
            points={s
              .map(
                (v, i) =>
                  `${45 + (i / Math.max(s.length - 1, 1)) * 535},${111 - ((v - min) / range) * 96}`,
              )
              .join(" ")}
            fill="none"
            stroke={COLORS[j]}
            strokeWidth="2"
          />
        ))}
        <text x="45" y="136">
          0
        </text>
        <text x="580" y="136" textAnchor="end">
          {Math.max(...series.map((s) => s.length)) - 1}
        </text>
      </svg>
      {labels && (
        <div className="chart-legend">
          {labels.map((label, i) => (
            <span key={label}>
              <i style={{ background: COLORS[i] }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
