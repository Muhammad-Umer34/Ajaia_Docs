# Phase 4: File Upload & Import

**Estimated Time:** 45 minutes  
**Priority:** 🟡 High  
**Dependencies:** Phase 3 (Document CRUD)

---

## 4.1 — Feature Scope

### What We Build:
Upload a file → Parse its content → Create a new editable document from it.

### Supported File Types:
| Type | Extension | Parser | Strategy |
|---|---|---|---|
| Plain Text | `.txt` | Built-in `TextDecoder` | Split by newlines → paragraphs |
| Markdown | `.md` | Custom markdown parser | Convert headings, bold, italic, lists → TipTap JSON |
| Word Document | `.docx` | `mammoth` library | Extract HTML → convert to TipTap JSON |

### What We Don't Build:
- ❌ Image attachments within documents
- ❌ PDF upload (complex parsing, poor ROI)
- ❌ File version tracking
- ❌ Drag-and-drop upload (nice-to-have, not core)

---

## 4.2 — Upload Flow

```
User clicks "Upload File" on dashboard
  → File picker opens (filtered by .txt, .md, .docx)
    → User selects file
      → Client sends file to POST /api/upload
        → Server validates file type and size
          → Server parses file content
            → Server converts to TipTap JSON format
              → Server creates new Document with parsed content
                → Server returns document ID
                  → Client redirects to editor with new document
```

### Flow Diagram:
```
┌──────────┐    ┌────────────┐    ┌─────────────┐    ┌──────────┐
│  Upload   │──▶│  Validate  │──▶│   Parse &    │──▶│  Create   │
│  Modal    │    │  File      │    │   Convert   │    │  Document │
└──────────┘    └────────────┘    └─────────────┘    └──────────┘
                     │                                      │
                     ▼                                      ▼
                Error toast                         Redirect to editor
```

---

## 4.3 — Upload API

### File: `src/app/api/upload/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. Authenticate user
  const user = await requireAuth()

  // 2. Parse multipart form data
  const formData = await request.formData()
  const file = formData.get('file') as File

  // 3. Validate
  if (!file) return errorResponse("No file provided", 400)
  if (file.size > 5 * 1024 * 1024) return errorResponse("File too large (max 5MB)", 400)

  const ext = getFileExtension(file.name)
  if (!['txt', 'md', 'docx'].includes(ext)) {
    return errorResponse("Unsupported file type. Use .txt, .md, or .docx", 400)
  }

  // 4. Parse content based on file type
  let tiptapContent: any
  const title = file.name.replace(/\.[^/.]+$/, '') // Filename without extension

  switch (ext) {
    case 'txt':
      tiptapContent = await parseTxtToTipTap(file)
      break
    case 'md':
      tiptapContent = await parseMdToTipTap(file)
      break
    case 'docx':
      tiptapContent = await parseDocxToTipTap(file)
      break
  }

  // 5. Create document
  const document = await prisma.document.create({
    data: {
      title,
      content: tiptapContent,
      ownerId: user.id,
    },
  })

  return successResponse({ documentId: document.id }, 201)
}
```

---

## 4.4 — File Parsers

### 4.4.1 — Plain Text Parser

**File:** `src/lib/parsers/txt-parser.ts`

```typescript
export async function parseTxtToTipTap(file: File): Promise<any> {
  const text = await file.text()
  const lines = text.split('\n')

  const content = lines
    .filter(line => line.trim() !== '') // Skip empty lines
    .map(line => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line }],
    }))

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  }
}
```

### 4.4.2 — Markdown Parser

**File:** `src/lib/parsers/md-parser.ts`

**Strategy:** Parse markdown syntax to TipTap JSON nodes.

```typescript
// Handles:
// # H1, ## H2, ### H3 → heading nodes
// **bold** → text with bold mark
// *italic* / _italic_ → text with italic mark
// - item / * item → bulletList
// 1. item → orderedList
// > quote → blockquote
// Plain text → paragraph

