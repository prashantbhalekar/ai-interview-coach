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

  let idCounter = 0;
  let resumeIdCounter = 0;

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
    idCounter = 0;
    resumeIdCounter = 0;

    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.REDIS_URL = 'redis://localhost:6380';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/ai_interview_coach_test?schema=public';
    process.env.JWT_SECRET = 'test-secret-123';

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
    idCounter = 0;
    resumeIdCounter = 0;
    storageMock.upload.mockClear();
    resumeQueueMock.enqueueResumeProcessing.mockClear();
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
});
