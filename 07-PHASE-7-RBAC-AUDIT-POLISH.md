# 07 — PHASE 7: RBAC, Audit, Confidential Matters & Polish

> **Prerequisites:** Phases 1–6 complete. **Goal:** harden everything that was wired
> incrementally — make the permission matrix airtight, enforce confidential-matter
> rules consistently, complete the audit trail, and bring the whole prototype to a
> demo-ready quality floor.

This phase adds little new UI; it makes the existing system correct, consistent, and
trustworthy.

---

## 1. RBAC enforcement pass (Scope: User Roles & Access Control)

By now `can()` is used throughout, but enforcement may be uneven. Do a systematic
sweep against the permission matrix (setup §7) for all six roles:

`CEO · General Counsel · Legal Manager · Senior Legal Officer · Legal Officer · Executive Officer`

### 1.1 Three enforcement layers

1. **Navigation** — hide or badge modules/actions the role can't use.
2. **Action gating** — every create/edit/close/assign/upload/approve/delete button is
   wrapped in a `can()` check; gated buttons are hidden (preferred) or disabled with a
   tooltip explaining why.
3. **Data scoping** — `assigned` roles only ever receive their own records from the
   services; `limited` report roles get the reduced set. This must be enforced in the
   **service/hook layer**, not just hidden in the UI, so it survives the Supabase swap.

### 1.2 Matrix verification table

Walk every cell of the Scope of Works permission matrix and confirm behaviour. Build a
tiny internal "RBAC self-test" page (dev-only, not in production nav) that, for the
currently switched role, lists each `Action` and the resolved `Access` — so you can
eyeball correctness while flipping roles. Cross-check against:

| Function | CEO | GC | Exec Officer | Legal Mgr | Sr Legal Off | Legal Off |
|---|---|---|---|---|---|---|
| View Cases | ✓ | ✓ | Assigned | ✓ | Assigned | Assigned |
| Create Cases | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ |
| Edit Cases | ✗ | ✓ | ✗ | ✓ | ✓ | Assigned |
| Close Cases | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Assign Cases | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |
| View Documents | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload Documents | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Documents | ✗ | ✓ | ✗ | ✓ | ✓ | Assigned |
| Register Correspondence | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Approve Correspondence | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| View Reports | ✓ | ✓ | Limited | ✓ | Limited | Limited |
| User Management | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |

> **Note on Approve Correspondence:** the Scope matrix marks CEO with a partial
> symbol; per the role descriptions the CEO *approves* correspondence. Treat CEO and
> General Counsel and Legal Manager as approvers. Confirm this reading with the
> business owner and adjust the one line in `config/permissions.ts` if needed — it's a
> single data change.

---

## 2. Confidential matter enforcement (Scope: Confidential Matter Security)

Confidential classes: Executive Investigations · Litigation Matters · Employment
Disciplinary Cases · Board Matters · Regulatory Investigations.

Access rules:
- **CEO, General Counsel** → full access to all confidential matters.
- **Legal Manager, Senior Legal Officer, Legal Officer** → access only if assigned to
  the case (or explicitly granted).
- **Executive Officer** → no access unless explicitly granted (`grantedUserIds`).

### Enforcement requirements
- A single `canAccessConfidential(case, user)` helper, used everywhere a confidential
  case/document might appear: case list, case detail, document list/detail (docs
  inheriting a confidential case), search results, relationship map, and **all
  reports** (counts must exclude restricted matters for unauthorised roles).
- Restricted records are **omitted**, not shown locked, in list/search/report
  contexts. Direct-URL access to a restricted detail page returns an "Access
  restricted" view and logs a `View` attempt in the audit trail.
- The confidential badge (deep red) appears on records the user *is* allowed to see,
  signalling sensitivity.

---

## 3. Audit trail completion (Scope: Audit & Security)

The system must log (Scope list): Record Creation, Record Updates, Record Deletion,
Document Uploads, Document Downloads, Status Changes — each with User, Date, Action,
Module, Record Reference.

