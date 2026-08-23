# AI-Native Engineering Workflow & Reflection Note

## 1. Overview & Tooling

As an AI-forward developer, AI was leveraged as an active pair programmer to accelerate scaffolding, explore architectural tradeoffs, generate parsers, and write automated test suites — while maintaining human judgment on system boundaries, security enforcement, and code quality.

### Primary AI Tools Used:
- **Google Antigravity (Advanced Agentic Assistant)**: Architectural planning, code generation, refactoring, and test suite creation.
- **Deep Web Search Integration**: Real-time evaluation of 2025/2026 library ecosystems (e.g. TipTap v2 vs. Lexical, NextAuth v5 App Router conventions, Neon vs. Turso serverless storage).

---

## 2. Where AI Materially Sped Up Work

1. **Rapid Exploration & Tech Stack Evaluation (~45 min saved)**:
   - Researched editor libraries (TipTap vs. Lexical vs. Slate) to select the right trade-off between extensibility and delivery velocity.
   - Evaluated serverless database persistence choices for Vercel, confirming that Neon PostgreSQL prevents data loss from ephemeral disk resets.
2. **Lexer & AST Parser Generation (~60 min saved)**:
   - Generated initial parsing logic for converting raw Markdown and Plain Text streams into TipTap ProseMirror AST nodes (handling headings, lists, blockquotes, and nested marks).
3. **Automated Test Scaffolding (~30 min saved)**:
   - Generated 16 comprehensive unit and integration tests across file parsers, date formatters, text snippet extractors, debounce timers, and UI components using Vitest.
4. **Boilerplate Reduction**:
   - Accelerated the creation of Prisma models, NextAuth callbacks, and styled-jsx / CSS design tokens.

---

## 3. What AI Output Was Changed or Rejected

True product engineering requires exercising critical judgment over AI suggestions rather than blind acceptance:

| AI Initial Suggestion | Engineering Decision | Rationale |
|---|---|---|
| **Local SQLite File (`dev.db`)** | **Rejected** → Replaced with Neon Serverless PostgreSQL | SQLite local files fail on serverless deployments (like Vercel) due to read-only ephemeral function containers. |
| **TailwindCSS Class Injections** | **Rejected** → Replaced with Scoped CSS & Design System Tokens | Custom CSS variables and glassmorphism styling provided greater aesthetic control and cleaner separation of concerns. |
| **Bundling Full Auth in Middleware** | **Refactored** → Separated `auth.config.ts` (Edge-safe) from `auth.ts` (Node runtime) | NextAuth v5 middleware threw Edge Runtime warnings when importing `bcryptjs` and `prisma`. Splitting the config ensured zero build warnings. |
| **Naive Markdown Regex** | **Rewritten** → Implemented full inline mark tokenizer | The initial AI regex failed on mixed bold (`**`) and italic (`*`) text or code spans on the same line. Rewrote `parseInlineMarks` with a loop-based token collector. |
| **Complex Multi-Step Upload Service** | **Simplified** → Direct stream parsing to document creation | Rejected storing static files in separate object storage (S3/Blob). Instead, directly parsed the uploaded stream into a native `Document` record, reducing architecture overhead. |

---

## 4. Verification & Correctness Methodology

To ensure production reliability and prevent subtle bugs:

1. **Automated Unit & Integration Testing**:
   - Executed `npm test` via Vitest across 3 test suites with 16 assertions validating parser accuracy and utility edge cases.
2. **Production Compilation & Edge Auditing**:
   - Executed `npm run build` to verify clean static page generation, type safety, and zero Edge runtime violations.
3. **Cross-Account Role & Permission Verification**:
   - Manually tested access boundaries across all 3 seeded accounts:
     - Verified that Alice (Owner) can rename, share, and delete.
     - Verified that Bob (Editor) can edit document content but cannot delete or revoke access.
     - Verified that Charlie (Uninvited) receives `403 Access Denied` upon direct document navigation.
4. **Resilience Testing**:
   - Tested large file uploads (>5MB), unsupported file types (.pdf, .jpg), and network error simulations.
