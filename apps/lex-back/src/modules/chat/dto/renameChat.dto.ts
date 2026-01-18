import { IsString, MinLength } from "class-validator";

export class RenameChatDto {
  @IsString()
  @MinLength(1)
  title!: string;
}
