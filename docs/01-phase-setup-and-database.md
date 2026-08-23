# Phase 1: Project Setup & Database Schema

**Estimated Time:** 30 minutes  
**Priority:** 🔴 Critical  
**Dependencies:** None (first phase)

---

## 1.1 — Initialize Next.js Project

### Steps:
1. Run `npx -y create-next-app@latest ./` with the following options:
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: **No** (we use vanilla CSS)
   - `src/` directory: Yes
   - App Router: Yes
   - Import alias: `@/*`

2. Verify the project runs with `npm run dev`

### Commands:
```bash
npx -y create-next-app@latest ./ --typescript --eslint --no-tailwind --src-dir --app --import-alias "@/*" --use-npm
```

---

## 1.2 — Install Core Dependencies

### Production Dependencies:
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-placeholder
npm install @prisma/client next-auth@beta bcryptjs
npm install mammoth                    # For .docx file parsing
```

### Dev Dependencies:
```bash
npm install -D prisma @types/bcryptjs
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

### Package Purposes:
| Package | Purpose |
|---|---|
| `@tiptap/react` | React bindings for TipTap editor |
| `@tiptap/pm` | ProseMirror core (required by TipTap) |
| `@tiptap/starter-kit` | Bold, Italic, Headings, Lists, etc. |
| `@tiptap/extension-underline` | Underline formatting support |
| `@tiptap/extension-placeholder` | Placeholder text when editor is empty |
| `@prisma/client` | Database client |
| `next-auth` | Authentication |
| `bcryptjs` | Password hashing |
| `mammoth` | .docx → HTML converter |
| `prisma` | Schema management & migrations |
| `vitest` | Test runner |

---

## 1.3 — Database Setup (Neon PostgreSQL)

### Steps:
1. Create a free Neon project at https://neon.tech
2. Copy the connection string
3. Create `.env` file with database URL

### Environment Variables (`.env`):
```env
# Database
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/ajaia_docs?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### `.env.example`:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 1.4 — Prisma Schema

### File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(cuid())
  name          String
  email         String     @unique
  passwordHash  String
  avatarColor   String     @default("#6366f1")  // For UI avatar
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // Relations
  ownedDocuments  Document[]      @relation("DocumentOwner")
  sharedDocuments DocumentShare[] @relation("SharedWith")

  @@map("users")
}

model Document {
  id        String   @id @default(cuid())
  title     String   @default("Untitled Document")
  content   Json?    // TipTap JSON content (preserves formatting)
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  owner  User            @relation("DocumentOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  shares DocumentShare[]

  @@index([ownerId])
  @@map("documents")
}

model DocumentShare {
  id          String   @id @default(cuid())
  documentId  String
  userId      String
  permission  String   @default("view")  // "view" | "edit"
  createdAt   DateTime @default(now())

  // Relations
  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user     User     @relation("SharedWith", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([documentId, userId])  // Can't share same doc with same user twice
  @@index([userId])
  @@map("document_shares")
}
```

### Schema Design Decisions:
1. **`content` as `Json`** — TipTap outputs structured JSON. Storing as JSON preserves all formatting and structure natively. No serialization/deserialization overhead.
2. **`DocumentShare` as junction table** — Clean many-to-many relationship. Supports adding permissions later.
3. **`permission` field** — Future-proofing for view vs. edit access (stretch goal: role-based permissions).
4. **`avatarColor`** — Simple UI touch for user avatars without needing image uploads.
5. **Cascade deletes** — Deleting a user removes their docs; deleting a doc removes its shares.

---

## 1.5 — Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 1.6 — Prisma Client Singleton

### File: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

This prevents multiple Prisma instances during Next.js hot reloads in development.

---

## 1.7 — Seed Data

### File: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@ajaia.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@ajaia.com',
      passwordHash: await bcrypt.hash('password123', 10),
      avatarColor: '#6366f1',
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@ajaia.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@ajaia.com',
      passwordHash: await bcrypt.hash('password123', 10),
      avatarColor: '#ec4899',
    },
  })

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@ajaia.com' },
    update: {},
    create: {
      name: 'Charlie Brown',
      email: 'charlie@ajaia.com',
      passwordHash: await bcrypt.hash('password123', 10),
      avatarColor: '#f59e0b',
    },
  })

  // Create sample documents for Alice
  const doc1 = await prisma.document.create({
    data: {
      title: 'Welcome to Ajaia Docs',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Welcome to Ajaia Docs' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This is a collaborative document editor. Try editing this document!' },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Features' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Rich text editing' }, { type: 'text', text: ' with formatting toolbar' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'Document sharing' }, { type: 'text', text: ' with other users' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'underline' }], text: 'File upload' }, { type: 'text', text: ' to create new documents' }] }],
              },
            ],
          },
        ],
      },
      ownerId: alice.id,
    },
  })

  // Share doc1 with Bob
  await prisma.documentShare.create({
    data: {
      documentId: doc1.id,
      userId: bob.id,
      permission: 'edit',
    },
  })

  console.log('✅ Seed data created successfully')
  console.log('   Demo accounts:')
  console.log('   - alice@ajaia.com / password123')
  console.log('   - bob@ajaia.com / password123')
  console.log('   - charlie@ajaia.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### Add seed script to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run with: `npx prisma db seed`

---

## 1.8 — Verification Checklist

- [ ] Next.js app runs on http://localhost:3000
- [ ] Prisma schema compiles without errors
- [ ] Migration creates tables in Neon
- [ ] Seed data populates 3 users + 1 sample document
- [ ] `prisma studio` shows correct data (`npx prisma studio`)
- [ ] `.env.example` created (no secrets committed)
- [ ] `.gitignore` includes `.env`, `node_modules`, `.next`

---

## Files Created in This Phase

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Demo data seeder |
| `src/lib/prisma.ts` | Prisma client singleton |
| `.env` | Environment variables (local only) |
| `.env.example` | Template for environment variables |
| `package.json` | Updated with dependencies + seed script |
