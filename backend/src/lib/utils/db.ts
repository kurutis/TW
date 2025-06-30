import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

async function tableExists(tableName: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

// Функция для создания всех таблиц
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Таблица пользователей (аутентификация)
    if (!await tableExists('users')) {
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(100),
          phone VARCHAR(20),
          nickname VARCHAR(50),
          email_verified BOOLEAN DEFAULT false,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query('CREATE INDEX idx_users_email ON users(email)');
      await client.query('CREATE INDEX idx_users_nickname ON users(nickname)');
      console.log('Таблица users создана');
    }

    // Таблица категорий товаров
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Таблица товаров
    await client.query(`
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
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    `);

    // Таблица изображений товаров
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        color_hex VARCHAR(7),
        is_main BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
    `);

    // Таблица корзины
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        color VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, product_id, color)
      );
      
      CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
    `);

    // Таблица отзывов о сервисе
    if (!await tableExists('service_reviews')) {
      await client.query(`
        CREATE TABLE service_reviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          text TEXT NOT NULL,
          images TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE (user_id)
        )
      `);
      await client.query('CREATE INDEX idx_service_reviews_user ON service_reviews(user_id)');
      console.log('Таблица service_reviews создана');
    }

    // Вставка начальных категорий
    await client.query(`
      INSERT INTO categories (name)
      VALUES 
        ('Троицкая пряжа для ручного вязания'),
        ('Шерсть для валяния'),
        ('Пряжа российских производителей'),
        ('Пехорская пряжа'),
        ('Спицы, крючки и иглы для валяния'),
        ('Иностранная пряжа'),
        ('Одеяла')
      ON CONFLICT (name) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Все таблицы успешно проверены/созданы');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  } finally {
    client.release();
  }
}


async function initializeWithRetry(retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await initializeDatabase();
      return;
    } catch (error) {
      console.error(`Попытка ${i + 1} из ${retries} не удалась:`, error);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

initializeDatabase().catch(err => {
  console.error('Не удалось инициализировать базу данных:', err);
  process.exit(1);
});


// Экспортируем пул подключений
export default pool;