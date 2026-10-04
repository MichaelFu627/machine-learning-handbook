import { test, expect } from "@playwright/test";

test("high-noise edited observations stay visible and survive sharing", async ({
  page,
}) => {
  await page.goto("/en/learn/linear-regression");
  const slider = page.getByRole("slider").first();
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("3");
  const point = page.locator(".scatter-chart circle[tabindex]").first();
  await point.focus();
  await page.keyboard.press("ArrowDown");
  const positions = await page
    .locator(".scatter-chart circle[tabindex]")
    .evaluateAll((nodes) =>
      nodes.map((node) => Number(node.getAttribute("cy"))),
    );
  expect(positions.every((y) => y >= 26 && y <= 310)).toBeTruthy();
  const metrics = await page.locator(".lab-stats").innerText();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.goto(await page.locator(".share-link input").inputValue());
  await expect.poll(() => page.locator(".lab-stats").innerText()).toBe(metrics);
});

test("all lessons render a working experiment and mathematical content in both languages", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const slugs = [
    "foundations",
    "evaluation",
    "linear-regression",
    "gradient-descent",
    "regularization",
    "logistic-regression",
    "naive-bayes",
    "svm",
    "decision-trees",
    "bagging",
    "random-forests",
    "k-means",
    "expectation-maximization",
    "mcmc",
  ];
  for (const locale of ["en", "zh-CN"])
    for (const slug of slugs) {
      await page.goto(`/${locale}/learn/${slug}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".katex-display")).toHaveCount(1);
      await expect(page.locator(".katex-error")).toHaveCount(0);
      if (!["foundations", "evaluation"].includes(slug)) {
        await expect(page.locator(".lab-results")).toHaveAttribute(
          "aria-busy",
          "false",
        );
        await expect(page.locator(".lab-error")).toHaveCount(0);
        await expect(page.locator(".lab-stats .stat")).toHaveCount(4);
      }
    }
  expect(errors).toEqual([]);
});

test("OLS keyboard edits, share round-trip, and bilingual navigation", async ({
  page,
}) => {
  await page.goto("/en/learn/linear-regression");
  const circle = page.locator(".scatter-chart circle[tabindex]").first();
  await circle.focus();
  const old = await circle.getAttribute("cy");
  await page.keyboard.press("ArrowUp");
  await expect(circle).not.toHaveAttribute("cy", old!);
  const before = await page.locator(".lab-stats").innerText();
  const slope = await page
    .locator(".lab-stats .stat strong")
    .first()
    .innerText();
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const link = await page.locator(".share-link input").inputValue();
  await page.goto(link);
  await expect.poll(() => page.locator(".lab-stats").innerText()).toBe(before);
  await page.locator(".language").click();
  await expect(page).toHaveURL(/zh-CN/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator(".lab-stats .stat strong").first()).toHaveText(
    slope,
  );
});

test("K-means playback, quiz and persistent completion", async ({ page }) => {
  await page.goto("/en/learn/k-means");
  await expect(page.locator(".playback")).toBeVisible();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(page.locator(".playback output")).toContainText("1/");
  await page
    .getByRole("button", { name: "Play animation", exact: true })
    .click();
  await expect(page.locator(".playback output")).not.toContainText("1/");
  if (
    await page
      .getByRole("button", { name: "Pause animation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Pause animation", exact: true })
      .click();
  await page
    .getByRole("button", { name: "A The group mean", exact: true })
    .click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page
    .getByRole("button", { name: "Mark as complete", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Lesson completed", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".sidebar-bottom strong")).toHaveText("1/14");
});

test("mobile navigation, search and layout have no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh-CN");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "打开导航" }).click();
  await page
    .locator(".sidebar")
    .getByRole("link", { name: /线性回归/ })
    .click();
  await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.locator(".search-trigger").click();
  await page.getByRole("textbox", { name: "搜索关键词" }).fill("k-means");
  await page.locator(".search-results a").click();
  await expect(page).toHaveURL(/k-means/);
});

test("remote failure is recoverable and malformed shared state is bounded", async ({
  page,
}) => {
  await page.route("**/api/experiment", (route) =>
    route.fulfill({ status: 503, body: "{}" }),
  );
  await page.goto("/en/learn/svm");
  await expect(page.locator(".lab-error")).toBeVisible();
  await page.unroute("**/api/experiment");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".lab-stats")).toBeVisible();
  await page.goto(
    "/en/learn/k-means?v=1&lab=" +
      encodeURIComponent(
        JSON.stringify({
          value: 9999,
          seed: -1,
          points: [{ x: Infinity, y: 0 }],
        }),
      ),
  );
  await expect(page.locator(".lab-stats .stat strong").first()).toHaveText("3");
});
