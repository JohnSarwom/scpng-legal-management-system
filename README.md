# SCPNG Legal Management System — Developer Specification Package

This package contains the complete build specification for the **Legal Management
System (LMS)** for the Securities Commission of Papua New Guinea (SCPNG).

The current goal is a **frontend-only, mock-data prototype** built with React +
TypeScript + Tailwind. The architecture deliberately isolates the data layer
behind a service interface so that **Supabase can be wired in later without
touching any UI components**.

---

## How to use this package

Read the files **in order**. Each phase builds on the previous one and lists its
prerequisites at the top. Do not skip the setup file — it defines the conventions,
folder structure, and the data-service pattern that every phase depends on.

| File | Purpose |
|------|---------|
| `00-SETUP.md` | **Foundational file.** Full tech stack, architecture, folder structure, naming conventions, the mock→Supabase data seam, and the design system. Read this first and keep it open. |
| `01-PHASE-1-FOUNDATION.md` | Scaffold the project: Vite + React + TS + Tailwind + Router, app shell/layout, the data-service layer, shared types, mock seed data, and the role-switcher RBAC context. |
| `02-PHASE-2-CASE-MANAGEMENT.md` | Module 1 — Case registration, entity linking, case detail, statuses, notes & activities. |
| `03-PHASE-3-DOCUMENT-REPOSITORY.md` | Module 2 — Document upload (mock), categories, versioning, multi-linking. |
| `04-PHASE-4-CEO-CORRESPONDENCE.md` | Module 3 — Incoming/outgoing correspondence, attachments, linking. |
| `05-PHASE-5-SEARCH-RELATIONSHIPS.md` | Module 4 — Unified search and the relationship navigation map. |
| `06-PHASE-6-REPORTS.md` | Module 5 — Executive dashboards and the report set. |
| `07-PHASE-7-RBAC-AUDIT-POLISH.md` | Enforce the permission matrix, confidential-matter rules, audit logging, and final polish. |

---

## The one rule that matters most

> **The LMS never creates or duplicates an entity.** Entities live in SCPNG's
> existing Licensing / Entity Management System. Every legal record stores only an
> `entityId` reference. In the prototype, entities are read-only mock data that
> simulate the Licensing API.

---

## Definition of done (prototype)

- All five modules navigable and functional against mock data.
- Role switcher changes what the current user can see and do, per the permission matrix.
- Confidential matters are hidden/locked for unauthorised roles.
- Every create/update/delete writes an audit entry.
- No component imports mock data directly — everything goes through the service layer.
- Swapping mock services for Supabase services would require **zero** changes to components.
