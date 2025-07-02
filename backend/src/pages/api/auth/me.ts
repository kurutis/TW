import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';
import { AuthService } from '../../../lib/utils/auth';

// Инициализация CORS один раз
const cors = Cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
});


const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};


const API_TIMEOUT = 5000; // 5 секунд

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Обработка таймаута
  const timeout = setTimeout(() => {
    res.status(503).json({ 
      error: 'Service Unavailable',
      message: 'Request timeout'
    });
  }, API_TIMEOUT);

  try {
    await runMiddleware(req, res, cors);

    if (req.method === 'OPTIONS') {
      clearTimeout(timeout);
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      clearTimeout(timeout);
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = req.cookies.authToken;

    if (!token) {
      clearTimeout(timeout);
      return res.status(200).json({ user: null });
    }

    try {
      if (typeof token !== 'string' || token.length < 10) {
        clearTimeout(timeout);
        return res.status(200).json({ user: null });
      }

      const decoded = AuthService.verifyToken(token);
      const user = await AuthService.findUserByEmail(decoded.email);

      if (!user) {
        clearTimeout(timeout);
        return res.status(200).json({ user: null });
      }

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.full_name || null,
        verified: user.email_verified || false,
        nickname: user.nickname,
        phone: user.phone
      };

      clearTimeout(timeout);
      return res.status(200).json({ user: userResponse });
    } catch (error) {
      console.error('Token verification failed:', error);
      clearTimeout(timeout);
      return res.status(200).json({ user: null });
    }
  } catch (error) {
    console.error('API Error:', error);
    clearTimeout(timeout);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    clearTimeout(timeout); 
  }
}