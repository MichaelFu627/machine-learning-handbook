import { t } from "@/lib/catalog";
import { Scatter } from "../../Charts";
import { Stat, pct } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function classifierView({
  slug,
  locale,
  settings,
  remote,
}: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (remote?.kind === "classifier") {
    visual = (
      <Scatter
        points={remote.points!.map((p) => ({
          x: p[0],
          y: p[1],
          label: p[2],
          validation: Boolean(p[3]),
        }))}
        bounds={remote.bounds}
        grid={remote.grid}
        gridSize={remote.gridSize}
        support={remote.support?.map((p) => ({ x: p[0], y: p[1] }))}
        title={t(
          locale,
          "Classifier regions, training and validation observations",
          "分类区域、训练与验证观测",
        )}
      />
    );
    metrics = (
      <>
        <Stat
          label={t(locale, "Training accuracy", "训练准确率")}
          value={pct(remote.trainAccuracy)}
        />
        <Stat
          label={t(locale, "Validation accuracy", "验证准确率")}
          value={pct(remote.testAccuracy)}
        />
        <Stat
          label={t(locale, "Training / validation", "训练 / 验证")}
          value="168 / 72"
        />
        <Stat
          label={t(locale, "Random seed", "随机种子")}
          value={settings.seed}
        />
      </>
    );
    detail = (
      <p className="experiment-note">
        {t(
          locale,
          "Outlined points are held-out validation observations. Regions show predicted classes without smoothing. Compare models with the same seed and dataset.",
          "空心点是留出验证观测。区域显示未平滑的预测类别。请在相同种子与数据集下比较模型。",
        )}
        {slug === "svm" &&
          t(
            locale,
            " Extra rings mark training support vectors.",
            " 额外圆圈标记训练支持向量。",
          )}
      </p>
    );
  }
  return { visual, metrics, detail };
}
