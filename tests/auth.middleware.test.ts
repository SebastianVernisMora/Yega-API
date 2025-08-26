import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', 'test-secret');
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as (code?: number) => never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should call next if a valid token is provided', async () => {
    const { authMiddleware } = await import('../src/middlewares/auth');
    const req = {
      headers: {
        authorization: 'Bearer valid_token',
      },
    } as Request;
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    } as any;
    const next = vi.fn() as NextFunction;

    (jwt.verify as any).mockReturnValue({ sub: 'user1', role: 'client' });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 'user1', role: 'client' });
  });

  it('should return 401 if no token is provided', async () => {
    const { authMiddleware } = await import('../src/middlewares/auth');
    const req = {
      headers: {},
    } as Request;
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    } as any;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'AUTH_REQUIRED' }),
      })
    );
  });

  it('should return 401 if the token is invalid', async () => {
    const { authMiddleware } = await import('../src/middlewares/auth');
    const req = {
      headers: {
        authorization: 'Bearer invalid_token',
      },
    } as Request;
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(),
    } as any;
    const next = vi.fn() as NextFunction;

    (jwt.verify as any).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
      })
    );
  });

  it('should return 401 if the token payload is invalid', async () => {
    const { authMiddleware } = await import('../src/middlewares/auth');
    const req = {
        headers: {
            authorization: 'Bearer invalid_payload_token',
        },
    } as Request;
    const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
    } as any;
    const next = vi.fn() as NextFunction;

    (jwt.verify as any).mockReturnValue({ id: 'user1' }); // Missing role

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
            error: expect.objectContaining({ code: 'INVALID_TOKEN' }),
        })
    );
  });
});
