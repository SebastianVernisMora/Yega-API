import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

interface JwtPayload {
  id: string;
  role: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        http: 401,
        message: 'Authorization header required',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded !== 'object' || decoded === null || !('id' in decoded) || !('role' in decoded)) {
      throw new Error('Invalid token payload');
    }

    req.user = { id: (decoded as JwtPayload).id, role: (decoded as JwtPayload).role };
    next();
  } catch {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        http: 401,
        message: 'Invalid or expired token',
      },
    });
  }
};

export default authMiddleware;

