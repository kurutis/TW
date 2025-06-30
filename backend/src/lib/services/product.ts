import { Pool } from 'pg';

interface Product {
  id: number;
  name: string;
  categoryId?: number;
  category_name?: string;
  composition_percent: string;
  brand: string;
  season: string;
  series: string;
  price: number;
  pack_quantity: number;
  thread_length: number;
  weight: number;
  description?: string;
  colors: string[];
  images: string[];
}

interface Category {
  id: number;
  name: string;
}

export class ProductService {
  constructor(private pool: Pool) {}

  async init() {
    await this.createTables();
  }

  private async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category_id INTEGER REFERENCES categories(id),
          composition_percent TEXT,
          brand VARCHAR(100),
          season VARCHAR(100),
          series VARCHAR(100),
          price DECIMAL(10, 2) NOT NULL,
          pack_quantity INTEGER,
          thread_length INTEGER,
          weight INTEGER,
          description TEXT,
          colors TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS product_images (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          color_hex VARCHAR(7)
        );
      `);
    } finally {
      client.release();
    }
  }

  async getProducts(categoryId?: number): Promise<Product[]> {
    const query = categoryId 
      ? `
        SELECT 
          p.*,
          c.name as category_name,
          array_remove(array_agg(pi.image_url), NULL) as images
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE p.category_id = $1
        GROUP BY p.id, c.name
        ORDER BY p.created_at DESC
      `
      : `
        SELECT 
          p.*,
          c.name as category_name,
          array_remove(array_agg(pi.image_url), NULL) as images
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_images pi ON p.id = pi.product_id
        GROUP BY p.id, c.name
        ORDER BY p.created_at DESC
      `;

    const { rows } = await this.pool.query<Product>(query, categoryId ? [categoryId] : []);
    return rows;
  }

  async getProductById(id: number): Promise<Product | null> {
    const { rows } = await this.pool.query<Product>(`
      SELECT 
        p.*,
        c.name as category_name,
        array_remove(array_agg(pi.image_url), NULL) as images
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1
      GROUP BY p.id, c.name
    `, [id]);
    
    return rows[0] || null;
  }

  async getCategories(): Promise<Category[]> {
    const { rows } = await this.pool.query<Category>('SELECT id, name FROM categories');
    return rows;
  }
}