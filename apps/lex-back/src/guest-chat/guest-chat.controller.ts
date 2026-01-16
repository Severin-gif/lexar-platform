import { Controller, Post, Body } from '@nestjs/common';
import { GuestChatService } from './guest-chat.service';

@Controller('guest-chat')
export class GuestChatController {
  constructor(private readonly service: GuestChatService) {}

  @Post()
  async handleMessage(
    @Body('message') message: string,
    @Body('chatId') chatId?: string,
  ) {
    if (!message) {
      return { ok: false, error: 'Empty message' };
    }

    const reply = await this.service.processMessage(message);

    return {
      ok: true,
      reply,
      chatId: chatId ?? null,
    };
  }
}
