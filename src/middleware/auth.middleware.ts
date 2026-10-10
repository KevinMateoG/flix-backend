import { type Request, type Response, type NextFunction } from 'express';
import { auth } from '../lib/auth.ts';
import { fromNodeHeaders } from 'better-auth/node';

declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
    sessionId: string;
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.userId = session.user.id;
  req.sessionId = session.session.id;
  next();
}
