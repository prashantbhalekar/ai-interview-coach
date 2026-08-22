import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AnalyzeResumeDto } from './dto/analyze-resume.dto';
import type { ResumeAnalysisResult } from './schemas/resume-analysis.schema';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

interface AnalyzeResumeResponseDto {
  provider: string;
  model: string;
  result: ResumeAnalysisResult;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('resume-analysis')
  @UseGuards(JwtAuthGuard)
  async analyzeResume(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AnalyzeResumeDto,
  ): Promise<AnalyzeResumeResponseDto> {
    return this.aiService.analyzeResume({
      userId: request.user.sub,
      resumeText: dto.resumeText,
      jobDescription: dto.jobDescription,
    });
  }
}
