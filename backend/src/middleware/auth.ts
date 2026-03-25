import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.access_token ?? req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser & { iat: number; exp: number };
    const result = await getDb().execute({
      sql: 'SELECT id, email, name, role, status FROM users WHERE id = ?',
      args: [payload.id],
    });
    const user = result.rows[0] as unknown as AuthUser | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }
    if (user.status !== 'approved') {
      res.status(403).json({ success: false, error: 'Account pending admin approval' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }
    next();
  });
};
