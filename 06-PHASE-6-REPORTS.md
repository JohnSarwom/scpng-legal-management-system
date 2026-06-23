# 06 — PHASE 6: Reports & Dashboards (Module 5)

> **Prerequisites:** Phases 1–5 complete. **Goal:** the management/oversight layer —
> executive dashboards plus the full report set, all derived from the data built in
> earlier phases. Reports are read-only views over the mock data.

---

## 1. Scope (Scope of Works, Module 5)

Reports turn the data collected across Cases, Documents, Correspondence, Notes, and
Activities into decision-ready views for management. Reports are organised into
sub-modules (Scope §5.8): Executive, Case, Document, Correspondence, User Activity,
and Audit.

> All figures are **derived** from the mock services — do not hard-code numbers.
> Compute them so they stay correct as seed data or earlier phases change. Charts use
> **Recharts**.

---

## 2. Report data service

Add a `reportService` (mock) with derivation methods, each reading the existing
collections via the other services or `db`:

- `ceoDashboard()` → `{ openCases, highRiskMatters, courtMatters, correspondenceThisMonth }`
- `legalManagerDashboard()` → `{ openCases, assignedCases, pendingReviews, casesDueThisWeek }`
- `casesByStatus()`, `casesByType()`, `openCasesList()`
- `entityLegalExposure()` → per-entity open-case and document counts
- `documentsUploadedMonthly()`, `documentsByCategory()`, `expiringContracts()`
- `incomingCorrespondence()`, `outstandingCorrespondence()` (count + avg response time)
- `openCasesByOfficer()`, `activitiesCompletedByOfficer()`
- `auditEntries(filter)`

Wrap in `hooks/useReports.ts`. Apply RBAC: `viewReports` is `full` for CEO/GC/Legal
Manager, `limited` for the others (limited roles see a reduced set — see §9).

---

## 3. Reports landing

Route: `/reports`. A sub-module nav (tabs or a left rail): **Executive · Cases ·
Documents · Correspondence · User Activity · Audit**. Show only the sub-modules the
role may view.

---

## 4. Executive dashboards (Scope §5.1)

### CEO Dashboard
Four headline stat cards (Scope example figures): **Open Cases · High-Risk Matters ·
Court Matters · Correspondence This Month**. Below: a small "Cases by Status" donut
and "Entity Legal Exposure" top-5 list. High-level only — no operational detail.

### Legal Manager Dashboard
Operational stat cards: **Open Cases · Assigned Cases · Pending Reviews · Cases Due
This Week**. Below: "Open Cases by Officer" bar chart and a "Cases Due This Week"
list.

Use `StatCard` components with the tabular-figures treatment. Define "high-risk" as
confidential or litigation-type cases (state your rule in code); "court matters" =
cases of type Litigation with linked court documents (or simply Litigation type —
pick one and document it).

---

## 5. Case reports (Scope §5.2)

- **Open Cases Report:** table — Case No, Title, Status, Officer (filterable).
- **Cases by Status:** count per status (table + bar/donut).
- **Cases by Type:** count per type, for resource planning (table + bar).

---

## 6. Entity Legal Exposure report (Scope §5.3)

Table linking to the entity database: Entity · Open Cases · Documents. Sort by open
cases or document count to surface the highest-risk entities. Each entity row links to
its Relationship Map (Phase 5) — this is where the numeric report and the visual map
meet.

---

## 7. Document reports (Scope §5.4)

- **Documents Uploaded (Monthly):** line/bar chart by month from upload dates.
- **Documents by Category:** count per `DOCUMENT_CATEGORIES` (bar).
- **Expiring Contracts:** documents in the Contracts category with an expiry within a
  window. *Note:* the base `LegalDocument` type has no expiry field — add an optional
  `expiryDate?: string` on contract-category documents and seed a few, or compute from
  a metadata field. Document the choice.

---

## 8. Correspondence reports (Scope §5.5)

- **Incoming Correspondence:** Ref No, Subject, Status table.
- **Outstanding Correspondence:** count of "Awaiting Response" + **average response
  time** (mean of closedDate − date for closed items).
- Optional: outgoing volume and incoming/outgoing split.

---

## 9. User activity reports (Scope §5.6)

- **Open Cases by Officer:** count per responsible officer (bar).
- **Activities Completed by Officer:** count of activities per `createdBy` (bar).

These support workload distribution for Legal Manager / General Counsel. **Limited**
report roles (Sr Legal Officer, Legal Officer, Executive Officer) see only their own
figures, not the cross-officer comparison.

---

## 10. Audit reports (Scope §5.7) — preview

A filterable table of `AuditLog` entries: Date · User · Action · Module · Record. This
is fully implemented/hardened in Phase 7, but surface a basic version here so the
Reports module is complete. Filters: date range, user, module, action.

---

## 11. Report structure summary (Scope §5.8)

Mirror the official grouping so the nav matches the spec:

- **Executive** — Legal Overview, Litigation Summary, Entity Exposure
- **Case** — Open, Closed, By Status, By Type
- **Document** — By Category, By Entity, Expiring Contracts
- **Correspondence** — Incoming, Outgoing, Outstanding
- **User Activity** — Officer Workload, Activity Summary
- **Audit** — Document Access, Case Changes, System Activity

Add a lightweight **export** affordance (CSV download generated client-side from the
table data) on tabular reports — useful for the demo and trivial to keep when Supabase
arrives.

---

## 12. Acceptance criteria

- [ ] All six report sub-modules render, gated by `viewReports` (full vs limited).
- [ ] CEO and Legal Manager dashboards show derived stat cards (not hard-coded).
- [ ] Case reports (open list, by status, by type) compute from mock data.
- [ ] Entity Legal Exposure links each entity to its Relationship Map.
- [ ] Document reports include monthly uploads, by category, and expiring contracts.
- [ ] Correspondence reports include outstanding count and average response time.
- [ ] Officer workload reports respect the limited-role restriction.
- [ ] Charts render with Recharts; tabular reports offer CSV export.
- [ ] Figures update correctly when seed data changes; no direct mock imports in components.
