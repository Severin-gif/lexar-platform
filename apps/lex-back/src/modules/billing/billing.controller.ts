import { Controller, Get } from '@nestjs/common';

@Controller('billing')
export class BillingController {
  @Get('plans')
  listPlans() {
    // TODO: move plans to DB when admin panel is ready.
    return {
      ok: true,
      plans: [
        {
          code: 'free',
          title: 'FREE',
          price: 0,
          features: ['Базовый доступ к чату'],
          isPublic: true,
        },
        {
          code: 'vip',
          title: 'VIP',
          price: 0,
          features: ['Приоритетная поддержка', 'Безлимитные сообщения'],
          isPublic: true,
        },
        {
          code: 'pro',
          title: 'PRO',
          price: 990,
          features: ['Расширенные лимиты', 'Доступ к новым функциям'],
          isPublic: false,
        },
      ],
    };
  }
}
