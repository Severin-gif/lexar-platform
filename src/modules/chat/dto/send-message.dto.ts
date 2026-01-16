import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  chatId?: string; // можно не передавать – создадим новый чат

  @IsString()
  @IsNotEmpty()
  content: string;
}
