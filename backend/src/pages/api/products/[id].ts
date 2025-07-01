import { NextApiRequest, NextApiResponse } from 'next';
import { ProductService } from '../../../lib/services/product';
import pool from '../../../lib/utils/db';
import Cors from 'cors';

// Инициализация CORS middleware
const cors = Cors({
  origin: ['http://localhost:5173', 'https://trowool.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
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

const productService = new ProductService(pool);

// Простое кэширование продукта
const productCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 минут

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Применяем CORS middleware
  await runMiddleware(req, res, cors);

  // Обрабатываем OPTIONS запрос
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Проверяем метод запроса
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ 
      error: `Method ${req.method} not allowed`,
      allowedMethods: ['GET', 'OPTIONS']
    });
  }

  // Валидация параметра ID
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ 
      error: 'Product ID is required and must be a single value'
    });
  }

  const productId = parseInt(id);
  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ 
      error: 'Invalid product ID. Must be a positive integer'
    });
  }

  try {
    // Проверяем кэш
    const cachedProduct = productCache.get(productId);
    const now = Date.now();

    if (cachedProduct && (now - cachedProduct.timestamp) < CACHE_DURATION_MS) {
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 минут на клиенте
      return res.status(200).json(cachedProduct.data);
    }

    // Получаем продукт из базы данных
    const product = await productService.getProductById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        productId
      });
    }

    // Обновляем кэш
    productCache.set(productId, {
      data: product,
      timestamp: now
    });

    // Устанавливаем заголовки
    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 минут на клиенте

    // Возвращаем результат
    res.status(200).json(product);

  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    
    // Более информативные ошибки в development
    const errorResponse = {
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    };
    
    res.status(500).json(errorResponse);
  }
}