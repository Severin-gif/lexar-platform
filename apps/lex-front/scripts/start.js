// apps/lex-front/scripts/start.js
const { spawn } = require("node:child_process");

const portRaw = process.env.PORT;
const port = Number.isFinite(Number(portRaw)) && Number(portRaw) > 0 ? String(portRaw) : "3000";

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "start", "-p", port],
  { stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 1));
