import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitInterviewAnswerDto {
  @IsOptional()
  @IsString()
  questionId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  answerText!: string;
}
