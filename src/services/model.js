export { defaultEvent, validateResponse } from "../../functions/model.js";
export const statuses = {
  yes: "מגיע/ה",
  no: "לא מגיע/ה",
  maybe: "אולי",
  pending: "טרם השיבו",
};
export function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
export function messageFor(inv, event, type, style, url) {
  const date = event.date.split("-").reverse().join(".");
  const formal = style === "formal";
  const lead = formal ? `${inv.name} שלום רב,` : `היי ${inv.name} 💛`;
  const messages = {
    initial: {
      casual: `אנחנו מתחתנים! 💍\nנשמח שתהיו איתנו ביום המיוחד שלנו, ${event.names}.\nנפגשים ב־${date} ב${event.venue}, ${event.address}.\nקבלת פנים בשעה ${event.time}. ${event.parking}.`,
      formal: `אנו שמחים להזמינכם לחגוג עמנו את חתונתם של ${event.names}, שתתקיים בתאריך ${date} ב${event.venue}, ${event.address}.\nקבלת הפנים תחל בשעה ${event.time}. ${event.parking}.\nנשמח לכבד את האירוע בנוכחותכם.`,
    },
    pending: {
      casual: `תזכורת קטנה עם הרבה אהבה 🌿\nהחתונה של ${event.names} ב־${date} מתקרבת, ועדיין לא קיבלנו את התשובה שלכם.\nתוכלו להגיע ולחגוג איתנו? נשמח לעדכון בקישור האישי.`,
      formal: `לקראת חתונתם של ${event.names} בתאריך ${date}, נבקש להזכיר כי טרם התקבל אישור הגעתכם.\nנודה לעדכון תשובתכם באמצעות הקישור האישי, כדי שנוכל להיערך לקבלתכם.`,
    },
    maybe: {
      casual: `נשמח להפוך את ה״אולי״ שלכם ל״ברור שמגיעים״ 😊\nסימנתם אולי לחתונה שלנו ב־${date}. אם כבר יודעים, נשמח שתעדכנו את התשובה בקישור האישי.\nמקווים לחגוג איתכם!`,
      formal: `בהמשך לתשובתכם ״אולי״ להזמנה לחתונתם של ${event.names} בתאריך ${date}, נשמח לקבל עדכון בנוגע להשתתפותכם.\nניתן לעדכן את התשובה באמצעות הקישור האישי המצורף.`,
    },
  };
  const body = messages[type][formal ? "formal" : "casual"];
  const signoff = formal
    ? `בברכה ובציפייה לראותכם, ${event.names}`
    : `מחכים לכם באהבה, ${event.names} 🤍`;
  return `${lead}\n\n${body}\n\nאישור הגעה באתר בלבד:\n${url}\n\n${signoff}`;
}
