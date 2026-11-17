import { test, expect } from "@playwright/test";
test("mobile guest RSVP, editing and dashboard counts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/i/demo");
  await expect(
    page.getByRole("heading", { name: "טל ורון", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("מבוגרים (עד 2)")).toHaveValue("1");
  await page.getByLabel("מבוגרים (עד 2)").selectOption("2");
  await page.getByLabel("ילדים מגיל 5 (עד 2)").selectOption("1");
  await page.getByLabel("ילדים מתחת לגיל 5 (עד 1)").selectOption("1");
  await expect(page.getByLabel(/מנה לאורח/)).toHaveCount(4);
  await page.getByLabel("מנה לאורח 1", { exact: true }).selectOption("טבעונית");
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await expect(page.getByRole("status")).toContainText("התשובה שלכם נשמרה");
  await page.reload();
  await expect(page.getByLabel("מבוגרים (עד 2)")).toHaveValue("2");
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "כל השמחה, במקום אחד." }),
  ).toBeVisible();
  await expect(page.locator(".stats")).toContainText(
    "3 מבוגרים · 1 ילדים · 1 מתחת ל־5",
  );
  await expect(page.locator(".meal-summary")).toContainText("טבעונית: 1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/tal-ron-admin-mobile.png",
    fullPage: true,
  });
});
test("admin creates capped invitation, CSV export and manual WhatsApp status", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "＋ הוספת מוזמן" }).click();
  await page.getByLabel("שם", { exact: true }).fill("בדיקת אורח");
  await page.getByLabel("טלפון", { exact: true }).fill("0500000000");
  await page.getByRole("button", { name: "שמירה", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ההזמנה נשמרה");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "ייצוא CSV" }).click();
  expect((await download).suggestedFilename()).toBe("tal-ron-guests.csv");
  await page.getByRole("button", { name: "הזמנות ותזכורות" }).click();
  await page
    .locator(".recipient")
    .filter({ hasText: "בדיקת אורח" })
    .getByRole("checkbox")
    .check();
  await page.getByRole("button", { name: /תצוגה מקדימה/ }).click();
  expect(await page.getByLabel("תוכן ההודעה").inputValue()).toContain("/i/");
  const wa = page.getByRole("link", { name: "פתיחת WhatsApp" });
  await expect(wa).toHaveAttribute(
    "href",
    /^https:\/\/wa.me\/972500000000\?text=/,
  );
  await expect(
    page.locator(".recipient").filter({ hasText: "בדיקת אורח" }),
  ).toContainText("אישורי שליחה: 0");
  await page.getByRole("button", { name: "אני מאשר/ת ששלחתי בפועל" }).click();
  await expect(
    page.locator(".recipient").filter({ hasText: "בדיקת אורח" }),
  ).toContainText("אישורי שליחה: 1");
});
test("landing page is RTL and fits desktop/mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("link", { name: "ניווט ב־Waze" }),
  ).toHaveAttribute("href", /^https:\/\/waze.com/);
  await page.screenshot({
    path: "/tmp/tal-ron-guest-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/tal-ron-guest-mobile.png",
    fullPage: true,
  });
});

test("guest can answer maybe, decline and receives invalid-link feedback", async ({
  page,
}) => {
  await page.goto("/i/demo");
  await page.getByRole("radio", { name: "אולי", exact: true }).check();
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await expect(page.getByRole("status")).toContainText("התשובה שלכם נשמרה");
  await page.getByRole("button", { name: "עדכון התשובה" }).click();
  await page.getByRole("radio", { name: "לא מגיע/ה", exact: true }).check();
  await expect(page.getByLabel(/מנה לאורח/)).toHaveCount(0);
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await page.goto("/admin");
  await expect(
    page.locator("tr").filter({ hasText: "נועה ישראלי" }),
  ).toContainText("לא מגיע/ה");
  await page.goto("/i/not-a-valid-link");
  await expect(page.getByRole("alert")).toContainText("הקישור אינו תקין");
  await expect(
    page.getByRole("button", { name: "שמירת אישור הגעה" }),
  ).toHaveCount(0);
});

test("event editing and CSV import update guest interface without rebuild", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.locator("input[type=file]").setInputFiles({
    name: "guests.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "\uFEFFname,phone,side,maxAdults,maxChildren,maxUnder5\r\nאורחת חדשה,,ron,1,0,0\r\n",
    ),
  });
  await expect(page.getByRole("status")).toContainText("הייבוא הושלם");
  await expect(
    page.locator("tr").filter({ hasText: "אורחת חדשה" }),
  ).toContainText("1 / 0 / 0");
  await page.getByRole("button", { name: "פרטי האירוע" }).click();
  await page.getByLabel("קבלת פנים", { exact: true }).fill("19:00");
  await page.getByRole("button", { name: "שמירת פרטי האירוע" }).click();
  await expect(page.getByRole("status")).toContainText("פרטי האירוע נשמרו");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "19:00" })).toBeVisible();
});
