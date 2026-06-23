# 05 — PHASE 5: Search & Relationships (Module 4)

> **Prerequisites:** Phases 1–4 complete. **Goal:** a unified search across every
> record type, and the **Relationship Map** — the interactive web of Entity ↔ Cases ↔
> Documents ↔ Correspondence that is the signature screen of the whole system.

This phase has no new core entity; it reads everything built so far.

---

## 1. Scope (Scope of Works, Module 4)

Provide one search surface across cases, documents, correspondence, and entities, and
make the relationships between records navigable. The relationship model is the
reason the system exists: everything connects through the shared Entity ID.

---

## 2. Unified search

Route: `/search` (also reachable from the topbar global-search affordance).

### 2.1 Search criteria (Scope §4.1)

A single query box plus optional facet filters. Searchable by:
- Entity (name or Entity ID)
- Case Number / Case Name
- Document Number
- Correspondence Number
- Officer
- Date range

### 2.2 Implementation

Add a `searchService.search(query, filters)` (mock) that queries across the four
collections and returns typed results:

```ts
type SearchResult =
  | { kind: 'entity'; record: Entity }
  | { kind: 'case'; record: Case }
  | { kind: 'document'; record: LegalDocument }
  | { kind: 'correspondence'; record: Correspondence };
```

Matching is simple substring/contains over the relevant fields for the prototype.
Apply the **same RBAC and confidentiality filtering as the list views** — search must
never surface a confidential record to an unauthorised role, and `assigned`-scoped
roles only see their own cases.

### 2.3 Results UI

Group results by kind (Entities, Cases, Documents, Correspondence) with counts.
Each result row uses the module's accent and a `RecordLink` to its detail page. Show
the matched context (e.g. which field matched). Facet chips along the top let the
user narrow by record type, officer, status, and date range. EmptyState: "No records
match '{query}'."

---

## 3. Relationship Map (the signature screen)

This is the page everything else stays quiet to make room for. It visualises the
relationship model from Scope §4.2:

- **Entity** ↔ Cases, Documents, Correspondence
- **Case** ↔ Documents, Correspondence, Notes, Activities
- **Correspondence** ↔ Documents, Entity, Case
- **Document** ↔ Entity, Case, Correspondence

### 3.1 Two entry points

1. **From any detail page** — a "View Relationships" action opens the map centred on
   that record, showing its immediate connections one hop out, expandable.
2. **Standalone** — `/search` has a "Relationship Map" tab where the user picks a
   focal record (usually an entity) and explores.

### 3.2 Visual model

A node-link diagram:
- **Nodes** are records, colour-coded by type (entity=green, case=blue,
  document=purple, correspondence=orange) with the record number as label.
- **Edges** show direct vs indirect relationships (solid vs dashed, mirroring the
  workflow diagram's legend).
- **Focal node** is centred and emphasised; one-hop neighbours arranged around it.
- **Click a node** → re-centre the map on it (expand its relationships) or open its
  detail page (provide both: click to focus, a button to open).

### 3.3 Implementation notes

- Build the graph data with a small helper: given a focal record, gather related IDs
  by walking the reference fields (`entityId`, `caseId`, `correspondenceId`, document
  links). Respect RBAC/confidentiality — excluded records are simply absent from the
  graph.
- For rendering, a lightweight approach: an SVG/canvas radial layout for one-hop, or a
  small force-directed layout. Avoid heavy graph libraries if a simple radial layout
  reads clearly; the brief values clarity over spectacle. If you do reach for a
  library, keep bundle impact modest.
- Keep interactions calm: hover highlights an edge and its endpoints; selecting
  re-centres with a 150ms transition. Respect `prefers-reduced-motion`.

### 3.4 Entity-centric default

Because the entity is the anchor of the whole model, the default focal node when
opening the standalone map is an entity. From an entity you can see, in one view, all
its cases, documents, and correspondence — which is exactly the "Entity Legal
Exposure" story the reports tell numerically (Phase 6).

---

## 4. Cross-navigation everywhere

Make sure every detail page (cases, documents, correspondence) already renders its
linked records as `RecordLink` chips (built in earlier phases). Search and the
Relationship Map are the macro view; the chips are the micro view. Both must reach
the same detail routes.

---

## 5. Acceptance criteria

- [ ] Unified search returns grouped results across entities, cases, documents, correspondence.
- [ ] Search honours all criteria from Scope §4.1 (entity, case no/name, doc no, corr no, officer, date range).
- [ ] Search respects RBAC and confidentiality (no leaking restricted records).
- [ ] Relationship Map opens from any detail page centred on that record.
- [ ] Standalone map defaults to an entity focal node and shows its cases/docs/correspondence.
- [ ] Nodes are colour-coded by type; direct vs indirect edges are visually distinct.
- [ ] Clicking a node re-centres or opens detail; navigation reaches correct routes.
- [ ] Excluded (confidential/unassigned) records never appear in the graph for unauthorised roles.
