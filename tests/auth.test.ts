import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAuthRouter } from '../src/routes/auth';
import { createPrismaMock } from './helpers/prisma';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

vi.mock('bcryptjs');

describe('Auth routes', () => {
  let app: express.Express;
  let prismaMock: PrismaClient;

  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret');
    vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret');
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);

    prismaMock = createPrismaMock();
    app = express();
    app.use(express.json());
    app.use('/auth', createAuthRouter(prismaMock));
  });

  it('registers a new user', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('hashed_password');
    (prismaMock.user.create as any).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'client',
      password: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'client',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('does not register existing user', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      name: 'Existing User',
      email: 'test@example.com',
      role: 'client',
      password: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Another User',
        email: 'test@example.com',
        password: 'password123',
        role: 'client',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('logs in a user with valid credentials', async () => {
    const user = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'client',
      password: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prismaMock.user.findUnique as any).mockResolvedValue(user);
    (bcrypt.compare as any).mockResolvedValue(true);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('does not log in with invalid credentials', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrong_password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });

  it('refreshes a token', async () => {
    const user = {
      id: 'user-1',
      refreshToken: 'hashed_refresh_token',
    };
    (prismaMock.user.findUnique as any).mockResolvedValue(user);
    (bcrypt.compare as any).mockResolvedValue(true);
    (prismaMock.user.update as any).mockResolvedValue({});

    // First, log in to get a refresh token
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const { refreshToken } = loginRes.body;

    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('does not refresh with an invalid token', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid_token' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});
