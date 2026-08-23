# Phase 2: Authentication (Seeded Users + Login)

**Estimated Time:** 45 minutes  
**Priority:** 🔴 Critical  
**Dependencies:** Phase 1 (Database + Users table)

---

## 2.1 — Auth Strategy

### Approach: NextAuth.js v5 with Credentials Provider

**Why this approach:**
- Lightweight — no external OAuth provider needed
- Seeded demo users — reviewers can test immediately
- JWT sessions — stateless, no session table needed
- Simple — minimal code, maximum functionality

**Auth Flow:**
```
User visits app → Redirected to /login → Enters credentials
→ NextAuth validates against DB → JWT issued → Session established
→ User redirected to /dashboard
```

**Seeded Test Accounts:**
| User | Email | Password |
|---|---|---|
| Alice Johnson | alice@ajaia.com | password123 |
| Bob Smith | bob@ajaia.com | password123 |
| Charlie Brown | charlie@ajaia.com | password123 |

---

## 2.2 — NextAuth Configuration

### File: `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.avatarColor = (user as any).avatarColor
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        (session.user as any).avatarColor = token.avatarColor as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
```

### Key Implementation Details:
1. **`authorize` function** — Looks up user by email, compares hashed password
2. **JWT callbacks** — Embed `id` and `avatarColor` into the JWT token
3. **Session callbacks** — Expose `id` and `avatarColor` in the session object
4. **Custom sign-in page** — Redirect to our styled `/login` page

---

## 2.3 — API Route Handler

### File: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

---

## 2.4 — TypeScript Type Extensions

### File: `src/types/next-auth.d.ts`

```typescript
import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    avatarColor?: string
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      avatarColor: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    avatarColor: string
  }
}
```

---

## 2.5 — Session Provider (Client Wrapper)

### File: `src/components/providers/SessionProvider.tsx`

```typescript
"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

### Update `src/app/layout.tsx`:
```tsx
import SessionProvider from "@/components/providers/SessionProvider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

---

## 2.6 — Login Page

### File: `src/app/(auth)/login/page.tsx`

**Design Requirements:**
- Full-page centered login form
- Dark mode background with glassmorphism card
- Animated gradient background
- Form fields: Email + Password
- "Sign In" button with loading state
- Error message display for invalid credentials
- Demo accounts listed below the form for easy reviewer access
- Subtle entrance animation

**UI Wireframe:**
```
┌──────────────────────────────────────────────┐
│          [Animated Gradient Background]        │
│                                                │
│         ┌──────────────────────────┐           │
│         │    🔒 Ajaia Docs         │           │
│         │                          │           │
│         │  Email                   │           │
│         │  ┌──────────────────┐    │           │
│         │  │ alice@ajaia.com  │    │           │
│         │  └──────────────────┘    │           │
│         │                          │           │
│         │  Password                │           │
│         │  ┌──────────────────┐    │           │
│         │  │ ••••••••••       │    │           │
│         │  └──────────────────┘    │           │
│         │                          │           │
│         │  [    Sign In     ]      │           │
│         │                          │           │
│         │  ⚠ Invalid credentials   │  ← error │
│         │                          │           │
│         │  ─── Demo Accounts ───   │           │
│         │  alice@ajaia.com         │           │
│         │  bob@ajaia.com           │           │
│         │  charlie@ajaia.com       │           │
│         │  Password: password123   │           │
│         └──────────────────────────┘           │
└──────────────────────────────────────────────┘
```

**Key Interactions:**
- Form submits via `signIn("credentials", { ... })`
- On success → redirect to `/dashboard`
- On failure → show error toast/message
- Loading spinner on submit button during auth

---

## 2.7 — Auth Guard (Middleware)

### File: `src/middleware.ts`

```typescript
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname === "/login"
  const isOnApiAuth = req.nextUrl.pathname.startsWith("/api/auth")
  const isOnPublicPage = req.nextUrl.pathname === "/"

  // Allow API auth routes and public page
  if (isOnApiAuth || isOnPublicPage) return

  // Redirect logged-in users away from login page
  if (isLoggedIn && isOnLoginPage) {
    return Response.redirect(new URL("/dashboard", req.nextUrl))
  }

  // Redirect non-logged-in users to login
  if (!isLoggedIn && !isOnLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

### Protection Logic:
| Route | Logged In | Not Logged In |
|---|---|---|
| `/` | Dashboard redirect | Show landing or login |
| `/login` | Redirect to `/dashboard` | Show login form |
| `/dashboard` | ✅ Access | Redirect to `/login` |
| `/document/[id]` | ✅ Access | Redirect to `/login` |
| `/api/auth/*` | ✅ Pass through | ✅ Pass through |
| `/api/*` | ✅ Access | 401 Unauthorized |

---

## 2.8 — Helper: Get Current User

### File: `src/lib/auth-helpers.ts`

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarColor: true,
    },
  })
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}
```

---

## 2.9 — Verification Checklist

- [ ] Login page renders at `/login`
- [ ] Can log in with alice@ajaia.com / password123
- [ ] Invalid credentials show error message
- [ ] After login, redirected to `/dashboard`
- [ ] Visiting protected routes while logged out redirects to `/login`
- [ ] Session persists across page refreshes
- [ ] Can sign out and be redirected to login
- [ ] JWT token includes user ID and avatar color

---

## Files Created in This Phase

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | NextAuth configuration |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth API route handler |
| `src/types/next-auth.d.ts` | TypeScript type extensions |
| `src/components/providers/SessionProvider.tsx` | Client session wrapper |
| `src/app/(auth)/login/page.tsx` | Login page UI |
| `src/middleware.ts` | Auth middleware/route protection |
| `src/lib/auth-helpers.ts` | Server-side auth utilities |
