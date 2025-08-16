import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: string;
  role: string;
  // you can include other properties from your JWT payload here
}

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({

        error: {
          code: 'UNAUTHORIZED',
          http: 401,
          message: 'Missing or invalid authentication token',
        }
      error: {
        code: 'AUTH_REQUIRED',
        http: 401,
        message: 'Authorization header required',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    // Attach user to the request object
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          http: 401,
          message: 'Invalid or expired token',
        }
    });
  }
}

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as jwt.JwtPayload;
    req.user = { id: decoded.sub as string, role: decoded.role as string };
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        http: 401,
        message: 'Invalid or expired token',
      },
    });
  }
};

