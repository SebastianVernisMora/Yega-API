import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pino from 'pino';
import { StringValue } from 'ms';
import { authMiddleware } from '../middlewares/auth.js';

export const createAuthRouter = (prisma: PrismaClient) => {
  const log = pino({ transport: { target: 'pino-pretty' } });
  const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

router.post('/register', async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        http: 400,
        message: 'Missing required fields',
      },
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      log.warn(`Registration attempt for existing email: ${normalizedEmail}`);
      return res.status(400).json({
        error: {
          code: 'EMAIL_TAKEN',
          http: 400,
          message: 'A user with this email already exists.',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
    });

    const accessTokenExpiresIn = (process.env.JWT_EXPIRES || '15m') as StringValue;
    const refreshTokenExpiresIn = (process.env.JWT_REFRESH_EXPIRES || '7d') as StringValue;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not defined');
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = jwt.sign({ sub: user.id }, jwtRefreshSecret, {
      expiresIn: refreshTokenExpiresIn,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    const userForResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(201).json({
      accessToken,
      refreshToken,
      user: userForResponse,
    });
  } catch (error) {
    log.error(error, 'Error during registration');
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        http: 400,
        message: 'Missing required fields',
      },
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      log.warn(`Login attempt for non-existent email: ${normalizedEmail}`);
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID',
          http: 401,
          message: 'Invalid credentials',
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      log.warn(`Invalid password attempt for email: ${normalizedEmail}`);
      return res.status(401).json({
        error: {
          code: 'AUTH_INVALID',
          http: 401,
          message: 'Invalid credentials',
        },
      });
    }

    const accessTokenExpiresIn = (process.env.JWT_EXPIRES || '15m') as StringValue;
    const refreshTokenExpiresIn = (process.env.JWT_REFRESH_EXPIRES || '7d') as StringValue;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not defined');
    }

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = jwt.sign({ sub: user.id }, jwtRefreshSecret, {
      expiresIn: refreshTokenExpiresIn,
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    const userForResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      accessToken,
      refreshToken,
      user: userForResponse,
    });
  } catch (error) {
    log.error(error, 'Error during login');
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'REFRESH_TOKEN_REQUIRED',
          http: 400,
          message: 'Refresh token is required',
        },
      });
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not defined');
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret);
      const userId = (decoded as any).sub;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.refreshToken) {
        return res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            http: 401,
            message: 'Invalid refresh token',
          },
        });
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken
      );

      if (!isRefreshTokenValid) {
        return res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            http: 401,
            message: 'Invalid refresh token',
          },
        });
      }

      const accessTokenExpiresIn = (process.env.JWT_EXPIRES || '15m') as StringValue;
      const accessToken = jwt.sign(
        { sub: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: accessTokenExpiresIn }
      );

      res.status(200).json({ accessToken });
    } catch (error) {
      log.error(error, 'Error during token refresh');
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          http: 401,
          message: 'Invalid or expired refresh token',
        },
      });
    }
  });

  return router;
};
