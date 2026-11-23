import Papa from "papaparse";
export const columns = ["name", "phone", "side", "maxAdults"];
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
  return parsed.data.map((row, i) => parseGuestRow(row, i + 2));
}

function parseGuestRow(row, line) {
  const guest = Object.fromEntries(
    columns.map((key) => [key, String(row[key] ?? "").trim()]),
  );
  guest.maxAdults = Number(guest.maxAdults);
  if (
    !guest.name ||
    !["tal", "ron"].includes(guest.side) ||
    !Number.isInteger(guest.maxAdults) ||
    guest.maxAdults < 1 ||
    guest.maxAdults > 20
  )
    throw Error(`נתונים לא תקינים בשורה ${line}`);
  return guest;
}

export async function parseGuestFile(file) {
  if (/\.csv$/i.test(file.name)) return parseGuests(await file.text());
  if (!/\.xlsx$/i.test(file.name)) throw Error("יש לבחור קובץ CSV או XLSX.");

  const { readSheet } = await import("read-excel-file/browser");
  let sheet;
  try {
    sheet = await readSheet(file);
  } catch {
    throw Error("לא ניתן לקרוא את קובץ האקסל. בדקו שהוא קובץ XLSX תקין.");
  }

  const [headers = [], ...rows] = sheet;
  const positions = columns.map((key) =>
    headers.findIndex((header) => String(header ?? "").trim() === key),
  );
  if (positions.some((position) => position === -1))
    throw Error("כותרות נדרשות בגיליון הראשון: " + columns.join(", "));

  return rows.flatMap((row, i) => {
    if (row.every((value) => !String(value ?? "").trim())) return [];
    const values = Object.fromEntries(
      columns.map((key, index) => [key, row[positions[index]]]),
    );
    return [parseGuestRow(values, i + 2)];
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
        note: g.response?.note || "",
        sentCount: g.sent?.length || 0,
      }).map(([k, v]) => [k, safe(v)]),
    ),
  );
  return "\uFEFF" + Papa.unparse(data, { newline: "\r\n" });
}
