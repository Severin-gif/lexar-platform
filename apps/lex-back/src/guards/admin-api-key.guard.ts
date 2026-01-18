import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerValue = request.headers['x-api-key'];
    const providedKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const expectedKey = process.env.ADMIN_API_KEY;

    if (!expectedKey || !providedKey || providedKey !== expectedKey) {
      throw new HttpException({ error: 'Unauthorized' }, HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
