"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Locale, t } from "@/lib/catalog";
import {
  classificationData,
  clusterData,
  ENGINE_VERSION,
  gradient,
  Point,
  regressionData,
  Snapshot,
} from "@/lib/engine";
import {
  Settings,
  RemoteResult,
  defaults,
  remoteMap,
  restore,
} from "./labs/state";
import { ConceptLab } from "./labs/ConceptLab";
import { ExperimentControls } from "./labs/ExperimentControls";
import { getLabView } from "./labs/views";
export function Lab({ slug, locale }: { slug: string; locale: Locale }) {
  if (slug === "foundations" || slug === "evaluation")
    return <ConceptLab slug={slug} locale={locale} />;
  return <Experiment key={slug + locale} slug={slug} locale={locale} />;
}
function Experiment({ slug, locale }: { slug: string; locale: Locale }) {
  const [settings, setSettings] = useState(defaults(slug)),
    [edited, setEdited] = useState<Point[] | null>(null),
    [ready, setReady] = useState(false),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [residuals, setResiduals] = useState(true);
  const [local, setLocal] = useState<unknown>(null),
    [remote, setRemote] = useState<RemoteResult | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [share, setShare] = useState(""),
    [copied, setCopied] = useState(false);
  const worker = useRef<Worker | null>(null),
    sequence = useRef(0);
  useEffect(() => {
    const data = restore(slug);
    setSettings(data.settings);
    setEdited(data.edited);
    setReady(true);
  }, [slug]);
  const points = useMemo(
    () =>
      edited ??
      (slug === "linear-regression"
        ? regressionData(settings.seed, settings.noise)
        : slug === "logistic-regression"
          ? classificationData(settings.seed, settings.noise)
          : slug === "k-means"
            ? clusterData(settings.seed)
            : []),
    [edited, settings.seed, settings.noise, slug],
  );
  const localAlgorithm =
    slug === "logistic-regression"
      ? "logistic"
      : slug === "k-means"
        ? "kmeans"
        : slug === "regularization"
          ? "regularization"
          : null;
  useEffect(() => {
    if (!localAlgorithm) return;
    const w = new Worker(new URL("../workers/compute.ts", import.meta.url));
    worker.current = w;
    w.onmessage = ({ data }) => {
      if (data.id === sequence.current) {
        if (data.error) setError(data.error);
        else {
          setLocal(data.result);
          setError("");
        }
      }
    };
    w.onerror = () =>
      setError(
        t(
          locale,
          "The local experiment could not start. Reload to retry.",
          "本地实验启动失败，请刷新重试。",
        ),
      );
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, [localAlgorithm, locale]);
  useEffect(() => {
    if (!ready || !localAlgorithm || !worker.current) return;
    const id = ++sequence.current;
    setLocal(null);
    worker.current.postMessage({
      id,
      algorithm: localAlgorithm,
      points,
      params: { seed: settings.seed, value: settings.value },
    });
  }, [ready, localAlgorithm, points, settings.seed, settings.value]);
  useEffect(() => {
    if (!ready || !remoteMap[slug]) return;
    const controller = new AbortController();
    setRemote(null);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/experiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            algorithm: remoteMap[slug],
            seed: settings.seed,
            noise: settings.noise,
            depth: settings.depth,
            trees: settings.trees,
            features: settings.features,
            c: settings.c,
            gamma: settings.gamma,
            dataset: settings.dataset,
            kernel: settings.kernel,
            clusters: Math.round(settings.value),
            samples: settings.samples,
            burn: settings.burn,
            width: settings.width,
            smoothing: settings.smoothing,
            ...(slug !== "expectation-maximization" ? { clusters: 3 } : {}),
          }),
        });
        if (!response.ok)
          throw new Error(
            t(
              locale,
              "We could not calculate this experiment. Please try again in a moment.",
              "暂时无法计算此实验，请稍后重试。",
            ),
          );
        const result = await response.json();
        if (!controller.signal.aborted) setRemote(result);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : String(e));
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [ready, settings, slug, locale, retry]);
  const gd = useMemo(() => gradient(settings.value), [settings.value]);
  const snapshots =
    (slug === "k-means" ? (local as Snapshot[] | null) : remote?.snapshots) ||
    [];
  const frames = slug === "gradient-descent" ? gd.length : snapshots.length;
  useEffect(() => {
    if (!playing || frames < 2) return;
    const timer = setInterval(
      () =>
        setStep((s) => {
          if (s >= frames - 1) {
            return s;
          }
          return s + 1;
        }),
      650,
    );
    return () => clearInterval(timer);
  }, [playing, frames]);
  useEffect(() => {
    if (frames && step >= frames - 1) setPlaying(false);
  }, [step, frames]);
  const change = (key: keyof Settings, value: number | string) => {
    setSettings((s) => {
      const next = { ...s, [key]: value };
      next.burn = Math.min(next.burn, next.samples - 10);
      return next;
    });
    setStep(0);
    setPlaying(false);
    if (key === "seed" || key === "noise") setEdited(null);
    setShare("");
    setCopied(false);
  };
  const move = (index: number, p: Point) => {
    p = {
      ...p,
      x: Math.max(-1e6, Math.min(1e6, p.x)),
      y: Math.max(-1e6, Math.min(1e6, p.y)),
    };
    setEdited(points.map((old, i) => (i === index ? p : old)));
    setStep(0);
    setPlaying(false);
    setShare("");
  };
  async function shareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(ENGINE_VERSION));
    url.searchParams.set(
      "lab",
      JSON.stringify({ ...settings, ...(edited ? { points: edited } : {}) }),
    );
    window.history.replaceState(null, "", url);
    setShare(url.toString());
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  const currentStep = Math.min(step, Math.max(0, frames - 1));
  const { visual, metrics, detail } = getLabView({
    slug,
    locale,
    settings,
    points,
    local,
    remote,
    gd,
    currentStep,
    residuals,
    setResiduals,
    move,
  });
  return (
    <section
      className="lab"
      aria-label={t(locale, "Interactive experiment", "交互实验")}
    >
      <div className="lab-header">
        <div>
          <FlaskConical size={17} />
          <strong>{t(locale, "The interactive lab", "交互实验室")}</strong>
          <span className="lab-live">
            <i />
            {t(locale, "EXPLORE AN IDEA", "探索一个想法")}
          </span>
        </div>
        <div className="lab-tools">
          <button
            className="icon-button"
            onClick={() => {
              setSettings(defaults(slug));
              setEdited(null);
              setStep(0);
              setPlaying(false);
              setShare("");
              window.history.replaceState(null, "", window.location.pathname);
            }}
            aria-label={t(locale, "Reset experiment", "重置实验")}
            title={t(locale, "Reset", "重置")}
          >
            <RotateCcw size={15} />
          </button>
          <button className="button small secondary" onClick={shareLink}>
            {copied ? <Check size={13} /> : <Copy size={13} />}{" "}
            {t(locale, "Share", "分享")}
          </button>
        </div>
      </div>
      <div className="lab-layout">
        <ExperimentControls
          slug={slug}
          locale={locale}
          settings={settings}
          change={change}
        />
        <div className="lab-results" aria-busy={!visual && !error}>
          {error ? (
            <div className="lab-error" role="alert">
              <strong>
                {t(
                  locale,
                  "The experiment needs a moment.",
                  "实验暂时无法运行。",
                )}
              </strong>
              <p>{error}</p>
              <button
                className="button secondary"
                onClick={() => setRetry((r) => r + 1)}
              >
                {t(locale, "Try again", "重试")}
              </button>
            </div>
          ) : (
            visual || (
              <div className="lab-loading" role="status">
                <div className="loading-dot" />
                {t(locale, "Preparing your experiment…", "正在准备实验…")}
              </div>
            )
          )}
          {frames > 1 && (
            <div className="playback">
              <button
                className="button primary small"
                onClick={() => {
                  if (currentStep >= frames - 1) setStep(0);
                  setPlaying(!playing);
                }}
                aria-label={
                  playing
                    ? t(locale, "Pause animation", "暂停动画")
                    : t(locale, "Play animation", "播放动画")
                }
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
                {playing
                  ? t(locale, "Pause", "暂停")
                  : t(locale, "Play", "播放")}
              </button>
              <button
                className="icon-button"
                disabled={currentStep === 0}
                aria-label={t(locale, "Previous step", "上一步")}
                onClick={() => {
                  setPlaying(false);
                  setStep((s) => Math.max(0, s - 1));
                }}
              >
                <ChevronLeft size={17} />
              </button>
              <input
                aria-label={t(locale, "Animation step", "动画步数")}
                type="range"
                min={0}
                max={frames - 1}
                value={currentStep}
                onChange={(e) => {
                  setPlaying(false);
                  setStep(Number(e.target.value));
                }}
              />
              <button
                className="icon-button"
                disabled={currentStep === frames - 1}
                aria-label={t(locale, "Next step", "下一步")}
                onClick={() => {
                  setPlaying(false);
                  setStep((s) => Math.min(frames - 1, s + 1));
                }}
              >
                <ChevronRight size={17} />
              </button>
              <output>
                {currentStep}/{frames - 1}
              </output>
            </div>
          )}
          {metrics && (
            <div className="lab-stats" aria-live="polite">
              {metrics}
            </div>
          )}
          {detail && <div className="lab-detail">{detail}</div>}
        </div>
      </div>
      {share && (
        <div className="share-link" role="status">
          <label>
            {copied
              ? t(
                  locale,
                  "Copied. This link restores the experiment.",
                  "已复制，链接可还原实验。",
                )
              : t(
                  locale,
                  "Copy this link to restore the experiment.",
                  "复制此链接以还原实验。",
                )}
            <input
              readOnly
              value={share}
              onFocus={(e) => e.currentTarget.select()}
            />
          </label>
        </div>
      )}
    </section>
  );
}
