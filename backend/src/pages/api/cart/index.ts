import { NextApiResponse } from 'next';
import { AuthenticatedRequest, authenticate } from '../../../middleware/authMiddleware';
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204,
  exposedHeaders: ['Set-Cookie']
});

async function runMiddleware(req: AuthenticatedRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  try {
    // Применяем CORS middleware
    await runMiddleware(req, res, cors);
    
    // Обрабатываем OPTIONS запрос
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    // Обработчик запросов
    const requestHandler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const cartService = new CartService(pool);
      
      switch (req.method) {
        case 'GET': {
          const cartItems = await cartService.getCart(req.user.userId);
          res.json(cartItems);
          break;
        }
        
        case 'POST': {
          const { productId, color, quantity = 1 } = req.body;
          
          if (!productId || isNaN(Number(productId))) {
            res.status(400).json({ error: 'Неверный ID товара' });
            return;
          }
          
          if (quantity < 1 || quantity > 10) {
            res.status(400).json({ error: 'Количество должно быть от 1 до 10' });
            return;
          }
          
          const item = await cartService.addToCart(
            req.user.userId, 
            productId, 
            color, 
            quantity
          );
          res.status(201).json(item);
          break;
        }
        
        case 'DELETE': {
          await cartService.clearCart(req.user.userId);
          res.status(204).end();
          break;
        }
        
        default:
          res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
          res.status(405).json({ error: 'Method not allowed' });
      }
    };

    return authenticate(req, res, requestHandler);
    
  } catch (error) {
    console.error('API handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}