import { test, expect } from "@playwright/test";
test("mobile guest RSVP, editing and dashboard counts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/i/demo");
  await expect(
    page.getByRole("heading", { name: "החתונה של טל ורון", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".guest-name-frame")).toHaveText("נועה ישראלי");
  for (const [choice, icon] of [
    ["yes", "tick"],
    ["maybe", "heart"],
    ["no", "flower"],
  ]) {
    await expect(
      page.locator(`.attendance-choice.choice-${choice} img`),
    ).toHaveAttribute("src", `/images/gouache/icon-${icon}.webp`);
  }
  await expect(page.locator(".saved-confirmation-icon")).toHaveCount(0);
  await page.getByRole("radio", { name: "מגיעים!" }).check();
  await expect(page.getByLabel("מבוגרים (עד 2)")).toHaveValue("1");
  await page.getByLabel("מבוגרים (עד 2)").selectOption("2");
  await page.getByLabel("ילדים מגיל 5 (עד 2)").selectOption("1");
  await page.getByLabel("ילדים מתחת לגיל 5 (עד 1)").selectOption("1");
  await expect(page.getByLabel(/מנה לאורח/)).toHaveCount(4);
  await page.getByLabel("מנה לאורח 1", { exact: true }).selectOption("טבעונית");
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await expect(page.getByRole("status")).toContainText("התשובה נשמרה");
  await expect(page.locator(".saved-confirmation-icon")).toBeVisible();
  await expect(page.locator(".saved-participants")).toContainText("2 מבוגרים");
  await expect(page.locator(".saved-participants")).toContainText(
    "ילד אחד מתחת לגיל 5",
  );
  await expect(page.locator(".bloom-frame")).toHaveCount(5);
  await page.reload();
  await expect(page.getByRole("status")).toContainText("מגיעים!");
  await expect(page.locator(".bloom-frame")).toHaveCount(0);
  await expect(page.locator(".saved-flower")).toBeVisible();
  await expect(page.locator(".saved-confirmation-icon")).toHaveCount(0);
  await page.getByRole("button", { name: "עדכון תשובה" }).click();
  await expect(page.getByLabel("מבוגרים (עד 2)")).toHaveValue("2");
  await expect(page.getByLabel("מנה לאורח 1", { exact: true })).toHaveValue(
    "טבעונית",
  );
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
  await expect(page.locator(".message-example")).toHaveCount(2);
  await expect(page.locator(".message-examples")).toContainText(
    "{הקישור האישי}",
  );
  await page.getByLabel("תבנית", { exact: true }).selectOption("pending");
  await expect(page.locator(".message-examples")).toContainText(
    "טרם התקבל אישור הגעתכם",
  );
  await page.getByLabel("תבנית", { exact: true }).selectOption("maybe");
  await expect(page.locator(".message-examples")).toContainText(
    "בהמשך לתשובתכם ״אולי״",
  );
  await page.getByLabel("תבנית", { exact: true }).selectOption("initial");

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
test("landing page is RTL and fits desktop/mobile", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("פתחו את הקישור האישי", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".guest-name-frame")).toHaveText(
    "נשמח לחגוג איתכם!",
  );
  const waze = page.getByRole("link", { name: "ניווט לדואה" });
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent("המאה ועשרים 6, ראשון לציון")}&navigate=yes`;
  await expect(waze).toHaveAttribute("href", wazeUrl);
  await context.route(wazeUrl, (route) =>
    route.fulfill({ body: "Waze link test" }),
  );
  const opened = context.waitForEvent("page");
  await waze.click();
  const destination = await opened;
  await expect(destination).toHaveURL(wazeUrl);
  await destination.close();
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
  await expect(page.getByText("פרטי הגעה משוערים")).toBeVisible();
  await expect(page.locator(".resting-dove")).toBeVisible();
  await expect(page.getByRole("heading", { name: "התשובה נשמרה" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await expect(page.getByRole("status")).toContainText("התשובה נשמרה");
  await expect(page.getByText("נשמח לעדכון כשתדעו")).toBeVisible();
  await expect(page.locator(".resting-dove")).toBeVisible();
  await page.getByRole("button", { name: "עדכון תשובה" }).click();
  await page.getByRole("radio", { name: "לא נוכל להגיע", exact: true }).check();
  await expect(page.getByLabel(/מנה לאורח/)).toHaveCount(0);
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await page.reload();
  await expect(page.getByRole("status")).toContainText("לא נוכל להגיע");
  await expect(page.locator(".saved-decline img")).toHaveAttribute(
    "src",
    "/images/gouache/response-petal.webp",
  );
  await expect(page.locator(".saved-participants")).toHaveCount(0);
  await page.getByRole("button", { name: "עדכון תשובה" }).click();
  await page.getByRole("radio", { name: "מגיעים!" }).check();
  await expect(page.getByLabel("מבוגרים (עד 2)")).toHaveValue("1");
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
  ).toContainText("מבוגרים: 1");
  await page.getByRole("button", { name: "פרטי האירוע" }).click();
  await page.getByLabel("קבלת פנים", { exact: true }).fill("19:00");
  await page.getByRole("button", { name: "שמירת פרטי האירוע" }).click();
  await expect(page.getByRole("status")).toContainText("פרטי האירוע נשמרו");
  await page.goto("/");
  await expect(page.locator("time").filter({ hasText: "19:00" })).toBeVisible();
});

test("personal invitation fits at both widths and retains a keyboard draft after a failed save", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/i/demo");
  const radios = page.getByRole("radio");
  await expect(radios).toHaveCount(3);
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 700 : 900 });
    for (const radio of await radios.all())
      await expect(radio).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await page.keyboard.press("Tab");
  await expect(radios.first()).toBeFocused();
  await expect(page.locator(".attendance-choice").first()).toHaveCSS(
    "outline-width",
    "3px",
  );
  await page.keyboard.press("Space");
  await expect(radios.first()).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(radios.nth(1)).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(radios.last()).toBeChecked();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(radios.first()).toBeChecked();

  await page.getByLabel("מבוגרים (עד 2)").selectOption("2");
  await page.getByLabel("הערות (אופציונלי)").fill("הערת בדיקה");
  await page.evaluate(() => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, data) {
      Storage.prototype.setItem = write;
      if (key === "tal-ron-demo-v1") throw new Error("Test save failure");
      return write.call(this, key, data);
    };
  });
  const save = page.getByRole("button", { name: "שמירת אישור הגעה" });
  await save.press("Enter");
  await expect(page.getByRole("alert")).toContainText("לא ניתן לשמור");
  await expect(page.getByRole("heading", { name: "התשובה נשמרה" })).toHaveCount(
    0,
  );
  await expect(page.getByLabel("הערות (אופציונלי)")).toHaveValue("הערת בדיקה");
  await expect(page.getByLabel("מבוגרים (עד 2)")).toHaveValue("2");
  await expect(save).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("התשובה נשמרה");
  await expect(page.locator(".bloom-frame-5")).toHaveCSS("opacity", "1");
  await expect(page.locator(".bloom-frame-1")).toHaveCSS("opacity", "0");
  await page.reload();
  await page.getByRole("button", { name: "עדכון תשובה" }).click();
  await expect(radios.first()).toBeFocused();
  await expect(page.getByLabel("הערות (אופציונלי)")).toHaveValue("הערת בדיקה");
});
