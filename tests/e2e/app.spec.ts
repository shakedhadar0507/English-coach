import { test, expect, devices, type Page } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "owner@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "TestPassword123";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/אימייל|Email/).fill(EMAIL);
  await page.getByLabel(/סיסמה|Password/).fill(PASSWORD);
  await page.getByRole("button", { name: /^(כניסה|Sign in)$/ }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

/** Answers whatever exercise is on screen with a plausible (not necessarily correct) response. */
async function answerCurrent(page: Page) {
  await page.getByRole("button", { name: /^(בדיקה|Check)$/ }).waitFor();
  const radios = page.getByRole("radio");
  if (await radios.count()) { await radios.first().click(); }
  else if (await page.locator("[data-option]").count()) { await page.locator("[data-option]").first().click(); }
  else if (await page.locator("input[data-blank]").count()) {
    for (const el of await page.locator("input[data-blank]").all()) await el.fill("is");
  } else if (await page.locator("[data-token]").count()) {
    for (const el of await page.locator("[data-token]").all()) await el.click();
  } else if (await page.locator("textarea, input[type=text]").count()) {
    await page.locator("textarea, input[type=text]").first().fill("I usually go to work by bus.");
  }
  await page.getByRole("button", { name: /^(בדיקה|Check)$/ }).click();
}

test.describe.serial("English Coach", () => {
  let shared: Page;
  test.beforeAll(async ({ browser }) => {
    shared = await browser.newPage({ ...devices["iPhone 13"], locale: "he-IL", baseURL: process.env.BASE_URL ?? "http://localhost:3100" });
  });
  test.afterAll(async () => { await shared?.close(); });

  test("signed-out users are redirected and APIs are protected", async ({ page, request }) => {
    await page.goto("/progress");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect((await request.post("/api/preferences", { data: {} })).status()).toBe(401);
    expect((await request.get("/api/data/export")).status()).toBe(401);
    expect((await request.post("/api/auth/sign-up/email", { data: { email: "x@example.com", password: "Password12345", name: "x" } })).ok()).toBeFalsy();
  });

  test("wrong password is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/אימייל|Email/).fill(EMAIL);
    await page.getByLabel(/סיסמה|Password/).fill("not-the-password");
    await page.getByRole("button", { name: /^(כניסה|Sign in)$/ }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("onboarding with adaptive placement test", async () => {
    const page = shared;
    await login(page);
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByRole("button", { name: /^(התחלה|Start)$/ }).click();
    await page.getByRole("button", { name: "עברית" }).click();
    const goal = page.getByRole("button", { name: /אנגלית עסקית|Business English/ });
    if ((await goal.getAttribute("aria-pressed")) !== "true") await goal.click();
    await page.getByRole("button", { name: /המשך|Continue/ }).click();
    await page.getByRole("button", { name: /המשך|Continue/ }).click();
    await page.getByRole("button", { name: /התחל מבחן|Start the test/ }).click();
    for (let i = 0; i < 32; i++) {
      if (await page.getByText(/רמה משוערת|Estimated level/).isVisible().catch(() => false)) break;
      await answerCurrent(page);
      await page.waitForTimeout(250);
    }
    await expect(page.getByText(/רמה משוערת|Estimated level/)).toBeVisible();
    await expect(page.getByText(/תעודה רשמית|not an official certificate/)).toBeVisible();
    await page.getByRole("button", { name: /סיום|Finish/ }).click();
    await page.waitForURL("/");
    await expect(page.getByRole("heading", { name: /התוכנית של היום|Today's plan/ })).toBeVisible();
  });

  test("main screens render without errors", async () => {
    const page = shared;
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of ["/", "/learn", "/learn/a1-introductions", "/practice", "/practice/vocabulary", "/practice/grammar", "/practice/grammar/present-simple",
      "/practice/listening", "/practice/listening/a1-cafe-order", "/practice/writing", "/practice/errors", "/speak", "/progress", "/settings", "/placement"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBeLessThan(400);
      await expect(page.locator("main")).toBeVisible();
      const body = await page.locator("body").innerText();
      expect(body, path).not.toMatch(/Application error|Internal Server Error/);
    }
    expect(errors).toEqual([]);
  });

  test("complete a lesson and record progress", async () => {
    const page = shared;
    await page.goto("/learn/a1-introductions");
    await page.getByRole("link").filter({ hasText: /./ }).locator("text=/.+/").first();
    const first = page.locator('a[href^="/lesson/"]').first();
    await first.click();
    await page.getByRole("button", { name: /התחל|Start|המשך מהמקום|Resume/ }).first().click();
    for (let i = 0; i < 20; i++) {
      if (await page.getByText(/סיכום השיעור|Lesson summary/).isVisible().catch(() => false)) break;
      await answerCurrent(page);
      const self = page.getByRole("button", { name: /התשובה שלי נכונה|My answer is correct/ });
      if (await self.isVisible().catch(() => false)) await self.click();
      await page.getByRole("button", { name: /^(המשך|Continue)$/ }).click();
      await page.waitForTimeout(200);
    }
    await expect(page.getByText(/סיכום השיעור|Lesson summary/)).toBeVisible();
    await page.goto("/progress");
    await expect(page.getByText(/שיעורים שהושלמו|Lessons completed/)).toBeVisible();
  });

  test("vocabulary: learn new words", async () => {
    const page = shared;
    await page.goto("/practice/vocabulary/review?kind=new");
    await page.getByRole("button", { name: /הצג תשובה|Show answer/ }).waitFor();
    for (let i = 0; i < 12; i++) {
      const show = page.getByRole("button", { name: /הצג תשובה|Show answer/ });
      const good = page.getByRole("button", { name: /^(טוב|Good)$/ });
      if (await show.isVisible().catch(() => false)) await show.click({ timeout: 5000 }).catch(() => {});
      if (await good.isVisible().catch(() => false)) { await good.click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300); continue; }
      const opt = page.getByRole("radio").first();
      if (await opt.isVisible().catch(() => false)) { await opt.click(); await page.getByRole("button", { name: /המשך|Continue/ }).click(); continue; }
      break;
    }
    await page.goto("/practice/vocabulary");
    await expect(page.locator('a[href^="/practice/vocabulary/word/"]').first()).toBeVisible();
    await page.locator('a[href^="/practice/vocabulary/word/"]').first().click();
    await expect(page.getByRole("heading", { name: /פירושים|Meanings/ })).toBeVisible();
  });

  test("speaking coach shows honest disabled state without AI", async () => {
    const page = shared;
    await page.goto("/speak");
    await expect(page.getByText(/כבויה כרגע|currently off/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /התחל שיחה|Start conversation/ })).toBeDisabled();
  });

  test("theme and language switch persist", async () => {
    const page = shared;
    await page.goto("/settings");
    await page.getByRole("button", { name: /^(כהה|Dark)$/ }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "English" }).click();
    await page.waitForTimeout(800);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "עברית" }).click();
    await page.getByRole("button", { name: /^(System|לפי המכשיר)$/ }).click();
    await page.waitForTimeout(800);
  });

  test("floating notes button saves a note for the current screen and can be dragged", async () => {
    await shared.goto("/progress");
    const btn = shared.locator("[data-feedback-button]");
    await expect(btn).toBeVisible();
    const box = (await btn.boundingBox())!;
    await shared.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await shared.mouse.down();
    await shared.mouse.move(box.x + 120, box.y - 200, { steps: 8 });
    await shared.mouse.up();
    const moved = (await btn.boundingBox())!;
    expect(Math.abs(moved.y - box.y)).toBeGreaterThan(100);
    await expect(shared.getByRole("dialog")).toHaveCount(0);
    await btn.click();
    const dialog = shared.getByRole("dialog");
    await expect(dialog).toContainText("/progress");
    const note = `e2e note ${Date.now()}`;
    await dialog.locator("textarea").fill(note);
    await dialog.getByRole("button", { name: "שמירה" }).click();
    await expect(dialog.getByText(note)).toBeVisible();
    await shared.reload();
    const after = (await btn.boundingBox())!;
    expect(Math.abs(after.y - moved.y)).toBeLessThan(4);
  });

  test("PWA manifest and service worker are served", async ({ request }) => {
    const m = await request.get("/manifest.webmanifest");
    expect(m.ok()).toBeTruthy();
    expect((await m.json()).display).toBe("standalone");
    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBeTruthy();
    expect((await request.get("/icons/icon-192.png")).ok()).toBeTruthy();
  });
});
