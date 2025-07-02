import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/utils/auth';
import Cors from 'cors';
import pool from '../../../lib/utils/db';

const cors = Cors({
  origin: true,
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
});

async function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await runMiddleware(req, res, cors);

    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST', 'OPTIONS']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
    }

    const client = await pool.connect();
    
    try {
      const user = await AuthService.findUserByEmail(email, client);

      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: 'Invalid email or password'
        });
      }

      const isValid = await AuthService.comparePasswords(password, user.password_hash);
      
      if (!isValid) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: 'Invalid email or password'
        });
      }

      const token = AuthService.generateToken({ 
        userId: user.id, 
        email: user.email,
      });

      const responseData = {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          nickname: user.nickname,
          phone: user.phone,
        }
      };

      // Исправленная установка cookies
      const cookieOptions = [
        `authToken=${token}`,
        `Path=/`,
        `HttpOnly`,
        `SameSite=Lax`,
        `Max-Age=${30 * 24 * 60 * 60}`,
        process.env.NODE_ENV === 'production' ? 'Secure' : ''
      ].filter(Boolean).join('; ');

      const userCookieOptions = [
        `user=${encodeURIComponent(JSON.stringify(responseData.user))}`,
        `Path=/`,
        `SameSite=Lax`,
        `Max-Age=${30 * 24 * 60 * 60}`,
        process.env.NODE_ENV === 'production' ? 'Secure' : ''
      ].filter(Boolean).join('; ');

      res.setHeader('Set-Cookie', [cookieOptions, userCookieOptions]);

      return res.status(200).json(responseData);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}