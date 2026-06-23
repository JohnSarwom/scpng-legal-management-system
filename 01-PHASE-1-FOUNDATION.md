# 01 — PHASE 1: Foundation & Scaffold

> **Prerequisites:** `00-SETUP.md` read. **Goal:** a running app shell with
> navigation, the design system, the full data-service seam, shared types, mock seed
> data, and a working role switcher. No module features yet — but everything they
> depend on is in place.

When this phase is done, you can log in as any role, navigate empty module pages, and
see the role switcher change the current user. The plumbing is complete; phases 2–6
just fill the pages.

---

## 1. Scaffold the project

Follow §3 of the setup file (Vite + React-TS, install deps, Tailwind init, strict
tsconfig, `@/*` alias). Confirm `npm run dev` serves a blank page before continuing.

Configure `tailwind.config.ts` with the palette and typography from §8 of the setup
file. Add the Google Fonts (Source Serif 4 + Inter) in `index.html`. Set
`font-variant-numeric: tabular-nums` on a `.tnum` utility for tables.

---

## 2. Shared types & config

Create the `types/` files and `config/` files exactly as specified in §6 and §7 of
the setup file:

- `types/entity.ts`, `case.ts`, `document.ts`, `correspondence.ts`, `user.ts`, `audit.ts`, plus `Note`/`Activity`.
- `types/index.ts` re-exports everything.
- `config/enums.ts` — all the `as const` enum arrays.
- `config/permissions.ts` — the `PERMISSIONS` matrix.

Also create `*Input` types (the shape forms submit, omitting auto fields like `id`,
`caseNumber`, `createdAt`) and `*Filter` types (query params for list views).

---

## 3. The data-service seam

### 3.1 Service interfaces

`services/types.ts` — declare `CaseService`, `DocumentService`,
`CorrespondenceService`, `EntityService`, `AuditService`, `NoteService`,
`ActivityService`. Each is a plain interface of async methods (see setup §5.1).

`EntityService` is **read-only**: `getAll()`, `getById()`, `search(query)`. No
create/update/remove — entities belong to the Licensing system.

### 3.2 Mock DB

`services/mock/db.ts` — a single module holding in-memory arrays plus the ID
sequence counters:

```ts
export const db = {
  entities: [...seedEntities],
  users: [...seedUsers],
  cases: [...seedCases],
  documents: [...seedDocuments],
  correspondence: [...seedCorrespondence],
  notes: [...seedNotes],
  activities: [...seedActivities],
  audit: [...seedAudit],
  counters: { case: 12, document: 28, correspondence: 9 },
};
export function nextNumber(kind: 'case'|'document'|'correspondence', prefix: string) {
  db.counters[kind] += 1;
  return `${prefix}-2026-${String(db.counters[kind]).padStart(3,'0')}`;
}
```

`services/mock/delay.ts` — `export const delay = (ms = 250) => new Promise(r => setTimeout(r, ms));`

### 3.3 Mock services

Implement each interface in `services/mock/*.ts` against `db`. Every `create`,
`update`, `remove`, and document `upload`/`download` must also push an `AuditLog`
through `auditService` (see setup §9). Keep mutations immutable-ish (return copies)
so React Query cache behaves.

### 3.4 The switch + the Supabase stub

`services/index.ts` exports the mock implementations under clean names
(`caseService`, `documentService`, …). Add the commented Supabase lines.

`services/supabase/README.md` — for each service method, write the target Supabase
query as a comment/spec (e.g. `caseService.getAll → from('cases').select('*, entity:entities(*)')`).
No real code yet; this documents the contract the future backend phase fulfils.

---

## 4. Mock seed data

Create realistic SCPNG-flavoured seed data so every screen looks populated. Put
generators/arrays in `services/mock/seed/`.

- **Entities (~12):** capital-market registered entities — brokers, fund managers,
  listed companies. Mix of statuses (mostly Registered, a couple Suspended).
  Realistic names and PNG context.
- **Users (~8):** one per role minimum, with a couple of extra Legal Officers so
  "assigned" logic is demonstrable. Include a `John`, `Sarah`, `Peter` set to match
  the report examples in the Scope of Works.
- **Cases (~12):** spread across all statuses and types; 2–3 flagged confidential
  with different classes; assigned across officers so the role switcher visibly
  changes the list.
- **Documents (~28):** spread across categories, some with multiple versions, linked
  variously to entities/cases/correspondence.
- **Correspondence (~9):** incoming and outgoing, some linked to cases.
- **Notes/Activities:** a handful per active case.
- **Audit:** a starter set so the audit report isn't empty.

> Make the numbers roughly match the Scope of Works report examples (e.g. ~42 open
> cases feel referenced in dashboards) — or scale dashboards to whatever the seed
> actually contains. Consistency between seed and reports matters more than hitting
> exact figures.

