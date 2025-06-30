import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DefaultSession } from 'next-auth';
import { AuthService } from '../../../lib/utils/auth';
import Cors from 'cors';

const cors = Cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
});

// 1. Корректное объявление типов
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    verified?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      verified?: boolean;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await AuthService.findUserByEmail(credentials.email);
          
          if (!user || !user.password_hash) {
            return null;
          }

          const isValid = await AuthService.comparePasswords(
            credentials.password, 
            user.password_hash
          );
          
          if (!isValid) return null;

          await AuthService.updateLastLogin(user.id);

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.full_name || null,
            verified: user.email_verified || false
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (token.sub && session.user) {
        session.user = {
          ...session.user,
          id: token.sub,
          email: token.email as string,
          name: token.name as string | null | undefined,
          verified: token.verified as boolean | undefined
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.verified = user.verified;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    error: '/auth/error'
  },
  jwt: {
    secret: AuthService.jwtConfig.secret,
    encode: async ({ secret, token }) => {
      if (!token || !token.sub) return '';
      return AuthService.generateToken({
        userId: parseInt(token.sub),
        email: token.email as string,
        role: 'user'
      });
    },
    decode: async ({ secret, token }) => {
      if (!token) return null;
      try {
        return AuthService.verifyToken(token as string) as any;
      } catch (error) {
        console.error('JWT decode error:', error);
        return null;
      }
    }
  }
};

export default NextAuth(authOptions);