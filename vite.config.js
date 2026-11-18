import { defineConfig, loadEnv } from "vite";
import { validateProductionEnvironment } from "./scripts/build-policy.js";
export default defineConfig(({ command, mode }) => {
  if (command === "build")
    validateProductionEnvironment(loadEnv(mode, process.cwd(), "VITE_"));
  return { esbuild: { jsx: "automatic" } };
});
