# Phase 3: Document CRUD + Rich Text Editor

**Estimated Time:** 90 minutes  
**Priority:** 🔴 Critical  
**Dependencies:** Phase 1 (Database), Phase 2 (Auth)

---

## 3.1 — Overview

This is the **core phase** of the application. We build:
1. **Dashboard** — List all owned + shared documents
2. **Document CRUD API** — Create, Read, Update, Delete endpoints
3. **TipTap Editor** — Rich text editor with formatting toolbar
4. **Auto-save** — Debounced save on content change

---

## 3.2 — Document API Routes

### 3.2.1 — List Documents: `GET /api/documents`

**File:** `src/app/api/documents/route.ts`

```typescript
// Returns all documents the current user owns OR has been shared with
// Response shape:
{
  owned: Document[],    // Documents user created
  shared: Document[],   // Documents shared with user (includes owner info)
}
```

**Query Logic:**
```sql
-- Owned documents
SELECT * FROM documents WHERE ownerId = :userId ORDER BY updatedAt DESC

-- Shared documents (with owner info)
SELECT d.*, u.name as ownerName, u.avatarColor as ownerAvatar
FROM documents d
JOIN document_shares ds ON d.id = ds.documentId
JOIN users u ON d.ownerId = u.id
WHERE ds.userId = :userId
ORDER BY ds.createdAt DESC
```

### 3.2.2 — Create Document: `POST /api/documents`

**Request Body:**
```json
{
  "title": "My New Document",         // optional, defaults to "Untitled Document"
  "content": { ... }                  // optional, TipTap JSON content
}
```

**Response:** Full document object with `201 Created`

### 3.2.3 — Get Document: `GET /api/documents/[id]`

**File:** `src/app/api/documents/[id]/route.ts`

**Authorization Logic:**
1. Check if user is the document owner → ✅ Full access
2. Check if user has a DocumentShare entry → ✅ Access with permission level
3. Neither → `403 Forbidden`

**Response:**
```json
{
  "id": "...",
  "title": "Document Title",
  "content": { /* TipTap JSON */ },
  "owner": { "id": "...", "name": "Alice", "avatarColor": "#6366f1" },
  "permission": "owner" | "edit" | "view",
  "shares": [...],        // Only included if user is owner
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 3.2.4 — Update Document: `PATCH /api/documents/[id]`

**Request Body (partial):**
```json
{
  "title": "Updated Title",           // optional
  "content": { /* TipTap JSON */ }    // optional
}
```

**Authorization:** Owner or shared user with `edit` permission

### 3.2.5 — Delete Document: `DELETE /api/documents/[id]`

**Authorization:** Owner only (cascade deletes shares)

---

## 3.3 — Dashboard Page

### File: `src/app/(dashboard)/dashboard/page.tsx`

**Layout Design:**
```
┌──────────────────────────────────────────────────────────────┐
│  Header: [Logo] Ajaia Docs          [Avatar] Alice ▾ [⚙]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─── Action Bar ──────────────────────────────────────────┐ │
│  │  [+ New Document]  [📤 Upload File]     🔍 Search...    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  📁 My Documents (3)                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 📄       │  │ 📄       │  │ 📄       │                  │
│  │ Welcome  │  │ Meeting  │  │ Project  │                  │
│  │ to Ajaia │  │ Notes    │  │ Brief    │                  │
│  │          │  │          │  │          │                  │
│  │ Aug 23   │  │ Aug 22   │  │ Aug 21   │                  │
│  │ [⋯]      │  │ [⋯]      │  │ [⋯]      │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                              │
│  🔗 Shared with Me (1)                                      │
│  ┌──────────┐                                                │
│  │ 📄       │                                                │
│  │ Design   │                                                │
│  │ System   │                                                │
│  │ by Bob   │                                                │
│  │ Aug 20   │                                                │
│  └──────────┘                                                │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Section separation** — "My Documents" vs "Shared with Me" clearly distinguished
- **Document cards** — Show title, preview snippet, last modified date, owner
- **Three-dot menu** on each card — Rename, Share, Delete (owner only)
- **New Document button** — Creates blank document, redirects to editor
- **Upload File button** — Opens file upload modal (Phase 4)
- **Search filter** — Client-side search by document title
- **Empty states** — Friendly messages when no documents exist
- **Hover animations** — Cards lift on hover with subtle shadow

