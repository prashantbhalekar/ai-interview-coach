import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto';
import {
  InterviewResultDto,
  InterviewSessionDetailDto,
  InterviewSessionSummaryDto,
  InterviewsService,
  SubmitInterviewAnswerResponseDto,
} from './interviews.service';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('sessions')
  createSession(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateInterviewSessionDto,
  ): Promise<InterviewSessionDetailDto> {
    return this.interviewsService.createSession(request.user.sub, dto);
  }

  @Get('sessions')
  listSessions(@Req() request: AuthenticatedRequest): Promise<InterviewSessionSummaryDto[]> {
    return this.interviewsService.listSessions(request.user.sub);
  }

  @Get('sessions/:id')
  getSession(
    @Req() request: AuthenticatedRequest,
    @Param('id') sessionId: string,
  ): Promise<InterviewSessionDetailDto> {
    return this.interviewsService.getSession(request.user.sub, sessionId);
  }

  @Post('sessions/:id/answers')
  submitAnswer(
    @Req() request: AuthenticatedRequest,
    @Param('id') sessionId: string,
    @Body() dto: SubmitInterviewAnswerDto,
  ): Promise<SubmitInterviewAnswerResponseDto> {
    return this.interviewsService.submitAnswer(request.user.sub, sessionId, dto);
  }

  @Get('sessions/:id/results')
  getSessionResults(
    @Req() request: AuthenticatedRequest,
    @Param('id') sessionId: string,
  ): Promise<InterviewResultDto> {
    return this.interviewsService.getSessionResults(request.user.sub, sessionId);
  }
}
