import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import pool from '../../../lib/utils/db';
import { CartService } from '../../../lib/services/CartService';
import Cors from 'cors';

// Конфигурация CORS
const cors = Cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://trowool.com'
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Для правильной обработки preflight запросов
});

// Функция для запуска middleware
async function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
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
      return res.status(200).end();
    }

    // Проверяем авторизацию
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      console.error('Доступ запрещен: отсутствует сессия');
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

    // Обработка методов
    switch (req.method) {
      case 'GET': {
        const cartItems = await cartService.getCart(userId);
        return res.status(200).json({
          success: true,
          data: cartItems
        });
      }

      case 'POST': {
        const { productId, color, quantity = 1 } = req.body;
        
        // Валидация входных данных
        if (!productId || isNaN(productId)) {
          return res.status(400).json({ 
            error: 'Неверный ID товара',
            code: 'INVALID_PRODUCT_ID'
          });
        }

        if (quantity < 1 || quantity > 100) {
          return res.status(400).json({
            error: 'Количество должно быть от 1 до 100',
            code: 'INVALID_QUANTITY'
          });
        }

        const item = await cartService.addToCart(userId, productId, color, quantity);
        return res.status(201).json({
          success: true,
          data: item
        });
      }

      case 'DELETE': {
        await cartService.clearCart(userId);
        return res.status(204).end();
      }

      default: {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
        return res.status(405).json({ 
          error: 'Метод не поддерживается',
          code: 'METHOD_NOT_ALLOWED'
        });
      }
    }
  } catch (error) {
    console.error('Ошибка API корзины:', error);
    
    // Специфичные ошибки
    if (error instanceof Error) {
      if (error.message.includes('не найден')) {
        return res.status(404).json({ 
          error: error.message,
          code: 'NOT_FOUND'
        });
      }
      
      if (error.message.includes('на складе')) {
        return res.status(409).json({ 
          error: error.message,
          code: 'INSUFFICIENT_STOCK'
        });
      }
    }
    
    // Общая ошибка сервера
    return res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      code: 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    });
  }
}