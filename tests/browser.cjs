const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
(async () => {
  const root = path.resolve(__dirname, "..");
  const server = http.createServer((req, res) => {
    let target = path.resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!target.startsWith(root + path.sep) && target !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (fs.existsSync(target) && fs.statSync(target).isDirectory())
      target = path.join(target, "index.html");
    if (!fs.existsSync(target)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
      }[path.extname(target)] || "application/octet-stream",
    );
    fs.createReadStream(target).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const go = async (w) => {
    await page.goto(base + "/week" + w + "/");
    try {
      await page.waitForSelector(".cf-nav", { timeout: 5000 });
    } catch (e) {
      throw Error("Week " + w + ": " + errors.join("; ") + " " + e.message);
    }
  };
  const setRange = async (id, v) =>
    page.locator("#" + id).evaluate((el, value) => {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, v);
  const text = async (id) => page.locator("#" + id).innerText();
  for (const w of [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) {
    await go(w);
    assert.equal(await page.locator(".cf-nav").count(), 1);
    const links = await page
      .locator(".cf-nav a,.cf-footer a")
      .evaluateAll((els) => els.map((el) => el.href));
    links
      .filter((x) => x.startsWith(base))
      .forEach((x) =>
        assert.ok(fs.existsSync(path.join(root, new URL(x).pathname)), x),
      );
  }
  await go(9);
  assert.match(await text("schedule-output"), /18\.667/);
  await setRange("delay", 1);
  assert.match(await text("schedule-output"), /19\.000/);
  await page.locator("[data-id=A][data-field=pred]").fill("I");
  await page.locator("[data-id=A][data-field=pred]").dispatchEvent("change");
  assert.match(await text("error"), /cycle/);
  await page.locator("#reset").click();
  assert.equal(await text("error"), "");
  await go(10);
  assert.match(await text("analytic"), /86\.2%/);
  await page.locator("#run").click();
  assert.match(await text("sim-output"), /5,000/);
  await setRange("deadline", 19);
  assert.match(await text("analytic"), /60\.7%/);
  const pixels = await page
    .locator("#histogram")
    .evaluate(
      (c) =>
        Array.from(
          c.getContext("2d").getImageData(0, 0, c.width, c.height).data,
        ).filter((v, i) => i % 4 === 3 && v > 0).length,
    );
  assert.ok(pixels > 1000);
  await go("10/lesson");
  assert.match(await text("pOut"), /86\.2%/);
  await page.locator('[data-dl="19"]').click();
  assert.match(await text("pOut"), /60\.7%/);
  await setRange("conf", 95);
  assert.match(await text("cdOut"), /20\.7/);
  await page.locator("#lvExp").click();
  assert.match(await text("lvP"), /97\.2%/);
  await page.locator("#sdIn").fill("1.22");
  await page.locator("#sdBtn").click();
  assert.match(await text("sdFb"), /Right/);
  for (const w of [11, 12]) {
    await go(w);
    assert.equal(await text("error"), "");
    assert.match(await text("fit-output"), /Fitted equation/);
    const before = await text("fit-output");
    await page.locator("#outlier").click();
    assert.notEqual(await text("fit-output"), before);
    await page.locator("#reset").click();
    assert.equal(await text("fit-output"), before);
  }
  await go(11);
  assert.match(await text("guided"), /42\.15/);
  await setRange("area", 4);
  assert.match(await text("sample-forecast"), /Extrapolation/);
  await go(12);
  assert.match(await text("guided"), /65\.50/);
  await page.locator("#correlated").click();
  assert.equal(await text("error"), "");
  await page.locator('[data-predictor="1"]').uncheck();
  assert.equal(await text("error"), "");
  await go(13);
  await page.locator("#reveal").click();
  assert.match(await text("gate"), /Choose/);
  await page.locator('[name=decision][value="0"]').check();
  await page.locator("#reveal").click();
  assert.match(await text("decision-output"), /192\.00/);
  assert.match(await text("tree-output"), /213\.74/);
  await setRange("high", 0.9);
  assert.ok(!errors.length, errors.join("; "));
  await go(14);
  assert.match(await text("capital-output"), /644\.24/);
  await setRange("probability", 0.8);
  assert.match(
    await text("capital-output"),
    /Properties \+ Professional Services/,
  );
  await page.locator("#reset").click();
  await setRange("budget", 2550);
  assert.match(
    await text("capital-output"),
    /Logistics \+ Properties \+ Professional Services/,
  );
  await page.locator('.cf-questions input[name=check0][value="0"]').check();
  await page.locator("#check-answers").click();
  assert.match(await text("feedback0"), /Correct/);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const w of [5, 6, 7, 8, 9, 10, "10/lesson", 11, 12, 13, 14]) {
      await go(w);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      if (overflow) {
        const offenders = await page.evaluate(() =>
          [...document.querySelectorAll("body *")]
            .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 12)
            .map(
              (el) =>
                el.tagName +
                "." +
                el.className +
                ":" +
                Math.round(el.getBoundingClientRect().right),
            ),
        );
        throw Error(
          `Week ${w} overflows at ${width}px: ${offenders.join(", ")}`,
        );
      }
      if (typeof w === "string" || w >= 9)
        await page.screenshot({
          path: path.join(
            require("node:os").tmpdir(),
            "cowford-week" + String(w).replace("/", "-") + "-" + width + ".png",
          ),
          fullPage: true,
        });
    }
  }
  assert.deepEqual(errors, []);
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  console.log(
    "Desktop/mobile routes, controls, reset, invalid inputs, charts, concept feedback and numerical UI checks passed.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
