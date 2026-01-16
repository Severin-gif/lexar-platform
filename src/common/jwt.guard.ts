// src/common/jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

const COOKIE_NAMES = ['lexar_auth', 'access_token'];

function extractToken(req: Request): string | null {
  // 1) Authorization: Bearer xxx
  const authHeader =
    (req.headers['authorization'] as string | undefined) ??
    (req.headers['Authorization'] as string | undefined);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim() || null;
  }

  // 2) куки
  if (req.cookies) {
    for (const name of COOKIE_NAMES) {
      if (req.cookies[name]) return req.cookies[name];
    }
  }

  return null;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();

    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedException('JWT token not found');
    }

    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET || 'JWT_SECRET',
      });

      // нормализуем user-объект, чтобы везде было одно и то же поле
      (req as any).user = {
        ...payload,
        userId: payload.sub ?? payload.userId ?? payload.id,
      };

      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}
