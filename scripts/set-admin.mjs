// Run only in a trusted local/server environment with Application Default Credentials.
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const uid = process.argv[2];
if (!uid) throw Error("Usage: node scripts/set-admin.mjs FIREBASE_UID");
initializeApp();
const auth = getAuth();
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log("Admin claim set. Sign out and back in.");
