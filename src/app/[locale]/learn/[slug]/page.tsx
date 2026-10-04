import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ArrowLeft, ArrowRight, Clock3, BookOpen } from "lucide-react";
import { isLocale, lessons, locales, t, groupTitle } from "@/lib/catalog";
import { Quiz } from "@/components/LessonActions";
import { Lab } from "@/components/Lab";
import { examples } from "@/lib/examples";
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    lessons.map((l) => ({ locale, slug: l.slug })),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const l = lessons.find((l) => l.slug === slug);
  if (!l || !isLocale(locale)) return {};
  return {
    title: l.title[locale],
    description: l.description[locale],
    alternates: {
      languages: { en: `/en/learn/${slug}`, "zh-CN": `/zh-CN/learn/${slug}` },
    },
  };
}
export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const lesson = lessons.find((l) => l.slug === slug);
  if (!isLocale(locale) || !lesson) notFound();
  const source = await readFile(
    path.join(process.cwd(), "content", locale, `${slug}.mdx`),
    "utf8",
  );
  const index = lessons.indexOf(lesson),
    previous = lessons[index - 1],
    next = lessons[index + 1];
  return (
    <article className="lesson-page">
      <div className="breadcrumbs">
        <Link href={`/${locale}`}>{t(locale, "Handbook", "课程")}</Link>
        <span>/</span>
        <span>{groupTitle(lesson.group, locale)}</span>
      </div>
      <header className="lesson-header">
        <div className="eyebrow">
          {t(locale, "LESSON", "第")} {String(lesson.number).padStart(2, "0")}{" "}
          {locale === "zh-CN" ? "课" : ""} · {lesson.label[locale]}
          <span className="level-tag">
            {t(
              locale,
              lesson.level,
              { beginner: "入门", intermediate: "进阶", advanced: "深入" }[
                lesson.level
              ] || "",
            )}
          </span>
        </div>
        <h1>{lesson.title[locale]}</h1>
        <p>{lesson.description[locale]}</p>
        <div className="lesson-meta">
          <span>
            <Clock3 size={14} />
            {lesson.minutes} {t(locale, "min", "分钟")}
          </span>
          <span>
            <BookOpen size={14} />
            {t(locale, "Read · experiment · reflect", "阅读 · 实验 · 思考")}
          </span>
        </div>
      </header>
      <div className="guiding-question">
        <span>{t(locale, "THE QUESTION", "本课问题")}</span>
        <p>{lesson.question[locale]}</p>
      </div>
      {lesson.prerequisites.length > 0 && (
        <div className="prerequisites">
          {t(locale, "Builds on", "前置知识")}
          <span>
            {lesson.prerequisites.map((s) => (
              <Link key={s} href={`/${locale}/learn/${s}`}>
                {lessons.find((l) => l.slug === s)?.title[locale]}
              </Link>
            ))}
          </span>
        </div>
      )}
      <Lab slug={slug} locale={locale} />
      <div className="lesson-body">
        <MDXRemote
          source={source}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkMath],
              rehypePlugins: [rehypeKatex],
            },
          }}
        />
      </div>
      {examples[slug] && (
        <details className="code-example">
          <summary>
            {t(locale, "Explore a Python implementation", "查看 Python 实现")}
          </summary>
          <p>
            {t(
              locale,
              "A minimal, runnable example with its own seeded data. Library-generated samples may differ from the browser experiment.",
              "这是可独立运行的最小示例，使用自己的固定种子数据。库生成的样本可能与浏览器实验不同。",
            )}
          </p>
          <pre>
            <code>{examples[slug]}</code>
          </pre>
        </details>
      )}
      <Quiz lesson={lesson} locale={locale} />
      <nav className="lesson-pagination">
        {previous ? (
          <Link href={`/${locale}/learn/${previous.slug}`}>
            <ArrowLeft size={18} />
            <span>
              <small>{t(locale, "Previous lesson", "上一课")}</small>
              {previous.title[locale]}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/${locale}/learn/${next.slug}`}>
            <span>
              <small>{t(locale, "Up next", "下一课")}</small>
              {next.title[locale]}
            </span>
            <ArrowRight size={18} />
          </Link>
        )}
      </nav>
    </article>
  );
}
