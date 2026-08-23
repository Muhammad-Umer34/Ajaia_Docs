# Phase 5: Document Sharing

**Estimated Time:** 45 minutes  
**Priority:** 🟡 High  
**Dependencies:** Phase 2 (Auth/Users), Phase 3 (Documents)

---

## 5.1 — Sharing Model Design

### Philosophy:
Simple, intuitive sharing that demonstrates clear ownership and access logic without enterprise-grade complexity.

### Model:
```
┌──────────┐        ┌─────────────────┐        ┌──────────┐
│   User   │───owns──▶│   Document     │◀──shared──│   User   │
│  (Owner) │         │                 │  with    │ (Viewer/ │
│          │         │ DocumentShare[] │          │  Editor) │
└──────────┘        └─────────────────┘        └──────────┘
```

### Permission Levels:
| Level | Can View | Can Edit | Can Share | Can Delete |
|---|---|---|---|---|
| **Owner** | ✅ | ✅ | ✅ | ✅ |
| **Editor** | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ |

### Sharing Rules:
1. Only the **document owner** can share
2. Share by entering a user's email address
3. Owner chooses permission level (view or edit)
4. Owner can revoke access at any time
5. Owner cannot share with themselves
6. Can't share with the same user twice (but can update permission)
7. Shared documents appear in the recipient's "Shared with Me" section

---

## 5.2 — Share API Endpoints

### 5.2.1 — Share Document: `POST /api/documents/[id]/share`

**File:** `src/app/api/documents/[id]/share/route.ts`

**Request Body:**
```json
{
  "email": "bob@ajaia.com",
  "permission": "edit"    // "view" | "edit"
}
```

**Logic:**
```
1. Authenticate user
2. Verify user is the document owner
3. Look up target user by email
4. Validate target user exists
5. Validate not sharing with self
6. Check if share already exists
   - If yes: update permission
   - If no: create new DocumentShare
7. Return updated share list
```

**Response (201):**
```json
{
  "share": {
    "id": "...",
    "user": {
      "id": "...",
      "name": "Bob Smith",
      "email": "bob@ajaia.com",
      "avatarColor": "#ec4899"
    },
    "permission": "edit",
    "createdAt": "..."
  }
}
```

**Error Cases:**
| Status | Condition | Message |
|---|---|---|
| 400 | Missing email | "Email is required" |
| 400 | Invalid permission | "Permission must be 'view' or 'edit'" |
| 403 | Not document owner | "Only the document owner can share" |
| 404 | User not found | "No user found with that email" |
| 409 | Self-share | "You cannot share a document with yourself" |

### 5.2.2 — List Shares: `GET /api/documents/[id]/share`

**Authorization:** Owner only

**Response:**
```json
{
  "shares": [
    {
      "id": "...",
      "user": { "id": "...", "name": "Bob", "email": "bob@ajaia.com", "avatarColor": "#ec4899" },
      "permission": "edit",
      "createdAt": "..."
    },
    {
      "id": "...",
      "user": { "id": "...", "name": "Charlie", "email": "charlie@ajaia.com", "avatarColor": "#f59e0b" },
      "permission": "view",
      "createdAt": "..."
    }
  ]
}
```

### 5.2.3 — Revoke Share: `DELETE /api/documents/[id]/share`

**Request Body:**
```json
{
  "shareId": "..."
}
```

**Authorization:** Owner only

---

## 5.3 — Share Modal Component

### File: `src/components/dashboard/ShareModal.tsx`

**UI Design:**
```
┌──────────────────────────────────────────────────┐
│  🔗 Share "Welcome to Ajaia Docs"           [✕]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Add people                                      │
│  ┌────────────────────────┐ ┌─────────┐ ┌─────┐ │
│  │ Enter email address... │ │ Can edit▾│ │Share│ │
│  └────────────────────────┘ └─────────┘ └─────┘ │
│                                                  │
│  ─── People with access ────────────────────     │
│                                                  │
│  🟣 Alice Johnson (you)           Owner          │
│     alice@ajaia.com                              │
│                                                  │
│  🩷 Bob Smith                     Can edit  [✕]  │
│     bob@ajaia.com                                │
│                                                  │
│  🟡 Charlie Brown                 Can view  [✕]  │
│     charlie@ajaia.com                            │
│                                                  │
│  ─── Share link ────────────────────────────     │
│  🔗 https://ajaia-docs.vercel.app/doc/abc  [📋] │
│                                                  │
│                               [Done]             │
└──────────────────────────────────────────────────┘
```

