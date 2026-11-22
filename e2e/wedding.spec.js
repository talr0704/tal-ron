import { test, expect } from "@playwright/test";
test("mobile guest RSVP, editing and dashboard counts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/i/demo");
  await expect(
    page.getByRole("heading", { name: "החתונה של טל ורון", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".rsvp-greeting")).toHaveText("היי, נועה ישראלי!");
  await expect(page.locator(".attendance-choices")).not.toContainText("✓");
  await expect(
    page.getByRole("heading", { name: "פרטי האירוע" }).locator("svg"),
  ).toHaveCount(0);
  await page.getByRole("radio", { name: "מגיעים!" }).check();
  await expect(page.getByLabel("מבוגרים")).toHaveValue("1");
  await page.getByLabel("מבוגרים").selectOption("2");
  await page.getByLabel("ילדים מגיל 5", { exact: true }).fill("25");
  await page.getByLabel("ילדים מתחת לגיל 5", { exact: true }).fill("12");
  await expect(page.getByLabel(/מנה לאורח/)).toHaveCount(0);
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await expect(page.getByRole("status")).toContainText("התשובה נשמרה");
  await expect(page.locator(".saved-participants")).toContainText("2 מבוגרים");
  await expect(page.locator(".saved-participants")).toContainText(
    "12 ילדים מתחת לגיל 5",
  );
  await expect(page.locator(".bloom-frame")).toHaveCount(5);
  await page.reload();
  await expect(page.getByRole("status")).toContainText("מגיעים!");
  await expect(page.locator(".bloom-frame")).toHaveCount(0);
  await expect(page.locator(".saved-flower")).toBeVisible();
  await page.getByRole("button", { name: "עדכון תשובה" }).click();
  await expect(page.getByLabel("מבוגרים")).toHaveValue("2");
  await expect(page.getByLabel("ילדים מגיל 5", { exact: true })).toHaveValue(
    "25",
  );
  await expect(
    page.getByLabel("ילדים מתחת לגיל 5", { exact: true }),
  ).toHaveValue("12");
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "כל השמחה, במקום אחד." }),
  ).toBeVisible();
  await expect(page.locator(".stats")).toContainText(
    "3 מבוגרים · 25 ילדים · 12 מתחת ל־5",
  );
  await expect(
    page.getByText("מנות למאשרי הגעה", { exact: false }),
  ).toHaveCount(0);
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
  await expect(
    page.locator(".recipient").filter({ hasText: "איתי כהן" }),
  ).toHaveCount(0);

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
  await page.getByLabel("תבנית", { exact: true }).selectOption("pending");
  await page
    .locator(".recipient")
    .filter({ hasText: "בדיקת אורח" })
    .getByRole("checkbox")
    .check();
  await page.getByRole("button", { name: /תצוגה מקדימה/ }).click();
  await page.getByRole("button", { name: "אני מאשר/ת ששלחתי בפועל" }).click();
  await expect(
    page.locator(".recipient").filter({ hasText: "בדיקת אורח" }),
  ).toContainText("אישורי שליחה: 2");
  await page.getByRole("button", { name: "מוזמנים ואישורי הגעה" }).click();
  const history = page.getByRole("row").filter({ hasText: "בדיקת אורח" });
  await expect(history).toContainText("הודעות שנשלחו: 2");
  await expect(history).not.toContainText("תזכורות שנשלחו");
  await expect(history).toContainText("הזמנה ראשונית: 1");
  await expect(history).toContainText("תזכורת לטרם השיבו: 1");
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
  await expect(page.locator(".rsvp-greeting")).toHaveText("אישור הגעה");
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
  await expect(page.locator(".saved-choice")).toHaveText("אולי");
  await expect(page.locator(".resting-dove")).toBeVisible();
  await page.getByRole("button", { name: "עדכון תשובה" }).click();
  await page.getByRole("radio", { name: "לא נוכל להגיע", exact: true }).check();
  await expect(page.getByText("תודה שעדכנתם :)")).toBeVisible();
  await expect(page.getByLabel(/מנה לאורח/)).toHaveCount(0);
  await page.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await page.reload();
  await expect(page.getByRole("status")).toContainText("לא נוכל להגיע");
  await expect(
    page.getByRole("heading", { name: "התשובה נשמרה" }),
  ).toBeVisible();
  await expect(page.locator(".saved-participants")).toHaveCount(0);
  await page.getByRole("button", { name: "עדכון תשובה" }).click();
  await page.getByRole("radio", { name: "מגיעים!" }).check();
  await expect(page.getByLabel("מבוגרים")).toHaveValue("1");
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
      "\uFEFFname,phone,side,maxAdults\r\nאורחת חדשה,,ron,1\r\n",
    ),
  });
  await expect(page.getByRole("status")).toContainText("הייבוא הושלם");
  await expect(
    page
      .locator("tr")
      .filter({ hasText: "אורחת חדשה" })
      .getByRole("cell", { name: "1", exact: true }),
  ).toBeVisible();
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
    await page.setViewportSize({ width, height: width === 320 ? 844 : 1050 });
    for (const radio of await radios.all())
      await expect(radio).toBeInViewport();
    const [yes, maybe, no] = await Promise.all(
      (await radios.all()).map((r) => r.boundingBox()),
    );
    expect(yes.x).toBeGreaterThan(maybe.x);
    expect(maybe.x).toBeGreaterThan(no.x);
    expect(yes.y).toBe(maybe.y);
    expect(maybe.y).toBe(no.y);
    const greeting = await page.locator(".rsvp-greeting").boundingBox();
    const portrait = await page.locator(".gouache-couple").boundingBox();
    const details = await page
      .getByRole("heading", { name: "פרטי האירוע" })
      .boundingBox();
    expect(greeting.y).toBeGreaterThanOrEqual(portrait.y + portrait.height);
    expect(greeting.y + greeting.height).toBeLessThan(yes.y);
    expect(details.y).toBeGreaterThan(yes.y + yes.height);
    const chuppah = await page.locator(".event-chuppah").boundingBox();
    const eventText = await page.locator(".event-directions").boundingBox();
    expect(chuppah.x).toBeGreaterThanOrEqual(eventText.x + eventText.width);
    expect(chuppah.y).toBeLessThan(eventText.y + eventText.height);

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

  await page.getByLabel("מבוגרים").selectOption("2");
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
  await expect(page.getByLabel("מבוגרים")).toHaveValue("2");
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

