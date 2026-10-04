import { t } from "@/lib/catalog";
import { Scatter, LineChart } from "../../Charts";
import { Stat, fmt } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function gradientView({
  slug,
  locale,
  settings,
  gd,
  currentStep,
}: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (slug === "gradient-descent") {
    const state = gd[currentStep];
    visual = (
      <Scatter
        points={[state]}
        quadratic
        bounds={[-10, 10, -10, 10]}
        trajectory={gd.slice(0, currentStep + 1)}
        title={t(
          locale,
          "Gradient descent trajectory on x² + 2y²",
          "x² + 2y² 上的梯度下降轨迹",
        )}
        xLabel="θ₁"
        yLabel="θ₂"
      />
    );
    metrics = (
      <>
        <Stat label="η" value={settings.value} />
        <Stat
          label={t(locale, "Loss", "损失")}
          value={state.loss.toExponential(2)}
        />
        <Stat label="θ₁" value={fmt(state.x)} />
        <Stat label="θ₂" value={fmt(state.y)} />
      </>
    );
    detail = (
      <>
        <p className="experiment-note">
          {settings.value >= 0.5
            ? t(
                locale,
                "Outside the strict convergence interval. The path may leave the plotted range.",
                "超出严格收敛区间，轨迹可能离开显示范围。",
              )
            : settings.value > 0.25
              ? t(
                  locale,
                  "The second coordinate alternates sign while its magnitude decreases.",
                  "第二个坐标符号交替，但绝对值逐渐减小。",
                )
              : t(
                  locale,
                  "Both coordinates contract toward zero without changing sign.",
                  "两个坐标都不改变符号地向零收缩。",
                )}
        </p>
        <LineChart
          series={[gd.slice(0, currentStep + 1).map((s) => s.loss)]}
          title={t(locale, "Loss vs. iteration", "损失与迭代次数")}
        />
      </>
    );
  }
  return { visual, metrics, detail };
}
