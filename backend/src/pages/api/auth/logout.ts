import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/utils/auth';
import Cors from 'cors';

// Настройки CORS (должны совпадать с другими эндпоинтами)
const cors = Cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://trowool.com'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
});

async function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Обработка CORS
    await runMiddleware(req, res, cors);

    // Установка CORS заголовков
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Обработка OPTIONS запроса
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    // Только POST запросы
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST', 'OPTIONS']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Очищаем куки аутентификации
    AuthService.clearAuthCookies(res);

    // Успешный ответ
    return res.status(200).json({ success: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}