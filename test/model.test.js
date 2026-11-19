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
  note: "",
};
test("response accepts both child categories without applying legacy quotas", () => {
  const large = { ...good, children: 27, under5: 13 };
  assert.deepEqual(
    validateResponse({ ...large, meals: ["רגילה"] }, inv),
    large,
  );
});
test("guest cannot increase adults or inject token", () => {
  assert.throws(() => validateResponse({ ...good, adults: 2 }, inv));
  assert.equal(
    validateResponse({ ...good, token: "fake" }, inv).token,
    undefined,
  );
});
test("negative, fractional and overflow children rejected", () => {
  for (const n of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => validateResponse({ ...good, children: n }, inv));
});
test("invalid count, note and status rejected", () => {
  for (const bad of [{ status: "pending" }, { note: "a".repeat(1001) }])
    assert.throws(() => validateResponse({ ...good, ...bad }, inv));
});
test("declining has no attendees", () => {
  assert.deepEqual(validateResponse({ ...good, status: "no" }, inv), {
    status: "no",
    adults: 0,
    children: 0,
    under5: 0,
    note: "",
  });
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
  assert.equal(g.maxChildren, undefined);
  assert.throws(() => validateGuest({ ...g, maxAdults: 0 }));
});
test("event validates image scheme and ignores legacy meals", () => {
  assert.deepEqual(validateEvent(defaultEvent), defaultEvent);
  assert.throws(() =>
    validateEvent({ ...defaultEvent, image: "javascript:alert(1).svg" }),
  );
  assert.deepEqual(
    validateEvent({ ...defaultEvent, meals: ["x"] }),
    defaultEvent,
  );
});
