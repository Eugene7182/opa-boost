import { describe, expect, it } from "vitest"

describe("health", () => {
  it("GET /health -> { ok: true }", async () => {
    const port = (globalThis as { __APP_PORT__?: number }).__APP_PORT__ ?? 3000
    const response = await fetch(`http://localhost:${port}/health`)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.ok).toBe(true)
  })
})
