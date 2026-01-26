import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import "reflect-metadata";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const jwtSecret = requireEnv("JWT_SECRET");
  const corsRaw = requireEnv("CORS_ORIGIN");
  const portRaw = requireEnv("PORT");
  const port = Number(portRaw);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portRaw}`);
  }

  const corsOrigins = parseCorsOrigins(corsRaw);
  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGIN must contain at least one origin");
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.use(cookieParser());

  await app.listen(port, "0.0.0.0");

  console.log(`🚀 Backend running on http://0.0.0.0:${port}`);
  console.log(`✅ Env OK: DATABASE_URL=${databaseUrl ? "set" : "missing"}`);
  console.log(`✅ Env OK: JWT_SECRET=${jwtSecret ? "set" : "missing"}`);
}

bootstrap().catch((err) => {
  console.error("❌ Bootstrap failed:", err);
  process.exit(1);
});
