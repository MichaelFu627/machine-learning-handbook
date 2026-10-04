import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "../globals.css";
export const metadata: Metadata = {
  title: { default: "Machine Learning Handbook", template: "%s · ML Handbook" },
  description:
    "An interactive field guide to statistics and machine learning. Learn by changing the data, exploring models, and testing your intuition.",
};
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale === "zh-CN" ? "zh-CN" : "en"}>
      <body>{children}</body>
    </html>
  );
}
