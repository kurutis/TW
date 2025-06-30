import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../lib/utils/auth';
import pool from '../../../lib/utils/db';
import Cors from 'cors';

const cors = Cors({
  origin: ['http://localhost:5173', 'https://trowool.com'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS middleware
  await new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, nickname, full_name, phone } = req.body;

  // Validate required fields
  if (!email || !password || !nickname) {
    return res.status(400).json({ 
      error: 'Email, password and nickname are required',
      fields: { email: !!email, password: !!password, nickname: !!nickname }
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check for existing email
    const emailCheck = await client.query(
      'SELECT id FROM users WHERE email = $1', 
      [email.toLowerCase().trim()]
    );
    
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Email already registered',
        field: 'email',
        type: 'EMAIL_EXISTS'
      });
    }

    // Check for existing nickname
    const nicknameCheck = await client.query(
      'SELECT id FROM users WHERE nickname = $1',
      [nickname]
    );
    
    if (nicknameCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Nickname already taken',
        field: 'nickname',
        type: 'NICKNAME_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(password);

    // Create user
    const { rows } = await client.query(
      `INSERT INTO users 
       (email, password_hash, nickname, full_name, phone) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, nickname, full_name, phone`,
      [email, passwordHash, nickname, full_name || null, phone || null]
    );

    await client.query('COMMIT');

    // Generate token
    const token = AuthService.generateToken({
      userId: rows[0].id,
      email: rows[0].email
    });

    // Set cookies
    AuthService.setAuthCookies(res, token, {
      id: rows[0].id,
      email: rows[0].email,
      nickname: rows[0].nickname
    });

    return res.status(201).json({
      user: rows[0],
      token
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && {
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    });
  } finally {
    client.release();
  }
}