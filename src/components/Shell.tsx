"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Menu,
  Search,
  X,
} from "lucide-react";
import { groupTitle, groups, lessons, Locale, t } from "@/lib/catalog";

export function Shell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [done, setDone] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const read = () => {
      try {
        const v = JSON.parse(localStorage.getItem("handbook-progress") || "[]");
        setDone(Array.isArray(v) ? v : []);
      } catch {
        setDone([]);
      }
    };
    read();
    window.addEventListener("handbook-progress", read);
    window.addEventListener("storage", read);
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
      if (e.key === "Escape") {
        setSearch(false);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("handbook-progress", read);
      window.removeEventListener("storage", read);
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    setMobile(false);
    setSearch(false);
  }, [pathname]);
  useEffect(() => {
    if (search) input.current?.focus();
  }, [search]);
  const other = locale === "en" ? "zh-CN" : "en";
  return (
    <>
      <a href="#main" className="skip-link">
        {t(locale, "Skip to content", "跳转到正文")}
      </a>
      <header className="topbar">
        <button
          className="icon-button mobile-toggle"
          aria-label={t(locale, "Open navigation", "打开导航")}
          onClick={() => setMobile(!mobile)}
        >
          <Menu size={20} />
        </button>
        <Link href={`/${locale}`} className="brand">
          <span className="brand-mark">
            <BookOpen size={19} />
          </span>
          <span>
            Machine Learning
            <span className="brand-sub">THE INTERACTIVE HANDBOOK</span>
          </span>
        </Link>
        <div className="header-actions">
          <button className="search-trigger" onClick={() => setSearch(true)}>
            <Search size={15} />
            <span>{t(locale, "Find a concept…", "搜索概念…")}</span>
            <kbd>⌘ K</kbd>
          </button>
          <a
            className="language"
            href={pathname.replace(`/${locale}`, `/${other}`)}
            onClick={(e) => {
              e.preventDefault();
              window.location.href =
                pathname.replace(`/${locale}`, `/${other}`) +
                window.location.search;
            }}
            lang={other}
          >
            {other === "en" ? "EN" : "中文"}
            <span>↗</span>
          </a>
        </div>
      </header>
      {mobile && (
        <button
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${mobile ? "is-open" : ""}`}
        aria-label={t(locale, "Course navigation", "课程导航")}
      >
        <div className="sidebar-top">
          <span className="eyebrow">
            {t(locale, "YOUR FIELD GUIDE", "你的学习指南")}
          </span>
          <Link
            className={`overview-link ${pathname === `/${locale}` ? "active" : ""}`}
            href={`/${locale}`}
          >
            <BookOpen size={16} />
            {t(locale, "Course overview", "课程概览")}
          </Link>
        </div>
        <nav>
          {Object.keys(groups).map((group) => (
            <div className="nav-group" key={group}>
              <p>{groupTitle(group, locale)}</p>
              {lessons
                .filter((l) => l.group === group)
                .map((l) => (
                  <Link
                    key={l.slug}
                    className={`nav-lesson ${pathname.endsWith("/" + l.slug) ? "active" : ""}`}
                    href={`/${locale}/learn/${l.slug}`}
                    aria-current={
                      pathname.endsWith("/" + l.slug) ? "page" : undefined
                    }
                  >
                    <span className="nav-number">
                      {done.includes(l.slug) ? (
                        <Check size={12} />
                      ) : (
                        String(l.number).padStart(2, "0")
                      )}
                    </span>
                    <span>{l.label[locale]}</span>
                    {pathname.endsWith("/" + l.slug) && (
                      <ChevronRight size={12} />
                    )}
                  </Link>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div>
            <span>{t(locale, "Your progress", "学习进度")}</span>
            <strong>
              {done.filter((s) => lessons.some((l) => l.slug === s)).length}/
              {lessons.length}
            </strong>
          </div>
          <div className="progress-track">
            <span
              style={{ width: `${(done.length / lessons.length) * 100}%` }}
            />
          </div>
          <small>
            {t(
              locale,
              "Saved on this device. Learn at your pace.",
              "保存在本机，按自己的节奏学习。",
            )}
          </small>
        </div>
      </aside>
      <main id="main" className="main-content">
        {children}
        <footer className="footer">
          <span>
            ML Handbook <span className="footer-dot">·</span>{" "}
            {t(locale, "Understanding through exploration.", "在探索中理解。")}
          </span>
          <Link href={`/${locale}/learn/foundations`}>
            {t(locale, "Start with the foundations", "从基础开始")}
            <ArrowUpRight size={14} />
          </Link>
        </footer>
      </main>
      {search && (
        <div className="search-overlay" onClick={() => setSearch(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t(locale, "Search lessons", "搜索课程")}
            className="search-dialog"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const items =
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "input,button,a",
                  );
                const first = items[0],
                  last = items[items.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <div className="search-input">
              <Search size={20} />
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  locale,
                  "Search lessons, topics, or algorithms",
                  "搜索课程、主题或算法",
                )}
                aria-label={t(locale, "Search query", "搜索关键词")}
              />
              <button
                className="icon-button"
                onClick={() => setSearch(false)}
                aria-label={t(locale, "Close search", "关闭搜索")}
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-results">
              {lessons
                .filter((l) =>
                  `${l.title.en} ${l.title["zh-CN"]} ${l.label.en} ${l.label["zh-CN"]} ${l.slug} ${l.description[locale]}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((l) => (
                  <Link
                    key={l.slug}
                    href={`/${locale}/learn/${l.slug}`}
                    onClick={() => setSearch(false)}
                  >
                    <span>
                      {l.title[locale]}
                      <small>{l.description[locale]}</small>
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                ))}
              {!lessons.some((l) =>
                `${l.title.en} ${l.title["zh-CN"]} ${l.label.en} ${l.label["zh-CN"]} ${l.slug} ${l.description[locale]}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && (
                <p className="empty-message">
                  {t(
                    locale,
                    "No lessons found. Try “regression” or “概率”.",
                    "没有匹配课程，试试“回归”或“概率”。",
                  )}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
