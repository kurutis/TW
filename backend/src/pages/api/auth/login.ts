import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/utils/auth';
import Cors from 'cors';
import pool from '../../../lib/utils/db';

// Инициализация CORS middleware
const cors = Cors({
  origin: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
});

// Вспомогательная функция для запуска middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Обработка CORS
  try {
    await runMiddleware(req, res, cors);
  } catch (error) {
    console.error('CORS middleware error:', error);
    return res.status(500).json({ error: 'CORS policy failed' });
  }

  // Установка CORS заголовков
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  // Обработка preflight запроса
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Проверка метода запроса
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Проверка Content-Type
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(415).json({ 
      error: 'Unsupported Media Type',
      details: 'Expected application/json'
    });
  }

  // Проверка тела запроса
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      error: 'Bad Request',
      details: 'Request body must be a JSON object'
    });
  }

  const { email, password } = req.body;

  // Валидация входных данных
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: {
        email: !email ? 'Email is required' : undefined,
        password: !password ? 'Password is required' : undefined
      }
    });
  }

  // Проверка формата email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: { email: 'Invalid email format' }
    });
  }

  const client = await pool.connect();
  
  try {
    // Поиск пользователя с защитой от timing-атак
    const [user, fakeUser] = await Promise.all([
      AuthService.findUserByEmail(email, client),
      AuthService.findUserByEmail('dummy@example.com', client),
    ]);

    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Искусственная задержка
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid email or password'
      });
    }

    // Сравнение паролей
    const isValid = await AuthService.comparePasswords(password, user.password_hash);
    const fakeCheck = await AuthService.comparePasswords('dummy', '$2a$10$dummyhash');
    
    // Контролируемая задержка
    await Promise.all([
      new Promise(resolve => setTimeout(resolve, isValid ? 300 : 500)),
      new Promise(resolve => setTimeout(resolve, fakeCheck ? 300 : 500)),
    ]);

    if (!isValid) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid email or password'
      });
    }

    // Генерация токена
    const token = AuthService.generateToken({ 
      userId: user.id, 
      email: user.email,
      email_verified: user.email_verified
    });

    // Установка безопасных cookies
    res.setHeader('Set-Cookie', [
      `authToken=${token}; HttpOnly; Path=/; SameSite=Lax; ${
        process.env.NODE_ENV === 'production' ? 'Secure; Domain=trowool.com' : ''
      } Max-Age=${30 * 24 * 60 * 60}`,
      `user=${JSON.stringify({
        id: user.id,
        email: user.email
      })}; Path=/; SameSite=Lax; ${
        process.env.NODE_ENV === 'production' ? 'Secure; Domain=trowool.com' : ''
      } Max-Age=${30 * 24 * 60 * 60}`
    ]);

    // Заголовки безопасности
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Успешный ответ
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        nickname: user.nickname,
        phone: user.phone,
        email_verified: user.email_verified,
      },
      token: process.env.NODE_ENV === 'development' ? token : undefined
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    });
  } finally {
    client.release();
  }
}