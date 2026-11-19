import { defaultEvent, token, validateResponse } from "./model";
import { validateGuest, validateEvent } from "../../functions/model.js";
const key = "tal-ron-demo-v1";
const initial = () => ({
  event: defaultEvent,
  guests: [
    {
      id: "demo",
      token: "demo",
      name: "נועה ישראלי",
      phone: "0501234567",
      side: "tal",
      maxAdults: 2,

      response: null,
      sent: [],
    },
    {
      id: "sample2",
      token: token(),
      name: "איתי כהן",
      phone: "",
      side: "ron",
      maxAdults: 1,

      response: {
        status: "yes",
        adults: 1,
        children: 0,
        under5: 0,

        note: "",
      },
      sent: [],
    },
  ],
});
function read() {
  const saved = JSON.parse(localStorage.getItem(key) || "null");
  return saved || write(initial());
}
function write(db) {
  localStorage.setItem(key, JSON.stringify(db));
  return db;
}

export const demo = {
  event: async () => read().event,
  guest: async (t) => {
    const g = read().guests.find((g) => g.token === t);
    if (!g) throw Error("הקישור אינו תקין");
    return g;
  },
  respond: async (t, data) => {
    const db = read(),
      g = db.guests.find((g) => g.token === t);
    if (!g) throw Error("הקישור אינו תקין");
    g.response = validateResponse(data, g);
    write(db);
  },
  list: async () => read().guests,
  saveGuest: async (g) => {
    const valid = validateGuest(g);
    const db = read();
    const i = db.guests.findIndex((x) => x.id === g.id);
    const old = i >= 0 ? db.guests[i] : null;
    if (old?.response && old.response.adults > valid.maxAdults)
      throw Error("המכסה נמוכה מהתשובה שכבר ניתנה");
    const next = {
      ...old,
      ...valid,
      id: g.id || token(),
      token: old?.token || token(),
      sent: old?.sent || [],
    };
    if (i < 0) db.guests.push(next);
    else db.guests[i] = next;
    write(db);
  },
  saveEvent: async (event) => {
    const db = read();
    db.event = { ...db.event, ...validateEvent(event) };
    write(db);
  },
  markSent: async (id, type) => {
    const db = read(),
      g = db.guests.find((g) => g.id === id);
    g.sent = [...(g.sent || []), { type, at: new Date().toISOString() }];
    write(db);
  },
};
