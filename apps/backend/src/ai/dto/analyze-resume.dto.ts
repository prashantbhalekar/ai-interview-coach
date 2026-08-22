import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AnalyzeResumeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60_000)
  resumeText!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30_000)
  jobDescription!: string;
}
