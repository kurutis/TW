import { Pool, PoolClient } from 'pg';

export class CartService {
  constructor(private pool: Pool) {}

  async checkConnection() {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  }

async getCart(userId: number) {
  const client = await this.pool.connect();
  try {
    console.log(`Fetching cart for user ${userId}`);
    const { rows } = await client.query(`
      SELECT 
        ci.id,
        ci.product_id as "productId",
        p.name,
        p.price,
        ci.quantity,
        ci.color as "selectedColor",
        p.images,
        p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [userId]);
    
    console.log(`Found ${rows.length} items in cart`);
    return rows;
  } catch (error) {
    console.error('Database error in getCart:', error);
    throw new Error('Ошибка при получении корзины');
  } finally {
    client.release();
  }
}

  async addToCart(userId: number, productId: number, color: string, quantity: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Проверка наличия товара
      const { rows: [product] } = await client.query(
      `SELECT id, stock FROM products WHERE id = $1 FOR UPDATE`,
      [productId]
    );
    
      if (!product) {
        throw new Error('Товар не найден');
      }

      // Проверяем существующий товар в корзине
      const { rows: existing } = await client.query(
        `SELECT id, quantity FROM cart_items 
         WHERE user_id = $1 AND product_id = $2 AND color = $3`,
        [userId, productId, color]
      );
      
      let result;
      if (existing.length > 0) {
        const newQuantity = existing[0].quantity + quantity;
        if (product.stock < newQuantity) {
          throw new Error('Not enough stock');
        }
        
        result = await client.query(
          `UPDATE cart_items 
           SET quantity = $1 
           WHERE id = $2
           RETURNING *`,
          [newQuantity, existing[0].id]
        );
      } else {
        result = await client.query(
          `INSERT INTO cart_items 
           (user_id, product_id, color, quantity)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [userId, productId, color, quantity]
        );
      }
      
      await client.query('COMMIT');
      
      // Получаем полные данные о продукте
      const { rows: [item] } = await this.pool.query(`
        SELECT 
          ci.id,
          ci.product_id as "productId",
          p.name,
          p.price,
          ci.quantity,
          ci.color as "selectedColor",
          p.images,
          p.stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.id = $1
      `, [result.rows[0].id]);
      
      return item;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }  finally {
    client.release();
  }
}


  async updateQuantity(userId: number, itemId: number, quantity: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Получаем текущий товар в корзине
      const { rows: [cartItem] } = await client.query(
        `SELECT product_id FROM cart_items WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [itemId, userId]
      );
      
      if (!cartItem) {
        throw new Error('Item not found in cart');
      }
      
      // Проверяем наличие на складе
      const { rows: [product] } = await client.query(
        `SELECT stock FROM products WHERE id = $1 FOR UPDATE`,
        [cartItem.product_id]
      );
      
      if (quantity > product.stock) {
        throw new Error('Not enough stock');
      }
      
      // Обновляем количество
      const { rows } = await client.query(
        `UPDATE cart_items 
         SET quantity = $1
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [quantity, itemId, userId]
      );
      
      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removeFromCart(userId: number, itemId: number) {
    const { rowCount } = await this.pool.query(
      `DELETE FROM cart_items 
       WHERE id = $1 AND user_id = $2`,
      [itemId, userId]
    );
    
    if (rowCount === 0) throw new Error('Item not found');
  }

  async clearCart(userId: number) {
    await this.pool.query(
      `DELETE FROM cart_items WHERE user_id = $1`,
      [userId]
    );
  }
}