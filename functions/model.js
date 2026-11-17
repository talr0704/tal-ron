export const defaultEvent = {
  names: "טל ורון",
  date: "2027-03-24",
  time: "18:30",
  venue: "אולם דואאה (DUEE)",
  address: "המאה ועשרים 6, ראשון לציון",
  parking: "חניה מול האולם",
  image: "/couple.svg",
  meals: ["רגילה", "צמחונית", "טבעונית", "ללא גלוטן"],
};
export function validateResponse(data, inv, event) {
  if (!data || !["yes", "no", "maybe"].includes(data.status))
    throw Error("Invalid status");
  for (const [key, max] of Object.entries({
    adults: inv.maxAdults,
    children: inv.maxChildren,
    under5: inv.maxUnder5,
  }))
    if (!Number.isInteger(data[key]) || data[key] < 0 || data[key] > max)
      throw Error("Invalid quota");
  if (data.status !== "no" && data.adults < 1) throw Error("Adult required");
  const total =
    data.status === "no" ? 0 : data.adults + data.children + data.under5;
  if (
    !Array.isArray(data.meals) ||
    data.meals.length !== total ||
    data.meals.some((m) => !event.meals.includes(m))
  )
    throw Error("Invalid meals");
  if (typeof data.note !== "string" || data.note.length > 1000)
    throw Error("Invalid note");
  return {
    status: data.status,
    adults: data.status === "no" ? 0 : data.adults,
    children: data.status === "no" ? 0 : data.children,
    under5: data.status === "no" ? 0 : data.under5,
    meals: data.meals,
    note: data.note,
  };
}
export function validateGuest(g) {
  if (
    !g ||
    typeof g.name !== "string" ||
    !g.name.trim() ||
    g.name.length > 120 ||
    typeof g.phone !== "string" ||
    g.phone.length > 30 ||
    !["tal", "ron"].includes(g.side)
  )
    throw Error("Invalid guest");
  for (const k of ["maxAdults", "maxChildren", "maxUnder5"])
    if (
      !Number.isInteger(g[k]) ||
      g[k] < (k === "maxAdults" ? 1 : 0) ||
      g[k] > 20
    )
      throw Error("Invalid quota");
  return Object.fromEntries(
    ["name", "phone", "side", "maxAdults", "maxChildren", "maxUnder5"].map(
      (k) => [k, g[k]],
    ),
  );
}
export function validateEvent(e) {
  for (const k of [
    "names",
    "date",
    "time",
    "venue",
    "address",
    "parking",
    "image",
  ])
    if (typeof e?.[k] !== "string" || !e[k].trim() || e[k].length > 500)
      throw Error("Invalid event");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
    !/^\d{2}:\d{2}$/.test(e.time) ||
    !/\.(svg|png|jpg|jpeg|webp)(\?.*)?$/i.test(e.image) ||
    !/^(\/(?!\/)|https:\/\/)/.test(e.image)
  )
    throw Error("Invalid date or image");
  if (
    !Array.isArray(e.meals) ||
    !e.meals.length ||
    e.meals.length > 20 ||
    new Set(e.meals).size !== e.meals.length ||
    e.meals.some((m) => typeof m !== "string" || !m.trim() || m.length > 80)
  )
    throw Error("Invalid meals");
  return Object.fromEntries(
    [
      "names",
      "date",
      "time",
      "venue",
      "address",
      "parking",
      "image",
      "meals",
    ].map((k) => [k, e[k]]),
  );
}
