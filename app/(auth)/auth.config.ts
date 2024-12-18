import { request } from 'http';
import { NextAuthConfig } from 'next-auth';

console.log("[auth.config.ts] process.env.GOOGLE_CLIENT_ID > ", process.env.GOOGLE_CLIENT_ID,)
console.log("[auth.config.ts] process.env.GOOGLE_CLIENT_SECRET > ", process.env.GOOGLE_CLIENT_SECRET,)

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    // TODO: Implement proper authorization logic for Google Auth provider.
    // - Add the Google Auth provider in the `providers` section dynamically (if not already added).
    // - Ensure that the `authorized` callback correctly checks the Google authentication token.
    // - Handle edge cases such as expired tokens, invalid sessions, and proper redirection for unauthenticated users.
    // - Test the integration with Google's OAuth2 API and validate token responses.
    // - Add unit tests to cover scenarios like successful login, failed login, and token expiration.
    authorized({ auth, request: { nextUrl } }) {
      // let isLoggedIn = !!auth?.user;
      // let isOnChat = nextUrl.pathname.startsWith('/');
      // let isOnRegister = nextUrl.pathname.startsWith('/register');
      // let isOnLogin = nextUrl.pathname.startsWith('/login');

      // if (isLoggedIn && (isOnLogin || isOnRegister)) {
      //   return Response.redirect(new URL('/', nextUrl as unknown as URL));
      // }

      // if (isOnRegister || isOnLogin) {
      //   return true; // Always allow access to register and login pages
      // }

      // if (isOnChat) {
      //   if (isLoggedIn) return true;
      //   return false; // Redirect unauthenticated users to login page
      // }

      // if (isLoggedIn) {
      //   return Response.redirect(new URL('/', nextUrl as unknown as URL));
      // }

      return true;
    },
  },
} satisfies NextAuthConfig;
