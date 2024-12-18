import { compare } from "bcrypt-ts";
import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleAuthProvider from 'next-auth/providers/google';

import { getUser } from "@/db/queries";

import { authConfig } from "./auth.config";

console.log("[auth.ts] process.env.GOOGLE_CLIENT_ID > ",process.env.GOOGLE_CLIENT_ID,)
console.log("[auth.ts] process.env.GOOGLE_CLIENT_SECRET > ",process.env.GOOGLE_CLIENT_SECRET,)

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  debug: true,
  logger: {
    error: (error) => {
      console.log(">>> Error ", error);
      
    }
  },
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        let users = await getUser(email);
        if (users.length === 0) return null;
        let passwordsMatch = await compare(password, users[0].password!);
        if (passwordsMatch) return users[0] as any;
      },
    }),
    GoogleAuthProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      }
    }),
  ],
  callbacks: {
    async signIn({ account, user, profile, email, credentials }) {
      try {
        console.log(">>> Account: ", account);
        console.log(">>> User: ", user);
        console.log(">>> profile: ", profile);
        console.log(">>> email: ", email);
        console.log(">>> credentials: ", credentials);
        
        // if (!account) throw new Error("Invalid account data");
        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});
