import { t } from "@/lib/catalog";
import { regularization } from "@/lib/engine";
import { LineChart } from "../../Charts";
import { Stat, fmt } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function regularizationView({
  slug,
  locale,
  settings,
  local,
}: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (slug === "regularization" && local) {
    const r = local as ReturnType<typeof regularization>;
    visual = (
      <div className="coefficient-view">
        <h3>
          {t(locale, "Two penalties. Two paths.", "两种惩罚，两条路径。")}
        </h3>
        <LineChart
          series={[
            r.path.map((p) => p.ridge[0]),
            r.path.map((p) => p.ridge[1]),
            r.path.map((p) => p.lasso[0]),
            r.path.map((p) => p.lasso[1]),
          ]}
          title={t(
            locale,
            "Coefficient paths · horizontal index / 20 = λ",
            "系数路径 · 横轴索引 / 20 = λ",
          )}
          labels={["Ridge w₁", "Ridge w₂", "Lasso w₁", "Lasso w₂"]}
        />
        <p>
          {t(locale, "Current λ", "当前 λ")} = {settings.value.toFixed(2)}
        </p>
      </div>
    );
    metrics = (
      <>
        <Stat label="Ridge w₁" value={fmt(r.ridge[0], 3)} />
        <Stat label="Ridge w₂" value={fmt(r.ridge[1], 3)} />
        <Stat label="Lasso w₁" value={fmt(r.lasso[0], 3)} />
        <Stat label="Lasso w₂" value={fmt(r.lasso[1], 3)} />
      </>
    );
    detail = (
      <p className="experiment-note">
        {t(
          locale,
          "120 standardized observations with correlated features. Both objectives use RSS/(2n) + λR(w). This is a coefficient experiment, not a generalization estimate.",
          "120 个标准化观测，两个特征相关。两者采用 RSS/(2n)+λR(w)。这是系数实验，不是泛化评估。",
        )}
      </p>
    );
  }
  return { visual, metrics, detail };
}
