import { t } from "@/lib/catalog";
import { logistic, classificationMetrics, sigmoid } from "@/lib/engine";
import { Scatter, LineChart } from "../../Charts";
import { Stat, pct } from "../primitives";
import type { ViewContext, LabView } from "./types";
export function logisticView({
  slug,
  locale,
  settings,
  points,
  local,
}: ViewContext): LabView {
  let visual: React.ReactNode,
    metrics: React.ReactNode,
    detail: React.ReactNode;
  if (slug === "logistic-regression" && local) {
    const model = local as ReturnType<typeof logistic>,
      validation = points.filter((p) => p.validation),
      m = classificationMetrics(validation, model, settings.threshold),
      train = classificationMetrics(
        points.filter((p) => !p.validation),
        model,
        settings.threshold,
      ),
      n = 42;
    const limit = Math.max(
      4,
      ...points.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)) + 0.4),
    );
    const grid = Array.from({ length: n * n }, (_, i) =>
      sigmoid(
        model.w1 * (-limit + ((i % n) * 2 * limit) / (n - 1)) +
          model.w2 * (-limit + (Math.floor(i / n) * 2 * limit) / (n - 1)) +
          model.b,
      ) >= settings.threshold
        ? 1
        : 0,
    );
    visual = (
      <Scatter
        points={points}
        bounds={[-limit, limit, -limit, limit]}
        grid={grid}
        title={t(
          locale,
          "Logistic decision regions. Outlined points are validation observations.",
          "逻辑回归决策区域；空心点是验证观测。",
        )}
      />
    );
    metrics = (
      <>
        <Stat
          label={t(locale, "Training accuracy", "训练准确率")}
          value={pct(train.accuracy)}
        />
        <Stat
          label={t(locale, "Validation accuracy", "验证准确率")}
          value={pct(m.accuracy)}
        />
        <Stat label="Precision" value={pct(m.precision)} />
        <Stat label="Recall" value={pct(m.recall)} />
      </>
    );
    detail = (
      <>
        <div className="confusion">
          <span>
            {t(locale, "Validation confusion matrix", "验证集混淆矩阵")}
          </span>
          <span>
            TP <b>{m.tp}</b>
          </span>
          <span>
            FP <b>{m.fp}</b>
          </span>
          <span>
            FN <b>{m.fn}</b>
          </span>
          <span>
            TN <b>{m.tn}</b>
          </span>
        </div>
        <p className="experiment-note">
          {t(
            locale,
            "Filled points: training. Outlined points: validation. Changing the threshold does not retrain the model.",
            "实心点：训练集。空心点：验证集。改变阈值不会重新训练模型。",
          )}
        </p>
        <LineChart
          series={[model.losses]}
          title={t(
            locale,
            "Training objective vs. gradient step",
            "训练目标与梯度步数",
          )}
        />
      </>
    );
  }
  return { visual, metrics, detail };
}
