import data from "../../content/lessons.json";
export type Locale = "en" | "zh-CN";
export const locales: Locale[] = ["en", "zh-CN"];
export const lessons = data;
export type Lesson = (typeof lessons)[number];
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
export function t(locale: Locale, en: string, zh: string) {
  return locale === "en" ? en : zh;
}
export const groups = {
  foundations: ["Foundations", "基础与评价"],
  regression: ["Linear models", "线性模型"],
  optimization: ["Optimization", "优化"],
  classification: ["Classification", "分类"],
  ensembles: ["Ensemble learning", "集成学习"],
  unsupervised: ["Unsupervised learning", "无监督学习"],
  inference: ["Probabilistic inference", "概率推断"],
};
export function groupTitle(group: string, locale: Locale) {
  return (
    groups[group as keyof typeof groups]?.[locale === "en" ? 0 : 1] ?? group
  );
}
