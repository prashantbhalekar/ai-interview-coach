import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInterviewSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  focusArea?: string;
}
