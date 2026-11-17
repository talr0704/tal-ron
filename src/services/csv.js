import Papa from "papaparse";
export const columns = [
  "name",
  "phone",
  "side",
  "maxAdults",
  "maxChildren",
  "maxUnder5",
];
export function parseGuests(text) {
  const parsed = Papa.parse(text.replace(/^\uFEFF/, ""), {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (
    parsed.errors.length ||
    columns.some((c) => !parsed.meta.fields?.includes(c))
  )
    throw Error("כותרות CSV נדרשות: " + columns.join(", "));
  return parsed.data.map((row, i) => {
    const g = Object.fromEntries(columns.map((c) => [c, row[c]?.trim()]));
    for (const key of columns.slice(3)) g[key] = Number(g[key]);
    if (
      !g.name ||
      !["tal", "ron"].includes(g.side) ||
      !Number.isInteger(g.maxAdults) ||
      g.maxAdults < 1 ||
      g.maxAdults > 20 ||
      ["maxChildren", "maxUnder5"].some(
        (k) => !Number.isInteger(g[k]) || g[k] < 0 || g[k] > 20,
      )
    )
      throw Error(`נתונים לא תקינים בשורה ${i + 2}`);
    return g;
  });
}
export function exportGuests(guests) {
  const safe = (v) =>
    typeof v === "string" && /^[=+@\-\t\r]/.test(v) ? "'" + v : v;
  const data = guests.map((g) =>
    Object.fromEntries(
      Object.entries({
        ...Object.fromEntries(columns.map((c) => [c, g[c]])),
        status: g.response?.status || "pending",
        adults: g.response?.adults || 0,
        children: g.response?.children || 0,
        under5: g.response?.under5 || 0,
        meals: (g.response?.meals || []).join(" | "),
        note: g.response?.note || "",
        sentCount: g.sent?.length || 0,
      }).map(([k, v]) => [k, safe(v)]),
    ),
  );
  return "\uFEFF" + Papa.unparse(data, { newline: "\r\n" });
}
