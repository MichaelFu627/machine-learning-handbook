import { t } from "@/lib/catalog";
import { Scatter, LineChart, Bounds } from "../../Charts";
import { Stat, fmt } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function mixtureView({
  locale,
  settings,
  remote,
  currentStep,
}: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (remote?.kind === "em") {
    const s = remote.snapshots![currentStep];
    const rgb = [
      [52, 118, 96],
      [200, 121, 83],
      [111, 121, 165],
      [182, 155, 67],
      [155, 99, 130],
    ];
    const colors = s.responsibilities.map(
      (row) =>
        `rgb(${[0, 1, 2].map((j) => Math.round(row.reduce((v, p, i) => v + p * rgb[i][j], 0))).join(",")})`,
    );
    const p = remote.points!.map((p) => ({ x: p[0], y: p[1] }));
    const bounds: Bounds = [
      Math.min(...p.map((p) => p.x)) - 1,
      Math.max(...p.map((p) => p.x)) + 1,
      Math.min(...p.map((p) => p.y)) - 1,
      Math.max(...p.map((p) => p.y)) + 1,
    ];
    visual = (
      <Scatter
        points={p}
        centers={s.centers.map((c) => ({ x: c[0], y: c[1] }))}
        colors={colors}
        bounds={bounds}
        title={t(
          locale,
          "Gaussian mixture means and soft responsibilities",
          "高斯混合均值与软责任度",
        )}
      />
    );
    metrics = (
      <>
        <Stat
          label={t(locale, "Fitted components", "拟合分量")}
          value={settings.value}
        />
        <Stat label={t(locale, "True groups", "真实组数")} value={3} />
        <Stat
          label={t(locale, "Log likelihood", "对数似然")}
          value={fmt(s.loss)}
        />
        <Stat label={t(locale, "Iteration", "迭代")} value={currentStep} />
      </>
    );
    detail = (
      <>
        <p className="experiment-note">
          {t(
            locale,
            "Each frame is a completed E/M iteration; colors are recomputed under the displayed parameters.",
            "每帧是一轮完整 E/M 迭代；颜色由当前展示的参数重新计算。",
          )}
        </p>
        <LineChart
          series={[
            remote.snapshots!.slice(0, currentStep + 1).map((s) => s.loss),
          ]}
          title={t(locale, "Observed log likelihood", "观测对数似然")}
        />
      </>
    );
  }
  return { visual, metrics, detail };
}
