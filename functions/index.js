import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { randomBytes, createHash } from "node:crypto";
import {
  defaultEvent,
  validateResponse,
  validateGuest,
  validateEvent,
} from "./model.js";
initializeApp();
const db = getFirestore();
const options = { region: "europe-west1", maxInstances: 10 };
const hash = (t) => createHash("sha256").update(t).digest("hex");
function admin(req) {
  if (req.auth?.token.admin !== true)
    throw new HttpsError("permission-denied", "Admin access required");
}
function checked(fn) {
  try {
    return fn();
  } catch {
    throw new HttpsError("invalid-argument", "Invalid input");
  }
}
function tokenRef(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
    throw new HttpsError("not-found", "Invitation not found");
  return db.collection("invitationTokens").doc(hash(token));
}
async function eventData() {
  const doc = await db.doc("settings/event").get();
  return doc.exists ? doc.data() : defaultEvent;
}
function publicGuest(g) {
  return Object.fromEntries(
    ["name", "maxAdults", "maxChildren", "maxUnder5", "response"].map((k) => [
      k,
      g[k] ?? null,
    ]),
  );
}
export const publicEvent = onCall(options, async () => eventData());
export const guestInvitation = onCall(options, async (req) => {
  const t = await tokenRef(req.data?.token).get();
  if (!t.exists) throw new HttpsError("not-found", "Invitation not found");
  const g = await db.collection("guests").doc(t.data().guestId).get();
  if (!g.exists) throw new HttpsError("not-found", "Invitation not found");
  return publicGuest(g.data());
});
export const respond = onCall(options, async (req) => {
  const ref = tokenRef(req.data?.token);
  await db.runTransaction(async (tx) => {
    const t = await tx.get(ref);
    if (!t.exists) throw new HttpsError("not-found", "Invitation not found");
    const gr = db.collection("guests").doc(t.data().guestId),
      g = await tx.get(gr),
      ev = await tx.get(db.doc("settings/event"));
    if (!g.exists) throw new HttpsError("not-found", "Invitation not found");
    const response = checked(() =>
      validateResponse(
        req.data.response,
        g.data(),
        ev.exists ? ev.data() : defaultEvent,
      ),
    );
    tx.update(gr, { response, updatedAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
});
export const adminList = onCall(options, async (req) => {
  admin(req);
  const snap = await db.collection("guests").get();
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
});
export const adminSaveGuest = onCall(options, async (req) => {
  admin(req);
  const input = req.data?.guest,
    g = checked(() => validateGuest(input));
  if (
    input.id !== undefined &&
    (typeof input.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(input.id))
  )
    throw new HttpsError("invalid-argument", "Invalid ID");
  const ref = input.id
    ? db.collection("guests").doc(input.id)
    : db.collection("guests").doc();
  await db.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (input.id && !old.exists)
      throw new HttpsError("not-found", "Guest not found");
    if (old.exists) {
      const r = old.data().response;
      if (
        r &&
        (r.adults > g.maxAdults ||
          r.children > g.maxChildren ||
          r.under5 > g.maxUnder5)
      )
        throw new HttpsError(
          "failed-precondition",
          "Quota is below existing response",
        );
      tx.update(ref, { ...g, updatedAt: FieldValue.serverTimestamp() });
    } else {
      const token = randomBytes(32).toString("hex");
      tx.create(ref, {
        ...g,
        token,
        response: null,
        sent: [],
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.create(db.collection("invitationTokens").doc(hash(token)), {
        guestId: ref.id,
      });
    }
  });
  return { ok: true };
});
export const adminSaveEvent = onCall(options, async (req) => {
  admin(req);
  const e = checked(() => validateEvent(req.data?.event));
  await db.runTransaction(async (tx) => {
    const guests = await tx.get(db.collection("guests"));
    if (
      guests.docs.some((g) =>
        (g.data().response?.meals || []).some((m) => !e.meals.includes(m)),
      )
    )
      throw new HttpsError(
        "failed-precondition",
        "Meal already selected by a guest",
      );
    tx.set(db.doc("settings/event"), e);
  });
  return { ok: true };
});
export const adminMarkSent = onCall(options, async (req) => {
  admin(req);
  const { id, type } = req.data || {};
  if (
    typeof id !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(id) ||
    !["initial", "pending", "maybe"].includes(type)
  )
    throw new HttpsError("invalid-argument", "Invalid message");
  await db
    .collection("guests")
    .doc(id)
    .update({
      sent: FieldValue.arrayUnion({
        type,
        at: new Date().toISOString(),
        by: req.auth.uid,
      }),
    });
  return { ok: true };
});
