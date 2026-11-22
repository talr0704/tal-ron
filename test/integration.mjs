import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
const require = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
initializeApp({ projectId: "demo-tal-ron" });
const base = "http://127.0.0.1:5001/demo-tal-ron/europe-west1/";
async function call(name, data = {}, token) {
  const res = await fetch(base + name, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify({ data }),
  });
  const body = await res.json();
  return { status: res.status, ...body };
}
async function user(email, admin) {
  const created = await getAuth().createUser({
    email,
    password: "test-local-only-123",
  });
  if (admin) await getAuth().setCustomUserClaims(created.uid, { admin: true });
  const res = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "test-local-only-123",
        returnSecureToken: true,
      }),
    },
  );
  return (await res.json()).idToken;
}
test("secure invitation lifecycle, admin checks and Firestore deny rules", async () => {
  const token = await user("admin@example.test", true),
    nonAdmin = await user("guest@example.test", false);
  assert.equal((await call("adminList")).status, 403);
  assert.equal((await call("adminList", {}, nonAdmin)).status, 403);
  assert.equal((await call("publicEvent")).result.names, "טל ורון");
  const guest = {
    name: "בדיקת אמולטור",
    phone: "",
    side: "tal",
    maxAdults: 2,
    maxChildren: 1,
    maxUnder5: 1,
  };
  assert.equal((await call("adminSaveGuest", { guest }, token)).status, 200);
  const list = (await call("adminList", {}, token)).result;
  assert.equal(list.length, 1);
  const g = list[0];
  assert.match(g.token, /^[a-f0-9]{64}$/);
  const own = (await call("guestInvitation", { token: g.token })).result;
  assert.equal(own.name, guest.name);
  assert.equal(own.phone, undefined);
  assert.equal(own.token, undefined);
  assert.equal(
    (await call("guestInvitation", { token: "0".repeat(64) })).status,
    404,
  );
  const response = {
    status: "yes",
    adults: 2,
    children: 27,
    under5: 12,
    note: "",
  };
  assert.equal(
    (
      await call("respond", {
        token: g.token,
        response: { ...response, adults: 3 },
      })
    ).status,
    400,
  );
  assert.equal(
    (await call("respond", { token: g.token, response })).status,
    200,
  );
  assert.equal(
    (await call("guestInvitation", { token: g.token })).result.response.under5,
    12,
  );
  assert.equal(
    (await call("adminSaveGuest", { guest: { ...g, maxAdults: 1 } }, token))
      .status,
    400,
  );
  assert.equal(
    (await call("adminMarkSent", { id: g.id, type: "initial" }, token)).status,
    200,
  );
  assert.equal((await call("adminList", {}, token)).result[0].sent.length, 1);
  const url =
    "http://127.0.0.1:8080/v1/projects/demo-tal-ron/databases/(default)/documents/guests";
  assert.equal((await fetch(url)).status, 403);
  assert.equal(
    (await fetch(url, { headers: { Authorization: "Bearer " + nonAdmin } }))
      .status,
    403,
  );
  assert.equal(
    (await fetch(url, { headers: { Authorization: "Bearer " + token } }))
      .status,
    403,
  );

  const deletion = { id: g.id };
  assert.equal((await call("adminDeleteGuest", deletion)).status, 403);
  assert.equal(
    (await call("adminDeleteGuest", deletion, nonAdmin)).status,
    403,
  );
  assert.equal((await call("adminList", {}, token)).result.length, 1);
  assert.equal((await call("adminDeleteGuest", deletion, token)).status, 200);
  assert.equal((await call("adminDeleteGuest", deletion, token)).status, 200);
  assert.deepEqual((await call("adminList", {}, token)).result, []);
  assert.equal((await call("guestInvitation", { token: g.token })).status, 404);
  assert.equal(
    (await call("respond", { token: g.token, response })).status,
    404,
  );
  const digest = createHash("sha256").update(g.token).digest("hex");
  assert.equal(
    (await getFirestore().doc(`invitationTokens/${digest}`).get()).exists,
    false,
  );
});
