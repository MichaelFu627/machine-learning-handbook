"use client";
import { useEffect, useState } from "react";
import { Check, CheckCircle2, ArrowRight } from "lucide-react";
import { Lesson, Locale, t } from "@/lib/catalog";
export function Quiz({ lesson, locale }: { lesson: Lesson; locale: Locale }) {
  const [choice, setChoice] = useState<number | null>(null),
    [checked, setChecked] = useState(false),
    [complete, setComplete] = useState(false),
    [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem("handbook-progress") || "[]");
      setComplete(Array.isArray(a) && a.includes(lesson.slug));
    } catch {}
  }, [lesson.slug]);
  function mark() {
    try {
      const v = JSON.parse(localStorage.getItem("handbook-progress") || "[]");
      const a = Array.isArray(v) ? v : [];
      localStorage.setItem(
        "handbook-progress",
        JSON.stringify([...new Set([...a, lesson.slug])]),
      );
      setComplete(true);
      window.dispatchEvent(new Event("handbook-progress"));
    } catch {
      setStorageError(true);
    }
  }
  return (
    <section className="quiz-section" aria-labelledby="quiz-title">
      <div className="section-label">
        <CheckCircle2 size={16} />
        {t(locale, "CHECK YOUR UNDERSTANDING", "检查你的理解")}
      </div>
      <h2 id="quiz-title">{lesson.quiz.question[locale]}</h2>
      <div className="quiz-options">
        {lesson.quiz.options[locale].map((o, i) => (
          <button
            key={o}
            aria-pressed={choice === i}
            className={`quiz-option ${choice === i ? "selected" : ""} ${checked && i === lesson.quiz.answer ? "correct" : ""}`}
            onClick={() => {
              setChoice(i);
              setChecked(false);
            }}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {o}
          </button>
        ))}
      </div>
      <div className="quiz-actions">
        <button
          className="button primary"
          disabled={choice === null}
          onClick={() => setChecked(true)}
        >
          {t(locale, "Check answer", "检查答案")}
          <ArrowRight size={15} />
        </button>
        {checked && choice === lesson.quiz.answer && (
          <button
            className="button secondary"
            onClick={mark}
            disabled={complete}
          >
            <Check size={15} />
            {complete
              ? t(locale, "Lesson completed", "课程已完成")
              : t(locale, "Mark as complete", "标记已完成")}
          </button>
        )}
      </div>
      {checked && (
        <p
          role="status"
          className={`quiz-feedback ${choice === lesson.quiz.answer ? "success" : "retry"}`}
        >
          <strong>
            {choice === lesson.quiz.answer
              ? t(locale, "Exactly. ", "正确。")
              : t(locale, "Try again. ", "再想一想。")}
          </strong>
          {lesson.quiz.explanation[locale]}
        </p>
      )}
      {storageError && (
        <p role="status">
          {t(
            locale,
            "Your browser could not save progress. You can still continue learning.",
            "浏览器无法保存进度，你仍然可以继续学习。",
          )}
        </p>
      )}
    </section>
  );
}