export async function parseMdToTipTap(file: File): Promise<any> {
  const text = await file.text()
  const lines = text.split('\n')
  const nodes: any[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: parseInlineMarks(headingMatch[2]),
      })
      i++
      continue
    }

    // Bullet list item
    if (line.match(/^[\-\*]\s+/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^[\-\*]\s+/)) {
        const text = lines[i].replace(/^[\-\*]\s+/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarks(text) }],
        })
        i++
      }
      nodes.push({ type: 'bulletList', content: items })
      continue
    }

    // Ordered list item
    if (line.match(/^\d+\.\s+/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        const text = lines[i].replace(/^\d+\.\s+/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarks(text) }],
        })
        i++
      }
      nodes.push({ type: 'orderedList', content: items })
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      nodes.push({
        type: 'blockquote',
        content: [{
          type: 'paragraph',
          content: parseInlineMarks(line.slice(2)),
        }],
      })
      i++
      continue
    }

    // Empty line → skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Regular paragraph
    nodes.push({
      type: 'paragraph',
      content: parseInlineMarks(line),
    })
    i++
  }

  return {
    type: 'doc',
    content: nodes.length > 0 ? nodes : [{ type: 'paragraph' }],
  }
}

// Parse inline bold/italic marks
function parseInlineMarks(text: string): any[] {
  // Process **bold** and *italic* patterns
  // Returns array of text nodes with appropriate marks
  // ... (regex-based inline parser)
}
```

### 4.4.3 — DOCX Parser

**File:** `src/lib/parsers/docx-parser.ts`

```typescript
import mammoth from 'mammoth'
import { generateJSON } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

export async function parseDocxToTipTap(file: File): Promise<any> {
  const buffer = await file.arrayBuffer()

  // mammoth converts .docx → clean HTML
  const result = await mammoth.convertToHtml({
    arrayBuffer: buffer,
  })

  // TipTap's generateJSON converts HTML → TipTap JSON
  const json = generateJSON(result.value, [
    StarterKit,
    Underline,
  ])

  return json
}
```

**Why mammoth?**
- Industry-standard .docx parser
- Produces clean, semantic HTML
- Handles headings, bold, italic, lists, etc.
- Ignores complex formatting (tables, images) gracefully

---

## 4.5 — Upload Modal Component

### File: `src/components/dashboard/UploadModal.tsx`

**UI Design:**
```
┌──────────────────────────────────────────┐
│  📤 Upload Document                  [✕] │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │     📁 Click to select a file     │  │
│  │     or drag and drop here         │  │
│  │                                    │  │
│  │     Supported: .txt, .md, .docx   │  │
│  │     Max size: 5MB                 │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ── or ──                                │
│                                          │
│  Selected: meeting-notes.md (2.1 KB)     │
│                                          │
│  [Cancel]              [Upload & Create] │
└──────────────────────────────────────────┘
```

**States:**
1. **Empty** — Drop zone with file type info
2. **File selected** — Show filename, size, type icon
3. **Uploading** — Progress spinner, "Creating document..."
4. **Success** — Brief success message, then redirect
5. **Error** — Error message with retry option

**Key UX Decisions:**
- File type restrictions shown clearly BEFORE upload
- Max file size (5MB) stated in the UI
- Selected file can be changed before uploading
- Cancel button available at all stages

---

## 4.6 — Validation Rules

| Rule | Limit | Error Message |
|---|---|---|
| File required | — | "Please select a file to upload" |
| File type | .txt, .md, .docx only | "Unsupported file type. Please use .txt, .md, or .docx" |
| File size | Max 5MB | "File is too large. Maximum size is 5MB" |
| Empty file | > 0 bytes | "The uploaded file is empty" |
| Parse error | — | "Unable to parse file content. The file may be corrupted" |

---

## 4.7 — Verification Checklist

- [ ] Upload modal opens from dashboard
- [ ] File picker filters by .txt, .md, .docx
- [ ] Can upload a .txt file → creates document with paragraphs
- [ ] Can upload a .md file → creates document with headings, bold, lists
- [ ] Can upload a .docx file → creates document with formatting
- [ ] Uploaded document opens in editor with correct formatting
- [ ] File type validation works (rejects .pdf, .jpg, etc.)
- [ ] File size validation works (rejects > 5MB)
- [ ] Error messages display correctly
- [ ] Loading state shows during upload
- [ ] Supported file types clearly stated in UI

---

## Files Created in This Phase

| File | Purpose |
|---|---|
| `src/app/api/upload/route.ts` | Upload API endpoint |
| `src/lib/parsers/txt-parser.ts` | .txt → TipTap JSON converter |
| `src/lib/parsers/md-parser.ts` | .md → TipTap JSON converter |
| `src/lib/parsers/docx-parser.ts` | .docx → TipTap JSON converter |
| `src/components/dashboard/UploadModal.tsx` | Upload UI component |
