/* eslint-disable no-console */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parsePort(raw, fallback) {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return parsed;
}

function resolveNextBin() {
  const local = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  if (fs.existsSync(local)) return local;

  const root = path.join(__dirname, "..", "..", "..", "node_modules", "next", "dist", "bin", "next");
  if (fs.existsSync(root)) return root;

  const alt = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  if (fs.existsSync(alt)) return alt;

  throw new Error(
    "Cannot find Next.js CLI. Expected next/dist/bin/next in app or repo node_modules."
  );
}

requireEnv("NEXT_PUBLIC_API_URL");
const port = parsePort(process.env.PORT, 3000);
const nextBin = resolveNextBin();

const child = spawn(
  process.execPath,
  [nextBin, "start", "-p", String(port)],
  { stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error("Failed to start Next:", err);
  process.exit(1);
});
