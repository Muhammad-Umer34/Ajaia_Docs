# Phase 7: Testing & Deployment

**Estimated Time:** 30 minutes  
**Priority:** 🔴 Critical  
**Dependencies:** All previous phases

---

## 7.1 — Testing Strategy

### Approach: Focused, meaningful tests over broad coverage.

The assignment asks for "at least one meaningful automated test." We'll provide several focused tests covering the most critical paths.

### Test Categories:
| Category | Tool | What We Test |
|---|---|---|
| API Integration | Vitest | Document CRUD, Share endpoints |
| Component Rendering | Vitest + React Testing Library | Editor toolbar, Document cards |
| Utility Functions | Vitest | Parsers, debounce, auth helpers |

---

## 7.2 — Test Configuration

### File: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
})
```

### File: `tests/setup.ts`

```typescript
import '@testing-library/jest-dom'
```

---

## 7.3 — Test: Document API (Most Meaningful)

### File: `tests/api/documents.test.ts`

This is our "most meaningful" test — it validates the core business logic:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test the core document CRUD logic
describe('Document API', () => {
  describe('POST /api/documents', () => {
    it('creates a new document with default title when none provided', async () => {
      // Mock authenticated session
      // Call POST /api/documents with empty body
      // Assert: 201 status
      // Assert: document has "Untitled Document" title
      // Assert: document has authenticated user as owner
    })

    it('creates a document with provided title and content', async () => {
      // Call POST with { title: "Test Doc", content: { type: "doc", content: [...] } }
      // Assert: document has correct title
      // Assert: document has correct content
    })
  })

  describe('GET /api/documents', () => {
    it('returns owned and shared documents separately', async () => {
      // Setup: Create docs owned by user, share one from another user
      // Call GET /api/documents
      // Assert: response has { owned: [...], shared: [...] }
      // Assert: owned contains user's docs
      // Assert: shared contains docs shared with user
    })
  })

  describe('PATCH /api/documents/[id]', () => {
    it('updates document title', async () => {
      // Create doc, then PATCH with new title
      // Assert: title updated
      // Assert: content unchanged
    })

    it('rejects update from unauthorized user', async () => {
      // Create doc as user A
      // Try to PATCH as user B (no share)
      // Assert: 403 Forbidden
    })

    it('allows update from user with edit permission', async () => {
      // Create doc as user A, share with user B (edit)
      // PATCH as user B
      // Assert: 200 success
    })

    it('rejects update from user with view-only permission', async () => {
      // Create doc as user A, share with user B (view)
      // PATCH as user B
      // Assert: 403 Forbidden
    })
  })

  describe('DELETE /api/documents/[id]', () => {
    it('deletes document and cascade deletes shares', async () => {
      // Create doc with shares
      // DELETE as owner
      // Assert: 200 success
      // Assert: document no longer exists
      // Assert: shares no longer exist
    })

    it('rejects delete from non-owner', async () => {
      // Create doc as user A, share with user B
      // DELETE as user B
      // Assert: 403 Forbidden
    })
  })
})
```

### File: `tests/api/share.test.ts`

```typescript
describe('Share API', () => {
  describe('POST /api/documents/[id]/share', () => {
    it('shares document with another user by email', async () => {
      // Create doc as Alice
      // Share with bob@ajaia.com, permission "edit"
      // Assert: 201
      // Assert: share record created
    })

    it('rejects sharing with non-existent email', async () => {
      // Share with unknown@email.com
      // Assert: 404
    })

    it('rejects self-sharing', async () => {
      // Share with own email
      // Assert: 409
    })

    it('only owner can share', async () => {
      // Create doc as Alice, share with Bob (edit)
      // Bob tries to share with Charlie
      // Assert: 403
    })
  })

  describe('DELETE /api/documents/[id]/share', () => {
    it('revokes share access', async () => {
      // Create share, then revoke
      // Assert: share removed
      // Assert: user no longer has access
    })
  })
})
```

---

## 7.4 — Test: File Parsers

### File: `tests/lib/parsers.test.ts`

