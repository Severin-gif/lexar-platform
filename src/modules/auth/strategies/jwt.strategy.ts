// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
}

const COOKIE_NAMES = ['lexar_auth', 'access_token'];

function cookieExtractor(req: Request): string | null {
  if (!req.cookies) return null;
  for (const name of COOKIE_NAMES) {
    if (req.cookies[name]) return req.cookies[name];
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'JWT_SECRET',
    });
  }

  async validate(payload: JwtPayload) {
    // что положили в токен в AuthService.sign — то и вернем
    return { userId: payload.sub, email: payload.email };
  }
}
