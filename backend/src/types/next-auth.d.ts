import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    verified?: boolean;
  }

  interface Session {
    user: {
      id: string;
      verified?: boolean;
      name?: string;
      email?: string;
    };
  }
}