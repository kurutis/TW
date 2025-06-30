import { NextApiRequest, NextApiResponse } from 'next';
import { ReviewModel } from '../../../lib/models/Review';
import pool from '../../../lib/utils/db';
import Cors from 'cors';
import { NextHandler } from 'next-connect';
import { handleApiError, handleFileCleanup } from './add';
import formidable from 'formidable';
import fs from 'fs/promises';

type NextMiddleware = (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => void;

const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://trowool.com'
  ],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

const form = formidable({
  multiples: true,
  keepExtensions: true,
  uploadDir: `${process.cwd()}/tmp/uploads`, // Используем относительный путь
  maxFileSize: 10 * 1024 * 1024, // 10MB
  filter: ({ mimetype }) => {
    return !!mimetype?.includes('image');
  }
});

const tmpDir = `${process.cwd()}/tmp/uploads`;
fs.mkdir(tmpDir, { recursive: true }).catch(console.error);

async function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: NextMiddleware) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (err?: unknown) => err ? reject(err) : resolve());
  });
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await runMiddleware(req, res, cors);
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const reviewModel = new ReviewModel(pool);

    switch (req.method) {
      case 'GET':
        try {
          const reviews = await reviewModel.getAllReviews();
          return res.status(200).json({ success: true, data: reviews });
        } catch (error) {
          console.error('Failed to fetch reviews:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to load reviews',
            ...(process.env.NODE_ENV === 'development' && {
              details: error instanceof Error ? error.message : 'Unknown error'
            })
          });
        }

      case 'POST':
  try {
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Валидация
    if (!fields.userId || !fields.rating || !fields.text) {
      if (files.images) await handleFileCleanup(files);
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields'
      });
    }

    // Обработка изображений
    let imageUrls: string[] = [];
    if (files.images) {
      const images = Array.isArray(files.images) ? files.images : [files.images];
      
      for (const file of images) {
        try {
          // Создаем уникальное имя файла
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 8);
          const ext = file.originalFilename?.split('.').pop() || 'jpg';
          const filename = `${timestamp}-${randomString}.${ext}`;
          const newPath = `/uploads/reviews/${filename}`;
          
          // Создаем директорию, если не существует
          await fs.mkdir(`${process.cwd()}/public/uploads/reviews`, { recursive: true });
          
          // Копируем файл вместо перемещения
          await fs.copyFile(file.filepath, `${process.cwd()}/public${newPath}`);
          
          // Удаляем временный файл после копирования
          await fs.unlink(file.filepath).catch(console.error);
          
          imageUrls.push(newPath);
        } catch (fileError) {
          console.error('Ошибка обработки файла:', fileError);
          // Продолжаем обработку даже если одно изображение не загрузилось
        }
      }
    }

    // Создание отзыва
    const reviewText = Array.isArray(fields.text) ? fields.text[0] : fields.text;
    const newReview = await reviewModel.createReview(
      Number(fields.userId),
      Number(fields.rating),
      reviewText,
      imageUrls
    );

    return res.status(201).json({ success: true, data: newReview });

  } catch (error) {
        console.error('Error creating review:', error);
        
        // Безопасное извлечение сообщения об ошибке
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && {
            details: {
              message: errorMessage,
              ...(error instanceof Error && { stack: error.stack }),
              rawError: process.env.NODE_ENV === 'development' ? error : undefined
            }
          })
        });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        });
    }
  } catch (error) {
    console.error('API handler error:', error);
    return handleApiError(res, error);
  }
}