### Document Card Component

**File:** `src/components/dashboard/DocumentCard.tsx`

Props:
```typescript
interface DocumentCardProps {
  id: string
  title: string
  updatedAt: string
  isOwner: boolean
  ownerName?: string
  ownerAvatar?: string
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
  onShare: (id: string) => void
}
```

**Card States:**
- Default — Subtle background, border
- Hover — Elevated shadow, slight scale
- Menu open — Highlighted border
- Loading — Skeleton placeholder

---

## 3.4 — TipTap Rich Text Editor

### 3.4.1 — Editor Component

**File:** `src/components/editor/TipTapEditor.tsx`

```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'

interface TipTapEditorProps {
  content: any           // TipTap JSON
  onUpdate: (json: any) => void
  editable: boolean
}
```

**Extensions Used:**
| Extension | Feature | Source |
|---|---|---|
| StarterKit | Bold, Italic, Strike, Headings (H1-H3), BulletList, OrderedList, Blockquote, Code, HorizontalRule, Undo/Redo | `@tiptap/starter-kit` |
| Underline | Underline formatting | `@tiptap/extension-underline` |
| Placeholder | "Start typing..." placeholder | `@tiptap/extension-placeholder` |

### 3.4.2 — Editor Toolbar

**File:** `src/components/editor/EditorToolbar.tsx`

**Toolbar Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ [B] [I] [U] [S] │ [H1] [H2] [H3] │ [•] [1.] [❝] │ [↩] [↪] │
│ Bold Italic Under Strike  Headings    Lists  Quote  Undo Redo│
└──────────────────────────────────────────────────────────────┘
```

**Button States:**
- **Default** — Subtle, muted icon
- **Active** (formatting applied) — Highlighted background, bold icon
- **Hover** — Background tint, tooltip showing shortcut
- **Disabled** (view-only mode) — Grayed out

**Keyboard Shortcuts (provided by TipTap):**
| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + Shift + S` | Strikethrough |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |

### 3.4.3 — Editor Page

**File:** `src/app/(editor)/document/[id]/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  [← Back]   Document Title (editable)      [Share] [⋯ More] │
├──────────────────────────────────────────────────────────────┤
│  [B] [I] [U] [S] | [H1] [H2] [H3] | [•] [1.] [❝] | [↩] [↪]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│     Start typing your document here...                       │
│                                                              │
│     The editor supports rich text formatting.                │
│     Try using the toolbar above or keyboard shortcuts.       │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  💾 Saved • Last edit: 2 min ago                  Word: 42  │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
1. **Inline title editing** — Click document title to rename (blur to save)
2. **Auto-save** — Debounced save (1.5 second delay after last keystroke)
3. **Save indicator** — "Saving...", "Saved ✓", "Error saving"
4. **Word count** — Bottom status bar
5. **Back button** — Return to dashboard
6. **Share button** — Opens share modal (Phase 5)
7. **View-only mode** — If user only has `view` permission, toolbar is disabled and editor is read-only
8. **Permission badge** — Shows "Owner", "Can Edit", or "View Only"

---

## 3.5 — Auto-Save Implementation

```typescript
// Debounced auto-save logic
const SAVE_DELAY = 1500 // ms

const saveDocument = useCallback(
  debounce(async (content: any) => {
    setSaveStatus('saving')
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
    }
  }, SAVE_DELAY),
  [documentId]
)

