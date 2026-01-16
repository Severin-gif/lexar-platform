import { Module } from '@nestjs/common';
import { GuestChatController } from './guest-chat.controller';
import { GuestChatService } from './guest-chat.service';
import { LlmProvider } from '../llm/llm.provider';

@Module({
  controllers: [GuestChatController],
  providers: [GuestChatService, LlmProvider],
})
export class GuestChatModule {}
