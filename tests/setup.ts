import type { Server } from "node:http"
import type { AddressInfo } from "node:net"
import { createServer } from "../src/server"

type GlobalWithServer = typeof globalThis & {
  __APP_SERVER__?: Server
  __APP_PORT__?: number
}

const globalWithServer = globalThis as GlobalWithServer

if (!globalWithServer.__APP_SERVER__) {
  const serverInstance = createServer(0)
  const address = serverInstance.address() as AddressInfo | null
  globalWithServer.__APP_SERVER__ = serverInstance
  globalWithServer.__APP_PORT__ = address?.port ?? 3000
  process.once("exit", () => {
    serverInstance.close()
  })
}

export const server = globalWithServer.__APP_SERVER__
