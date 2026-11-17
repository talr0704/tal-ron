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
  const lead =
    style === "formal" ? `${inv.name} שלום רב,` : `היי ${inv.name} 💛`;
  const body =
    type === "initial"
      ? `אנחנו מתחתנים! נשמח לחגוג איתכם את החתונה של ${event.names} ב־${event.date.split("-").reverse().join(".")} ב${event.venue}, בשעה ${event.time}.`
      : type === "pending"
        ? "נשמח לדעת אם תוכלו להגיע ולחגוג איתנו."
        : "סימנתם אולי — נשמח לעדכון אם תוכלו להגיע לחגיגה.";
  return `${lead}\n${body}\nאישור הגעה באתר בלבד:\n${url}\nמחכים לכם, ${event.names}`;
}
