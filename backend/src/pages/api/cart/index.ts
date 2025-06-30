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
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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

  // Валидация ID пользователя
  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Некорректный ID пользователя' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        // Получение содержимого корзины
        const cartItems = await cartService.getCart(userId);
        return res.status(200).json(cartItems);
      }
        
      case 'POST': {
        // Добавление товара в корзину
        const { productId, color, quantity = 1 } = req.body;
        
        // Валидация входных данных
        if (!productId || isNaN(productId)) {
          return res.status(400).json({ 
            error: 'Необходимо указать корректный ID товара' 
          });
        }
        
        if (!color || typeof color !== 'string') {
          return res.status(400).json({ 
            error: 'Необходимо указать цвет товара' 
          });
        }
        
        if (isNaN(quantity) || quantity < 1 || quantity > 100) {
          return res.status(400).json({ 
            error: 'Количество должно быть числом от 1 до 100' 
          });
        }
        
        // Добавление товара
        const cartItem = await cartService.addToCart(
          userId, 
          productId, 
          color, 
          quantity
        );
        
        return res.status(201).json(cartItem); // 201 Created для POST
      }
        
      case 'DELETE': {
        // Очистка корзины
        await cartService.clearCart(userId);
        return res.status(204).end(); // 204 No Content для DELETE
      }
        
      default: {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
        return res.status(405).json({ 
          error: `Метод ${req.method} не поддерживается` 
        });
      }
    }
  } catch (error) {
    console.error('Ошибка корзины:', error);
    
    // Специфичная обработка ошибок
    if (error instanceof Error) {
      if (error.message.includes('не найден')) {
        return res.status(404).json({ 
          error: 'Товар не найден' 
        });
      }
      if (error.message.includes('на складе') || 
          error.message.includes('Количество')) {
        return res.status(409).json({ 
          error: error.message 
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