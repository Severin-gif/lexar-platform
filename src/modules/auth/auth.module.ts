import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // грузим .env один раз на все приложение
    ConfigModule.forRoot({ isGlobal: true }),

    // регистрируем passport с jwt по умолчанию
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JwtModule нужен только чтобы получить JwtService,
    // секрет и срок жизни мы передаем в auth.service вручную
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