// Called on every editor update
editor.on('update', ({ editor }) => {
  const json = editor.getJSON()
  saveDocument(json)
})
```

**Save Status States:**
| State | Display | Icon |
|---|---|---|
| `idle` | "" | — |
| `saving` | "Saving..." | ⟳ spinner |
| `saved` | "Saved" | ✓ checkmark |
| `error` | "Error saving" | ⚠ warning |

---

## 3.6 — Title Rename Flow

**In Dashboard:**
1. Click three-dot menu → "Rename"
2. Title becomes editable input field
3. Press Enter or blur → saves via `PATCH /api/documents/[id]`
4. Escape → cancel rename

**In Editor:**
1. Click the document title text
2. It becomes an editable input
3. Blur or Enter → saves title
4. Title update happens independently from content auto-save

---

## 3.7 — Editor CSS Styling

```css
/* Editor content styles — since TipTap is headless */
.ProseMirror {
  min-height: 60vh;
  padding: 2rem;
  font-family: 'Georgia', serif;   /* Document-like feel */
  font-size: 1rem;
  line-height: 1.75;
  color: var(--text-primary);
  outline: none;
}

.ProseMirror h1 { font-size: 2rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
.ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
.ProseMirror h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }

.ProseMirror p { margin: 0.5rem 0; }

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror blockquote {
  border-left: 3px solid var(--accent-primary);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--text-secondary);
  font-style: italic;
}

.ProseMirror code {
  background: var(--surface-secondary);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9em;
}

.ProseMirror .is-empty::before {
  content: attr(data-placeholder);
  color: var(--text-muted);
  pointer-events: none;
  float: left;
  height: 0;
}
```

---

## 3.8 — API Error Handling Patterns

```typescript
// Standard API response helpers
function successResponse(data: any, status = 200) {
  return Response.json(data, { status })
}

function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

// Common error cases:
// 401 — Not authenticated
// 403 — Not authorized (not owner, not shared)
// 404 — Document not found
// 422 — Invalid input (bad title, malformed content)
// 500 — Server error
```

---

## 3.9 — Verification Checklist

- [ ] Dashboard loads and shows documents
- [ ] "My Documents" section shows owned docs
- [ ] "Shared with Me" section shows shared docs (with owner info)
- [ ] Can create a new document → redirects to editor
- [ ] Editor loads with TipTap and document content
- [ ] Toolbar buttons work: Bold, Italic, Underline, Strike
- [ ] Toolbar buttons work: H1, H2, H3 headings
- [ ] Toolbar buttons work: Bullet list, Ordered list, Blockquote
- [ ] Undo/Redo works via toolbar and keyboard
- [ ] Active formatting state shows on toolbar buttons
- [ ] Auto-save triggers after editing (check network tab)
- [ ] Save status indicator works (saving → saved → error)
- [ ] Can rename document from dashboard (three-dot menu)
- [ ] Can rename document from editor (click title)
- [ ] Can delete document from dashboard (owner only)
- [ ] Deleting refreshes the document list
- [ ] View-only mode works for shared users with view permission
- [ ] Editor keyboard shortcuts work
- [ ] Back button returns to dashboard
- [ ] Empty state shows when no documents exist
- [ ] Word count displays correctly

---

## Files Created in This Phase

| File | Purpose |
|---|---|
| `src/app/api/documents/route.ts` | List + Create documents |
| `src/app/api/documents/[id]/route.ts` | Get + Update + Delete document |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard page |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout with header |
| `src/app/(editor)/document/[id]/page.tsx` | Document editor page |
| `src/app/(editor)/layout.tsx` | Editor layout (minimal) |
| `src/components/editor/TipTapEditor.tsx` | TipTap editor component |
| `src/components/editor/EditorToolbar.tsx` | Formatting toolbar |
| `src/components/dashboard/DocumentCard.tsx` | Document card component |
| `src/components/dashboard/DocumentGrid.tsx` | Document grid layout |
| `src/components/layout/Header.tsx` | App header with user menu |
| `src/lib/utils.ts` | Debounce, date formatting, etc. |