### 3.1 Centralise
Ensure every service mutation routes through a single `audit(action, module, recordRef)`
call (ideally inside the service methods so no call site can forget). Audit:
- create / update / delete on cases, documents, correspondence
- document upload / download
- case + correspondence status changes
- confidential-record view attempts (granted and denied)

### 3.2 Audit report (full)
Complete the audit report from Phase 6: filter by date range, user, module, action,
and record reference; sort by date desc; CSV export. Make it accessible to roles with
report access appropriate to audit (typically GC, Legal Manager; confirm with owner).

---

## 4. Confidential & integrity guarantees (Scope: Audit & Security, Integrity)

- **No duplicate entities** — reaffirm there is no entity-create path anywhere; all
  links are `entityId` references resolved read-only via `entityService`. Add a guard
  comment in `EntityPicker` stating this invariant.
- **Document classification** — surface the Public / Restricted / Confidential /
  Executive-Confidential classification on documents (a `classification` field) if the
  business wants document-level (not just case-level) confidentiality. Optional;
  document the decision.

---

## 5. Quality & polish pass

### 5.1 States
- Every list, detail, and report has proper **loading** (skeletons), **empty**
  (actionable message), and **error** (specific, recoverable) states. No raw spinners
  with no context; no blank screens.
- Forms show inline validation from the Zod schemas; submit is disabled until valid;
  server (mock) errors surface as toasts.

### 5.2 Consistency
- One action vocabulary across the app (a button labelled "Register Case" leads to a
  toast "Case registered" — verbs match through the flow, per the design guidance).
- StatusBadge, ConfidentialBadge, RecordLink, EntityBadge used uniformly — no one-off
  styles.
- Module accent colours consistent across sidebar, badges, search results, and the
  relationship map.

### 5.3 Accessibility floor
- Visible keyboard focus everywhere; modals trap focus and close on Esc.
- All inputs labelled; icons that carry meaning have `aria-label`.
- Colour is never the only signal (pair confidential red with a lock icon + text).
- Responsive down to tablet; `prefers-reduced-motion` respected on the relationship map.

### 5.4 Demo readiness
- Seed data tells a coherent story across modules (an entity with several cases, those
  cases with documents and correspondence, a couple of confidential matters, an audit
  trail) so a single demo walkthrough touches every feature.
- The role switcher visibly changes the experience for each of the six roles — prepare
  a short script: "As Legal Officer I see only my cases; switch to CEO and the
  confidential board matter and full dashboards appear."

---

## 6. Final Supabase-readiness audit

Before sign-off, confirm the migration seam is intact:

- [ ] No component or feature file imports from `services/mock/*` or `services/supabase/*`.
- [ ] Every data access goes through a hook → `@/services` → service interface.
- [ ] `services/index.ts` is the single switch point; flipping a service to a Supabase
      implementation would require no UI changes.
- [ ] `services/supabase/README.md` documents the target table/query/storage mapping
      for every method (cases, documents + storage, correspondence, entities=external,
      audit).
- [ ] RBAC and confidentiality scoping live in the service/hook layer (not only the
      UI), so they carry over to the real backend.
- [ ] Auto-numbering format (`PREFIX-YYYY-NNN`) is generated in one place and unchanged
      by the data source.

---

## 7. Acceptance criteria (prototype complete)

- [ ] Every cell of the permission matrix behaves correctly for all six roles (verified via the RBAC self-test).
- [ ] Confidential matters are omitted for unauthorised roles across lists, search, map, and reports; direct access is blocked and logged.
- [ ] Audit trail captures all required actions with full fields; audit report filters and exports.
- [ ] No entity can be created anywhere; all entity usage is reference-only.
- [ ] Loading/empty/error states and validation are consistent and specific everywhere.
- [ ] Accessibility floor met; app is responsive to tablet.
- [ ] Demo walkthrough exercises all five modules + RBAC + confidentiality + audit on coherent seed data.
- [ ] Supabase-readiness audit passes — the backend phase can begin by writing `services/supabase/*` alone.
