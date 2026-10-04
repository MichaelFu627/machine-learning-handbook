"use client";
import { useState, useMemo } from "react";
import { FlaskConical, Shuffle } from "lucide-react";
import { Locale, t } from "@/lib/catalog";
import { LineChart } from "../Charts";
import { Range, Stat } from "./primitives";
export function ConceptLab({ slug, locale }: { slug: string; locale: Locale }) {
  const [n, setN] = useState(20),
    [seed, setSeed] = useState(42),
    [prevalence, setPrevalence] = useState(10);
  const samples = useMemo(() => {
    let s = seed;
    return Array.from({ length: n }, () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296 < 0.5 ? 1 : 0;
    });
  }, [n, seed]);
  const means = samples.map(
    (_, i) =>
      samples.slice(0, i + 1).reduce<number>((s, v) => s + v, 0) / (i + 1),
  );
  return (
    <section className="concept-lab">
      <div className="section-label">
        <FlaskConical size={16} />
        {t(locale, "A SMALL EXPERIMENT", "一个小实验")}
      </div>
      {slug === "foundations" ? (
        <>
          <h2>
            {t(
              locale,
              "A fair coin. An uncertain estimate.",
              "公平的硬币，不确定的估计。",
            )}
          </h2>
          <Range
            label={t(locale, "Number of tosses", "投掷次数")}
            value={n}
            min={10}
            max={200}
            step={10}
            onChange={setN}
          />
          <div
            className="coin-row"
            aria-label={`${samples.reduce<number>((s, v) => s + v, 0)} / ${n}`}
          >
            {samples.slice(-40).map((v, i) => (
              <span key={i} className={v ? "heads" : "tails"}>
                {v ? "H" : "T"}
              </span>
            ))}
          </div>
          <div className="concept-result">
            <strong>{(means.at(-1)! * 100).toFixed(1)}%</strong>
            <span>
              {t(
                locale,
                "observed heads · true probability 50%",
                "观测正面比例 · 真实概率 50%",
              )}
            </span>
            <button
              className="button secondary"
              onClick={() => setSeed((s) => s + 1)}
            >
              <Shuffle size={14} />
              {t(locale, "Repeat experiment", "重复实验")}
            </button>
          </div>
          <LineChart
            series={[means, means.map(() => 0.5)]}
            title={t(
              locale,
              "Running estimate vs. true probability",
              "累积估计与真实概率",
            )}
            labels={[t(locale, "Estimate", "估计"), t(locale, "Truth", "真值")]}
          />
        </>
      ) : (
        <>
          <h2>
            {t(
              locale,
              "An accurate model that finds nothing.",
              "很准确，却什么也没找到。",
            )}
          </h2>
          <p>
            {t(
              locale,
              "A classifier always predicts “negative”. Change the number of positive cases among 100 observations.",
              "分类器始终预测“负类”。调整 100 个观测中的正例数量。",
            )}
          </p>
          <Range
            label={t(locale, "Positive cases out of 100", "100 个观测中的正例")}
            value={prevalence}
            min={1}
            max={50}
            step={1}
            onChange={setPrevalence}
          />
          <div className="lab-stats">
            <Stat
              label={t(locale, "Accuracy", "准确率")}
              value={`${100 - prevalence}%`}
            />
            <Stat label="Recall" value="0%" />
            <Stat label="False negatives" value={prevalence} />
            <Stat label="True positives" value={0} />
          </div>
          <p className="experiment-note">
            {t(
              locale,
              "High accuracy can coexist with zero recall. Start with the decision you need to make, then choose the metric.",
              "高准确率可以与零召回率同时出现。先明确决策目标，再选择评价指标。",
            )}
          </p>
        </>
      )}
    </section>
  );
}
