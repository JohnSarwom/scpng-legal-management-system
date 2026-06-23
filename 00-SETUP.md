# 00 — SETUP (Foundational File)

> **Read this before writing any code.** It defines the stack, the folder
> structure, the naming conventions, the mock→Supabase data seam, and the design
> system. Every phase file assumes these are in place and refers back here.

---

## 1. What we are building

A **Legal Management System (LMS)** for SCPNG that centralises legal **Cases**,
**Documents**, **CEO Correspondence**, and the **relationships** between them — all
anchored to entities that already exist in SCPNG's Licensing / Entity Management
System.

**This iteration is a frontend-only prototype.** No backend, no real auth, no real
file storage. Everything runs on in-memory mock data. The point of the prototype is
to validate the UX, the data model, and the role-based behaviour before any backend
spend.

**Non-negotiable architectural goal:** the prototype must be built so that Supabase
can be added later by replacing *only* the service layer. UI components must never
know whether data comes from a mock array or a database.

---

## 2. Tech stack

| Concern | Choice | Notes |
|--------|--------|-------|
| Build tool | **Vite** | Fast dev server, simple config. |
| Framework | **React 18** | Function components + hooks only. |
| Language | **TypeScript** | Strict mode on. Types are the contract every phase shares. |
| Styling | **Tailwind CSS** | Utility-first. Design tokens defined in `tailwind.config`. |
| Routing | **React Router v6** | Nested routes per module. |
| State (server data) | **TanStack Query (React Query)** | Caching + loading/error states. Makes the Supabase swap trivial because components already expect async data. |
| State (UI/session) | **React Context** | Current user/role, theme. Keep it light. |
| Forms | **React Hook Form** + **Zod** | Zod schemas double as runtime validation and TS types. |
| Icons | **lucide-react** | Matches the clean line-icon style of the workflow diagram. |
| Dates | **date-fns** | Formatting and relative dates. |
| IDs (mock) | **nanoid** or `crypto.randomUUID()` | For mock record IDs. |
| Charts (Phase 6) | **Recharts** | Dashboards and report visuals. |

> **Why React Query even with mock data?** Components call `useQuery(['cases'], caseService.getAll)`.
> Whether `caseService` reads a mock array or hits Supabase, the component code is
> identical. This is the seam that makes the later migration painless.

---

## 3. Project initialisation

```bash
npm create vite@latest scpng-lms -- --template react-ts
cd scpng-lms
npm install react-router-dom @tanstack/react-query react-hook-form zod @hookform/resolvers lucide-react date-fns nanoid recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Enable strict mode in `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

Add the same `@/*` alias to `vite.config.ts` via `resolve.alias` so imports like
`@/services/caseService` work.

---

## 4. Folder structure

```
src/
├── main.tsx                  # App entry: Router + QueryClient + AppProviders
├── App.tsx                   # Route definitions
├── index.css                 # Tailwind directives + base styles
│
├── types/                    # Shared TypeScript types (the data contract)
│   ├── index.ts
│   ├── case.ts
│   ├── document.ts
│   ├── correspondence.ts
│   ├── entity.ts
│   ├── user.ts
│   └── audit.ts
│
├── config/
│   ├── enums.ts              # Statuses, categories, case types, roles, confidential classes
│   └── permissions.ts        # The permission matrix encoded as data
│
├── services/                 # THE DATA SEAM. Components only ever talk to these.
│   ├── types.ts              # Service interfaces (CaseService, DocumentService, ...)
│   ├── index.ts              # Exports the active implementation (mock for now)
│   ├── mock/
│   │   ├── db.ts             # In-memory mock database (the seed arrays live here)
│   │   ├── caseService.ts
│   │   ├── documentService.ts
│   │   ├── correspondenceService.ts
│   │   ├── entityService.ts
│   │   ├── auditService.ts
│   │   └── delay.ts          # simulates network latency
│   └── supabase/             # EMPTY FOR NOW. Stub files only. Filled in later.
│       └── README.md         # explains how each mock service maps to a Supabase query
│
├── context/
│   ├── SessionContext.tsx    # current user + role + role switcher
│   └── useSession.ts
│
├── hooks/                    # React Query wrappers: useCases, useDocuments, etc.
│   ├── useCases.ts
│   ├── useDocuments.ts
│   ├── useCorrespondence.ts
│   ├── useEntities.ts
│   └── usePermission.ts      # can(action, resource) helper
│
├── components/
│   ├── ui/                   # Primitives: Button, Input, Select, Badge, Table, Modal, Card, ...
│   ├── layout/               # AppShell, Sidebar, Topbar, RoleSwitcher, PageHeader
│   └── shared/               # EntityPicker, StatusBadge, RecordLink, ConfidentialBadge, EmptyState
│
├── features/                 # One folder per module. Pages + module-specific components.
│   ├── dashboard/
│   ├── cases/
│   ├── documents/
│   ├── correspondence/
│   ├── search/
│   └── reports/
│
└── lib/
    └── utils.ts              # cn() classname helper, formatters, id generators
```

