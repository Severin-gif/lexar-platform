// src/modules/chat/chat.service.ts
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmProvider } from '../../llm/llm.provider';
import { CreateChatDto, SendMessageDto } from './dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Message } from '@prisma/client';
import { TARIFF, Tariff } from '../../common/tariff';

// Сообщение для LLM и истории
type Msg = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmProvider,
  ) {}

  private readonly logger = new Logger(ChatService.name);

  /**
   * Список чатов пользователя, отсортированных по updatedAt DESC.
   */
  async list(userId: string) {
    return this.prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Создание чата по заголовку.
   */
  async createChat(userId: string, dto: CreateChatDto) {
    const title = dto.title?.trim() || 'Новый диалог';

    return this.prisma.chat.create({
      data: {
        userId,
        title,
      },
      include: {
        messages: true,
      },
    });
  }

  /**
   * Сообщения конкретного чата (проверяем принадлежность пользователю).
   */
  async listMessages(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new ForbiddenException('Chat not found or not owned by user');
    }

    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Отправка сообщения: при наличии chatId — в существующий чат,
   * иначе — создаём новый чат.
   *
   * DTO: { chatId?: string; content: string }
   * Ответ: { chatId, messages: Message[], assistantStatus }
   */
  async sendMessage(userId: string, dto: SendMessageDto) {
    const content = dto.content?.trim();
    if (!content) {
      throw new ForbiddenException('Content cannot be empty');
    }

    const dailyLimit = this.getDailyMessageLimit();
    if (dailyLimit !== null) {
      const tariff = await this.getUserTariff(userId);
      if (tariff !== TARIFF.VIP) {
        await this.assertDailyMessageLimit(userId, dailyLimit);
      }
    }

    let chatId: string;
    let chatTitle: string | null = null;

    if (dto.chatId) {
      // существующий чат
      const existing = await this.prisma.chat.findFirst({
        where: { id: dto.chatId, userId },
        select: { id: true, title: true },
      });

      if (!existing) {
        throw new ForbiddenException('Chat not found or not owned by user');
      }

      chatId = existing.id;
      chatTitle = existing.title;
    } else {
      // новый чат
      const created = await this.createChat(userId, {
        title: content.slice(0, 80),
      });
      chatId = created.id;
      chatTitle = created.title ?? null;
    }

    // сначала записываем user message, чтобы она была доступна сразу же
    const userMessage = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId,
          role: 'user',
          content,
        },
      });

      await tx.chat.update({
        where: { id: chatId },
        data: {
          updatedAt: new Date(),
          title: chatTitle || content.slice(0, 80),
        },
      });

      return message;
    });

    // история последних сообщений с учётом только что созданного user message
    const history = await this.buildHistory(chatId, 20);

    let assistantMessage: Message | null = null;

    try {
      const answer = await this.llm.ask(content, history);

      assistantMessage = await this.prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            chatId,
            role: 'assistant',
            content: answer,
          },
        });

        await tx.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });

        return message;
      });
    } catch (error) {
      this.logger.error(
        `LLM answer failed for chat ${chatId}: ${error?.message ?? error}`,
      );
    }

    const messages = await this.recentMessages(chatId, 50);

    return {
      chatId,
      messages,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage?.id ?? null,
      assistantStatus: assistantMessage ? 'completed' : 'pending',
    };
  }

  /**
   * История для LLM: до N последних сообщений чата в порядке создания.
   */
  private async buildHistory(chatId: string, limit = 20): Promise<Msg[]> {
    const msgs = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return msgs
      .reverse()
      .map((m) => ({
        role: m.role as Msg['role'],
        content: m.content,
      }));
  }

  private async recentMessages(chatId: string, limit = 50) {
    const msgs = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return msgs.reverse();
  }

  private getDailyMessageLimit(): number | null {
    const rawLimit = process.env.DAILY_MESSAGE_LIMIT;
    if (!rawLimit) {
      return null;
    }

    const parsed = Number(rawLimit);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private async getUserTariff(userId: string): Promise<Tariff> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    return this.normalizePlanToTariff(user?.plan);
  }

  private normalizePlanToTariff(plan?: string | null): Tariff {
    const normalized = (plan ?? 'free').toLowerCase();
    switch (normalized) {
      case 'vip':
        return TARIFF.VIP;
      case 'pro':
        return TARIFF.PRO;
      case 'free':
      default:
        return TARIFF.FREE;
    }
  }

  private async assertDailyMessageLimit(userId: string, limit: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const used = await this.prisma.message.count({
      where: {
        chat: { userId },
        createdAt: { gte: startOfDay },
      },
    });

    if (used >= limit) {
      throw new ForbiddenException('Daily message limit exceeded');
    }
  }
  async renameChat(userId: string, chatId: string, dto: { title: string }) {
    const title = (dto?.title ?? "").trim();
    if (!title) throw new BadRequestException("Title is required");

    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      select: { id: true },
    });

    if (!chat) throw new NotFoundException("Chat not found");

    return this.prisma.chat.update({
      where: { id: chatId },
      data: { title },
      select: { id: true, title: true },
    });
  }

  async deleteChat(userId: string, chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
      select: { id: true },
    });

    if (!chat) {
      throw new NotFoundException("Chat not found");
    }

    await this.prisma.$transaction([
      this.prisma.message.deleteMany({
        where: { chatId },
      }),
      this.prisma.chat.delete({
        where: { id: chatId },
      }),
    ]);

    return { ok: true };
  }
}
