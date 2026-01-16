// src/llm/llm.provider.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

@Injectable()
export class LlmProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly referer: string;
  private readonly title: string;
  private readonly timeoutMs: number;

  constructor(private readonly cfg: ConfigService) {
    this.apiKey =
      this.cfg.get<string>('OPENROUTER_KEY') ??
      process.env.OPENROUTER_KEY ??
      '';

    if (!this.apiKey) {
      throw new Error('OPENROUTER_KEY is not set');
    }

    this.baseUrl =
      this.cfg.get<string>('OPENROUTER_BASE') ??
      process.env.OPENROUTER_BASE ??
      'https://openrouter.ai/api/v1';

    this.model =
      this.cfg.get<string>('OPENROUTER_MODEL') ??
      process.env.OPENROUTER_MODEL ??
      'openai/gpt-4o-mini';

    this.referer =
      this.cfg.get<string>('OPENROUTER_REFERER') ??
      process.env.OPENROUTER_REFERER ??
      'https://lexai-chat.com';

    this.title =
      this.cfg.get<string>('OPENROUTER_TITLE') ??
      process.env.OPENROUTER_TITLE ??
      'Lexar.Chat';

    this.timeoutMs = Number(
      this.cfg.get<string>('LLM_TIMEOUT_MS') ??
        process.env.LLM_TIMEOUT_MS ??
        '60000',
    );
  }

  // ВАЖНО: возвращаем именно string — под это написан GuestChatService
  async ask(message: string, history: Msg[] = []): Promise<string> {
    const messages: Msg[] = [...history, { role: 'user', content: message }];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const resp = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.referer,
          'X-Title': this.title,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`LLM API error: ${resp.status} ${text}`);
      }

      const data = await resp.json();
      const content: string =
        data?.choices?.[0]?.message?.content ?? '[no content]';

      return content;
    } finally {
      clearTimeout(timer);
    }
  }
    async reply(_chatId: number, content: string): Promise<string> {
    return this.ask(content);
  }
}