**Key Features:**
1. **Email input** — Type email of user to share with
2. **Permission dropdown** — Select "Can edit" or "Can view"
3. **Share button** — Initiates share, shows toast on success
4. **People list** — Shows all current access:
   - Owner always listed first with "Owner" badge
   - Each shared user shows name, email, permission, revoke button
5. **Revoke button (✕)** — Remove a user's access (owner only)
6. **Copy link** — Copy document URL to clipboard
7. **Error feedback** — "User not found", "Already shared", etc.

**States:**
| State | UI Change |
|---|---|
| Idle | Default form |
| Sharing | Button shows spinner, input disabled |
| Share success | Toast: "Shared with Bob Smith" |
| Share error | Toast: error message (red) |
| Revoking | Row shows loading state |
| Revoke success | Row removed with animation |

---

## 5.4 — Dashboard: Shared Documents Section

### Visual Distinction:

**My Documents section:**
```
┌──────────────────┐
│  📄 Document     │   ← Standard card
│  Title           │
│  Last edited:    │
│  Aug 23, 2025    │
│  [⋯]            │   ← Full menu (Rename, Share, Delete)
└──────────────────┘
```

**Shared with Me section:**
```
┌──────────────────┐
│  📄 Document     │   ← Card with "shared" visual indicator
│  Title           │
│  by Alice        │   ← Shows owner name
│  🟣 Can edit     │   ← Permission badge
│  [⋯]            │   ← Limited menu (Open only, no Delete/Rename)
└──────────────────┘
```

**Visual Differences:**
1. Different section header with icon (🔗 vs 📁)
2. Shared cards show owner name and avatar color
3. Permission badge on shared cards ("Can edit" / "Can view")
4. Three-dot menu is limited for shared docs (no Delete/Rename)
5. Subtle left border color matching owner's avatar color

---

## 5.5 — Editor: Sharing Integration

When viewing a shared document, the editor page shows:

1. **Permission indicator** in header:
   - Owner: Full toolbar, all actions available
   - Can edit: Full toolbar, but no Share/Delete buttons
   - Can view: Toolbar disabled, read-only content, "View only" badge

2. **Share button** — Only visible to owner, opens ShareModal

3. **Owner info** — For shared docs, show "Owned by Alice Johnson" in header

---

## 5.6 — Access Control Middleware

### Authorization helper:

```typescript
// src/lib/auth-helpers.ts

export async function getDocumentAccess(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarColor: true } },
      shares: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarColor: true } },
        },
      },
    },
  })

  if (!document) return null

  // Check if owner
  if (document.ownerId === userId) {
    return { document, permission: 'owner' as const }
  }

  // Check if shared
  const share = document.shares.find(s => s.userId === userId)
  if (share) {
    return { document, permission: share.permission as 'view' | 'edit' }
  }

  // No access
  return null
}
```

---

## 5.7 — Verification Checklist

- [ ] Share modal opens from document card menu and editor header
- [ ] Can share document by entering email
- [ ] Permission dropdown works (view/edit)
- [ ] Sharing with non-existent email shows error
- [ ] Sharing with self shows error
- [ ] Duplicate share updates permission instead of creating new
- [ ] Shared user sees document in "Shared with Me" section
- [ ] Shared user can open and view document
- [ ] "Can edit" user can edit document content
- [ ] "Can view" user sees read-only editor
- [ ] Owner can revoke access
- [ ] Revoked user no longer sees document
- [ ] People with access list shows correct data
- [ ] Copy link works
- [ ] Permission badges display correctly on dashboard cards
- [ ] Shared cards show owner name and avatar

---

## Files Created in This Phase

| File | Purpose |
|---|---|
| `src/app/api/documents/[id]/share/route.ts` | Share/Revoke API |
| `src/components/dashboard/ShareModal.tsx` | Share dialog UI |
| Updated `src/lib/auth-helpers.ts` | Document access helper |
| Updated `src/components/dashboard/DocumentCard.tsx` | Shared card variant |
| Updated `src/app/(editor)/document/[id]/page.tsx` | Permission-based UI |
