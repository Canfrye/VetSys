import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

// Electron production (file://) için relative asset yolları.
// Normal web build (`npm run build`) base '/' ile kalır.
const isElectronBuild =
  typeof process !== "undefined" && process.env?.ELECTRON === "true";

export default defineConfig({
  plugins: [react()],
  base: isElectronBuild ? "./" : "/",
  define: {
    __VETSYS_VERSION__: JSON.stringify(pkg.version || "1.0.0"),
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
