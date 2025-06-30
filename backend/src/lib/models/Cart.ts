import { Pool } from 'pg';

interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  color?: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export class CartModel {
  constructor(private pool: Pool) {}

  // Получить все товары в корзине пользователя
  async getCart(userId: number): Promise<CartItem[]> {
    const query = `
      SELECT id, product_id, color, quantity, created_at, updated_at
      FROM cart_items
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await this.pool.query(query, [userId]);
    return rows;
  }

  // Добавить товар в корзину или обновить количество, если уже есть
  async addToCart(
    userId: number,
    productId: number,
    color: string,
    quantity: number = 1
  ): Promise<CartItem> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Проверяем, есть ли уже такой товар в корзине
      const existingItem = await client.query(
        `SELECT id, quantity FROM cart_items 
         WHERE user_id = $1 AND product_id = $2 AND color = $3`,
        [userId, productId, color]
      );

      let result;
      if (existingItem.rows.length > 0) {
        // Обновляем количество, если товар уже есть
        const newQuantity = existingItem.rows[0].quantity + quantity;
        result = await client.query(
          `UPDATE cart_items 
           SET quantity = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, product_id, color, quantity, created_at, updated_at`,
          [newQuantity, existingItem.rows[0].id]
        );
      } else {
        // Добавляем новый товар
        result = await client.query(
          `INSERT INTO cart_items 
           (user_id, product_id, color, quantity)
           VALUES ($1, $2, $3, $4)
           RETURNING id, product_id, color, quantity, created_at, updated_at`,
          [userId, productId, color, quantity]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Очистить корзину пользователя
  async clearCart(userId: number): Promise<void> {
    await this.pool.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [userId]
    );
  }

  // Обновить количество конкретного товара
  async updateQuantity(
    userId: number,
    itemId: number,
    quantity: number
  ): Promise<CartItem> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const { rows } = await this.pool.query(
      `UPDATE cart_items 
       SET quantity = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, product_id, color, quantity, created_at, updated_at`,
      [quantity, itemId, userId]
    );

    if (rows.length === 0) {
      throw new Error('Cart item not found');
    }

    return rows[0];
  }

  // Удалить конкретный товар из корзины
  async removeFromCart(userId: number, itemId: number): Promise<void> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [itemId, userId]
    );

    if (rowCount === 0) {
      throw new Error('Cart item not found');
    }
  }
}