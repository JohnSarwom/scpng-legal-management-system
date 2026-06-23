# 02 — PHASE 2: Case Management (Module 1)

> **Prerequisites:** Phase 1 complete. **Goal:** full case lifecycle against mock
> data — register, list, view, edit, change status, link entity, manage notes &
> activities. This is the spine of the system; documents and correspondence link
> back to cases.

Module accent colour: **cases (blue, `#2563A8`)**.

---

## 1. Scope (from the Scope of Works, Module 1)

Legal Officers register and manage cases. Each case links to **exactly one entity**
(by reference), is assigned to a responsible officer, carries a status through its
lifecycle, and aggregates related documents, correspondence, notes, and activities.

---

## 2. Data & services

Uses the `Case`, `Note`, `Activity` types and `caseService`, `noteService`,
`activityService` from Phase 1. Add to `caseService` if not already present:

- `getAll(filter?: CaseFilter)` — filter by status, type, officer, entityId, confidentiality, text query.
- `getById(id)` — returns the case (or null).
- `create(input: CaseInput)` — auto-generates `caseNumber` via `nextNumber('case','CASE')`, sets `status` default `Draft`, `dateOpened` = today, writes audit `Create`.
- `update(id, patch)` — writes audit `Update`; if status changes, also write `Status Change`.
- `remove(id)` — soft consideration: in the prototype, allow delete but audit `Delete`. (Real system may archive instead.)

`hooks/useCases.ts` — React Query wrappers: `useCases(filter)`, `useCase(id)`,
`useCreateCase()`, `useUpdateCase()`, `useDeleteCase()` (with cache invalidation on
mutation).

---

## 3. Case Registration form

Route: a "Register Case" action on the Cases list opens a **modal or drawer** with a
`react-hook-form` + Zod form.

Fields (from Scope of Works §1.3):

| Field | Control | Rules |
|-------|---------|-------|
| Case Number | display only | auto-generated on save; show "Auto-generated" placeholder before save |
| Case Title | text input | required, 3–120 chars |
| Entity | **EntityPicker** | required; stores `entityId`; shows selected entity name + status |
| Case Type | select (`CASE_TYPES`) | required |
| Description | textarea | required |
| Responsible Officer | select (users with legal roles) | required; default to current user if they can be assigned |
| Status | select (`CASE_STATUSES`) | default `Draft` |
| Registration Date | date | default today; stored as `dateOpened` |
| Confidential | toggle | optional |
| Confidential Class | select (`CONFIDENTIAL_CLASSES`) | required *only if* Confidential is on |

**Entity linking (Scope §1.2):** the EntityPicker searches existing entities,
retrieves info, and stores the `entityId` reference. There is **no** path to create a
new entity. Selecting an entity displays its name (read-only) on the case.

**Permission gate:** the Register action is hidden/disabled unless `can('createCases') !== 'none'`.

On submit: create the case, close the form, toast "Case CASE-2026-013 registered",
navigate to the new case's detail page.

---

## 4. Cases list view

Route: `/cases`.

- **Table columns:** Case No, Title, Entity (name + status badge), Type, Officer,
  Status (StatusBadge), Registered. Confidential cases show a `ConfidentialBadge`.
- **Filters bar:** status, type, officer, confidentiality, registered date range,
  and a text search box (matches case number/title/entity name).
- **Date range wording:** use "Registered from" and "Registered to" in the UI. The
  underlying field remains `dateOpened`, but avoid "Opened from/to" because it can
  be confused with the `Open` status.
- **Sorting:** by registration date (default newest), oldest registration date, case
  number, status.
- **Row click:** routes to case detail.
- **Primary action:** "Register Case" button (permission-gated).

**RBAC behaviour in the list:**
- `viewCases = 'full'` (CEO, GC, Legal Manager) → see all cases.
- `viewCases = 'assigned'` (Sr Legal Officer, Legal Officer, Executive Officer) →
  see only cases where they are the responsible officer.
- Confidential cases the current role can't access are **excluded entirely**, not shown locked.

EmptyState when no cases match: "No cases match these filters" with a clear filter
reset, or "No cases yet — register the first one" when truly empty.

---

## 5. Case detail view

Route: `/cases/:id`. Layout: `PageHeader` (case number + title + status badge +
confidential badge) with actions, then a **tabbed** body.

**Header actions** (permission-gated):
- Edit (inline or modal) — `editCases`.
- Change Status — `editCases`; opens a small status-change dialog with a required reason note (the reason becomes an activity + audit `Status Change`).
- Assign Officer — `assignCases`.
- Close / Archive — `closeCases`; sets status `Closed`, `dateClosed` = today.

**Tabs:**

1. **Overview** — all case fields (Scope §1.3), entity card (name, status,
   registration details pulled read-only from `entityService.getById(entityId)`),
   timeline of recent activities.
2. **Documents** — documents where `caseId === this case`. Reuses the documents
   table (Phase 3). "Link/Upload document" action prefilled with this case. Until
   Phase 3 lands, render an empty table with a placeholder.
3. **Correspondence** — correspondence linked to this case (Phase 4). Same pattern.
4. **Notes** — list of `Note`s; add-note box (createNote → audit + activity).
   `editCases`/Legal Officer can add notes per the role spec.
5. **Activities** — chronological `Activity` log for the case (status changes,
   assignments, notes added, documents linked). Read-only feed.

**Confidential access guard:** if the case is confidential and the current role lacks
access, the detail route returns an "Access restricted" page (and the case never
appears in lists to reach it anyway).

---

## 6. Case statuses & lifecycle

Statuses: `Draft → Open → Pending → Under Review → Closed → Archived` (Scope §1.4).
Allow free transitions in the prototype but log every change. `Closed` requires/sets
`dateClosed`. `Archived` cases are excluded from default list views (filter toggle to
show them).

`StatusBadge` colours: Draft (muted/grey), Open (blue), Pending (amber/warning),
Under Review (purple), Closed (green/success), Archived (muted with strikethrough
feel).

---

## 7. Notes & Activities

- **Notes** are user-authored free text on a case. `noteService.create` appends and
  audits, and also creates an `Activity` of type "Note added".
- **Activities** are the system + user event feed: case created, status changed,
  officer assigned, document linked, correspondence linked, note added. Most are
  generated automatically by the relevant service calls; this tab just renders them
  sorted newest-first.

---

## 8. Audit hooks

Confirm these audit actions fire (module = `Cases`):
- Case create → `Create`
- Case field edit → `Update`
- Status change → `Status Change`
- Officer assignment → `Update`
- Case delete → `Delete`
- Viewing a confidential case → `View` (so access to sensitive matters is traceable)

---

## 9. Acceptance criteria

- [ ] Can register a case; case number auto-generates as `CASE-2026-NNN`.
- [ ] Entity is selected via EntityPicker (reference only); no entity-creation path exists.
- [ ] Cases list shows correct columns, filters, registered date range, and sorting.
- [ ] Role switcher changes visible cases: `full` roles see all, `assigned` roles see only their own.
- [ ] Confidential cases are hidden from unauthorised roles in both list and detail.
- [ ] Case detail tabs render; status change requires a reason and logs an activity + audit.
- [ ] Notes can be added; activities feed updates automatically.
- [ ] Close/Archive set `dateClosed` and move the case correctly.
- [ ] All mutations produce audit entries; no direct mock imports in components.