```typescript
describe('Markdown Parser', () => {
  it('converts headings correctly', () => {
    const input = '# Hello\n## World'
    const result = parseMdToTipTap(input)
    expect(result.content[0]).toEqual({
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Hello' }],
    })
  })

  it('converts bold and italic inline marks', () => {
    const input = 'This is **bold** and *italic* text'
    const result = parseMdToTipTap(input)
    // Assert bold mark on "bold" text
    // Assert italic mark on "italic" text
  })

  it('converts bullet lists', () => {
    const input = '- Item 1\n- Item 2\n- Item 3'
    const result = parseMdToTipTap(input)
    expect(result.content[0].type).toBe('bulletList')
    expect(result.content[0].content).toHaveLength(3)
  })
})

describe('Plain Text Parser', () => {
  it('converts lines to paragraphs', () => {
    const input = 'Line 1\nLine 2\nLine 3'
    const result = parseTxtToTipTap(input)
    expect(result.content).toHaveLength(3)
    expect(result.content[0].type).toBe('paragraph')
  })

  it('handles empty input', () => {
    const result = parseTxtToTipTap('')
    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('paragraph')
  })
})
```

---

## 7.5 — Test: Component Rendering

### File: `tests/components/EditorToolbar.test.tsx`

```typescript
describe('EditorToolbar', () => {
  it('renders all formatting buttons', () => {
    render(<EditorToolbar editor={mockEditor} />)
    expect(screen.getByTitle('Bold')).toBeInTheDocument()
    expect(screen.getByTitle('Italic')).toBeInTheDocument()
    expect(screen.getByTitle('Underline')).toBeInTheDocument()
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument()
    expect(screen.getByTitle('Bullet List')).toBeInTheDocument()
    expect(screen.getByTitle('Ordered List')).toBeInTheDocument()
  })

  it('shows active state when formatting is applied', () => {
    // Mock editor with bold active
    render(<EditorToolbar editor={mockEditorWithBold} />)
    expect(screen.getByTitle('Bold')).toHaveClass('active')
  })

  it('disables buttons when editor is not editable', () => {
    render(<EditorToolbar editor={mockReadOnlyEditor} />)
    expect(screen.getByTitle('Bold')).toBeDisabled()
  })
})
```

---

## 7.6 — Running Tests

### Package.json Scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Commands:
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

---

## 7.7 — Deployment to Vercel

### Steps:

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit: Ajaia Docs"
git remote add origin https://github.com/YOUR_USERNAME/ajaia-docs.git
git push -u origin main
```

2. **Connect to Vercel:**
   - Go to https://vercel.com/new
   - Import GitHub repository
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`

3. **Set Environment Variables in Vercel:**
   - `DATABASE_URL` → Neon PostgreSQL connection string
   - `NEXTAUTH_SECRET` → Random secret string
   - `NEXTAUTH_URL` → `https://your-app.vercel.app`

4. **Build Configuration:**
```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

5. **Run Migrations on Production DB:**
```bash
# Set production DATABASE_URL locally, then:
npx prisma migrate deploy

# Run seed for demo accounts:
npx prisma db seed
```

6. **Verify Deployment:**
   - Visit the Vercel URL
   - Test login with seeded accounts
   - Create a document, edit it, share it
   - Verify persistence across refreshes

### Vercel Project Settings:
| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `prisma generate && next build` |
| Output Directory | `.next` |
| Node.js Version | 18.x or 20.x |

---

## 7.8 — Pre-Deployment Checklist

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] `.env.example` is up to date
- [ ] `.gitignore` excludes `.env`, `node_modules`, `.next`
- [ ] Database migrations are up to date
- [ ] Seed data creates demo accounts
- [ ] All three demo accounts can log in
- [ ] Document CRUD works end-to-end
- [ ] File upload works for .txt, .md
- [ ] Sharing works between demo users

---

## 7.9 — Post-Deployment Verification

- [ ] Live URL loads
- [ ] Can log in with alice@ajaia.com / password123
- [ ] Can create and edit documents
- [ ] Can upload a file
- [ ] Can share a document with bob@ajaia.com
- [ ] Bob can see shared document in "Shared with Me"
- [ ] Data persists after page refresh
- [ ] Formatting preserves after save and reload
- [ ] Mobile responsive layout works
- [ ] No console errors in production

---

## Files Created in This Phase

| File | Purpose |
|---|---|
| `vitest.config.ts` | Test configuration |
| `tests/setup.ts` | Test setup / imports |
| `tests/api/documents.test.ts` | Document API tests |
| `tests/api/share.test.ts` | Share API tests |
| `tests/lib/parsers.test.ts` | File parser tests |
| `tests/components/EditorToolbar.test.tsx` | Toolbar component tests |
| `.github/workflows/ci.yml` | (Optional) CI pipeline |
