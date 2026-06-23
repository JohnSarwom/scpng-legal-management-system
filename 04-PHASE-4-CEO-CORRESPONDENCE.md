# 04 — PHASE 4: CEO Correspondence (Module 3)

> **Prerequisites:** Phases 1–3 complete (documents needed for attachments). **Goal:**
> register incoming and outgoing CEO legal correspondence, attach documents, link to
> entities and cases, and track response status.

Module accent colour: **corr (orange, `#D9682A`)**.

---

## 1. Scope (Scope of Works, Module 3)

Manage CEO legal correspondence in both directions. Incoming letters are registered
with attachments and linked to an entity and/or case; outgoing letters carry signed
copies and the same links. Correspondence has a response-status lifecycle that feeds
the Correspondence reports (Phase 6).

---

## 2. Data & services

Uses `Correspondence` type and `correspondenceService` from Phase 1.

Methods:
- `getAll(filter?)` — filter by direction, status, entityId, caseId, date range, text.
- `getById(id)`
- `create(input)` — auto `correspondenceNumber` (`COR-2026-NNN`), audit `Create`.
- `update(id, patch)` — audit `Update`; status change → `Status Change`.
- `remove(id)` — audit `Delete`.
- `approve(id)` — gated by `approveCorrespondence`; marks approved, audit `Update`.

`hooks/useCorrespondence.ts` — standard React Query wrappers.

---

## 3. Register Correspondence form

One form with a **direction toggle** (Incoming / Outgoing) that lightly adapts
labels, opened via "New Correspondence".

Fields (Scope §3.3):

| Field | Control | Rules |
|-------|---------|-------|
| Correspondence Number | display only | auto on save |
| Direction | toggle (Incoming/Outgoing) | required |
| Subject | text | required |
| Date | date | required, default today |
| Sender | text | required (for incoming: external party; for outgoing: usually SCPNG/CEO) |
| Recipient | text | required |
| Link to Entity | EntityPicker | optional |
| Link to Case | case picker | optional |
| Attachments | document multi-picker | optional; link existing docs or upload new (reuses Phase 3 upload, prefilling `correspondenceId`) |
| Status | select (Open / Awaiting Response / Closed) | default Open |

Incoming-specific (Scope §3.1): register the letter, upload/attach the received
document. Outgoing-specific (Scope §3.2): attach the signed copy.

**Permission gates:** registering requires `registerCorrespondence !== 'none'`
(available to most roles incl. Executive Officer). **Approving** correspondence
requires `approveCorrespondence` (CEO, GC, Legal Manager only) — surfaced as a
separate "Approve" action, not part of registration.

---

## 4. Correspondence list view

Route: `/correspondence`.

- **Columns:** Corr No, Direction (in/out icon), Subject, Date, Sender, Recipient,
  Linked Entity/Case (chips), Status.
- **Filters:** direction, status, entity, case, correspondence date range, text.
- **Sorting:** newest date, oldest date, letter number, status. Keep sort option
  labels short in the toolbar so the CEO Correspondence controls do not crowd the
  table.
- **Segments:** quick tabs for "Incoming", "Outgoing", "Awaiting Response"
  (outstanding) — the last one feeds the outstanding-correspondence report metric.
- **Primary action:** "New Correspondence" (gated).
- **Row click:** correspondence detail.

---

## 5. Correspondence detail view

Route: `/correspondence/:id`.

- **Header:** corr number + subject + direction + status badge. Actions: Edit (gated),
  Approve (gated, CEO/GC/Legal Manager), Update Status, Delete (gated).
- **Details panel:** all metadata fields.
- **Links panel:** entity (EntityBadge), case (RecordLink) — add/remove links here.
- **Attachments panel:** linked documents (RecordLink to each), with "Attach
  document" (link existing or upload new via Phase 3 flow).
- **Activity/audit strip:** registered, status changes, approval — for traceability.

---

## 6. Status lifecycle & metrics

Statuses: `Open`, `Awaiting Response`, `Closed`. The "Awaiting Response" count and
**average response time** (date opened → date closed) are computed for the
Correspondence report (Phase 6). Store enough on the record (date, status, closed
date) to derive these without extra fields — add a `closedDate` if needed and note it
in the type.

---

## 7. CEO approval flow

The CEO role views and **approves** correspondence but does not create or edit it
(per the role spec). Model approval as a status/flag (`approvedBy`, `approvedAt`) set
by `approve()`. Show an "Approved by {name} on {date}" stamp once set. The approve
action is only visible to roles where `approveCorrespondence !== 'none'`.

---

## 8. Acceptance criteria

- [ ] Register incoming and outgoing correspondence; number auto-generates `COR-2026-NNN`.
- [ ] Direction toggle adapts the form; attachments link to documents (existing or newly uploaded).
- [ ] Correspondence links to entity and/or case by reference.
- [ ] List filters by direction/status/entity/case/date; "Awaiting Response" segment works.
- [ ] Detail shows attachments and links; can add/remove both.
- [ ] Approve action appears only for CEO/GC/Legal Manager and stamps approver + date.
- [ ] Status changes and approvals are audited; no direct mock imports in components.
