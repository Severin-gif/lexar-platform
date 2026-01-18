import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "https://lexai-chat.com",
      "https://www.lexai-chat.com",
      "https://admin.lexai-chat.com",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
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

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, "0.0.0.0");

  console.log(`🚀 Backend running on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error("❌ Bootstrap failed:", err);
  process.exit(1);
});
