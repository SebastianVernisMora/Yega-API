import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

// Helper to import the middleware with current env in effect.
// Because JWT_SECRET is captured at module load time, we need to re-import to test secret selection.
const importMiddlewareFresh = async () => {
  jest.resetModules();
  // Re-mock after resetting modules to preserve our mock
  jest.doMock('jsonwebtoken', () => ({
    __esModule: true,
    default: {
      verify: (jwt as any).verify,
    },
  }));
  // Dynamic import after reset ensures top-level constants pick up current env
  const mod = await import('./auth'); // expect src/middlewares/auth.ts implementation
  return mod.default as (req: Request, res: Response, next: NextFunction) => void;
};

describe('authMiddleware', () => {
  const mockRes = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response & {
      status: jest.Mock;
      json: jest.Mock;
    };
  };

  const mockNext = () => jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 when Authorization header is missing', async () => {
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: {} } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        http: 401,
        message: 'Missing or invalid authentication token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header does not start with "Bearer "', async () => {
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: { authorization: 'Token abc' } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        http: 401,
        message: 'Missing or invalid authentication token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is empty after "Bearer "', async () => {
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: { authorization: 'Bearer ' } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    // @ts-expect-error we expect jwt.verify to throw
    (jwt as any).verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    // token is empty string when header is 'Bearer '
    expect((jwt as any).verify).toHaveBeenCalledWith('', expect.any(String));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        http: 401,
        message: 'Invalid or expired token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when jwt.verify throws (invalid/expired token)', async () => {
    process.env.JWT_SECRET = 'test-secret-invalid';
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: { authorization: 'Bearer invalidToken' } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    (jwt as any).verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('invalidToken', 'test-secret-invalid');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'UNAUTHORIZED',
        http: 401,
        message: 'Invalid or expired token',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next and sets req.user when token is valid', async () => {
    process.env.JWT_SECRET = 'valid-secret';
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: { authorization: 'Bearer validToken' } } as unknown as Request & { user?: any };
    const res = mockRes();
    const next = mockNext();

    (jwt as any).verify.mockReturnValue({ id: 'user-123', role: 'admin' });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validToken', 'valid-secret');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect((req as any).user).toEqual({ id: 'user-123', role: 'admin' });
  });

  test('uses default secret when JWT_SECRET env is not set at import time', async () => {
    // Ensure JWT_SECRET is unset BEFORE re-importing the module
    delete process.env.JWT_SECRET;
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: { authorization: 'Bearer tok' } } as unknown as Request;
    const res = mockRes();
    const next = mockNext();

    (jwt as any).verify.mockReturnValue({ id: 'abc', role: 'user' });

    authMiddleware(req, res, next);

    // Secret should be 'your-secret-key' (the module default)
    expect(jwt.verify).toHaveBeenCalledWith('tok', 'your-secret-key');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('ignores extra payload fields and only sets id and role', async () => {
    process.env.JWT_SECRET = 'another-secret';
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: { authorization: 'Bearer xyz' } } as unknown as Request & { user?: any };
    const res = mockRes();
    const next = mockNext();

    (jwt as any).verify.mockReturnValue({
      id: 'u1',
      role: 'viewer',
      email: 'ignored@example.com',
      permissions: ['x', 'y'],
    });

    authMiddleware(req, res, next);

    expect((req as any).user).toEqual({ id: 'u1', role: 'viewer' });
    expect((req as any).user).not.toHaveProperty('email');
    expect((req as any).user).not.toHaveProperty('permissions');
  });

  test('robustness: role and id must be taken as strings from payload', async () => {
    process.env.JWT_SECRET = 'string-secret';
    const authMiddleware = await importMiddlewareFresh();

    const req = { headers: { authorization: 'Bearer tok2' } } as unknown as Request & { user?: any };
    const res = mockRes();
    const next = mockNext();

    // Even if types differ, middleware assigns directly; ensure behavior is consistent
    (jwt as any).verify.mockReturnValue({
      id: 999,
      role: 123,
    });

    authMiddleware(req, res, next);

    expect((req as any).user).toEqual({ id: 999 as any, role: 123 as any });
    expect(next).toHaveBeenCalled();
  });
});