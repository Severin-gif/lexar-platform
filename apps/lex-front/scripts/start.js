/* eslint-disable no-console */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function resolveNextBin() {
  // 1) локальный node_modules приложения
  const local = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  if (fs.existsSync(local)) return local;

  // 2) корневой node_modules монорепы (на случай hoist)
  const root = path.join(__dirname, "..", "..", "..", "node_modules", "next", "dist", "bin", "next");
  if (fs.existsSync(root)) return root;

  // 3) fallback: попытка относительного пути (если структура иная)
  const alt = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  if (fs.existsSync(alt)) return alt;

  throw new Error(
    "Cannot find Next.js CLI. Expected next/dist/bin/next in app or repo node_modules."
  );
}

const port = Number(process.env.PORT) || 3001;
const host = process.env.HOST || "0.0.0.0";
const nextBin = resolveNextBin();

// Запускаем next через node, чтобы не зависеть от .bin/командной строки и не ловить spawn EINVAL на Windows.
const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", host, "-p", String(port)],
  { stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error("Failed to start Next:", err);
  process.exit(1);
});
