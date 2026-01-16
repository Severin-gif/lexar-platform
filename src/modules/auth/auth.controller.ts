import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtGuard } from '../../common/jwt.guard';

const AUTH_COOKIE_NAME = 'lexar_auth';
const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // сервис уже возвращает { access_token, ... } — это не трогаем
    const result = await this.auth.register(dto.email, dto.password, dto.name);

    if (result?.access_token) {
      this.setAuthCookie(res, result.access_token);
    }

    // старый контракт ответа сохраняем
    return result;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password);

    if (result?.access_token) {
      this.setAuthCookie(res, result.access_token);
    }

    return result;
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@Req() req: any) {
    const userId = req?.user?.userId ?? req?.user?.sub ?? req?.user?.id;
    if (!userId) {
      return {
        user: { id: null, email: null, plan: 'free', planLabel: 'FREE' },
      };
    }

    const user = await this.auth.me(String(userId));
    return { user };
  }

  // при необходимости можно вызвать из logout
  private clearAuthCookie(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    for (const name of [AUTH_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME]) {
      res.cookie(name, '', {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        domain: isProd ? '.lexai-chat.com' : undefined,
      });
    }
  }

  private setAuthCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';

    for (const name of [AUTH_COOKIE_NAME, ACCESS_TOKEN_COOKIE_NAME]) {
      res.cookie(name, token, {
        httpOnly: true,
        secure: isProd, // в проде только по https
        sameSite: 'lax',
        maxAge: AUTH_COOKIE_MAX_AGE * 1000,
        path: '/',
        domain: isProd ? '.lexai-chat.com' : undefined,
      });
    }
  }
}
