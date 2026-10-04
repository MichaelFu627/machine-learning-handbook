import { t } from "@/lib/catalog";
import { LineChart } from "../../Charts";
import { Stat, fmt, pct } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function samplingView({ locale, remote }: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (remote?.kind === "mcmc") {
    const retained = remote.retained!,
      bins = Array.from({ length: 48 }, () => 0);
    retained.forEach((x) => {
      const i = Math.floor(((x + 6) / 12) * 48);
      if (i >= 0 && i < 48) bins[i]++;
    });
    const density = bins.map((c) => c / retained.length / 0.25),
      target = density.map((_, i) => {
        const x = -6 + (i + 0.5) * 0.25;
        return (
          (0.3 * Math.exp(-0.5 * ((x + 2) / 0.8) ** 2)) /
            (0.8 * Math.sqrt(2 * Math.PI)) +
          (0.7 * Math.exp(-0.5 * ((x - 2) / 0.8) ** 2)) /
            (0.8 * Math.sqrt(2 * Math.PI))
        );
      });
    visual = (
      <div className="mcmc-charts">
        <LineChart
          series={[remote.states!]}
          title={t(
            locale,
            "Chain trace · includes burn-in",
            "链轨迹 · 包含预热",
          )}
        />
        <LineChart
          series={[density, target]}
          title={t(
            locale,
            "Retained density vs. target · x = −6 + 0.25(index + 0.5)",
            "保留样本密度与目标 · x=−6+0.25(索引+0.5)",
          )}
          labels={[
            t(locale, "Sample density", "样本密度"),
            t(locale, "Target", "目标"),
          ]}
        />
      </div>
    );
    metrics = (
      <>
        <Stat
          label={t(locale, "Acceptance", "接受率")}
          value={pct(remote.acceptance)}
        />
        <Stat
          label={t(locale, "Retained states", "保留状态")}
          value={retained.length}
        />
        <Stat
          label={t(locale, "Zero crossings", "跨零点次数")}
          value={remote.crossings!}
        />
        <Stat
          label={t(locale, "Approx. ESS", "近似 ESS")}
          value={fmt(remote.ess, 0)}
        />
      </>
    );
    detail = (
      <>
        <p className="experiment-note">
          {remote.crossings === 0
            ? t(
                locale,
                "No zero crossings in retained states: the other mode may be unexplored.",
                "保留状态未跨零点：可能尚未探索另一模态。",
              )
            : t(
                locale,
                "Crossings and acceptance do not prove convergence. Compare dispersed chains and autocorrelation.",
                "跨零点与接受率不能证明收敛，请比较分散初值的多链与自相关。",
              )}
        </p>
        <LineChart
          series={[remote.acf!]}
          title={t(locale, "Autocorrelation vs. lag", "自相关与滞后")}
        />
      </>
    );
  }
  return { visual, metrics, detail };
}
