import { Point, ENGINE_VERSION } from "@/lib/engine";
import type { Bounds } from "../Charts";
export type Settings = {
  seed: number;
  noise: number;
  value: number;
  threshold: number;
  depth: number;
  trees: number;
  features: number;
  c: number;
  gamma: number;
  dataset: string;
  kernel: string;
  samples: number;
  burn: number;
  width: number;
  smoothing: number;
};
export const defaults = (slug: string): Settings => ({
  seed: 42,
  noise:
    slug === "linear-regression"
      ? 0.9
      : slug === "logistic-regression"
        ? 1
        : 0.2,
  value:
    slug === "k-means" || slug === "expectation-maximization"
      ? 3
      : slug === "gradient-descent"
        ? 0.1
        : slug === "regularization"
          ? 0.4
          : 0.05,
  threshold: 0.5,
  depth: 3,
  trees: 20,
  features: 1,
  c: 1,
  gamma: 1,
  dataset: "moons",
  kernel: "rbf",
  samples: 1000,
  burn: 100,
  width: 0.5,
  smoothing: 1e-9,
});
export const remoteMap: Record<string, string> = {
  "naive-bayes": "bayes",
  svm: "svm",
  "decision-trees": "tree",
  bagging: "bagging",
  "random-forests": "forest",
  "expectation-maximization": "em",
  mcmc: "mcmc",
};
export type RemoteResult = {
  kind: string;
  points?: number[][];
  bounds?: Bounds;
  grid?: number[];
  gridSize?: number;
  trainAccuracy?: number;
  testAccuracy?: number;
  support?: number[][];
  snapshots?: {
    centers: number[][];
    responsibilities: number[][];
    loss: number;
  }[];
  states?: number[];
  retained?: number[];
  acceptance?: number;
  crossings?: number;
  ess?: number;
  acf?: number[];
};
const ranges: Record<string, [number, number]> = {
  seed: [0, 2147483647],
  noise: [0.01, 3],
  value: [0, 5],
  threshold: [0.05, 0.95],
  depth: [1, 10],
  trees: [1, 100],
  features: [1, 2],
  c: [0.01, 100],
  gamma: [0.01, 10],
  samples: [100, 5000],
  burn: [0, 4999],
  width: [0.05, 5],
  smoothing: [1e-9, 1],
};
export function restore(slug: string) {
  const d = defaults(slug);
  let edited: Point[] | null = null;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("v") !== String(ENGINE_VERSION) || !q.has("lab"))
      return { settings: d, edited };
    const raw = JSON.parse(q.get("lab")!);
    for (const [key, [min, max]] of Object.entries(ranges)) {
      const value = raw[key];
      if (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= min &&
        value <= max
      )
        (d as unknown as Record<string, unknown>)[key] = value;
    }
    for (const key of [
      "seed",
      "depth",
      "trees",
      "features",
      "samples",
      "burn",
    ] as const)
      d[key] = Math.floor(d[key]);
    if (["moons", "circles", "linear"].includes(raw.dataset))
      d.dataset = raw.dataset;
    if (["linear", "rbf", "poly"].includes(raw.kernel)) d.kernel = raw.kernel;
    if (slug === "k-means" || slug === "expectation-maximization")
      d.value = Math.max(2, Math.min(5, Math.round(d.value)));
    if (slug === "gradient-descent")
      d.value = Math.max(0.01, Math.min(0.65, d.value));
    if (slug === "logistic-regression")
      d.value = Math.max(0.001, Math.min(1, d.value));
    if (slug === "regularization") d.value = Math.min(3, d.value);
    d.burn = Math.min(d.burn, d.samples - 10);
    if (remoteMap[slug]) d.noise = Math.min(1, d.noise);
    if (
      ["linear-regression", "k-means"].includes(slug) &&
      Array.isArray(raw.points) &&
      raw.points.length >= 3 &&
      raw.points.length <= 200 &&
      raw.points.every(
        (p: Point) =>
          p &&
          Number.isFinite(p.x) &&
          Number.isFinite(p.y) &&
          Math.abs(p.x) <= 1e6 &&
          Math.abs(p.y) <= 1e6,
      )
    )
      edited = raw.points.map((p: Point) => ({ x: p.x, y: p.y }));
    if (slug === "k-means" && edited)
      d.value = Math.min(d.value, edited.length);
  } catch {}
  return { settings: d, edited };
}
