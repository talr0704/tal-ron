import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateResponse,
  validateGuest,
  validateEvent,
  defaultEvent,
} from "../functions/model.js";
const inv = { maxAdults: 1, maxChildren: 2, maxUnder5: 1 };
const good = {
  status: "yes",
  adults: 1,
  children: 1,
  under5: 1,
  meals: ["רגילה", "צמחונית", "רגילה"],
  note: "",
};
test("response accepts separate child categories and meals", () =>
  assert.deepEqual(validateResponse(good, inv, defaultEvent), good));
test("guest cannot increase adults or inject token", () => {
  assert.throws(() =>
    validateResponse({ ...good, adults: 2 }, inv, defaultEvent),
  );
  assert.equal(
    validateResponse({ ...good, token: "fake" }, inv, defaultEvent).token,
    undefined,
  );
});
test("negative, fractional and overflow children rejected", () => {
  for (const n of [-1, 1.5, 3])
    assert.throws(() =>
      validateResponse({ ...good, children: n }, inv, defaultEvent),
    );
});
test("invalid meal, count and status rejected", () => {
  for (const bad of [
    { meals: ["רגילה"] },
    { meals: ["x", "רגילה", "רגילה"] },
    { status: "pending" },
    { note: "a".repeat(1001) },
  ])
    assert.throws(() =>
      validateResponse({ ...good, ...bad }, inv, defaultEvent),
    );
});
test("declining has no meals or attendees", () => {
  assert.deepEqual(
    validateResponse({ ...good, status: "no", meals: [] }, inv, defaultEvent),
    { status: "no", adults: 0, children: 0, under5: 0, meals: [], note: "" },
  );
});
test("admin guest validation only permits supported fields", () => {
  const g = validateGuest({
    name: "אורח",
    phone: "",
    side: "tal",
    maxAdults: 1,
    maxChildren: 0,
    maxUnder5: 0,
    admin: true,
  });
  assert.equal(g.admin, undefined);
  assert.throws(() => validateGuest({ ...g, maxAdults: 0 }));
});
test("event validates image scheme and unique meals", () => {
  assert.deepEqual(validateEvent(defaultEvent), defaultEvent);
  assert.throws(() =>
    validateEvent({ ...defaultEvent, image: "javascript:alert(1).svg" }),
  );
  assert.throws(() => validateEvent({ ...defaultEvent, meals: ["x", "x"] }));
});
