import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/utils/db';
import { ProductService } from '../../../lib/services/product';
import Cors from 'cors';

// Инициализация CORS middleware
const cors = Cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://trowool.com'
  ],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true,
  exposedHeaders: ['Set-Cookie'],
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

// Кэширование категорий на сервере
let cachedCategories: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 час кэширования

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
      error: `Метод ${req.method} не поддерживается`,
      allowedMethods: ['GET', 'OPTIONS']
    });
  }

  try {
    // Проверяем кэш
    const now = Date.now();
    if (cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
      // Устанавливаем заголовки кэширования
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 час на клиенте
      res.setHeader('X-Cache-Status', 'HIT');
      return res.status(200).json(cachedCategories);
    }

    // Получаем категории из базы данных
    const categories = await productService.getCategories();
    
    // Обновляем кэш
    cachedCategories = categories;
    cacheTimestamp = now;

    // Устанавливаем заголовки
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 час на клиенте
    res.setHeader('X-Cache-Status', 'MISS');

    // Возвращаем результат
    res.status(200).json(categories);
    
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    
    // Более информативные ошибки в development
    const errorResponse = {
      error: 'Произошла ошибка при загрузке категорий',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    };
    
    res.status(500).json(errorResponse);
  }
}