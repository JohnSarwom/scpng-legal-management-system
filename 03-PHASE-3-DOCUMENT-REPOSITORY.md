# 03 — PHASE 3: Legal Document Repository (Module 2)

> **Prerequisites:** Phases 1–2 complete. **Goal:** upload (mock), categorise,
> version, search, and multi-link legal documents to entities, cases, and
> correspondence. Documents are the connective tissue of the relationship model.

Module accent colour: **docs (purple, `#6D54B5`)**.

---

## 1. Scope (Scope of Works, Module 2)

Store and manage all legal documents. A document can stand alone or be linked to one
or more of: an entity, a case, a correspondence record. Documents are categorised and
version-controlled.

> **Mock-file note:** there is no real file storage in the prototype. "Upload" means
> the user picks a file; we capture the filename and metadata only. The
> integration seam is documented so Supabase Storage drops in later (see §7).

---

## 2. Data & services

Uses `LegalDocument` + `DocumentVersion` types and `documentService` from Phase 1.

`documentService` methods:
- `getAll(filter?: DocumentFilter)` — filter by category, status, entityId, caseId, correspondenceId, text query, date range, confidentiality.
- `getById(id)`
- `create(input: DocumentInput)` — auto `documentNumber` (`DOC-2026-NNN`), sets `currentVersion = 1`, seeds `versions[0]`, `uploadDate` = today, `uploadedBy` = current user, audit `Upload`.
- `addVersion(id, version: NewVersionInput)` — increments `currentVersion`, appends to `versions[]`, sets prior version status implicitly, audit `Update`.
- `update(id, patch)` — metadata edits, audit `Update`.
- `remove(id)` — audit `Delete`.
- `download(id)` — no real file; just audit `Download` and toast (so the audit trail requirement is satisfiable).

`hooks/useDocuments.ts` — `useDocuments(filter)`, `useDocument(id)`,
`useUploadDocument()`, `useAddVersion()`, `useUpdateDocument()`, `useDeleteDocument()`.

---

## 3. Upload Document form

Triggered from: the Documents list, a case detail's Documents tab (prefilled
`caseId`), or a correspondence record (prefilled `correspondenceId`).

Fields (Scope §2.4):

| Field | Control | Rules |
|-------|---------|-------|
| Document Number | display only | auto on save |
| Title | text | required |
| Category | select (`DOCUMENT_CATEGORIES`) | required |
| File | file input (mock) | required; capture filename only |
| Link to Entity | EntityPicker | optional |
| Link to Case | case picker (search cases) | optional |
| Link to Correspondence | correspondence picker | optional |
| Status | select (Draft/Active/Superseded/Archived) | default Draft |
| Confidential | toggle | optional; inherits restriction rules |

At least the title, category, and file are required; links are all optional and a
document may have several (Scope §2.3 — "exist independently or be associated with
multiple records"). When opened from a case/correspondence context, the relevant link
is pre-filled and locked or pre-selected.

**Permission gate:** Upload requires `uploadDocuments !== 'none'`.

---

## 4. Documents list view

Route: `/documents`.

- **Columns:** Doc No, Title, Category, Version (`v{n}`), Linked To (chips: entity /
  case / correspondence via `RecordLink`), Uploaded By, Upload Date, Status.
  Confidential docs show the confidential badge.
- **Filters:** category, status, linked-entity, linked-case, uploaded date range,
  text search.
- **Sorting:** newest uploaded, oldest uploaded, document number, title.
- **Group/segment option:** a "Documents by Category" view toggle (feeds the Phase 6 report too).
- **Primary action:** "Upload Document" (permission-gated).
- **Row click:** document detail.

**RBAC:** `viewDocuments` is `full` for every role, so all roles see the document
list — **except** confidential documents, which follow the confidential access rules
and are excluded for unauthorised roles. Edit/upload actions are gated separately.

---

## 5. Document detail view

Route: `/documents/:id`.

- **Header:** doc number + title + category + current version + status badge.
  Actions: Download (mock, audited), Add Version, Edit Metadata (gated by
  `editDocuments`), Delete (gated).
- **Metadata panel:** all fields from Scope §2.4.
- **Links panel:** linked entity (EntityBadge), case (RecordLink), correspondence
  (RecordLink). Allow add/remove links here (re-link without re-upload).
- **Version history (Scope §2.5):** table of `versions[]` — version no, file name,
  updated by, updated date, note. "Add Version" opens a form (new file + change note)
  that calls `addVersion`. Original version is always preserved; history is
  append-only.

---

## 6. Document categories & versioning

Categories are the `DOCUMENT_CATEGORIES` enum (Scope §2.2), including the two Gazettal
Notice variants (Internal/External). These categories drive the "Documents by
Category" report in Phase 6 — keep the enum the single source of truth.

Versioning rules:
- New upload starts at version 1.
- `addVersion` creates an immutable history entry; never overwrite a prior version's
  record.
- `currentVersion` always points at the latest; older versions remain viewable in the
  history table.
- Track `updatedBy` / `updatedDate` per version (Scope §2.5).

---

## 7. Supabase integration seam (document-specific)

Document this in `services/supabase/README.md` now:

- **Metadata** → `documents` table; `versions` → a `document_versions` child table.
- **Files** → Supabase **Storage** bucket `legal-documents`; the mock `fileName`
  field becomes a storage path/URL. The mock `create`/`addVersion`/`download` map
  cleanly onto `storage.upload` / `createSignedUrl`.
- **Links** → either nullable FK columns (`entity_id`, `case_id`, `correspondence_id`)
  or a join table if true many-to-many is needed. The prototype's multi-link UI
  already anticipates this — note which approach the schema will take.

Because components call `documentService` only, none of this changes the UI later.

---

## 8. Acceptance criteria

- [ ] Upload creates a document with auto number `DOC-2026-NNN` and version 1.
- [ ] Category comes from the enum; all ten categories selectable.
- [ ] A document can link to entity, case, and/or correspondence (any combination, including none).
- [ ] Documents list filters by category/status/links/date/text and shows linked-record chips.
- [ ] Document detail shows version history; Add Version appends without destroying prior versions.
- [ ] Download is mocked but produces an audit `Download` entry.
- [ ] Confidential documents are hidden from unauthorised roles.
- [ ] Upload/edit/delete are permission-gated; viewing is open to all roles.
- [ ] Supabase Storage mapping documented; no direct mock imports in components.
