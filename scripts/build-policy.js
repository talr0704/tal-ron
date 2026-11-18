export function validateProductionEnvironment(env) {
  if (env.VITE_DEMO_MODE === "true") {
    throw new Error(
      "Production deployment cannot use demo mode. Set VITE_DEMO_MODE=false in .env.production.local.",
    );
  }
  if (env.VITE_USE_EMULATORS === "true") {
    throw new Error(
      "Production deployment cannot use Firebase emulators. Set VITE_USE_EMULATORS=false.",
    );
  }
  const required = [
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
  ];
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length)
    throw new Error(
      "Missing Firebase production configuration in .env.production.local: " +
        missing.join(", "),
    );
}
