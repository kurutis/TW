import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      console.log('Сессия не найдена. Заголовки cookies:', req.headers.cookie);
      return res.status(401).json({ 
        error: 'Требуется авторизация',
        code: 'UNAUTHORIZED'
      });
    }

    return res.status(200).json({ 
      user: session.user,
      expires: session.expires
    });
    
  } catch (error) {
    console.error('Ошибка проверки сессии:', error);
    return res.status(500).json({ 
      error: 'Ошибка сервера',
      code: 'SERVER_ERROR'
    });
  }
}