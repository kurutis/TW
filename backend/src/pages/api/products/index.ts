import { NextApiRequest, NextApiResponse } from 'next';
import Cors from 'cors';
import { ProductService } from '../../../lib/services/product';
import pool from '../../../lib/utils/db';

const productService = new ProductService(pool);

// Инициализация CORS middleware
const cors = Cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://trowool.com' 
  ],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
});

// Вспомогательная функция для запуска middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
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
  // Запускаем CORS middleware
  await runMiddleware(req, res, cors);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const categoryId = req.query.categoryId 
      ? parseInt(req.query.categoryId as string)
      : undefined;

    const products = await productService.getProducts(categoryId);
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}