**Rule:** `features/*` may import from `components/*`, `hooks/*`, `types/*`,
`config/*`, `lib/*`. **Never** from `services/mock/*` directly — always through
`hooks/*`, which call `services/index.ts`.

---

## 5. The mock → Supabase data seam (most important section)

### 5.1 Define service *interfaces* first

`src/services/types.ts` declares what every service can do, with **no
implementation**:

```ts
import type { Case, CaseInput, CaseFilter } from '@/types/case';

export interface CaseService {
  getAll(filter?: CaseFilter): Promise<Case[]>;
  getById(id: string): Promise<Case | null>;
  create(input: CaseInput): Promise<Case>;
  update(id: string, patch: Partial<CaseInput>): Promise<Case>;
  remove(id: string): Promise<void>;
}
// ...one interface per module
```

### 5.2 Mock implementation

`src/services/mock/caseService.ts` implements `CaseService` against an in-memory
array, with a small artificial delay to mimic the network so loading states are
real:

```ts
import { db } from './db';
import { delay } from './delay';
import type { CaseService } from '../types';

export const mockCaseService: CaseService = {
  async getAll(filter) {
    await delay();
    let rows = [...db.cases];
    // apply filter...
    return rows;
  },
  async getById(id) { await delay(); return db.cases.find(c => c.id === id) ?? null; },
  async create(input) { await delay(); /* push + return */ },
  async update(id, patch) { await delay(); /* mutate + return */ },
  async remove(id) { await delay(); /* splice */ },
};
```

### 5.3 The switch point

`src/services/index.ts` is the **only** file that decides which implementation is
live:

```ts
import { mockCaseService } from './mock/caseService';
// import { supabaseCaseService } from './supabase/caseService'; // LATER

export const caseService = mockCaseService;
// When backend is ready: export const caseService = supabaseCaseService;
```

Components never import from `mock/` or `supabase/` — only from `@/services`.
When Supabase is ready, you change one line per service here and nothing else.

### 5.4 Supabase stub

`src/services/supabase/README.md` is created **now** (empty implementations) so the
target shape is documented from day one. For each method, note the intended query,
e.g. `getAll → supabase.from('cases').select('*')`. This is the contract the future
backend phase fulfils.

---

## 6. Shared data model (the contract)

These types are defined in Phase 1 and used by every later phase. Summarised here so
the whole model is visible in one place.

### Enums (`config/enums.ts`)

```ts
export const CASE_STATUSES = ['Draft','Open','Pending','Under Review','Closed','Archived'] as const;
export type CaseStatus = typeof CASE_STATUSES[number];

export const CASE_TYPES = ['Litigation','Employment','Contracts','Compliance','Regulatory','Other'] as const;
export type CaseType = typeof CASE_TYPES[number];

export const DOCUMENT_CATEGORIES = [
  'Contracts','Court Documents','Affidavits','Agreements','Compliance Documents',
  'Legal Opinions','Internal Memos','External Correspondence',
  'Gazettal Notices (Internal)','Gazettal Notices (External)',
] as const;
export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

export const CORRESPONDENCE_DIRECTIONS = ['Incoming','Outgoing'] as const;
export type CorrespondenceDirection = typeof CORRESPONDENCE_DIRECTIONS[number];

export const ROLES = [
  'CEO','General Counsel','Legal Manager','Senior Legal Officer','Legal Officer','Executive Officer',
] as const;
export type Role = typeof ROLES[number];

export const CONFIDENTIAL_CLASSES = [
  'Executive Investigations','Litigation Matters','Employment Disciplinary Cases',
  'Board Matters','Regulatory Investigations',
] as const;
export type ConfidentialClass = typeof CONFIDENTIAL_CLASSES[number];
```

### Core record types

