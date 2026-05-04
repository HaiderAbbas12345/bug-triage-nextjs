# bug-triage-nextjs

> Tiny **Next.js 15 + MongoDB** bug-triage tool, built around the data-integrity mistakes I see when I take over stalled internal tools and admin panels.

When you inherit a codebase mid-build, you start by getting every blocker out of your head and into a triage list. This is that list — and a sample of the patterns I'd apply when rescuing a bigger version of the same idea.

---

## Stack

- **Next.js 15** — App Router, Server Actions, `revalidatePath`
- **MongoDB** (driver, not Mongoose — lighter for App Router server actions)
- **TypeScript** strict
- **zod** for boundary validation
- **Tailwind v4**

No auth in this template — it's a single-tenant local triage tool. Production gating discussed below.

---

## Quick start

```bash
git clone https://github.com/HaiderAbbas12345/bug-triage-nextjs.git
cd bug-triage-nextjs
npm install
cp .env.local.example .env.local
# Edit .env.local with your MongoDB Atlas URI + DB name
npm run dev
```

Visit http://localhost:3000.

---

## Rescue patterns

### 1. Optimistic concurrency on status updates &nbsp;`src/lib/bug-actions.ts`

**Bug I see:** Two engineers open the same bug detail page. Engineer A marks it "fixed" at 14:02. Engineer B marks it "wontfix" at 14:03 (without seeing A's update). The DB ends up at "wontfix" — A's note that the fix landed is silently lost.

**Fix:** every Bug carries a `version` integer. Every update increments it and matches against the version the client rendered with. If they don't match, the update is rejected.

```ts
const result = await col.updateOne(
  { _id: new ObjectId(id), version: expectedVersion },
  { $set: { status, updatedAt: new Date() }, $inc: { version: 1 } },
);

if (result.matchedCount === 0) {
  return {
    ok: false,
    error: 'This bug was updated by someone else. Refresh to see the latest version.',
  };
}
```

The form on the detail page submits `expectedVersion` as a hidden input. Stale form = rejected update with a clear message.

This is the same pattern Postgres `xmin` / Mongoose `versionKey` / Stripe `if-match` headers all use.

---

### 2. Status state machine, enforced server-side &nbsp;`src/types.ts` + `src/lib/bug-actions.ts`

**Bug I see:** UI shows a `<select>` of all statuses. Engineer can drag a `wontfix` bug back to `investigating` directly. Worse, an attacker bypasses the UI and POSTs whatever status they want to the API — no server-side check.

**Fix:** define valid transitions in one place and enforce on the server:

```ts
// src/types.ts
export const VALID_TRANSITIONS: Record<BugStatus, ReadonlyArray<BugStatus>> = {
  open: ['investigating', 'wontfix'],
  investigating: ['fixed', 'open', 'wontfix'],
  fixed: ['open'],
  wontfix: ['open'],
};
```

The UI uses the same map to disable invalid options (UX hint), but the **server action** is the source of truth — `canTransition(existing.status, newStatus)` runs before the DB write.

Defense in depth: the UI helps users, the server prevents abuse.

---

### 3. Compound indexes for filter performance &nbsp;`src/lib/bug-actions.ts` `ensureIndexes`

**Bug I see:** Bug list page lists 10k bugs filtered by `status: 'open'` for `project: 'api-gateway'`, sorted by `createdAt desc`. Every page load does a collection scan + in-memory sort. P95 latency: 4 seconds. Engineer adds a single-field index on `status` — barely helps because the sort still has to load every doc.

**Fix:** a compound index that covers the **filter, secondary filter, and sort** in the order they appear in the query:

```ts
await col.createIndex({ status: 1, project: 1, createdAt: -1 });
```

Mongo can satisfy the entire query — filter, narrow, and return sorted results — by walking the index. No collection scan, no in-memory sort.

Indexes are created lazily on first request and memoized with a module-level flag. In production, run as part of migrations.

---

### 4. Server actions vs API routes — where to draw the line

**Bug I see:** team standardizes on API routes for everything, then has to plumb form errors through fetch + JSON + setState ceremony. The boilerplate buries actual business logic.

**This template's choice:** **server actions for all mutations** (`createBug`, `updateBugStatus`, `deleteBug`). They're called directly from `<form action={...}>`, get free CSRF, and surface results via `useActionState`.

API routes would be the right call for **read-only data** consumed by external clients (mobile apps, integrations). For server-rendered React forms that round-trip back to the same React tree, server actions cut ~60% of the integration code.

The reads here (`listBugs`, `getBug`) are server-component data fetches — no API route needed at all.

---

### 5. Boundary validation with zod, never trust FormData

**Bug I see:** server action takes `formData.get('email')` and passes it directly to a database query. `formData.get()` returns `FormDataEntryValue | null` — could be a string, could be a File upload, could be undefined. The query coerces it to a string regardless and writes garbage to the DB.

**Fix:** every server action runs the input through a zod schema first:

```ts
const parsed = createSchema.safeParse({
  title: formData.get('title'),
  description: formData.get('description'),
  // ...
});
if (!parsed.success) {
  return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
}
```

The DB only sees data that has passed schema validation. Type-narrowing comes free as a side benefit.

---

## File map

```
src/
├── app/
│   ├── page.tsx                      # Bug list + filter + create form
│   └── bugs/[id]/
│       ├── page.tsx                  # Detail view + delete (server)
│       └── status-form.tsx           # Status update form (client)
├── components/
│   ├── BugCard.tsx
│   └── CreateBugForm.tsx             # 'use client' — useActionState
├── lib/
│   ├── db.ts                         # HMR-safe Mongo client (same as auth template)
│   └── bug-actions.ts                # All server actions (Patterns 1, 2, 3, 5)
└── types.ts                          # Bug type + status state machine (Pattern 2)
```

---

## Deliberately not built

- **Auth** — single-tenant tool. In production, gate via `auth()` in a layout (see `nextjs-auth-rescue-template`) and add a `userId` filter to every query.
- **Soft delete with audit trail** — `delete` here is hard. For real triage you'd add `deletedAt` + `deletedBy`, query `{ deletedAt: null }` everywhere, and keep records for compliance.
- **Full-text search** — the `description` and `stackTrace` fields beg for `$text` indexes. Easy add.
- **Comments / activity log** — every status change should write an event to a separate `bug_events` collection for the audit trail.
- **Pagination** — current list is hard-capped at 100. Real triage tools need cursor-based pagination using `_id` (offset pagination is broken at any non-trivial scale).

---

## License

MIT

---

Built by **[Haider Abbas](https://github.com/HaiderAbbas12345)** — Senior MERN + Next.js engineer. I rescue stalled JavaScript projects.
