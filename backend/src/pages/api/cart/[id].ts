import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import pool from '../../../lib/utils/db';
import { CartService } from '../../../lib/services/CartService';
import Cors from 'cors';

// Расширенная конфигурация CORS
const cors = Cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://trowool.com'
  ],
  methods: ['GET', 'PUT', 'DELETE', 'OPTIONS'], // Добавлен GET для полноты
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
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
    // Применяем CORS middleware
    await runMiddleware(req, res, cors);
    
    // Обрабатываем OPTIONS запрос
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    // Проверяем авторизацию с улучшенной обработкой ошибок
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      console.warn('Попытка доступа без авторизации', {
        endpoint: '/api/cart',
        method: req.method,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
      return res.status(401).json({ 
        error: 'Требуется авторизация',
        code: 'UNAUTHORIZED'
      });
    }

    // Валидация ID пользователя
    const userId = parseInt(session.user.id);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        error: 'Некорректный ID пользователя',
        code: 'INVALID_USER_ID'
      });
    }

    const cartService = new CartService(pool);

    // Обработка разных методов
    switch (req.method) {
      case 'PUT': {
        const itemId = parseInt(req.query.id as string);
        if (isNaN(itemId)) {
          return res.status(400).json({ 
            error: 'Некорректный ID товара',
            code: 'INVALID_ITEM_ID'
          });
        }

        const { quantity } = req.body;
        if (!quantity || isNaN(quantity) || quantity < 1 || quantity > 100) {
          return res.status(400).json({ 
            error: 'Количество должно быть целым числом от 1 до 100',
            code: 'INVALID_QUANTITY'
          });
        }

        const updatedItem = await cartService.updateQuantity(userId, itemId, quantity);
        return res.status(200).json({
          success: true,
          data: updatedItem
        });
      }

      case 'DELETE': {
        const itemId = parseInt(req.query.id as string);
        if (isNaN(itemId)) {
          return res.status(400).json({ 
            error: 'Некорректный ID товара',
            code: 'INVALID_ITEM_ID'
          });
        }

        await cartService.removeFromCart(userId, itemId);
        return res.status(204).end();
      }

      default:
        res.setHeader('Allow', ['PUT', 'DELETE', 'OPTIONS']);
        return res.status(405).json({ 
          error: `Метод ${req.method} не поддерживается`,
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    console.error('Ошибка обработки запроса корзины:', error);
    
    // Улучшенная обработка ошибок
    if (error instanceof Error) {
      switch (true) {
        case error.message.includes('не найден'):
          return res.status(404).json({ 
            error: 'Товар не найден в корзине',
            code: 'ITEM_NOT_FOUND'
          });
          
        case error.message.includes('на складе'):
          return res.status(409).json({ 
            error: 'Недостаточное количество товара на складе',
            code: 'INSUFFICIENT_STOCK'
          });
          
        default:
          return res.status(500).json({ 
            error: 'Внутренняя ошибка сервера',
            code: 'INTERNAL_SERVER_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
              details: error.message,
              stack: error.stack
            })
          });
      }
    }
    
    return res.status(500).json({ 
      error: 'Неизвестная ошибка сервера',
      code: 'UNKNOWN_ERROR'
    });
  }
}