```ts
// entity.ts — READ-ONLY mirror of the Licensing system. LMS never writes these.
export interface Entity {
  entityId: string;          // the shared reference key
  entityName: string;
  entityStatus: 'Registered' | 'Suspended' | 'Revoked' | 'Pending';
  registrationDetails: string;
}

// case.ts
export interface Case {
  id: string;
  caseNumber: string;        // auto-generated, e.g. CASE-2026-001
  caseTitle: string;
  entityId: string;          // reference only
  caseType: CaseType;
  description: string;
  responsibleOfficerId: string;
  status: CaseStatus;
  dateOpened: string;        // ISO date
  dateClosed: string | null;
  isConfidential: boolean;
  confidentialClass: ConfidentialClass | null;
  createdAt: string;
  updatedAt: string;
}

// document.ts
export interface DocumentVersion {
  version: number;
  fileName: string;
  updatedBy: string;
  updatedAt: string;
  note?: string;
}
export interface LegalDocument {
  id: string;
  documentNumber: string;    // auto, e.g. DOC-2026-014
  title: string;
  category: DocumentCategory;
  currentVersion: number;
  versions: DocumentVersion[];
  entityId: string | null;
  caseId: string | null;
  correspondenceId: string | null;
  uploadedBy: string;
  uploadDate: string;
  status: 'Draft' | 'Active' | 'Superseded' | 'Archived';
  isConfidential: boolean;
}

// correspondence.ts
export interface Correspondence {
  id: string;
  correspondenceNumber: string; // auto, e.g. COR-2026-007
  subject: string;
  direction: CorrespondenceDirection;
  date: string;
  sender: string;
  recipient: string;
  entityId: string | null;
  caseId: string | null;
  attachments: string[];     // document IDs
  status: 'Open' | 'Closed' | 'Awaiting Response';
}

// case sub-records
export interface Note { id: string; caseId: string; body: string; createdBy: string; createdAt: string; }
export interface Activity { id: string; caseId: string; type: string; description: string; createdBy: string; createdAt: string; }

// user.ts
export interface User { id: string; name: string; role: Role; }

// audit.ts
export interface AuditLog {
  id: string;
  user: string;
  date: string;              // ISO datetime
  action: 'Create'|'Update'|'Delete'|'Upload'|'Download'|'Status Change'|'View';
  module: 'Cases'|'Documents'|'Correspondence'|'Entities'|'System';
  recordRef: string;         // e.g. CASE-2026-001
}
```

---

## 7. RBAC model

Roles, in descending authority:

`CEO > General Counsel > Legal Manager > Senior Legal Officer > Legal Officer > Executive Officer`

### Permission matrix (`config/permissions.ts`)

Encode the matrix from the Scope of Works as data, not as scattered `if` statements.
Permission values: `'full' | 'assigned' | 'limited' | 'none'`.

```ts
import type { Role } from './enums';

export type Action =
  | 'viewCases' | 'createCases' | 'editCases' | 'closeCases' | 'assignCases'
  | 'viewDocuments' | 'uploadDocuments' | 'editDocuments'
  | 'registerCorrespondence' | 'approveCorrespondence'
  | 'viewReports' | 'userManagement';

export type Access = 'full' | 'assigned' | 'limited' | 'none';

export const PERMISSIONS: Record<Action, Record<Role, Access>> = {
  viewCases:             { 'CEO':'full','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'assigned','Legal Officer':'assigned','Executive Officer':'assigned' },
  createCases:           { 'CEO':'none','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'full','Legal Officer':'full','Executive Officer':'none' },
  editCases:             { 'CEO':'none','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'full','Legal Officer':'assigned','Executive Officer':'none' },
  closeCases:            { 'CEO':'none','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'none','Legal Officer':'none','Executive Officer':'none' },
  assignCases:           { 'CEO':'none','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'none','Legal Officer':'none','Executive Officer':'none' },
  viewDocuments:         { 'CEO':'full','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'full','Legal Officer':'full','Executive Officer':'full' },
  uploadDocuments:       { 'CEO':'none','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'full','Legal Officer':'full','Executive Officer':'full' },
  editDocuments:         { 'CEO':'none','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'full','Legal Officer':'assigned','Executive Officer':'none' },
  registerCorrespondence:{ 'CEO':'none','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'full','Legal Officer':'full','Executive Officer':'full' },
  approveCorrespondence: { 'CEO':'full','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'none','Legal Officer':'none','Executive Officer':'none' },
  viewReports:           { 'CEO':'full','General Counsel':'full','Legal Manager':'full','Senior Legal Officer':'limited','Legal Officer':'limited','Executive Officer':'limited' },
  userManagement:        { 'CEO':'none','General Counsel':'full','Legal Manager':'none','Senior Legal Officer':'none','Legal Officer':'none','Executive Officer':'none' },
};
```

