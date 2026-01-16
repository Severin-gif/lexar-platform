// src/modules/chat/chat.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto, SendMessageDto } from './dto';
import { JwtGuard } from '../../common/jwt.guard';
import { Delete, Patch } from '@nestjs/common';
import { RenameChatDto } from './dto/renameChat.dto';
import { randomUUID } from 'crypto';


interface RequestWithUser extends Request {
  user?: {
    userId?: string;
    sub?: string;
    id?: string;
    [key: string]: any;
  };
}

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  private readonly logger = new Logger(ChatController.name);

  private getUserId(req: RequestWithUser): string {
    const u = req.user || ({} as any);
    const id = u.userId ?? u.sub ?? u.id;

    if (!id) {
      throw new Error('User id not found in request');
    }

    return String(id);
  }

  // GET /chat — список чатов пользователя
  @Get()
  list(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.chat.list(userId);
  }

  // POST /chat — создать чат вручную по title
  @Post()
  create(@Req() req: any, @Body() dto: CreateChatDto) {
    const userId = this.getUserId(req);
    return this.chat.createChat(userId, dto);
  }

  // GET /chat/:id/messages — сообщения указанного чата
  @Get(':id/messages')
  async messages(@Req() req: any, @Param('id') chatId: string) {
    const userId = this.getUserId(req);
    const requestId = randomUUID();
    const started = Date.now();

    try {
      const messages = await this.chat.listMessages(userId, chatId);

      this.logger.log(
        JSON.stringify({
          requestId,
          userId,
          chatId,
          method: req?.method,
          path: req?.url,
          statusCode: 200,
          latencyMs: Date.now() - started,
          messagesCount: messages.length,
          lastMessageId: messages.length
            ? messages[messages.length - 1].id
            : null,
        }),
      );

      return messages;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          requestId,
          userId,
          chatId,
          method: req?.method,
          path: req?.url,
          statusCode: error?.status ?? 500,
          latencyMs: Date.now() - started,
          error: error?.message ?? 'Unknown error',
        }),
      );

      throw error;
    }
  }

  // POST /chat/send — отправка сообщения (chatId? + content)
  @Post('send')
  async send(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.sendWithLogging(req, dto.chatId, dto);
  }

  // POST /chat/:id/messages — отправка сообщения в конкретный чат
  @Post(':id/messages')
  async sendToChat(
    @Req() req: any,
    @Param('id') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.sendWithLogging(req, chatId, dto);
  }

  private async sendWithLogging(req: any, chatId: string | undefined, dto: SendMessageDto) {
    const userId = this.getUserId(req);
    const requestId = randomUUID();
    const started = Date.now();

    try {
      const response = await this.chat.sendMessage(userId, {
        ...dto,
        chatId: dto.chatId ?? chatId,
      });

      this.logger.log(
        JSON.stringify({
          requestId,
          userId,
          chatId: response.chatId ?? chatId ?? dto.chatId ?? null,
          method: req?.method,
          path: req?.url,
          statusCode: 200,
          latencyMs: Date.now() - started,
          messageIds: response.messages?.map((m) => m.id) ?? [],
        }),
      );

      return response;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          requestId,
          userId,
          chatId: chatId ?? dto.chatId ?? null,
          method: req?.method,
          path: req?.url,
          statusCode: error?.status ?? 500,
          latencyMs: Date.now() - started,
          error: error?.message ?? 'Unknown error',
        }),
      );

      throw error;
    }
  }

  // PATCH /chat/:id — переименовать чат
  @Patch(':id')
  rename(@Req() req: any, @Param('id') chatId: string, @Body() dto: RenameChatDto) {
    const userId = this.getUserId(req);
    return this.chat.renameChat(userId, chatId, dto);
  }

  // DELETE /chat/:id — удалить чат
  @Delete(':id')
  remove(@Req() req: any, @Param('id') chatId: string) {
    const userId = this.getUserId(req);
    return this.chat.deleteChat(userId, chatId);
  }

}
