/**
 * Простой postbuild: переименовываем server.js в server.cjs,
 * чтобы стартовый скрипт мог запускать CommonJS-версию.
 */
const { renameSync } = require("node:fs");
const { resolve } = require("node:path");

const distDir = resolve(process.cwd(), "dist-server");
const source = resolve(distDir, "server.js");
const target = resolve(distDir, "server.cjs");

try {
  renameSync(source, target);
  console.log("server.js -> server.cjs");
} catch (err) {
  console.error("postbuild failed", err);
  process.exitCode = 1;
}
