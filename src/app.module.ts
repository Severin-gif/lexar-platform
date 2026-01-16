import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { SignOptions } from 'jsonwebtoken';

import { AuthModule } from './modules/auth/auth.module';
import { GuestChatModule } from './guest-chat/guest-chat.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminController } from './modules/admin/admin.controller';

import { ChatController } from './modules/chat/chat.controller';
import { ChatService } from './modules/chat/chat.service';
import { ChatGateway } from './modules/gateway/gateway';
import { PrismaService } from './prisma/prisma.service';
import { LlmProvider } from './llm/llm.provider';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // глобальная конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // JWT конфиг через env
// JWT конфиг через env
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (cfg: ConfigService): JwtModuleOptions => {
    const secret = cfg.get<string>('JWT_SECRET') || 'JWT_SECRET';

    const expiresEnv = cfg.get<string>('JWT_EXPIRES'); // например "7d" или "3600"
    const expiresIn: SignOptions['expiresIn'] =
      (expiresEnv as any) || '7d';

    return {
      secret,
      signOptions: {
        expiresIn,
      },
    };
  },
}),


    // Авторизация и гостевой чат
    AuthModule,
    BillingModule,
    GuestChatModule,
  ],
  // здесь добавили HealthController
  controllers: [ChatController, HealthController, AdminController],
  providers: [ChatService, ChatGateway, PrismaService, LlmProvider],
})
export class AppModule {}
