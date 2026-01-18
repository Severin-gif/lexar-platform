import { createServer } from "http";
import next from "next";

// dev-режим для локального запуска, в Docker будет production
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Порт и хост берём из окружения, с дефолтами
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
});
