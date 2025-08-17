import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

let prismaMock: any;
vi.mock('@prisma/client', () => {
  prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => prismaMock) };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed')),
    compare: vi.fn(() => Promise.resolve(true)),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'token'),
  },
  sign: vi.fn(() => 'token'),
}));

describe('Auth routes', () => {
  let app: express.Express;
  let authRouter: any;

  beforeEach(async () => {
    vi.stubEnv('JWT_SECRET', 'test-secret');
    app = express();
    app.use(express.json());
    authRouter = (await import('../src/routes/auth.js')).default;
    app.use('/auth', authRouter);

    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registers a new user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: '1',
      name: 'Test',
      email: 'test@example.com',
      role: 'customer',
      password: 'hashed',
    });

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'pw', role: 'customer' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token', 'token');
    expect(res.body.user).toMatchObject({ name: 'Test', email: 'test@example.com', role: 'customer' });
  });

  it('fails to register with missing fields', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in an existing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: '1',
      name: 'Test',
      email: 'test@example.com',
      role: 'customer',
      password: 'hashed',
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'pw' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'token');
  });

  it('fails login with invalid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'pw' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });
});

