import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'nirman-sih-2026-secret-key-gov-mospi';

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    } catch (e) {}

    if (!user) {
      user = {
        id: decoded.userId,
        authorityId: decoded.authorityId,
        name: 'Authorized Officer',
        role: decoded.role || 'MINISTRY',
        state: 'All India',
        district: 'All Districts'
      };
    }

    req.user = {
      id: user.id,
      authorityId: user.authorityId,
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.state,
      district: user.district
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
