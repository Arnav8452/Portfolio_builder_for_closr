import { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';
import crypto from 'crypto';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const expectedSecret = env.aiGatewaySecret;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Bearer Token' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedSecret);
    if (tokenBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
      return res.status(403).json({ error: 'Forbidden: Invalid Token' });
    }
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden: Invalid Token' });
  }

  next();
}
