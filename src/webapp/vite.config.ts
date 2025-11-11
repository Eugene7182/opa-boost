import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "src/webapp",
  server: {
    port: 8080
  },
  build: {
    outDir: "../../dist/webapp",
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": "/src/webapp"
    }
  }
});
