import { Controller, Get, NotFoundException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Controller()
export class HealthController {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  @Get()
  root() {
    return { ok: true, status: 'running' };
  }

  @Get('health')
  health() {
    return { ok: true, status: 'running' };
  }

  @Get('routes')
  routes() {
    if (process.env.APP_ENV !== 'test') {
      throw new NotFoundException();
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const instance = httpAdapter?.getInstance?.();
    const router = instance?._router;
    const stack = Array.isArray(router?.stack) ? router.stack : [];

    const routes = stack
      .map((layer: any) => {
        if (!layer?.route?.path) return null;
        const methods = Object.keys(layer.route.methods ?? {})
          .filter((method) => layer.route.methods[method])
          .map((method) => method.toUpperCase())
          .sort();
        if (methods.length === 0) return null;
        return `${methods.join(',')} ${layer.route.path}`;
      })
      .filter(Boolean)
      .sort();

    return { ok: true, routes };
  }
}
