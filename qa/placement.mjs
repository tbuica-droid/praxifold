import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { items } from "../placement-items.js";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = process.env.PREVIEW_URL || "http://127.0.0.1:5173/";
  await page.goto(base);
  await page.getByRole("link", { name: "Take the placement quiz" }).click();
  await page
    .getByLabel("What would you most like to work on?")
    .selectOption("build");
  await page.getByRole("button", { name: "Start the quiz" }).click();
  const next = () =>
    page
      .getByRole("button", { name: /Next question|See my practice plan/ })
      .click();
  await next();
  await page
    .getByRole("alert")
    .filter({ hasText: "Choose an answer" })
    .waitFor();
  async function audit() {
    await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
    const issues = await page.evaluate(async () =>
      (
        await axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
          },
        })
      ).violations.map((v) => v.id),
    );
    assert.deepEqual(issues, []);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
  }
  for (const [width, dark] of [
    [390, false],
    [320, true],
    [1440, false],
    [768, true],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    if (
      (await page
        .locator("html")
        .evaluate((e) => e.classList.contains("dark"))) !== dark
    )
      await page.locator(".theme").click();
    await audit();
    if(width===320 || width===1440) await page.screenshot({path:"qa/screenshots/placement-"+width+".png"});
    const ink = await page
      .locator(".quiz-surface")
      .evaluate((e) => getComputedStyle(e).color);
    for (const selector of [".quiz-evidence", ".quiz-option", "legend"]) {
      const css = await page
        .locator(selector)
        .first()
        .evaluate((e) => ({
          color: getComputedStyle(e).color,
          weight: Number(getComputedStyle(e).fontWeight),
        }));
      assert.equal(css.color, ink);
      assert.ok(css.weight >= 500);
    }
  }
  for (const [i, q] of items.entries()) {
    await page.getByRole("heading", { name: q.prompt, exact: true }).waitFor();
    if (q.options)
      await page.locator('input[name=pick][value="' + q.answer + '"]').check();
    else await page.getByLabel("Your answer (%)", { exact: true }).fill("10");
    if (i === 1) {
      await page.getByRole("link", { name: "Pause quiz" }).click();
      await page.getByRole("link", { name: "Resume placement quiz" }).click();
      await page.reload();
      await page.locator("fieldset").waitFor();
      assert.equal(await page.locator("input:checked").inputValue(), q.answer);
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await next();
    }
    await next();
  }
  await page.getByRole("heading", { name: "Your practice plan" }).waitFor();
  await audit();
  await page.getByText("Use AI well", { exact: true }).click();
  await page
    .getByText("Your answer · 10% (incorrect)", { exact: true })
    .waitFor();
  await page.getByRole("link", { name: "Go to practice" }).click();
  assert.equal(
    await page
      .getByRole("link", { name: "Open activity" })
      .getAttribute("href"),
    "#/lesson/d4",
  );
  await page.getByRole("link", { name: "See your quiz results" }).click();
  await page.getByRole("button", { name: "Retake quiz" }).click();
  await page.getByLabel("I’m not sure yet").check();
  await next();
  await page.reload();
  await page.getByRole("heading", { name: items[1].prompt }).waitFor();
  await page.goto(base + "#/placement/results");
  await page.getByRole("heading", { name: "Your practice plan" }).waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "Open recommended activity" })
      .getAttribute("href"),
    "#/lesson/d4",
  );
  await page.getByRole("link",{name:"Open recommended activity"}).click();
  await page.getByLabel("Eligible activation rate (%)").fill("40");
  await page.getByRole("button",{name:"Check my work"}).click();
  assert.equal(await page.getByRole("link",{name:"Next challenge"}).getAttribute("href"),"#/lab/launch");
  await page.goto(base+"#/map/use");
  await page.getByText("Suggested for you",{exact:true}).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS · placement, answer review, personalized routing, saved retake, responsive typography and accessibility",
  );
} finally {
  await browser.close();
}
