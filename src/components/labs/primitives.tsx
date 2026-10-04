export function Range({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="range-control">
      <span>
        {label}
        <output>
          {Number.isInteger(value)
            ? value
            : value.toFixed(Math.max(0, Math.ceil(-Math.log10(step))))}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="range-ends">
        <small>{min}</small>
        <small>{max}</small>
      </span>
    </label>
  );
}
export function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="stat">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
export const fmt = (n: number | undefined | null, d = 2) =>
  n === undefined || n === null ? "—" : n.toFixed(d);
export const pct = (n: number | undefined | null) =>
  n === undefined || n === null ? "—" : `${(n * 100).toFixed(1)}%`;
