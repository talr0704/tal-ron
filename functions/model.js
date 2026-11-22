export const defaultEvent = {
  names: "טל ורון",
  date: "2027-03-24",
  time: "18:30",
  venue: "אולם דואאה (DUEE)",
  address: "המאה ועשרים 6, ראשון לציון",
  parking: "חניה מול האולם",
  image: "/images/couple.svg",
};
export function validateResponse(data, inv) {
  if (!data || !["yes", "no", "maybe"].includes(data.status))
    throw Error("Invalid status");
  for (const key of ["adults", "children", "under5"]) {
    if (!Number.isSafeInteger(data[key]) || data[key] < 0)
      throw Error("Invalid attendee count");
  }
  if (data.adults > inv.maxAdults) throw Error("Invalid adult quota");
  if (data.status !== "no" && data.adults < 1) throw Error("Adult required");
  if (!Number.isSafeInteger(data.adults + data.children + data.under5))
    throw Error("Invalid attendee total");
  if (typeof data.note !== "string" || data.note.length > 1000)
    throw Error("Invalid note");
  return {
    status: data.status,
    adults: data.status === "no" ? 0 : data.adults,
    children: data.status === "no" ? 0 : data.children,
    under5: data.status === "no" ? 0 : data.under5,
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
  if (!Number.isInteger(g.maxAdults) || g.maxAdults < 1 || g.maxAdults > 20)
    throw Error("Invalid adult quota");
  return Object.fromEntries(
    ["name", "phone", "side", "maxAdults"].map((k) => [k, g[k]]),
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
  return Object.fromEntries(
    ["names", "date", "time", "venue", "address", "parking", "image"].map(
      (k) => [k, e[k]],
    ),
  );
}

export function canMessageGuest(guest, type) {
  const status = guest.response?.status || "pending";
  return (
    (status === "pending" || status === "maybe") &&
    (type === "initial" || type === status)
  );
}
