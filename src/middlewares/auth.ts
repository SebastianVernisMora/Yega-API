import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: string;
  role: string;
}

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        http: 401,
        message: 'Missing or invalid authentication token',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        http: 401,
        message: 'Invalid or expired token',
      },
    });
  }
}

