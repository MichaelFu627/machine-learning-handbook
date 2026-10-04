import { t } from "@/lib/catalog";
import { Snapshot } from "@/lib/engine";
import { Scatter, LineChart, COLORS } from "../../Charts";
import { Stat, fmt } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function clusteringView({
  slug,
  locale,
  settings,
  points,
  local,
  currentStep,
  move,
}: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (slug === "k-means" && local) {
    const history = local as Snapshot[],
      s = history[currentStep];
    visual = (
      <Scatter
        points={points}
        bounds={[
          Math.min(0, ...points.map((p) => p.x - 0.3)),
          Math.max(10, ...points.map((p) => p.x + 0.3)),
          Math.min(0, ...points.map((p) => p.y - 0.3)),
          Math.max(10, ...points.map((p) => p.y + 0.3)),
        ]}
        centers={s.centers}
        colors={s.labels.map((l) => COLORS[l])}
        onMove={move}
        title={t(
          locale,
          "K-means assignments and centers. Move points or play the iterations.",
          "K-means 分配与中心。可移动数据点或播放迭代。",
        )}
      />
    );
    metrics = (
      <>
        <Stat
          label={t(locale, "Clusters K", "簇数 K")}
          value={settings.value}
        />
        <Stat
          label={t(locale, "Current phase", "当前阶段")}
          value={
            s.phase === "assign"
              ? t(locale, "Assign", "分配")
              : t(locale, "Update", "更新")
          }
        />
        <Stat
          label={t(locale, "Within-cluster SSE", "簇内平方和")}
          value={fmt(s.loss)}
        />
        <Stat
          label={t(locale, "Step", "步数")}
          value={`${currentStep + 1}/${history.length}`}
        />
      </>
    );
    detail = (
      <LineChart
        series={[history.slice(0, currentStep + 1).map((s) => s.loss)]}
        title={t(locale, "Within-cluster sum of squares", "簇内平方和")}
      />
    );
  }
  return { visual, metrics, detail };
}
