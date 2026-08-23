import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isLoginPage = pathname === "/login";
      const isPublicAsset = pathname.startsWith("/_next") || pathname.includes("/favicon.ico");
      const isAuthApi = pathname.startsWith("/api/auth");

      if (isPublicAsset || isAuthApi) {
        return true;
      }

      // If logged in and on login page or home page, redirect to /dashboard
      if (isLoggedIn && (isLoginPage || pathname === "/")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // If not logged in and accessing protected pages
      if (!isLoggedIn && (pathname.startsWith("/dashboard") || pathname.startsWith("/document"))) {
        return false; // redirects to signIn page (/login)
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.avatarColor = (user as any).avatarColor;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.avatarColor = token.avatarColor as string;
      }
      return session;
    },
  },
  providers: [], // Added in auth.ts with Node.js runtime logic (bcrypt/prisma)
};