A `can(action)` helper (Phase 1) reads the current role from session and returns the
`Access` level. `'assigned'` means "only records where the current user is the
responsible officer." `'limited'` means a reduced report set.

### Confidential matters

A case may be flagged confidential with one of the `CONFIDENTIAL_CLASSES`. Access:

- CEO, General Counsel → always full access.
- Legal Manager, Senior Legal Officer, Legal Officer → only if assigned to the case.
- Executive Officer → no access unless explicitly granted (a `grantedUserIds` list on the case).

Confidential cases must be **excluded from list views, search results, and reports**
for unauthorised roles — not merely greyed out.

---

## 8. Design system

The brief is a **government securities regulator's legal system**. The tone is
institutional, precise, and trustworthy — closer to a court registry than a
consumer app. The workflow diagram already establishes a navy-led palette with one
accent colour per module; we carry that through so each module is colour-coded
consistently across navigation, badges, and the relationship map.

### Palette (`tailwind.config.ts` → theme.extend.colors)

```ts
colors: {
  ink:      { DEFAULT: '#0F2A4A', 700:'#16365C', 500:'#1E4A7A' }, // deep navy — headers, primary
  paper:    '#F7F8FA',                                            // app background
  surface:  '#FFFFFF',                                            // cards, tables
  line:     '#E2E6EC',                                            // borders, dividers
  muted:    '#5A6675',                                            // secondary text
  // module accents (match the workflow diagram)
  cases:    '#2563A8',  // blue
  docs:     '#6D54B5',  // purple
  corr:     '#D9682A',  // orange (CEO correspondence)
  entity:   '#2E9E6B',  // green
  // status / feedback
  success:  '#2E9E6B',
  warning:  '#C9881F',
  danger:   '#C0392B',
  confidential: '#8A1C2B', // deep red for confidential markers
}
```

### Typography

- **Display / headings:** a serious, legible serif or humanist sans — e.g. *Source
  Serif 4* for page titles to signal a formal registry, paired with...
- **Body / UI:** *Inter* (or system UI stack) for everything functional.
- **Data / numbers:** tabular figures (`font-variant-numeric: tabular-nums`) in
  tables and dashboard stat cards so columns align.

Type scale: page title 24px/600, section 18px/600, body 14px/400, caption 12px/500
uppercase tracked for table headers and eyebrows.

### Layout

Fixed left **sidebar** (module nav, colour-keyed) + top **topbar** (page title,
global search shortcut, **role switcher**, current user). Content area is a padded
column with a `PageHeader` (title + primary action) above each module's content.
Density is high — this is a data tool. Tables are the workhorse; cards are for
dashboards only. Zero playful motion; use only quiet transitions (150ms) on hover
and modal open.

### The signature element

The **Relationship Map** (Phase 5). Everywhere else is disciplined and quiet so this
one screen — the interactive web of Entity ↔ Cases ↔ Documents ↔ Correspondence — is
the memorable centrepiece that embodies the system's whole purpose.

### UI primitives to build in Phase 1

`Button` (primary/secondary/ghost/danger), `Input`, `Textarea`, `Select`,
`Badge`/`StatusBadge`, `Table` (sortable header, zebra optional), `Modal`/`Drawer`,
`Card`, `Tabs`, `EmptyState`, `Toast`, `ConfirmDialog`. Keep them small and
composable.

### Accessibility & quality floor

Visible keyboard focus rings, labelled inputs, `aria` on interactive elements,
responsive down to tablet width, `prefers-reduced-motion` respected. Errors are
specific and actionable ("Select a responsible officer before saving"), empty states
invite action ("No cases yet — register the first one").

---

## 9. Conventions

- **Files:** components `PascalCase.tsx`, hooks `useThing.ts`, services `thingService.ts`.
- **Auto-numbering:** generate human IDs as `PREFIX-YYYY-NNN` (`CASE-2026-001`).
  Sequence counters live in `db.ts` for the mock; the future Supabase version uses a
  DB sequence. Keep the format identical so display code never changes.
- **Dates:** store ISO strings, format at the edge with `date-fns`.
- **No business logic in components.** Validation in Zod schemas, permission checks
  in `can()`, data access in services.
- **Audit on every mutation.** Each service `create/update/remove` (and document
  upload/download) appends an `AuditLog` via `auditService`. Phase 7 hardens this;
  wire the call points as you build each module so it's not retrofitted.

---

## 10. What "done" means per phase

Every phase file ends with an **Acceptance Criteria** checklist. A phase is complete
only when all boxes are ticked *and* the "no direct mock imports in components" rule
still holds. Treat that rule as a build-breaking lint, not a guideline.
