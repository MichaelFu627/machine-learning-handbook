import { t } from "@/lib/catalog";
import { ols } from "@/lib/engine";
import { Scatter } from "../../Charts";
import { Stat, fmt } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function regressionView({
  slug,
  locale,
  points,
  residuals,
  setResiduals,
  move,
}: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (slug === "linear-regression") {
    let model;
    try {
      model = ols(points);
    } catch {}
    visual = (
      <Scatter
        points={points}
        bounds={[
          Math.min(0, ...points.map((p) => p.x - 0.3)),
          Math.max(10, ...points.map((p) => p.x + 0.3)),
          Math.min(-4, ...points.map((p) => p.y - 0.3)),
          Math.max(14, ...points.map((p) => p.y + 0.3)),
        ]}
        line={model}
        residuals={residuals}
        onMove={move}
        title={t(
          locale,
          "Drag observations to change the least-squares fit. Arrow keys move a focused point.",
          "拖动观测点改变最小二乘拟合，也可聚焦数据点后使用方向键。",
        )}
        xLabel="x"
        yLabel="y"
      />
    );
    metrics = (
      <>
        <Stat
          label={t(locale, "Slope β₁", "斜率 β₁")}
          value={fmt(model?.slope)}
        />
        <Stat
          label={t(locale, "Intercept β₀", "截距 β₀")}
          value={fmt(model?.intercept)}
        />
        <Stat label="RSS" value={fmt(model?.rss)} />
        <Stat
          label={t(locale, "Training RMSE", "训练 RMSE")}
          value={fmt(model?.rmse)}
        />
      </>
    );
    detail = (
      <>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={residuals}
            onChange={(e) => setResiduals(e.target.checked)}
          />
          {t(locale, "Show vertical residuals", "显示竖直残差")}
        </label>
        <p className="experiment-note">
          {model
            ? t(
                locale,
                "Drag any point, or focus it and use arrow keys. The fit updates immediately.",
                "拖动任意点，或聚焦后使用方向键。拟合结果即时更新。",
              )
            : t(
                locale,
                "Move points to different x positions to obtain a unique line.",
                "请将数据点移到不同的 x 位置，以得到唯一拟合线。",
              )}
        </p>
      </>
    );
  }
  return { visual, metrics, detail };
}
