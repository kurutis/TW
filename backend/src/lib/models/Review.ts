import { Pool, QueryResult } from 'pg';

export interface Review {
  id: number;
  user_id: number;
  rating: number;
  text: string;
  images?: string[];
  created_at: Date;
  user_name?: string;
  user_avatar?: string;
}

export class ReviewModel {
  constructor(private pool: Pool) {}

  async getAllReviews(): Promise<Review[]> {
    const client = await this.pool.connect();
    try {
      const result: QueryResult<Review> = await client.query(`
        SELECT 
          sr.*,
          u.full_name as user_name,
          u.nickname as user_nickname
        FROM service_reviews sr
        LEFT JOIN users u ON sr.user_id = u.id
        ORDER BY sr.created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Ошибка при получении отзывов:', error);
      throw new Error('Не удалось загрузить отзывы');
    } finally {
      client.release();
    }
  }

  async createReview(userId: number, rating: number, text: string, images: string[] = []): Promise<Review> {
  const client = await this.pool.connect();
  try {
    // Проверка существующего отзыва
    const existing = await client.query(
      `SELECT id FROM service_reviews WHERE user_id = $1`,
      [userId]
    );
    
    if (existing.rows.length > 0) {
      throw new Error('User already has a review');
    }

    const result = await client.query(
      `INSERT INTO service_reviews (user_id, rating, text, images)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, rating, text, images]
    );

    // Получаем данные пользователя
    const userResult = await client.query(
      `SELECT full_name, avatar_url FROM users WHERE id = $1`,
      [userId]
    );

    return {
      ...result.rows[0],
      user_name: userResult.rows[0]?.full_name || 'Anonymous',
      user_avatar: userResult.rows[0]?.avatar_url || null
    };
  } finally {
    client.release();
  }
}
}