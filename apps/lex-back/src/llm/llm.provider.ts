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
    this.apiKey = (
      this.cfg.get<string>('OPENROUTER_KEY') ??
      process.env.OPENROUTER_KEY ??
      ''
    ).trim();

    if (!this.apiKey) {
      throw new Error('OPENROUTER_KEY is not set');
    }

    // ✅ поддержка OPENROUTER_BASE_URL (как у тебя в .env) + обратная совместимость
    this.baseUrl = (
      this.cfg.get<string>('OPENROUTER_BASE_URL') ??
      process.env.OPENROUTER_BASE_URL ??
      this.cfg.get<string>('OPENROUTER_BASE') ??
      process.env.OPENROUTER_BASE ??
      'https://openrouter.ai/api/v1'
    ).trim();

    this.model = (
      this.cfg.get<string>('OPENROUTER_MODEL') ??
      process.env.OPENROUTER_MODEL ??
      'openai/gpt-4o-mini'
    ).trim();

    this.referer = (
      this.cfg.get<string>('OPENROUTER_REFERER') ??
      process.env.OPENROUTER_REFERER ??
      'http://localhost'
    ).trim();

    this.title = (
      this.cfg.get<string>('OPENROUTER_TITLE') ??
      process.env.OPENROUTER_TITLE ??
      'lexar-sandbox'
    ).trim();

    this.timeoutMs = Number(
      (this.cfg.get<string>('LLM_TIMEOUT_MS') ?? process.env.LLM_TIMEOUT_MS ?? '60000').trim(),
    );
  }

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
          Accept: 'application/json',
          // ✅ обязательные заголовки OpenRouter
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
      return data?.choices?.[0]?.message?.content ?? '[no content]';
    } finally {
      clearTimeout(timer);
    }
  }

  async reply(_chatId: number, content: string): Promise<string> {
    return this.ask(content);
  }
}
