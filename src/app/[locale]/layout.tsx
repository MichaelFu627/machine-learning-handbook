import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "../globals.css";
export const metadata: Metadata = {
  title: { default: "Machine Learning Handbook", template: "%s · ML Handbook" },
  description: "An interactive field guide to statistics and machine learning.",
};
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/catalog";
import { Shell } from "@/components/Shell";
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale}>
      <body>
        <Shell locale={locale}>{children}</Shell>
      </body>
    </html>
  );
}
