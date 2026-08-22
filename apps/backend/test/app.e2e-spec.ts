import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { ResumeQueueService } from '../src/resumes/resume-queue.service';
import { StorageService } from '../src/storage/storage.service';

describe('App (e2e)', () => {
  let app: INestApplication;
  let users: Array<{
    id: string;
    email: string;
    fullName: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  let resumes: Array<{
    id: string;
    userId: string;
    status: 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    storageBucket: string;
    storageUrl: string;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  let interviewSessions: Array<{
    id: string;
    userId: string;
    title: string;
    focusArea: string | null;
    status: 'ACTIVE' | 'COMPLETED';
    currentQuestionIndex: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  let interviewQuestions: Array<{
    id: string;
    sessionId: string;
    order: number;
    text: string;
    createdAt: Date;
  }>;
  let interviewAnswers: Array<{
    id: string;
    sessionId: string;
    questionId: string;
    order: number;
    answerText: string;
    score: number;
    feedbackSummary: string;
    followUpQuestion: string;
    createdAt: Date;
  }>;
  let interviewEvaluations: Array<{
    id: string;
    sessionId: string;
    overallScore: number;
    strengths: string[];
    improvements: string[];
    followUpPlan: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;

  let idCounter = 0;
  let resumeIdCounter = 0;
  let interviewSessionCounter = 0;
  let interviewQuestionCounter = 0;
  let interviewAnswerCounter = 0;
  let interviewEvaluationCounter = 0;

  function attachInterviewSession(session: {
    id: string;
    userId: string;
    title: string;
    focusArea: string | null;
    status: 'ACTIVE' | 'COMPLETED';
    currentQuestionIndex: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const questions = interviewQuestions
      .filter((entry) => entry.sessionId === session.id)
      .sort((a, b) => a.order - b.order);
    const answers = interviewAnswers
      .filter((entry) => entry.sessionId === session.id)
      .sort((a, b) => a.order - b.order)
      .map((answer) => {
        const question = questions.find((entry) => entry.id === answer.questionId);
        return {
          ...answer,
          question: {
            text: question?.text ?? 'Unknown question',
          },
        };
      });
    const evaluation = interviewEvaluations.find((entry) => entry.sessionId === session.id) ?? null;

    return {
      ...session,
      questions,
      answers,
      evaluation,
    };
  }

  const prismaMock = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(
        async ({ where }: { where: { email?: string; id?: string } }) =>
          users.find((user) => user.email === where.email || user.id === where.id) ?? null,
      ),
      create: jest.fn(
        async ({
          data,
        }: {
          data: {
            email: string;
            fullName: string;
            passwordHash: string;
          };
        }) => {
          idCounter += 1;
          const now = new Date();

          const user = {
            id: `user-${idCounter}`,
            email: data.email,
            fullName: data.fullName,
            passwordHash: data.passwordHash,
            createdAt: now,
            updatedAt: now,
          };

          users.push(user);
          return user;
        },
      ),
    },
    resume: {
      create: jest.fn(
        async ({
          data,
        }: {
          data: {
            userId: string;
            status: 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            storageKey: string;
            storageBucket: string;
            storageUrl: string;
          };
        }) => {
          resumeIdCounter += 1;
          const now = new Date();
          const resume = {
            id: `resume-${resumeIdCounter}`,
            userId: data.userId,
            status: data.status,
            fileName: data.fileName,
            mimeType: data.mimeType,
            sizeBytes: data.sizeBytes,
            storageKey: data.storageKey,
            storageBucket: data.storageBucket,
            storageUrl: data.storageUrl,
            failureReason: null,
            createdAt: now,
            updatedAt: now,
          };

          resumes.push(resume);
          return resume;
        },
      ),
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; userId: string } }) =>
          resumes.find((resume) => resume.id === where.id && resume.userId === where.userId) ??
          null,
      ),
      update: jest.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { status: 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' };
        }) => {
          const resume = resumes.find((entry) => entry.id === where.id);

          if (!resume) {
            throw new Error('Resume not found for update');
          }

          resume.status = data.status;
          resume.updatedAt = new Date();
          return resume;
        },
      ),
    },
    interviewSession: {
      create: jest.fn(async ({ data, include }: { data: any; include?: any }) => {
        interviewSessionCounter += 1;
        const now = new Date();

        const session = {
          id: `interview-session-${interviewSessionCounter}`,
          userId: data.userId,
          title: data.title,
          focusArea: data.focusArea ?? null,
          status: data.status,
          currentQuestionIndex: data.currentQuestionIndex,
          createdAt: now,
          updatedAt: now,
        };

        interviewSessions.push(session);

        const createdQuestions = (data.questions?.create ?? []) as Array<{
          order: number;
          text: string;
        }>;
        for (const questionData of createdQuestions) {
          interviewQuestionCounter += 1;
          interviewQuestions.push({
            id: `interview-question-${interviewQuestionCounter}`,
            sessionId: session.id,
            order: questionData.order,
            text: questionData.text,
            createdAt: now,
          });
        }

        if (!include) {
          return session;
        }

        return attachInterviewSession(session);
      }),
      findMany: jest.fn(async ({ where }: { where: { userId: string } }) => {
        return interviewSessions
          .filter((session) => session.userId === where.userId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .map((session) => {
            const questionCount = interviewQuestions.filter(
              (question) => question.sessionId === session.id,
            ).length;
            const answerCount = interviewAnswers.filter(
              (answer) => answer.sessionId === session.id,
            ).length;
            const evaluation =
              interviewEvaluations.find((entry) => entry.sessionId === session.id) ?? null;

            return {
              ...session,
              _count: {
                questions: questionCount,
                answers: answerCount,
              },
              evaluation,
            };
          });
      }),
      findFirst: jest.fn(async ({ where }: { where: { id: string; userId: string } }) => {
        const session =
          interviewSessions.find(
            (entry) => entry.id === where.id && entry.userId === where.userId,
          ) ?? null;

        if (!session) {
          return null;
        }

        return attachInterviewSession(session);
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
        const session = interviewSessions.find((entry) => entry.id === where.id);

        if (!session) {
          throw new Error('Interview session not found for update');
        }

        session.currentQuestionIndex = data.currentQuestionIndex;
        session.status = data.status;
        session.updatedAt = new Date();

        return attachInterviewSession(session);
      }),
    },
    interviewAnswer: {
      create: jest.fn(async ({ data }: { data: any }) => {
        interviewAnswerCounter += 1;
        const createdAt = new Date();

        const answer = {
          id: `interview-answer-${interviewAnswerCounter}`,
          sessionId: data.sessionId,
          questionId: data.questionId,
          order: data.order,
          answerText: data.answerText,
          score: data.score,
          feedbackSummary: data.feedbackSummary,
          followUpQuestion: data.followUpQuestion,
          createdAt,
        };

        interviewAnswers.push(answer);

        const question = interviewQuestions.find((entry) => entry.id === data.questionId);
        return {
          ...answer,
          question: {
            text: question?.text ?? 'Unknown question',
          },
        };
      }),
      findMany: jest.fn(async ({ where }: { where: { sessionId: string } }) => {
        const questions = interviewQuestions.filter((entry) => entry.sessionId === where.sessionId);
        return interviewAnswers
          .filter((entry) => entry.sessionId === where.sessionId)
          .sort((a, b) => a.order - b.order)
          .map((answer) => ({
            ...answer,
            question: {
              text:
                questions.find((entry) => entry.id === answer.questionId)?.text ??
                'Unknown question',
            },
          }));
      }),
    },
    interviewEvaluation: {
      upsert: jest.fn(
        async ({
          where,
          update,
          create,
        }: {
          where: { sessionId: string };
          update: any;
          create: any;
        }) => {
          const existing = interviewEvaluations.find(
            (entry) => entry.sessionId === where.sessionId,
          );
          const now = new Date();

          if (existing) {
            existing.overallScore = update.overallScore;
            existing.strengths = update.strengths;
            existing.improvements = update.improvements;
            existing.followUpPlan = update.followUpPlan;
            existing.updatedAt = now;
            return existing;
          }

          interviewEvaluationCounter += 1;
          const entry = {
            id: `interview-evaluation-${interviewEvaluationCounter}`,
            sessionId: create.sessionId,
            overallScore: create.overallScore,
            strengths: create.strengths,
            improvements: create.improvements,
            followUpPlan: create.followUpPlan,
            createdAt: now,
            updatedAt: now,
          };

          interviewEvaluations.push(entry);
          return entry;
        },
      ),
    },
  };

  const storageMock = {
    upload: jest.fn(async ({ key, body }: { key: string; body: Buffer }) => ({
      key,
      bucket: 'test-bucket',
      url: `r2://test-bucket/${key}`,
      sizeBytes: body.byteLength,
    })),
  };

  const resumeQueueMock = {
    enqueueResumeProcessing: jest.fn(
      async ({ resumeId }: { resumeId: string; userId: string; storageKey: string }) =>
        `job-${resumeId}`,
    ),
  };

  beforeAll(async () => {
    users = [];
    resumes = [];
    interviewSessions = [];
    interviewQuestions = [];
    interviewAnswers = [];
    interviewEvaluations = [];
    idCounter = 0;
    resumeIdCounter = 0;
    interviewSessionCounter = 0;
    interviewQuestionCounter = 0;
    interviewAnswerCounter = 0;
    interviewEvaluationCounter = 0;

    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.REDIS_URL = 'redis://localhost:6380';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/ai_interview_coach_test?schema=public';
    process.env.JWT_SECRET = 'test-secret-123';
    process.env.AI_PROVIDER = 'ollama';

    const { AppModule } = require('../src/app.module') as {
      AppModule: new (...args: never[]) => unknown;
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(StorageService)
      .useValue(storageMock)
      .overrideProvider(ResumeQueueService)
      .useValue(resumeQueueMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  beforeEach(() => {
    users = [];
    resumes = [];
    interviewSessions = [];
    interviewQuestions = [];
    interviewAnswers = [];
    interviewEvaluations = [];
    idCounter = 0;
    resumeIdCounter = 0;
    interviewSessionCounter = 0;
    interviewQuestionCounter = 0;
    interviewAnswerCounter = 0;
    interviewEvaluationCounter = 0;
    storageMock.upload.mockClear();
    resumeQueueMock.enqueueResumeProcessing.mockClear();
    prismaMock.interviewSession.create.mockClear();
    prismaMock.interviewSession.findMany.mockClear();
    prismaMock.interviewSession.findFirst.mockClear();
    prismaMock.interviewSession.update.mockClear();
    prismaMock.interviewAnswer.create.mockClear();
    prismaMock.interviewAnswer.findMany.mockClear();
    prismaMock.interviewEvaluation.upsert.mockClear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/v1/health (GET) returns healthy payload', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body).toMatchObject({
      success: true,
      status: 'ok',
      service: 'backend',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('/api/v1/users/me (GET) rejects unauthenticated requests', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: 'Unauthorized',
    });
    expect(response.body.path).toBe('/api/v1/users/me');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('/api/v1/auth/login (POST) rejects invalid payloads with validation errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({})
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
    });
    expect(Array.isArray(response.body.message)).toBe(true);
  });

  it('/api/v1/auth/register and /api/v1/auth/login return JWT and allow /users/me', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Demo User',
        email: 'demo@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    expect(registerResponse.body.user).toMatchObject({
      fullName: 'Demo User',
      email: 'demo@interviewcoach.dev',
    });
    expect(typeof registerResponse.body.accessToken).toBe('string');

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'demo@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    expect(loginResponse.body.user).toMatchObject({
      fullName: 'Demo User',
      email: 'demo@interviewcoach.dev',
    });
    expect(typeof loginResponse.body.accessToken).toBe('string');

    const meResponse = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body).toMatchObject({
      fullName: 'Demo User',
      email: 'demo@interviewcoach.dev',
    });
  });

  it('/api/v1/auth/register (POST) rejects duplicate email', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      fullName: 'Demo User',
      email: 'duplicate@interviewcoach.dev',
      password: 'Password@123',
    });

    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Another User',
        email: 'duplicate@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(409);

    expect(duplicateResponse.body).toMatchObject({
      success: false,
      statusCode: 409,
      message: 'Email is already registered',
    });
  });

  it('/api/v1/resumes/upload (POST) queues resume and returns accepted status', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Resume User',
        email: 'resume@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    const uploadResponse = await request(app.getHttpServer())
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .attach('file', Buffer.from('%PDF-1.4 test resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(202);

    expect(uploadResponse.body).toMatchObject({
      status: 'QUEUED',
      fileName: 'resume.pdf',
      queueJobId: uploadResponse.body.queueJobId,
    });
    expect(typeof uploadResponse.body.resumeId).toBe('string');
    expect(typeof uploadResponse.body.queueJobId).toBe('string');
    expect(storageMock.upload).toHaveBeenCalledTimes(1);
    expect(resumeQueueMock.enqueueResumeProcessing).toHaveBeenCalledTimes(1);
  });

  it('/api/v1/resumes/upload (POST) rejects non-PDF files', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Resume User',
        email: 'resume-invalid@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    const uploadResponse = await request(app.getHttpServer())
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .attach('file', Buffer.from('plain text'), {
        filename: 'resume.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(uploadResponse.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: 'Only PDF files are accepted',
    });
  });

  it('/api/v1/resumes/:id/status (GET) returns status for owner only', async () => {
    const ownerRegisterResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Owner',
        email: 'owner@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    const viewerRegisterResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Viewer',
        email: 'viewer@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    const uploadResponse = await request(app.getHttpServer())
      .post('/api/v1/resumes/upload')
      .set('Authorization', `Bearer ${ownerRegisterResponse.body.accessToken}`)
      .attach('file', Buffer.from('%PDF-1.4 owner resume'), {
        filename: 'owner-resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(202);

    const statusResponse = await request(app.getHttpServer())
      .get(`/api/v1/resumes/${uploadResponse.body.resumeId}/status`)
      .set('Authorization', `Bearer ${ownerRegisterResponse.body.accessToken}`)
      .expect(200);

    expect(statusResponse.body).toMatchObject({
      id: uploadResponse.body.resumeId,
      fileName: 'owner-resume.pdf',
      status: 'QUEUED',
    });

    await request(app.getHttpServer())
      .get(`/api/v1/resumes/${uploadResponse.body.resumeId}/status`)
      .set('Authorization', `Bearer ${viewerRegisterResponse.body.accessToken}`)
      .expect(404);
  });

  it('/api/v1/interviews/sessions lifecycle supports Q&A, evaluation, and results', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Interview User',
        email: 'interview-user@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    const token = registerResponse.body.accessToken as string;

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/interviews/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        focusArea: 'backend reliability',
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      id: createResponse.body.id,
      status: 'ACTIVE',
      currentQuestionIndex: 0,
    });
    expect(Array.isArray(createResponse.body.questions)).toBe(true);
    expect(createResponse.body.questions.length).toBeGreaterThan(0);

    const sessionId = createResponse.body.id as string;
    const currentQuestion = createResponse.body.currentQuestion as { id: string };

    const answerResponse = await request(app.getHttpServer())
      .post(`/api/v1/interviews/sessions/${sessionId}/answers`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionId: currentQuestion.id,
        answerText:
          'First, I map failure modes. Second, I define retries and idempotency boundaries. Finally, I track latency and error-rate metrics with rollback controls.',
      })
      .expect(201);

    expect(answerResponse.body).toMatchObject({
      sessionId,
      status: 'ACTIVE',
      submittedAnswer: {
        questionId: currentQuestion.id,
      },
    });
    expect(typeof answerResponse.body.submittedAnswer.score).toBe('number');

    const sessionResponse = await request(app.getHttpServer())
      .get(`/api/v1/interviews/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(sessionResponse.body).toMatchObject({
      id: sessionId,
      status: 'ACTIVE',
      currentQuestionIndex: 1,
    });
    expect(sessionResponse.body.answers).toHaveLength(1);

    const resultsResponse = await request(app.getHttpServer())
      .get(`/api/v1/interviews/sessions/${sessionId}/results`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resultsResponse.body).toMatchObject({
      sessionId,
      status: 'ACTIVE',
    });
    expect(typeof resultsResponse.body.overallScore).toBe('number');
    expect(Array.isArray(resultsResponse.body.strengths)).toBe(true);
    expect(Array.isArray(resultsResponse.body.improvements)).toBe(true);
    expect(Array.isArray(resultsResponse.body.followUpPlan)).toBe(true);

    const historyResponse = await request(app.getHttpServer())
      .get('/api/v1/interviews/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(historyResponse.body)).toBe(true);
    expect(historyResponse.body).toHaveLength(1);
    expect(historyResponse.body[0]).toMatchObject({
      id: sessionId,
      answeredCount: 1,
    });
  });

  it('/api/v1/interviews/sessions/:id enforces ownership for history and results', async () => {
    const ownerRegisterResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Interview Owner',
        email: 'interview-owner@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    const viewerRegisterResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Interview Viewer',
        email: 'interview-viewer@interviewcoach.dev',
        password: 'Password@123',
      })
      .expect(201);

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/interviews/sessions')
      .set('Authorization', `Bearer ${ownerRegisterResponse.body.accessToken}`)
      .send({
        focusArea: 'distributed systems',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/interviews/sessions/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${viewerRegisterResponse.body.accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/api/v1/interviews/sessions/${createResponse.body.id}/results`)
      .set('Authorization', `Bearer ${viewerRegisterResponse.body.accessToken}`)
      .expect(404);
  });
});
