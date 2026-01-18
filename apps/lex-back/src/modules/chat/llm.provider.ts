import { Injectable } from "@nestjs/common";
type Msg = { role: "user" | "assistant" | "system"; content: string };
@Injectable()
export class LlmProvider {
  async complete(messages: Msg[]): Promise<{ content: string; tokensIn?: number; tokensOut?: number }> {
    const last = messages[messages.length - 1];
    return { content: `Echo: ${last.content}`, tokensIn: 0, tokensOut: 0 };
  }
}
