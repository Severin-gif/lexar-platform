import { Injectable } from '@nestjs/common';
import { LlmProvider } from '../llm/llm.provider'; // этот файл у тебя уже есть

@Injectable()
export class GuestChatService {
  constructor(private readonly llm: LlmProvider) {}

  async processMessage(message: string): Promise<string> {
    const answer = await this.llm.ask(message);
    return answer;
  }
}
