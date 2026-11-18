import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
  connectAuthEmulator,
} from "firebase/auth";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import { demo } from "./demo";
export const isDemo =
  import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE !== "false";
let auth, functions;
if (!isDemo) {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  auth = getAuth(app);
  functions = getFunctions(
    app,
    import.meta.env.VITE_FIREBASE_REGION || "europe-west1",
  );
  if (import.meta.env.VITE_USE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }
}
const call = async (name, data) =>
  (await httpsCallable(functions, name)(data)).data;
export const api = isDemo
  ? demo
  : {
      event: () => call("publicEvent"),
      guest: (token) => call("guestInvitation", { token }),
      respond: (token, response) => call("respond", { token, response }),
      list: () => call("adminList"),
      saveGuest: (guest) => call("adminSaveGuest", { guest }),
      saveEvent: (event) => call("adminSaveEvent", { event }),
      markSent: (id, type) => call("adminMarkSent", { id, type }),
    };
export const login = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const watchAdmin = (callback) =>
  isDemo
    ? (callback(true), () => {})
    : onAuthStateChanged(auth, async (user) => {
        try {
          callback(
            !!user &&
              (await getIdTokenResult(user, true)).claims.admin === true,
          );
        } catch {
          callback(false);
        }
      });
