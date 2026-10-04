import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  MousePointer2,
  SlidersHorizontal,
  Compass,
  Clock3,
} from "lucide-react";
import { isLocale, lessons, t, groupTitle } from "@/lib/catalog";
import { HeroPlot } from "@/components/HeroPlot";
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh-CN" }];
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const featured = ["linear-regression", "logistic-regression", "k-means"].map(
    (s) => lessons.find((l) => l.slug === s)!,
  );
  return (
    <div className="home-page">
      <div className="home-top-note">
        <span className="status-dot" />
        {t(
          locale,
          "A FREE, INTERACTIVE FIELD GUIDE",
          "免费开放的交互式学习指南",
        )}
        <span>STATISTICS → MACHINE LEARNING</span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            {t(
              locale,
              "LESS MEMORIZING. MORE UNDERSTANDING.",
              "少一点死记硬背，多一点真正理解。",
            )}
          </div>
          <h1>
            {t(locale, "Make sense of", "理解数据，")}
            <br />
            <em>{t(locale, "machine learning.", "看见机器学习。")}</em>
          </h1>
          <p>
            {t(
              locale,
              "The ideas become clearer when you can play with them. Build intuition, explore the mathematics, and see what happens when you change the data.",
              "当你能亲手探索，抽象的概念就会变得清晰。建立直觉，理解数学，看看改变数据后会发生什么。",
            )}
          </p>
          <div className="hero-buttons">
            <Link
              className="button primary"
              href={`/${locale}/learn/foundations`}
            >
              {t(locale, "Start exploring", "开始探索")}
              <ArrowRight size={16} />
            </Link>
            <a className="text-link" href="#curriculum">
              {t(locale, "Browse the handbook", "浏览全部课程")}
              <span>↓</span>
            </a>
          </div>
          <div className="hero-meta">
            <span>14 {t(locale, "guided lessons", "节引导课程")}</span>
            <i />
            <span>{t(locale, "No account needed", "无需注册")}</span>
            <i />
            <span>EN / 中文</span>
          </div>
        </div>
        <HeroPlot />
      </section>
      <div className="principles">
        {[
          [
            MousePointer2,
            t(locale, "Learn by doing", "在动手中学习"),
            t(
              locale,
              "Move a point. Test an idea.",
              "移动一个点，验证一个想法。",
            ),
          ],
          [
            SlidersHorizontal,
            t(locale, "See the mechanism", "看见算法机制"),
            t(
              locale,
              "Every control has a purpose.",
              "每个控件都有明确的学习目标。",
            ),
          ],
          [
            Compass,
            t(locale, "Follow your curiosity", "跟随你的好奇心"),
            t(
              locale,
              "From first principles to deeper ideas.",
              "从基本原理走向更深的理解。",
            ),
          ],
        ].map(([Icon, title, description]) => {
          const I = Icon as typeof Compass;
          return (
            <div key={String(title)}>
              <I size={20} />
              <span>
                <strong>{String(title)}</strong>
                <small>{String(description)}</small>
              </span>
            </div>
          );
        })}
      </div>
      <section className="featured-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              {t(locale, "A GOOD PLACE TO BEGIN", "从这里开始")}
            </div>
            <h2>
              {t(
                locale,
                "Three ideas. A new way to see.",
                "三个概念，一种新的理解方式。",
              )}
            </h2>
          </div>
          <span>
            {t(locale, "Try an interactive lesson", "试一节交互课程")} ↘
          </span>
        </div>
        <div className="featured-grid">
          {featured.map((l, i) => (
            <Link
              className={`lesson-card card-${i}`}
              key={l.slug}
              href={`/${locale}/learn/${l.slug}`}
            >
              <div className="card-label">
                <span>{groupTitle(l.group, locale)}</span>
                <ArrowUpRight size={18} />
              </div>
              <div className="card-art" aria-hidden="true">
                {i === 0 ? (
                  <svg viewBox="0 0 220 85">
                    <path
                      d="M20 72L200 16"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    {[22, 45, 72, 92, 110, 137, 165, 190].map((x, j) => (
                      <circle
                        key={x}
                        cx={x}
                        cy={74 - x * 0.28 + Math.sin(j * 4) * 10}
                        r="4"
                        fill="currentColor"
                      />
                    ))}
                  </svg>
                ) : i === 1 ? (
                  <svg viewBox="0 0 220 85">
                    <path
                      d="M15 72 C100 72 100 12 205 12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <path
                      d="M15 42H205"
                      stroke="currentColor"
                      strokeDasharray="3 5"
                      opacity=".3"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 220 85">
                    {[
                      [55, 48],
                      [117, 24],
                      [168, 59],
                    ].map(([x, y], j) => (
                      <g key={x}>
                        {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                          <circle
                            key={k}
                            cx={x + Math.cos(k * 2.4 + j) * 18}
                            cy={y + Math.sin(k * 2.4 + j) * 13}
                            r="3.5"
                            fill="currentColor"
                            opacity={0.45 + j * 0.2}
                          />
                        ))}
                        <path
                          d={`M${x - 4} ${y}H${x + 4}M${x} ${y - 4}V${y + 4}`}
                          stroke="currentColor"
                        />
                      </g>
                    ))}
                  </svg>
                )}
              </div>
              <h3>{l.title[locale]}</h3>
              <p>{l.description[locale]}</p>
              <div className="card-footer">
                <span>
                  <Clock3 size={12} />
                  {l.minutes} {t(locale, "min", "分钟")}
                </span>
                <span>
                  {t(locale, "Open lesson", "进入课程")}
                  <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section id="curriculum" className="curriculum">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              {t(locale, "THE LEARNING PATH", "完整学习路径")}
            </div>
            <h2>
              {t(locale, "Build one idea on another.", "让知识逐步连接。")}
            </h2>
          </div>
          <span>01 — 14</span>
        </div>
        <p className="section-description">
          {t(
            locale,
            "Start at the beginning or jump to a question that interests you. Each lesson connects intuition, mathematics, and a small experiment.",
            "从基础开始，或直接探索你感兴趣的问题。每课把直觉、数学和小实验连接起来。",
          )}
        </p>
        <div className="curriculum-list">
          {lessons.map((l) => (
            <Link key={l.slug} href={`/${locale}/learn/${l.slug}`}>
              <span className="curriculum-number">
                {String(l.number).padStart(2, "0")}
              </span>
              <div>
                <h3>{l.title[locale]}</h3>
                <p>{l.description[locale]}</p>
              </div>
              <span className="curriculum-group">
                {groupTitle(l.group, locale)}
              </span>
              <span className="duration">
                {l.minutes} {t(locale, "min", "分钟")}
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
