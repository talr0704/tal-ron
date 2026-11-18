import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProductionEnvironment } from "../scripts/build-policy.js";
const config = {
  VITE_FIREBASE_API_KEY: "public-key",
  VITE_FIREBASE_AUTH_DOMAIN: "example.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "example",
  VITE_FIREBASE_APP_ID: "public-id",
  VITE_DEMO_MODE: "false",
  VITE_USE_EMULATORS: "false",
};
test("production accepts configured Firebase and requires no demo fallback", () =>
  assert.doesNotThrow(() => validateProductionEnvironment(config)));
test("production rejects demo even with valid Firebase settings", () =>
  assert.throws(
    () => validateProductionEnvironment({ ...config, VITE_DEMO_MODE: "true" }),
    /demo mode/,
  ));
test("production rejects emulators and missing Firebase settings", () => {
  assert.throws(
    () =>
      validateProductionEnvironment({ ...config, VITE_USE_EMULATORS: "true" }),
    /emulators/,
  );
  for (const key of [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
  ])
    assert.throws(
      () => validateProductionEnvironment({ ...config, [key]: "" }),
      /Missing Firebase/,
    );
});
