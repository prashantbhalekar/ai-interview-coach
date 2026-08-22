import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewSessionDto } from './dto/create-interview-session.dto';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto';

export interface InterviewSessionSummaryDto {
  id: string;
  title: string;
  focusArea: string | null;
  status: string;
  currentQuestionIndex: number;
  questionCount: number;
  answeredCount: number;
  overallScore: number | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface InterviewQuestionDto {
  id: string;
  order: number;
  text: string;
}

export interface InterviewAnswerDto {
  id: string;
  order: number;
  questionId: string;
  questionText: string;
  answerText: string;
  score: number;
  feedbackSummary: string;
  followUpQuestion: string;
  createdAt: Date;
}

export interface InterviewEvaluationDto {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  followUpPlan: string[];
  updatedAt: Date;
}

export interface InterviewSessionDetailDto {
  id: string;
  title: string;
  focusArea: string | null;
  status: string;
  currentQuestionIndex: number;
  currentQuestion: InterviewQuestionDto | null;
  questions: InterviewQuestionDto[];
  answers: InterviewAnswerDto[];
  evaluation: InterviewEvaluationDto | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmitInterviewAnswerResponseDto {
  sessionId: string;
  status: string;
  submittedAnswer: InterviewAnswerDto;
  nextQuestion: InterviewQuestionDto | null;
  evaluation: InterviewEvaluationDto;
}

export interface InterviewResultDto {
  sessionId: string;
  title: string;
  status: string;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  followUpPlan: string[];
  answers: InterviewAnswerDto[];
}

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    userId: string,
    dto: CreateInterviewSessionDto,
  ): Promise<InterviewSessionDetailDto> {
    const focusArea = dto.focusArea?.trim() || 'backend engineering';
    const title = dto.title?.trim() || `Interview Practice - ${focusArea}`;
    const questions = this.buildQuestionSet(focusArea);

    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        title,
        focusArea,
        status: 'ACTIVE',
        currentQuestionIndex: 0,
        questions: {
          create: questions.map((text, index) => ({
            text,
            order: index,
          })),
        },
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        evaluation: true,
      },
    });

    return this.toSessionDetailDto(session);
  }

  async listSessions(userId: string): Promise<InterviewSessionSummaryDto[]> {
    const sessions = await this.prisma.interviewSession.findMany({
      where: {
        userId,
      },
      include: {
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
        evaluation: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      title: session.title,
      focusArea: session.focusArea,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      questionCount: session._count.questions,
      answeredCount: session._count.answers,
      overallScore: session.evaluation?.overallScore ?? null,
      updatedAt: session.updatedAt,
      createdAt: session.createdAt,
    }));
  }

  async getSession(userId: string, sessionId: string): Promise<InterviewSessionDetailDto> {
    const session = await this.prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        evaluation: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    return this.toSessionDetailDto(session);
  }

  async submitAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitInterviewAnswerDto,
  ): Promise<SubmitInterviewAnswerResponseDto> {
    const session = await this.prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Interview session is already completed');
    }

    const currentQuestion = session.questions[session.currentQuestionIndex] ?? null;

    if (!currentQuestion) {
      throw new BadRequestException('No pending question in this session');
    }

    if (dto.questionId && dto.questionId !== currentQuestion.id) {
      throw new BadRequestException('Submitted answer does not match current question');
    }

    const score = this.scoreAnswer(dto.answerText);
    const feedbackSummary = this.buildFeedback(score);
    const followUpQuestion = this.buildFollowUpQuestion(score, currentQuestion.text);

    const createdAnswer = await this.prisma.interviewAnswer.create({
      data: {
        sessionId: session.id,
        questionId: currentQuestion.id,
        order: currentQuestion.order,
        answerText: dto.answerText,
        score,
        feedbackSummary,
        followUpQuestion,
      },
      include: {
        question: true,
      },
    });

    const nextQuestionIndex = session.currentQuestionIndex + 1;
    const isComplete = nextQuestionIndex >= session.questions.length;

    const updatedSession = await this.prisma.interviewSession.update({
      where: {
        id: session.id,
      },
      data: {
        currentQuestionIndex: nextQuestionIndex,
        status: isComplete ? 'COMPLETED' : 'ACTIVE',
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    const allAnswers = await this.prisma.interviewAnswer.findMany({
      where: {
        sessionId: session.id,
      },
      include: {
        question: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    const evaluationPayload = this.computeEvaluation(allAnswers);

    const evaluation = await this.prisma.interviewEvaluation.upsert({
      where: {
        sessionId: session.id,
      },
      update: {
        overallScore: evaluationPayload.overallScore,
        strengths: evaluationPayload.strengths,
        improvements: evaluationPayload.improvements,
        followUpPlan: evaluationPayload.followUpPlan,
      },
      create: {
        sessionId: session.id,
        overallScore: evaluationPayload.overallScore,
        strengths: evaluationPayload.strengths,
        improvements: evaluationPayload.improvements,
        followUpPlan: evaluationPayload.followUpPlan,
      },
    });

    const nextQuestion = updatedSession.questions[nextQuestionIndex] ?? null;

    return {
      sessionId: updatedSession.id,
      status: updatedSession.status,
      submittedAnswer: this.toAnswerDto(createdAnswer),
      nextQuestion: nextQuestion
        ? {
            id: nextQuestion.id,
            order: nextQuestion.order,
            text: nextQuestion.text,
          }
        : null,
      evaluation: {
        overallScore: evaluation.overallScore,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        followUpPlan: evaluation.followUpPlan,
        updatedAt: evaluation.updatedAt,
      },
    };
  }

  async getSessionResults(userId: string, sessionId: string): Promise<InterviewResultDto> {
    const session = await this.prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        answers: {
          include: {
            question: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        evaluation: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Interview session not found');
    }

    if (!session.evaluation) {
      throw new BadRequestException('Interview evaluation is not available yet');
    }

    return {
      sessionId: session.id,
      title: session.title,
      status: session.status,
      overallScore: session.evaluation.overallScore,
      strengths: session.evaluation.strengths,
      improvements: session.evaluation.improvements,
      followUpPlan: session.evaluation.followUpPlan,
      answers: session.answers.map((answer) => this.toAnswerDto(answer)),
    };
  }

  private buildQuestionSet(focusArea: string): string[] {
    return [
      `Describe a production incident related to ${focusArea} and how you resolved it.`,
      `How would you design a scalable architecture for ${focusArea} with reliability in mind?`,
      `What trade-offs do you consider when balancing delivery speed and quality in ${focusArea}?`,
      `How do you measure impact and define success metrics for ${focusArea} initiatives?`,
      `What would you improve first in an existing ${focusArea} codebase and why?`,
    ];
  }

  private scoreAnswer(answerText: string): number {
    const trimmed = answerText.trim();
    const lengthScore = Math.min(50, Math.floor(trimmed.length / 14));

    const keywords = ['trade-off', 'latency', 'scal', 'monitor', 'retry', 'idempot', 'metric'];
    const normalized = trimmed.toLowerCase();
    const keywordHits = keywords.filter((keyword) => normalized.includes(keyword)).length;
    const keywordScore = Math.min(35, keywordHits * 7);

    const structureScore = /\b(first|second|finally|because|therefore)\b/i.test(trimmed) ? 15 : 8;

    return Math.min(100, Math.max(35, lengthScore + keywordScore + structureScore));
  }

  private buildFeedback(score: number): string {
    if (score >= 85) {
      return 'Strong, structured answer with clear technical reasoning and practical trade-offs.';
    }

    if (score >= 70) {
      return 'Good answer with relevant technical points; add deeper metrics and risk framing.';
    }

    return 'Baseline answer detected; improve structure, measurable impact, and edge-case handling.';
  }

  private buildFollowUpQuestion(score: number, questionText: string): string {
    if (score >= 85) {
      return `Great. Can you now quantify the business impact of your approach to: ${questionText}`;
    }

    if (score >= 70) {
      return `Can you add a failure-mode analysis and rollback strategy for: ${questionText}`;
    }

    return `Can you restate your answer with a clearer architecture, concrete metrics, and risk controls for: ${questionText}`;
  }

  private computeEvaluation(
    answers: Array<{
      score: number;
      followUpQuestion: string;
    }>,
  ): {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    followUpPlan: string[];
  } {
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const overallScore = answers.length > 0 ? Math.round(totalScore / answers.length) : 0;

    const strengths =
      overallScore >= 80
        ? [
            'Communicates architecture decisions clearly',
            'Considers resilience and production reliability',
            'Provides practical trade-off rationale',
          ]
        : [
            'Shows baseline technical understanding',
            'Attempts to reason about implementation choices',
          ];

    const improvements =
      overallScore >= 80
        ? ['Add stronger business impact quantification', 'Practice concise executive summaries']
        : [
            'Improve answer structure using clear sections',
            'Include measurable metrics and outcomes',
            'Expand edge-case and failure-mode coverage',
          ];

    const followUpPlan = answers.slice(-3).map((answer) => answer.followUpQuestion);

    return {
      overallScore,
      strengths,
      improvements,
      followUpPlan,
    };
  }

  private toSessionDetailDto(session: {
    id: string;
    title: string;
    focusArea: string | null;
    status: string;
    currentQuestionIndex: number;
    questions: Array<{ id: string; order: number; text: string }>;
    answers: Array<{
      id: string;
      order: number;
      questionId: string;
      answerText: string;
      score: number;
      feedbackSummary: string;
      followUpQuestion: string;
      createdAt: Date;
      question: { text: string };
    }>;
    evaluation: {
      overallScore: number;
      strengths: string[];
      improvements: string[];
      followUpPlan: string[];
      updatedAt: Date;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  }): InterviewSessionDetailDto {
    const currentQuestion =
      session.status === 'ACTIVE'
        ? (session.questions[session.currentQuestionIndex] ?? null)
        : null;

    return {
      id: session.id,
      title: session.title,
      focusArea: session.focusArea,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            order: currentQuestion.order,
            text: currentQuestion.text,
          }
        : null,
      questions: session.questions.map((question) => ({
        id: question.id,
        order: question.order,
        text: question.text,
      })),
      answers: session.answers.map((answer) => this.toAnswerDto(answer)),
      evaluation: session.evaluation
        ? {
            overallScore: session.evaluation.overallScore,
            strengths: session.evaluation.strengths,
            improvements: session.evaluation.improvements,
            followUpPlan: session.evaluation.followUpPlan,
            updatedAt: session.evaluation.updatedAt,
          }
        : null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  private toAnswerDto(answer: {
    id: string;
    order: number;
    questionId: string;
    answerText: string;
    score: number;
    feedbackSummary: string;
    followUpQuestion: string;
    createdAt: Date;
    question: { text: string };
  }): InterviewAnswerDto {
    return {
      id: answer.id,
      order: answer.order,
      questionId: answer.questionId,
      questionText: answer.question.text,
      answerText: answer.answerText,
      score: answer.score,
      feedbackSummary: answer.feedbackSummary,
      followUpQuestion: answer.followUpQuestion,
      createdAt: answer.createdAt,
    };
  }
}
