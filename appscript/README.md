# SCPNG Legal Management System — Google Apps Script Backend

This folder contains the complete Apps Script project that backs the SCPNG Legal
Management System using a Google Sheet as the database.

---

## File structure

| File | Purpose |
|---|---|
| `appsscript.json` | Project manifest — OAuth scopes, timezone, runtime |
| `00_Config.js` | Central config: spreadsheet ID, sheet names, roles, permission matrix, notification types |
| `01_Setup.js` | One-time setup: creates all sheet tabs, seeds all mock data |
| `02_SheetHelpers.js` | Low-level read/write helpers (getAll, findById, insert, update, remove, nextCounter) |
| `03_Permissions.js` | RBAC helpers: `can()`, `assertCan()`, `canViewCase()`, `canEditCase()` |
| `04_NotificationService.js` | Notification CRUD + Gmail email dispatch on every `push()` |
| `05_AuditService.js` | Append-only audit log |
| `06_CaseService.js` | Case CRUD with permission checks, activity log, and notifications |
| `07_DocumentService.js` | Document CRUD with upload notifications |
| `08_CorrespondenceService.js` | Correspondence CRUD + full approval/rejection workflow |
| `09_EntityService.js` | Entity CRUD + bulk import (Licensing sync) |
| `10_NoteAndActivityService.js` | Case notes and system activity timeline |
| `11_UserService.js` | User lookup and management |
| `12_ReportService.js` | Dashboard summary stats and report sheet generation |
| `13_WebApp.js` | Optional: exposes everything as a JSON REST API (doGet / doPost) |

---

## Sheet tabs created by Setup

| Tab | Contents |
|---|---|
| Users | Staff roster with roles and emails |
| Entities | Capital-market participants |
| Cases | Legal cases |
| Documents | Legal documents metadata |
| Correspondence | CEO letters and correspondence |
| Notes | Manual case notes |
| Activities | System-generated case timeline events |
| AuditLog | Immutable action log |
| Notifications | Per-user notification inbox |
| Counters | Auto-increment counters for IDs |

---

## Getting started

### Step 1 — Create the Apps Script project

1. Open your Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Delete the default `Code.gs` file.
4. Create one `.gs` file per file in this folder (name them exactly as shown).
5. Paste each file's contents into the corresponding `.gs` file.

### Step 2 — Set the Spreadsheet ID

1. Copy the ID from your Google Sheet URL:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
2. Open `00_Config.js` and replace `PASTE_YOUR_SPREADSHEET_ID_HERE` with it.

### Step 3 — Run setup

1. In the Apps Script editor, select function `runFullSetup` from the dropdown.
2. Click **Run**.
3. Approve the permission prompts (Sheets + Gmail).
4. All 10 sheet tabs will be created and seeded with the mock data.

### Step 4 (optional) — Deploy as Web App

To connect the React front-end:

1. Click **Deploy → New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone within [your organisation]** (or Anyone if testing).
5. Click **Deploy** and copy the Web App URL.
6. Use that URL in the React app's service layer to replace the mock services.

---

## Notification flow

```
User action (create case / upload doc / approve corr)
        │
        ▼
Service function (CaseService.create, etc.)
        │
        ├── SheetDB.insert / update  (writes to Google Sheet)
        ├── AuditService.record      (writes audit row)
        └── NotificationService.push (recipientId, type, title, body, linkTo)
                    │
                    ├── SheetDB.insert → Notifications sheet
                    └── GmailApp.sendEmail → recipient's email
```

### Who gets notified for what

| Event | Who is notified |
|---|---|
| Case created | Legal Manager + General Counsel (if they didn't create it) |
| Case assigned | The responsible officer (if different from creator) |
| Case status changed | The responsible officer (if someone else changed it) |
| Document uploaded | Legal Manager + the case's responsible officer |
| Correspondence needs approval | CEO + General Counsel + Legal Manager |
| Correspondence approved | The assignedTo officer(s) |
| Correspondence rejected | The assignedTo officer(s) |

---

## Role-based access (mirrors the React app exactly)

| Action | CEO | General Counsel | Legal Manager | Senior Legal Officer | Legal Officer | Executive Officer |
|---|---|---|---|---|---|---|
| viewCases | full | full | full | assigned | assigned | assigned |
| createCases | — | full | full | full | full | — |
| editCases | — | full | full | full | assigned | — |
| closeCases | — | full | full | — | — | — |
| assignCases | — | full | full | — | — | — |
| uploadDocuments | — | full | full | full | full | full |
| registerCorrespondence | — | full | full | full | full | full |
| approveCorrespondence | full | full | full | — | — | — |
| viewReports | full | full | full | limited | limited | limited |
| manageEntities | — | full | full | — | — | — |
| userManagement | — | full | — | — | — | — |

`assigned` = can only see/edit records where they are the responsible officer.

---

## Connecting to the React front-end

Once the Web App is deployed, swap out the mock services in `src/services/index.ts`:

```ts
// Before (mock)
export const caseService = mockCaseService;

// After (Apps Script backend)
export const caseService = createWebAppCaseService('YOUR_WEB_APP_URL');
```

Each service wrapper calls `fetch(webAppUrl, { method: 'POST', body: JSON.stringify({ action, userId, ... }) })`.
