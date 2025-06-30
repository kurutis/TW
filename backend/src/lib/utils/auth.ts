import bcrypt from 'bcryptjs';
import pool from './db';
import { NextApiResponse } from 'next';
import { PoolClient } from 'pg';
import jwt, { Algorithm, SignOptions } from 'jsonwebtoken';

// 1. Типы данных
interface UserData {
  id: number;
  email: string;
  password_hash: string;
  full_name?: string;
  phone?: string;
  nickname?: string;
  email_verified?: boolean; 
}

interface TokenPayload {
  userId: number;
  email: string;
  role?: string;
  iss?: string;
  iat?: number;
  exp?: number;
  aud?: string;
  email_verified?: boolean;
}

interface CookieOptions {
  httpOnly?: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
}

interface JwtConfig {
  secret: string;
  verificationSecret: string;
  expiresIn: string;
  issuer: string;
  algorithm: Algorithm;
  audience: string;
}

// 2. Конфигурация JWT
const getJwtConfig = (): JwtConfig => {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  const verificationSecret = process.env.JWT_VERIFICATION_SECRET;
  
  if (!secret || !verificationSecret) {
    throw new Error('JWT секреты не настроены');
  }

  return {
    secret,
    verificationSecret,
    expiresIn: '30d',
    issuer: 'trowool-api',
    algorithm: 'HS256',
    audience: 'trowool-client'
  };
};

// 3. Сериализация cookies
const serializeCookieOptions = (options: CookieOptions): string => {
  return [
    options.expires && `Expires=${options.expires.toUTCString()}`,
    options.maxAge && `Max-Age=${options.maxAge}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
    options.httpOnly && 'HttpOnly',
    options.secure && 'Secure',
    options.domain && `Domain=${options.domain}`
  ].filter(Boolean).join('; ');
};

// 4. Основной сервис аутентификации
export const AuthService = {
  jwtConfig: getJwtConfig(),

  // 4.1. Хэширование пароля
  async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new Error('Пароль должен содержать минимум 8 символов');
    }
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  },

  // 4.2. Сравнение паролей
  async comparePasswords(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  },

  // 4.3. Генерация JWT токена
  generateToken(payload: TokenPayload): string {
    if (!payload.userId || !payload.email) {
      throw new Error('Missing required fields in token payload');
    }

    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      email_verified: !!payload.email_verified,
      role: payload.role || 'user',
      iss: this.jwtConfig.issuer,
      iat: Math.floor(Date.now() / 1000),
      aud: this.jwtConfig.audience
    };

    return jwt.sign(
      tokenPayload,
      this.jwtConfig.secret,
      {
        expiresIn: this.jwtConfig.expiresIn,
        algorithm: this.jwtConfig.algorithm
      } as SignOptions
    );
  },

  // 4.4. Генерация токена подтверждения email
  generateVerificationToken(userId: number): string {
    if (!Number.isInteger(userId)) {
      throw new Error('Некорректный ID пользователя');
    }

    const payload = {
      userId,
      purpose: 'email_verification',
      iss: this.jwtConfig.issuer,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(
      payload,
      this.jwtConfig.verificationSecret,
      {
        expiresIn: '24h',
        algorithm: this.jwtConfig.algorithm
      } as SignOptions
    );
  },

  // 4.5. Верификация токена
  verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.jwtConfig.secret, {
      issuer: this.jwtConfig.issuer,
      algorithms: [this.jwtConfig.algorithm],
      audience: this.jwtConfig.audience
    }) as TokenPayload;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      email_verified: !!decoded.email_verified
    };
  },

  // 4.6. Поиск пользователя по email
  async findUserByEmail(email: string, client?: PoolClient): Promise<UserData | null> {
    if (!email.includes('@')) {
      throw new Error('Некорректный email');
    }

    const dbClient = client || await pool.connect();
    const shouldRelease = !client;
    
    try {
      const { rows } = await dbClient.query<UserData>(
        `SELECT id, email, password_hash, full_name, phone, nickname, 
         email_verified FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );
      return rows[0] || null;
    } finally {
      if (shouldRelease) {
        dbClient.release();
      }
    }
  },

  // 4.7. Установка cookies аутентификации
  setAuthCookies(res: NextApiResponse, token: string, userData: Omit<UserData, 'password_hash'>) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const options: CookieOptions = {
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60,
      domain: process.env.COOKIE_DOMAIN,
      httpOnly: true
    };

    res.setHeader('Set-Cookie', [
      `authToken=${token}; ${serializeCookieOptions(options)}`,
      `user=${encodeURIComponent(JSON.stringify(userData))}; ${
        serializeCookieOptions({ ...options, httpOnly: false })
      }`
    ]);
  },

  // 4.8. Очистка cookies
  clearAuthCookies(res: NextApiResponse) {
    const options: CookieOptions = {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      domain: process.env.COOKIE_DOMAIN
    };

    res.setHeader('Set-Cookie', [
      `authToken=; ${serializeCookieOptions({ ...options, httpOnly: true })}`,
      `user=; ${serializeCookieOptions({ ...options, httpOnly: false })}`
    ]);
  },

  // 4.9. Обновление времени последнего входа
  async updateLastLogin(userId: number, client?: PoolClient): Promise<void> {
    const dbClient = client || await pool.connect();
    const shouldRelease = !client;
    
    try {
      await dbClient.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [userId]
      );
    } finally {
      if (shouldRelease) {
        dbClient.release();
      }
    }
  }
};

// Проверка инициализации
console.log('Сервис аутентификации инициализирован');