---

## 5. Session & RBAC context

### 5.1 SessionContext

`context/SessionContext.tsx` holds `{ currentUser: User, setRole: (role: Role) => void }`.
On `setRole`, pick a seed user with that role (or synthesise one) and set them as
current. Default to `Legal Manager` on first load (a role with broad but not total
access — good for demoing).

### 5.2 The `can` helper

`hooks/usePermission.ts`:

```ts
export function usePermission() {
  const { currentUser } = useSession();
  function can(action: Action): Access {
    return PERMISSIONS[action][currentUser.role];
  }
  function canDo(action: Action) { return can(action) !== 'none'; }
  return { can, canDo, role: currentUser.role, userId: currentUser.id };
}
```

`'assigned'` checks (does this record belong to the current user?) are applied at the
list/detail level in each module, using `userId` from this hook.

### 5.3 React Query setup

`main.tsx` wraps the app in `QueryClientProvider`, `BrowserRouter`, and
`SessionProvider`. Set sensible defaults (`staleTime: 30s`, retry off for the mock).

---

## 6. App shell & navigation

### 6.1 Layout

`components/layout/AppShell.tsx` — fixed left sidebar + topbar + scrollable content
`<Outlet/>`.

**Sidebar** (`Sidebar.tsx`): nav items for Dashboard, Cases, Documents,
Correspondence, Search, Reports. Each item colour-keyed to its module accent
(cases=blue, docs=purple, corr=orange, etc.). Active route highlighted. Hide items
the role can't access at all (e.g. hide nothing by default, but Reports shows
"limited" badge for limited roles).

**Topbar** (`Topbar.tsx`): page title slot, a global search affordance (routes to
Search), the **RoleSwitcher**, and the current user's name + role.

### 6.2 RoleSwitcher

`components/layout/RoleSwitcher.tsx` — a dropdown listing all six roles. Selecting
one calls `setRole`. Visually prominent (it's the headline feature of the
prototype). Show the current role as a coloured badge. Add a small "Prototype" label
so demo viewers know this stands in for real auth.

### 6.3 Routes

`App.tsx` defines nested routes under `AppShell`:

```
/                       → Dashboard (placeholder card grid for now)
/cases                  → Cases list (empty placeholder this phase)
/cases/:id              → Case detail (placeholder)
/documents              → Documents list (placeholder)
/correspondence         → Correspondence list (placeholder)
/search                 → Search (placeholder)
/reports                → Reports (placeholder)
*                       → NotFound
```

Each placeholder page is just a `PageHeader` + an `EmptyState`. Phases 2–6 replace
them.

---

## 7. UI primitives

Build the primitives listed in setup §8 inside `components/ui/`. They must be
unstyled-logic + Tailwind-styled, theme-token driven (no hard-coded hex). Minimum
set to finish this phase: `Button`, `Input`, `Select`, `Textarea`, `Badge`,
`StatusBadge`, `Table`, `Card`, `Modal`, `ConfirmDialog`, `Tabs`, `EmptyState`,
`Toast`, `PageHeader`.

`StatusBadge` maps each `CaseStatus` / document status / correspondence status to a
colour. `ConfidentialBadge` (in `components/shared/`) renders the deep-red
confidential marker.

Add `lib/utils.ts` with `cn()` (clsx + tailwind-merge), date formatters, and the
`PREFIX-YYYY-NNN` formatter.

---

## 8. Shared cross-module components (stubs)

Create these now since every module uses them:

- `components/shared/EntityPicker.tsx` — searches entities via `entityService.search`,
  lets the user select one, returns the `entityId`. Used by Cases, Documents,
  Correspondence. **This is how the "never duplicate an entity" rule is enforced in
  the UI** — there is no "create entity" path anywhere.
- `components/shared/RecordLink.tsx` — renders a clickable chip for a linked case/doc/
  correspondence that routes to its detail page.
- `components/shared/EntityBadge.tsx` — shows entity name + status from an `entityId`.

---

## 9. Acceptance criteria

- [ ] `npm run dev` serves the app shell; sidebar + topbar render with the design tokens.
- [ ] All routes resolve to placeholder pages without errors.
- [ ] Role switcher changes `currentUser`; the displayed role badge updates live.
- [ ] `usePermission().can(...)` returns correct values for each role (spot-check against the matrix).
- [ ] Mock seed data loads; `caseService.getAll()` etc. return data via React Query (verify in React Query devtools or a temporary console log).
- [ ] `EntityPicker` searches and selects from mock entities; there is no UI path to create an entity.
- [ ] Every mock mutation writes an audit entry (verify the audit array grows).
- [ ] **No component imports from `services/mock/*` or `services/supabase/*` directly** — only via hooks/`@/services`.
- [ ] Supabase stub README documents the target query for every service method.
