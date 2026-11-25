import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { lessons } from "../lessons.js";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-background-networking"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  const accessibility = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const base = process.env.PREVIEW_URL || "http://127.0.0.1:5173/";
  const go = async (route) => {
    await page.goto(base + "#/" + route);
    await page.waitForFunction(
      (p) => document.querySelector("main")?.dataset.route === p,
      route,
    );
    await page.locator("main h1").first().waitFor();
  };
  const shot = (name) =>
    page.screenshot({ path: "qa/screenshots/" + name + ".png" });
  const field = (n) => page.locator('[data-field="' + n + '"]');
  const action = (n) => page.locator('[data-action="' + n + '"]');
  const panel = async (n) => {
    const t = page.getByRole("tab", { name: n, exact: true });
    if (await t.isVisible()) await t.click();
  };
  const result = page.locator("#lab-panel-Results");
  const run = async () => {
    await action("run").click();
    await page.waitForFunction(
      () =>
        !document
          .querySelector('[data-panel="Work"]')
          ?.hasAttribute("aria-busy"),
    );
    await panel("Results");
  };
  const assertText = async (loc, s) =>
    assert.ok((await loc.innerText()).includes(s), s);
  await go("portfolio");
  await assertText(page.locator("main"), "Your first artifact");
  await go("review");
  await assertText(page.locator("main"), "Your review queue is clear");
  await go("");
  await shot("landing-desktop");
  await page
    .getByRole("link", { name: "Try a challenge", exact: true })
    .click();
  await page.locator("[name=choice]").nth(0).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.getByRole("button", { name: "Check my work" }).press("Enter");
  await page.locator(".ld-feedback").waitFor();
  assert.equal(
    await page
      .locator(".ld-feedback")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.reload();
  await assertText(page.locator(".ld-feedback"), "Take another look");
  await go("review");
  await page.getByRole("link", { name: "Revisit exercise" }).click();
  await page.getByRole("button", { name: "Retry this case" }).click();
  await page.locator("[name=choice]").nth(1).check();
  await page.getByRole("button", { name: "Check my work" }).click();
  await shot("drill-feedback");
  await page.getByRole("button", { name: "Try a transfer case" }).click();
  await page.locator("[name=choice]").first().check();
  await page.getByRole("button", { name: "Check my work" }).click();
  await go("map/use");
  await page.getByRole("link", { name: "✓ Demonstrated" }).click();
  await page.getByRole("button", { name: "Export artifact" }).waitFor();
  await go("practice");
  await shot("practice");
  await go("lab/launch");
  await action("run").click();
  await assertText(page.locator("#lab-error"), "prediction");
  await field("prediction").selectOption("1");
  await field("cohort").selectOption("eligible");
  await page.locator('[data-cite="COHORT-02"]').click();
  await assertText(page.locator("#lab-excerpt"), "COHORT-02");
  const bar = page.getByRole("separator", {
    name: "Resize evidence and work panes",
  });
  await bar.focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await bar.getAttribute("aria-valuenow"), "33");
  const downloadWait = page.waitForEvent("download");
  await action("csv").click();
  const csv = await downloadWait;
  assert.equal(
    (await readFile(await csv.path(), "utf8")).split("\r\n").length,
    201,
  );
  await run();
  await assertText(result, "40%");
  await field("decision").selectOption("narrow");
  await field("memo").fill(
    "Run a narrower pilot and check support demand before expanding.",
  );
  await field("refs").fill("COHORT-02, INT-01");
  await field("self").check();
  await action("finish").click();
  await assertText(result, "Objective checks passed");
  await shot("lab-result");
  await go("lab/agent");
  await field("prediction").selectOption("1");
  await run();
  await assertText(result, "Invalid brief");
  await field("pack").selectOption("unreadable");
  await run();
  await assertText(result, "Failed");
  assert.equal(await action("finish").count(), 0);
  await field("selection").selectOption("latest");
  await field("review").selectOption("guard");
  await field("pack").selectOption("complete");
  await run();
  await assertText(result, "Valid brief");
  await field("pack").selectOption("missing");
  await run();
  await assertText(result, "Paused for review");
  await field("architecture").selectOption("fixed");
  await action("finish").click();
  await assertText(result, "Objective checks passed");
  await go("lab/model");
  await field("prediction").selectOption("1");
  await run();
  await assertText(result, "100%");
  await field("receipt").uncheck();
  await run();
  await field("interpret").selectOption("clean");
  await action("finish").click();
  await assertText(result, "Objective checks passed");
  for (const l of lessons.filter(
    (l) => l.id.startsWith("d") && l.id !== "d1",
  )) {
    await go("lesson/" + l.id);
    const c = l.cases[0];
    if (c.options) await page.locator("[name=choice]").nth(c.correct).check();
    if (c.number)
      await page.locator("[name=amount]").fill(String(c.number.value));
    if (c.writing) await page.locator("[name=writing]").fill(c.writing.example);
    for (const el of await page.locator(".ld-form select").all())
      await el.selectOption(c.mapping[await el.getAttribute("name")]);
    await page.locator(".ld-form button[type=submit]").click();
    await assertText(page.locator(".ld-feedback"), "Your evidence checks out.");
  }
  await go("lesson/capstone");
  await page.locator("[name=choice]").nth(1).check();
  await page.locator("[name=amount]").fill("58");
  await page.locator("[name=refs]").fill("EVT-12, REG-08");
  await page
    .locator("[name=writing]")
    .fill("Keep the existing room and confirm attendance before the cutoff.");
  await page
    .locator("[name=reconsider]")
    .fill("A shift in the registration mix would change the expected turnout.");
  await page.locator("[name=self]").first().check();
  await page.getByRole("button", { name: "Submit recommendation" }).click();
  await assertText(page.locator(".ld-feedback"), "Forecast verified");
  await page.getByRole("link", { name: "Open portfolio" }).click();
  const exporting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export artifact" }).click();
  const exported = JSON.parse(
    await readFile(await (await exporting).path(), "utf8"),
  );
  assert.equal(exported.id, "capstone");
  assert.equal(exported.attempt.demonstrated, true);
  await page.reload();
  await assertText(page.locator("main"), "Make the room decision");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dark of [false, true]) {
      if (
        (await page
          .locator("html")
          .evaluate((el) => el.classList.contains("dark"))) !== dark
      )
        await page.locator(".theme").click();
      for (const path of [
        "",
        "practice",
        "map",
        "review",
        "portfolio",
        "lesson/d1",
        "lab/launch",
        "lab/agent",
        "lab/model",
        "plans",
      ]) {
        await go(path);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "overflow " + width + " " + path,
        );
        if (width === 1440 || width === 390) {
          if (!await page.evaluate(() => !!window.axe)) await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
          const issues = await page.evaluate(async () => {
            const result=await window.axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
            return result.violations.map(v=>({id:v.id,target:v.nodes[0].target,reason:v.nodes[0].failureSummary}));
          });
          if(issues.length)accessibility.push({width,dark,path,issues});
        }
        if (path === "plans" && width === 390 && !dark)
          await shot("plans-mobile");
        if (!path && width === 390)
          await shot("landing-mobile-" + (dark ? "dark" : "light"));
        if (path === "lab/agent" && width === 390) {
          await panel("Results");
          const manifest = result.getByText("Inspect source manifest",{exact:true});
          await manifest.click();
          await assertText(result,"Finance-approved overnight travel reimbursement policy");
          await shot("mobile-lab-" + (dark ? "dark" : "light"));
        }
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await go("lab/launch");
  await panel("Work");
  await page.getByRole("tab",{name:"Work",exact:true}).press("ArrowLeft");
  assert.equal(await page.getByRole("tab",{name:"Evidence",exact:true}).getAttribute("aria-selected"),"true");
  await panel("Work");
  await field("memo").fill("Mobile draft survives panel changes.");
  await page.locator('[data-cite="COHORT-02"]').click();
  await assertText(page.locator("#lab-excerpt"), "COHORT-02");
  await panel("Work");
  assert.equal(
    await field("memo").inputValue(),
    "Mobile draft survives panel changes.",
  );
  await page.reload();
  await panel("Work");
  assert.equal(
    await field("memo").inputValue(),
    "Mobile draft survives panel changes.",
  );
  await go("plans");
  await page.locator("main").getByRole("link", { name: "Start free" }).click();
  await page
    .getByRole("heading", { name: "Spot the unsupported claim", exact: true })
    .waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(accessibility, []);
  console.log(
    "PASS · 12 drills, 3 labs, capstone, exports, reviews, saved work, navigation, keyboard checks, 80 viewport/theme/route checks and zero browser errors.",
  );
} finally {
  await browser.close();
}
