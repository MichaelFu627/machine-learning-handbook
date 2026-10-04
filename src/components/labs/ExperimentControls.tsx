import { Shuffle } from "lucide-react";
import { Locale, t } from "@/lib/catalog";
import { Range } from "./primitives";
import { Settings, remoteMap } from "./state";
export function ExperimentControls({
  slug,
  locale,
  settings,
  change,
}: {
  slug: string;
  locale: Locale;
  settings: Settings;
  change: (key: keyof Settings, value: number | string) => void;
}) {
  const range = (
    key: keyof Settings,
    label: string,
    min: number,
    max: number,
    increment = 0.1,
  ) => (
    <Range
      label={label}
      value={settings[key] as number}
      min={min}
      max={max}
      step={increment}
      onChange={(v) => change(key, v)}
    />
  );
  return (
    <aside className="lab-controls">
      <div className="control-heading">
        {t(locale, "MAKE IT YOURS", "动手调整")}
      </div>
      {slug === "linear-regression" &&
        range("noise", t(locale, "Noise σ", "噪声 σ"), 0.1, 3)}
      {slug === "logistic-regression" && (
        <>
          {range("noise", t(locale, "Class overlap", "类别重叠度"), 0.3, 2)}
          {range(
            "value",
            t(locale, "L2 penalty λ", "L2 惩罚 λ"),
            0.001,
            1,
            0.001,
          )}
          {range(
            "threshold",
            t(locale, "Decision threshold", "分类阈值"),
            0.05,
            0.95,
            0.05,
          )}
        </>
      )}
      {(slug === "k-means" || slug === "expectation-maximization") &&
        range("value", t(locale, "Number of groups K", "分组数量 K"), 2, 5, 1)}
      {slug === "gradient-descent" &&
        range(
          "value",
          t(locale, "Learning rate η", "学习率 η"),
          0.01,
          0.65,
          0.01,
        )}
      {slug === "regularization" &&
        range("value", t(locale, "Penalty λ", "惩罚 λ"), 0, 3, 0.05)}
      {remoteMap[slug] && slug !== "mcmc" && (
        <>
          {slug !== "expectation-maximization" && (
            <label className="select-control">
              {t(locale, "Dataset", "数据集")}
              <select
                value={settings.dataset}
                onChange={(e) => change("dataset", e.target.value)}
              >
                <option value="moons">
                  {t(locale, "Two moons", "双月牙")}
                </option>
                <option value="circles">
                  {t(locale, "Concentric circles", "同心环")}
                </option>
                <option value="linear">
                  {t(locale, "Two clouds", "两组点云")}
                </option>
              </select>
            </label>
          )}
          {range(
            "noise",
            t(locale, "Noise / overlap", "噪声 / 重叠"),
            0.05,
            1,
            0.05,
          )}
        </>
      )}
      {["decision-trees", "bagging", "random-forests"].includes(slug) &&
        range("depth", t(locale, "Maximum depth", "最大深度"), 1, 10, 1)}
      {["bagging", "random-forests"].includes(slug) &&
        range("trees", t(locale, "Number of trees", "树的数量"), 1, 100, 1)}
      {slug === "random-forests" &&
        range(
          "features",
          t(locale, "Features per split", "每次分裂候选特征"),
          1,
          2,
          1,
        )}
      {slug === "naive-bayes" && (
        <label className="select-control">
          {t(locale, "Variance smoothing", "方差平滑")}
          <select
            value={settings.smoothing}
            onChange={(e) => change("smoothing", Number(e.target.value))}
          >
            <option value={1e-9}>10⁻⁹</option>
            <option value={0.1}>0.1</option>
            <option value={1}>1.0</option>
          </select>
        </label>
      )}
      {slug === "svm" && (
        <>
          <label className="select-control">
            {t(locale, "Kernel", "核函数")}
            <select
              value={settings.kernel}
              onChange={(e) => change("kernel", e.target.value)}
            >
              <option value="linear">Linear</option>
              <option value="rbf">RBF</option>
              <option value="poly">Polynomial (d=3)</option>
            </select>
          </label>
          {range("c", "C", 0.1, 10, 0.1)}
          {settings.kernel !== "linear" &&
            range("gamma", "Gamma", 0.05, 5, 0.05)}
        </>
      )}
      {slug === "mcmc" && (
        <>
          {range(
            "samples",
            t(locale, "Sampling steps", "采样步数"),
            100,
            5000,
            100,
          )}
          {range(
            "burn",
            t(locale, "Burn-in", "丢弃预热"),
            0,
            settings.samples - 10,
            10,
          )}
          {range(
            "width",
            t(locale, "Proposal scale", "建议分布尺度"),
            0.1,
            5,
            0.1,
          )}
        </>
      )}
      <div className="seed-control">
        <label>
          {t(locale, "Random seed", "随机种子")}
          <input
            type="number"
            min="0"
            max="2147483647"
            value={settings.seed}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n))
                change(
                  "seed",
                  Math.max(0, Math.min(2147483647, Math.floor(n))),
                );
            }}
          />
        </label>
        <button
          className="button secondary"
          onClick={() =>
            change("seed", settings.seed === 2147483647 ? 0 : settings.seed + 1)
          }
        >
          <Shuffle size={13} />
          {t(locale, "New sample", "重新采样")}
        </button>
      </div>
      <p className="control-hint">
        {t(
          locale,
          "Keep the seed fixed to compare one change at a time.",
          "固定随机种子，每次只比较一个变化。",
        )}
      </p>
    </aside>
  );
}
