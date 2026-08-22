import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

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

  let idCounter = 0;

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
  };

  beforeAll(async () => {
    users = [];
    idCounter = 0;

    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.FRONTEND_URL = 'http://localhost:3000';
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
    idCounter = 0;
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
});