test("admin can cancel or confirm deletion and the deleted invite stops working", async ({
  page,
}) => {
  await page.goto("/admin");
  const row = page.getByRole("row").filter({ hasText: "נועה ישראלי" });
  const remove = row.getByRole("button", {
    name: "מחיקת ההזמנה של נועה ישראלי",
  });

  page.once("dialog", (dialog) => dialog.dismiss());
  await remove.click();
  await expect(row).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await remove.click();
  await expect(page.getByRole("status")).toContainText("המוזמן נמחק");
  await expect(row).toHaveCount(0);
  await expect(
    page.getByRole("row").filter({ hasText: "איתי כהן" }),
  ).toBeVisible();

  await page.goto("/i/demo");
  await expect(page.getByRole("alert")).toContainText("הקישור אינו תקין");
});

test("WhatsApp preview rechecks eligibility when a guest replies in another tab", async ({
  page,
  context,
}) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "הזמנות ותזכורות" }).click();
  const recipient = page
    .locator(".recipient")
    .filter({ hasText: "נועה ישראלי" });
  await recipient.getByRole("checkbox").check();
  await page.getByRole("button", { name: /תצוגה מקדימה/ }).click();

  const invitation = await context.newPage();
  await invitation.goto("/i/demo");
  await invitation.getByRole("radio", { name: "אולי", exact: true }).check();
  await invitation.getByRole("button", { name: "שמירת אישור הגעה" }).click();
  await expect(invitation.getByRole("status")).toContainText("התשובה נשמרה");
  await invitation.close();

  await page.reload();
  await page.getByRole("button", { name: "הזמנות ותזכורות" }).click();
  await page.getByLabel("תבנית").selectOption("maybe");
  await recipient.getByRole("checkbox").check();
  await page.getByRole("button", { name: /תצוגה מקדימה/ }).click();

  const updatedInvitation = await context.newPage();
  await updatedInvitation.goto("/i/demo");
  await updatedInvitation.getByRole("button", { name: "עדכון תשובה" }).click();
  await updatedInvitation
    .getByRole("radio", { name: "לא נוכל להגיע", exact: true })
    .check();
  await updatedInvitation
    .getByRole("button", { name: "שמירת אישור הגעה" })
    .click();
  await expect(updatedInvitation.getByRole("status")).toContainText(
    "לא נוכל להגיע",
  );
  await updatedInvitation.close();

  await page.getByRole("link", { name: "פתיחת WhatsApp" }).click();
  await expect(page.getByRole("alert")).toContainText("המוזמן כבר אינו מתאים");
  await expect(recipient).toHaveCount(0);
  await expect(page.getByRole("link", { name: "פתיחת WhatsApp" })).toHaveCount(
    0,
  );
});
