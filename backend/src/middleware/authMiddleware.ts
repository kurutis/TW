import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../lib/utils/auth';
import jwt from 'jsonwebtoken'

// Тип для расширенного запроса с пользователем
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: number;
    email: string;
    role?: string;
    email_verified?: boolean;
  };
}

// Тип для middleware next функции
type NextHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

export const authenticate = async (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  try {
    // Получаем токен из cookies или заголовка Authorization
    const token = req.cookies.authToken || 
                 req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Не авторизован' });
    }

    // Верифицируем токен
    const decoded = AuthService.verifyToken(token);
    
    // Добавляем пользователя в объект запроса
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      email_verified: decoded.email_verified
    };

    // Передаем управление следующему middleware/обработчику
    return await next(req, res);
  } catch (error) {
    console.error('Auth error:', error);
    
    // Очищаем куки если токен невалидный или просроченный
    if (error instanceof jwt.TokenExpiredError || 
        error instanceof jwt.JsonWebTokenError) {
      res.setHeader('Set-Cookie', [
        'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      ]);
      
      return res.status(401).json({ 
        error: error instanceof jwt.TokenExpiredError 
          ? 'Сессия истекла' 
          : 'Невалидный токен'
      });
    }
    
    return res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};