import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classificationData,
  classificationMetrics,
  clusterData,
  gradient,
  kmeans,
  logistic,
  ols,
  regressionData,
  regularization,
} from "../src/lib/engine";

test("a fixed seed reproduces data and changed noise preserves x draws", () => {
  const a = regressionData(42, 0.5),
    b = regressionData(42, 2);
  assert.deepEqual(a, regressionData(42, 0.5));
  assert.deepEqual(
    a.map((p) => p.x),
    b.map((p) => p.x),
  );
  assert.notDeepEqual(a, regressionData(43, 0.5));
});
test("OLS recovers a known affine relationship and rejects a singular design", () => {
  const points = [-2, -1, 0, 1, 2].map((x) => ({ x, y: 3 + 2 * x }));
  const fit = ols(points);
  assert.equal(fit.slope, 2);
  assert.equal(fit.intercept, 3);
  assert.equal(fit.rss, 0);
  assert.throws(() =>
    ols([
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
    ]),
  );
});
test("logistic fitting never reads validation outcomes", () => {
  const data = classificationData(9, 1),
    fit = logistic(data, 0.05);
  const changed = data.map((p) =>
    p.validation ? { ...p, label: 1 - p.label! } : p,
  );
  assert.deepEqual(fit, logistic(changed, 0.05));
  assert.ok(fit.losses.at(-1)! < fit.losses[0]);
  for (let i = 1; i < fit.losses.length; i++)
    assert.ok(fit.losses[i] <= fit.losses[i - 1] + 1e-10);
  const heldout = data.filter((p) => p.validation);
  const low = classificationMetrics(heldout, fit, 0.2),
    high = classificationMetrics(heldout, fit, 0.8);
  assert.ok(low.tp >= high.tp);
  assert.equal(low.tp + low.tn + low.fp + low.fn, heldout.length);
});
test("K-means steps do not increase SSE, and every point has a valid assignment", () => {
  for (const k of [2, 3, 5]) {
    const data = clusterData(42),
      history = kmeans(data, k, 42);
    for (const s of history) {
      assert.equal(s.labels.length, data.length);
      assert.ok(s.labels.every((l) => l >= 0 && l < k));
      assert.ok(Number.isFinite(s.loss));
    }
    for (let i = 1; i < history.length; i++)
      assert.ok(history[i].loss <= history[i - 1].loss + 1e-8);
    assert.deepEqual(history, kmeans(data, k, 42));
  }
});
test("quadratic optimizer reflects stable, oscillating and divergent regimes", () => {
  const stable = gradient(0.2);
  assert.ok(stable.at(-1)!.loss < stable[0].loss);
  assert.ok(stable.every((p) => p.x >= 0 && p.y <= 0));
  assert.ok(gradient(0.3)[1].y > 0);
  assert.ok(gradient(0.55).at(-1)!.loss > gradient(0.55)[0].loss);
});
test("penalty-zero solutions agree; L1 can produce exact zeros", () => {
  const zero = regularization(42, 0);
  assert.ok(Math.abs(zero.ridge[0] - zero.lasso[0]) < 1e-7);
  assert.ok(Math.abs(zero.ridge[1] - zero.lasso[1]) < 1e-7);
  const large = regularization(42, 3);
  assert.ok(large.lasso.some((w) => w === 0));
  assert.ok(Math.hypot(...large.ridge) < Math.hypot(...zero.ridge));
});
