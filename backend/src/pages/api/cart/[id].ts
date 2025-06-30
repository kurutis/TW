import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import pool from '../../../lib/utils/db';
import { CartService } from '../../../lib/services/CartService';
import Cors from 'cors';

// Инициализация CORS middleware
const cors = Cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://trowool.com' 
  ],
  methods: ['PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Вспомогательная функция для запуска middleware
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

const cartService = new CartService(pool);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Применяем CORS middleware
  await runMiddleware(req, res, cors);

  // Обрабатываем OPTIONS запрос
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Проверяем авторизацию
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  // Валидация ID пользователя и товара
  const userId = parseInt(session.user.id);
  const itemId = parseInt(req.query.id as string);

  if (isNaN(userId) || isNaN(itemId)) {
    return res.status(400).json({ error: 'Некорректные идентификаторы' });
  }

  try {
    switch (req.method) {
      case 'PUT': {
        // Валидация количества
        const { quantity } = req.body;
        
        if (!quantity || isNaN(quantity) || quantity < 1) {
          return res.status(400).json({ 
            error: 'Укажите корректное количество (целое число, минимум 1)' 
          });
        }

        // Обновление количества
        const updatedItem = await cartService.updateQuantity(userId, itemId, quantity);
        return res.status(200).json(updatedItem);
      }
        
      case 'DELETE': {
        // Удаление товара
        await cartService.removeFromCart(userId, itemId);
        return res.status(204).end(); // 204 No Content для DELETE
      }
        
      default:
        res.setHeader('Allow', ['PUT', 'DELETE', 'OPTIONS']);
        return res.status(405).json({ 
          error: `Метод ${req.method} не поддерживается` 
        });
    }
  } catch (error) {
    console.error('Ошибка элемента корзины:', error);
    
    // Специфичная обработка ошибок
    if (error instanceof Error) {
      if (error.message.includes('не найден')) {
        return res.status(404).json({ 
          error: 'Товар не найден в корзине' 
        });
      }
      if (error.message.includes('на складе')) {
        return res.status(409).json({ 
          error: 'Недостаточное количество товара на складе' 
        });
      }
    }
    
    // Общая обработка ошибок
    return res.status(500).json({ 
      error: 'Произошла ошибка при обработке запроса',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error)
      })
    });
  }
}