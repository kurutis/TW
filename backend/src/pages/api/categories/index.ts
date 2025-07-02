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
const CACHE_DURATION = 60 * 60 * 1000; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors);

  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ 
      error: `Метод ${req.method} не поддерживается`,
      allowedMethods: ['GET', 'OPTIONS']
    });
  }

  try {
    const now = Date.now();
    if (cachedCategories && (now - cacheTimestamp) < CACHE_DURATION) {
    
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 час на клиенте
      res.setHeader('X-Cache-Status', 'HIT');
      return res.status(200).json(cachedCategories);
    }

    const categories = await productService.getCategories();
    
    // Обновляем кэш
    cachedCategories = categories;
    cacheTimestamp = now;

    
    res.setHeader('Cache-Control', 'public, max-age=3600'); 
    res.setHeader('X-Cache-Status', 'MISS');

    res.status(200).json(categories);
    
  } catch (error) {
    console.error('Ошибка при получении категорий:', error);
    
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