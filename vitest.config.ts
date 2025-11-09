import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    setupFiles: ["tests/setup.ts"],
    environment: "node",
    globals: false,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  }
})
