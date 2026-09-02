/* Pure-SVG chart primitives for the patient mobile screens (Figma 6-385/6-725).
   Colors validated (dataviz): #066c41 + #2563eb pass all palette checks; the
   single-series sparklines rely on their large direct value labels. */

export function ProgressRing({
  pct,
  size = 180,
  stroke = 14,
  color = "#0b4d34",
  track = "#e5e7eb",
  children,
}: Readonly<{
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}>) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, pct)) / 100;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * filled} ${c * (1 - filled)}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function points(values: number[], w: number, h: number, pad = 4) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1);
    const y = h - pad - ((v - min) / span) * (h - 2 * pad);
    return [x, y] as const;
  });
}

const smoothLine = (pts: ReadonlyArray<readonly [number, number]>) => {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const d = [`M${pts[0][0]},${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const x0 = pts[Math.max(i - 1, 0)][0];
    const y0 = pts[Math.max(i - 1, 0)][1];
    const x1 = pts[i][0];
    const y1 = pts[i][1];
    const x2 = pts[i + 1][0];
    const y2 = pts[i + 1][1];
    const x3 = pts[Math.min(i + 2, pts.length - 1)][0];
    const y3 = pts[Math.min(i + 2, pts.length - 1)][1];

    const tension = 0.2;
    const cp1x = x1 + (x2 - x0) * tension;
    const cp1y = y1 + (y2 - y0) * tension;
    const cp2x = x2 - (x3 - x1) * tension;
    const cp2y = y2 - (y3 - y1) * tension;

    d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`);
  }
  return d.join(" ");
};

/** Smooth single-series sparkline (2px line, no axes — value shown as big label). */
export function Sparkline({
  values,
  color,
  width = 220,
  height = 56,
  step = false,
}: Readonly<{
  values: number[];
  color: string;
  width?: number;
  height?: number;
  step?: boolean;
}>) {
  if (values.length < 2) return null;
  const pts = points(values, width, height);
  const d = step
    ? pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `H${x} V${y}`)).join(" ")
    : smoothLine(pts);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="max-w-full">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Two-series correlation: green dosage area + dashed blue relief line (Figma 6-725). */
export function CorrelationChart({
  dosage,
  relief,
  labels,
  width = 320,
  height = 180,
}: Readonly<{
  dosage: number[];
  relief: number[];
  labels: string[];
  width?: number;
  height?: number;
}>) {
  if (dosage.length < 2) return null;
  const plotH = height - 24; // room for x labels
  const dPts = points(dosage, width, plotH);
  const rPts = points(relief, width, plotH);
  const line = (pts: ReadonlyArray<readonly [number, number]>) => smoothLine(pts);
  const area = `${line(dPts)} L${dPts.at(-1)![0]},${plotH} L${dPts[0][0]},${plotH} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      className="w-full h-auto"
    >
      {/* recessive horizontal grid */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={0}
          x2={width}
          y1={plotH * f}
          y2={plotH * f}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      <path d={area} fill="#066c41" opacity={0.12} />
      <path d={line(dPts)} fill="none" stroke="#066c41" strokeWidth={2} />
      {dPts.map(([x, y], i) =>
        i % 2 === 0 ? <circle key={i} cx={x} cy={y} r={3} fill="#066c41" stroke="#fff" strokeWidth={2} /> : null,
      )}
      <path
        d={line(rPts)}
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      {labels.map((l, i) => (
        <text
          key={l + i}
          x={dPts[i]?.[0] ?? 0}
          y={height - 6}
          textAnchor="middle"
          fontSize={10}
          fill="#6b7280"
          style={{ textTransform: "uppercase" }}
        >
          {l}
        </text>
      ))}
    </svg>
  );
}
