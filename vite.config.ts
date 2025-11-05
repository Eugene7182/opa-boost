import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

const webappRoot = path.resolve(__dirname, "src/webapp");

export default defineConfig({
  root: webappRoot,
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    outDir: path.resolve(__dirname, "dist/webapp"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(webappRoot, "src"),
    },
  },
  plugins: [react()],
});
