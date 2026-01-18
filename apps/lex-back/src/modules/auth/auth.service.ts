import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}

  private normEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Регистрация: создаём пользователя и сразу выдаём токен */
  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<{ access_token: string }> {
    const emailNorm = this.normEmail(email);
    const hash = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: emailNorm,
          // если в схеме поле называется иначе (password, pass и т.п.) — поправь здесь
          passwordHash: hash,
          name: name ?? null,
        },
        select: { id: true, email: true },
      });

      return this.sign(user.id, user.email);
    } catch (e: any) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw e;
    }
  }

  /** Логин: проверяем пароль и выдаём токен */
  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const emailNorm = this.normEmail(email);

    const user = await this.prisma.user.findUnique({
      where: { email: emailNorm },
      // поле пароля см. комментарий выше
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.sign(user.id, user.email);
  }

  /** Выдача JWT-токена */
  private sign(userId: string, email: string): { access_token: string } {
    const payload: JwtPayload = { sub: userId, email };

    const secret = this.cfg.get<string>('JWT_SECRET') ?? 'JWT_SECRET';
    const expiresIn = this.cfg.get<string>('JWT_EXPIRES') ?? '7d';

    // через обычный sign — меньше проблем с типами
    const token = this.jwt.sign(payload as any, {
      secret,
      expiresIn: expiresIn as any,
    } as any);

    return { access_token: token };
  }

  async me(
    userId: string,
  ): Promise<{
    id: string;
    email: string;
    plan: string;
    planLabel: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, plan: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const normalizedPlan = this.normalizePlan(user.plan);

    return {
      id: user.id,
      email: user.email,
      plan: normalizedPlan.plan,
      planLabel: normalizedPlan.planLabel,
    };
  }

  private normalizePlan(rawPlan?: string | null): {
    plan: 'free' | 'vip' | 'pro';
    planLabel: 'FREE' | 'VIP' | 'PRO';
  } {
    const plan = (rawPlan ?? 'free').toLowerCase();
    switch (plan) {
      case 'vip':
        return { plan: 'vip', planLabel: 'VIP' };
      case 'pro':
        return { plan: 'pro', planLabel: 'PRO' };
      case 'free':
      default:
        return { plan: 'free', planLabel: 'FREE' };
    }
  }
}
