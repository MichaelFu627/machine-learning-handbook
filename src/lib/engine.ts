export type Point = {
  x: number;
  y: number;
  label?: number;
  validation?: boolean;
};
export type Snapshot = {
  centers: Point[];
  labels: number[];
  loss: number;
  phase: "assign" | "update";
};
export const ENGINE_VERSION = 1;
export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let z = a;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
export function normal(rng: () => number) {
  return (
    Math.sqrt(-2 * Math.log(Math.max(rng(), 1e-12))) *
    Math.cos(2 * Math.PI * rng())
  );
}
export function regressionData(seed: number, noise: number, n = 36): Point[] {
  const rng = random(seed);
  return Array.from({ length: n }, () => {
    const x = 0.3 + rng() * 9.4;
    return { x, y: 1.2 + 0.65 * x + noise * normal(rng) };
  });
}
export function ols(points: Point[]) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const xx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (n < 3 || xx < 1e-10)
    throw new Error("At least three points with varying x are required.");
  const slope = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / xx;
  const intercept = my - slope * mx;
  const residuals = points.map((p) => p.y - (intercept + slope * p.x));
  const rss = residuals.reduce((s, r) => s + r * r, 0);
  const total = points.reduce((s, p) => s + (p.y - my) ** 2, 0);
  return {
    slope,
    intercept,
    residuals,
    rss,
    rmse: Math.sqrt(rss / n),
    r2: total > 0 ? 1 - rss / total : 1,
  };
}
export function classificationData(seed: number, noise: number): Point[] {
  const rng = random(seed);
  return Array.from({ length: 160 }, (_, i) => {
    const label = i % 2;
    return {
      x: (label ? 1.2 : -1.2) + normal(rng) * noise,
      y: (label ? 0.7 : -0.7) + normal(rng) * noise,
      label,
      validation: i % 10 >= 7,
    };
  });
}
export function sigmoid(z: number) {
  return z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
}
export function logistic(points: Point[], lambda: number) {
  const train = points.filter((p) => !p.validation);
  let w1 = 0,
    w2 = 0,
    b = 0;
  const losses: number[] = [];
  for (let step = 0; step < 500; step++) {
    let dw1 = 0,
      dw2 = 0,
      db = 0,
      loss = 0;
    for (const p of train) {
      const z = w1 * p.x + w2 * p.y + b;
      const error = sigmoid(z) - p.label!;
      dw1 += error * p.x;
      dw2 += error * p.y;
      db += error;
      loss +=
        Math.max(z, 0) - z * p.label! + Math.log1p(Math.exp(-Math.abs(z)));
    }
    losses.push(loss / train.length + (lambda / 2) * (w1 * w1 + w2 * w2));
    w1 -= 0.1 * (dw1 / train.length + lambda * w1);
    w2 -= 0.1 * (dw2 / train.length + lambda * w2);
    b -= (0.1 * db) / train.length;
  }
  return { w1, w2, b, losses };
}
export function classificationMetrics(
  points: Point[],
  model: { w1: number; w2: number; b: number },
  threshold: number,
) {
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0;
  for (const p of points) {
    const prediction =
      sigmoid(model.w1 * p.x + model.w2 * p.y + model.b) >= threshold;
    if (prediction && p.label) tp++;
    else if (prediction) fp++;
    else if (p.label) fn++;
    else tn++;
  }
  return {
    tp,
    tn,
    fp,
    fn,
    accuracy: (tp + tn) / points.length,
    precision: tp + fp ? tp / (tp + fp) : null,
    recall: tp + fn ? tp / (tp + fn) : null,
  };
}
export function clusterData(seed: number): Point[] {
  const rng = random(seed),
    centers = [
      { x: 2.2, y: 2.8 },
      { x: 7.3, y: 3.1 },
      { x: 5, y: 7.5 },
    ];
  return Array.from({ length: 75 }, (_, i) => ({
    x: centers[i % 3].x + normal(rng) * 0.8,
    y: centers[i % 3].y + normal(rng) * 0.8,
  }));
}
const distance = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export function kmeans(points: Point[], k: number, seed: number): Snapshot[] {
  if (k < 1 || k > points.length) throw new Error("Invalid K");
  const rng = random(seed);
  let centers = [{ ...points[Math.floor(rng() * points.length)] }];
  while (centers.length < k) {
    const weights = points.map((p) =>
      Math.min(...centers.map((c) => distance(p, c))),
    );
    let target = rng() * weights.reduce((s, w) => s + w, 0),
      index = 0;
    for (; index < weights.length - 1; index++) {
      target -= weights[index];
      if (target <= 0) break;
    }
    centers.push({ ...points[index] });
  }
  let labels: number[] = [];
  const history: Snapshot[] = [];
  const save = (phase: "assign" | "update") =>
    history.push({
      centers: centers.map((p) => ({ ...p })),
      labels: [...labels],
      loss: points.reduce((s, p, i) => s + distance(p, centers[labels[i]]), 0),
      phase,
    });
  for (let step = 0; step < 25; step++) {
    const next = points.map((p) => {
      const distances = centers.map((c) => distance(p, c));
      return distances.indexOf(Math.min(...distances));
    });
    const unchanged = next.every((v, i) => v === labels[i]);
    labels = next;
    save("assign");
    centers = centers.map((c, j) => {
      const members = points.filter((_, i) => labels[i] === j);
      return members.length
        ? {
            x: members.reduce((s, p) => s + p.x, 0) / members.length,
            y: members.reduce((s, p) => s + p.y, 0) / members.length,
          }
        : c;
    });
    save("update");
    if (unchanged) break;
  }
  return history;
}
export function gradient(rate: number) {
  let x = 8,
    y = -8;
  return Array.from({ length: 41 }, () => {
    const state = { x, y, loss: x * x + 2 * y * y };
    x *= 1 - 2 * rate;
    y *= 1 - 4 * rate;
    return state;
  });
}
export function regularization(seed: number, lambda: number) {
  const rng = random(seed);
  const raw = Array.from({ length: 120 }, () => {
    const x = normal(rng);
    return [x, 0.85 * x + 0.5 * normal(rng), normal(rng)];
  });
  const means = [0, 1].map(
    (j) => raw.reduce((s, r) => s + r[j], 0) / raw.length,
  );
  const scales = means.map((m, j) =>
    Math.sqrt(raw.reduce((s, r) => s + (r[j] - m) ** 2, 0) / raw.length),
  );
  const X = raw.map((r) => [
    (r[0] - means[0]) / scales[0],
    (r[1] - means[1]) / scales[1],
  ]);
  const y = X.map((r, i) => 2.5 * r[0] + 0.5 * r[1] + 0.6 * raw[i][2]);
  const n = y.length,
    a = X.reduce((s, r) => s + r[0] * r[0], 0) / n,
    d = X.reduce((s, r) => s + r[1] * r[1], 0) / n;
  const b = X.reduce((s, r) => s + r[0] * r[1], 0) / n;
  const u = X.reduce((s, r, i) => s + r[0] * y[i], 0) / n,
    v = X.reduce((s, r, i) => s + r[1] * y[i], 0) / n;
  const solve = (l: number) => {
    const aa = a + 2 * l,
      dd = d + 2 * l,
      determinant = aa * dd - b * b;
    const ridge = [
      (dd * u - b * v) / determinant,
      (aa * v - b * u) / determinant,
    ];
    let w1 = 0,
      w2 = 0;
    const soft = (z: number) => Math.sign(z) * Math.max(0, Math.abs(z) - l);
    for (let i = 0; i < 1000; i++) {
      const old1 = w1,
        old2 = w2;
      w1 = soft(u - b * w2) / a;
      w2 = soft(v - b * w1) / d;
      if (Math.abs(w1 - old1) + Math.abs(w2 - old2) < 1e-10) break;
    }
    return { ridge, lasso: [w1, w2] };
  };
  return {
    ...solve(lambda),
    path: Array.from({ length: 61 }, (_, i) => ({
      lambda: i / 20,
      ...solve(i / 20),
    })),
  };
}
export type LocalAlgorithm = "logistic" | "kmeans" | "regularization";
export function compute(
  algorithm: LocalAlgorithm,
  points: Point[],
  params: { seed: number; value: number },
) {
  if (algorithm === "logistic") return logistic(points, params.value);
  if (algorithm === "kmeans") return kmeans(points, params.value, params.seed);
  return regularization(params.seed, params.value);
}
