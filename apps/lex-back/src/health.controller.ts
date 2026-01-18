import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return { ok: true, status: 'running' };
  }

  @Get('health')
  health() {
    return { ok: true, status: 'running' };
  }
}
