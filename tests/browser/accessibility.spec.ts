import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("main reading and experiment surfaces meet automated WCAG checks", async ({
  page,
}) => {
  test.setTimeout(120000);
  for (const route of [
    "/en",
    "/en/learn/linear-regression",
    "/zh-CN/learn/k-means",
  ]) {
    await page.goto(route);
    if (route.includes("/learn/"))
      await expect(page.locator(".lab-stats")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
});
