# Case Access Control (Ownership, Grants, Confidentiality)

## Purpose

Cases are visible/editable based on three layered things:

1. **Role tier** - what a role can generally do (`src/config/permissions.ts`).
2. **Ownership/grants** - the specific people attached to a case (`responsibleOfficerId`, `grantedUserIds`, `grantedEditUserIds`).
3. **Confidentiality** - an extra gate on top of (1) and (2) for cases flagged `isConfidential`.

This doc explains how those three combine, the per-person **read-only vs read & write** access control, and where each piece lives in the UI.

## Role permission tiers

From `src/config/permissions.ts`, the tiers relevant to cases:

| Role | viewCases | editCases | closeCases | assignCases |
|---|---|---|---|---|
| CEO | full | none | none | none |
| General Counsel | full | full | full | full |
| Legal Manager | full | full | full | full |
| Senior Legal Officer | assigned | full | none | none |
| Legal Officer | assigned | assigned | none | none |
| Executive Officer | assigned | none | none | none |

`Access` values:
- `'full'` - always allowed, no per-case check.
- `'assigned'` - only allowed if the per-case grant/ownership check passes.
- `'none'` - never allowed, regardless of grants.

**Key consequence:** the only role where `editCases` is `'assigned'` is **Legal Officer**. Every other role either always gets edit once it can see the case (`'full'`) or never gets edit at all (`'none'`). This is why the read/write toggle (below) only offers a real 3-way choice for Legal Officers - for every other role, "read only" or "read & write" isn't actually a choice the system can enforce.

## Data model

`Case` (`src/types/index.ts`):

```ts
interface Case {
  // ...
  responsibleOfficerId: string;     // the owner - always full access
  grantedUserIds?: string[];        // who can VIEW this case beyond the owner
  grantedEditUserIds?: string[];    // who can additionally EDIT (only meaningful for 'assigned'-tier roles)
  isConfidential: boolean;
  confidentialClass: ConfidentialClass | null;
  // ...
}
```

- `grantedUserIds` is the general-purpose "case team" list. It governs base visibility for any role whose `viewCases` tier is `'assigned'` (Senior Legal Officer, Legal Officer, Executive Officer), **whether or not the case is confidential**.
- `grantedEditUserIds` is a narrower list that only matters for roles whose `editCases` tier is `'assigned'` (Legal Officer today). Being in `grantedEditUserIds` without being in `grantedUserIds` has no effect - edit implies view, so the UI always keeps both lists in sync (see below).
- Confidentiality does **not** introduce a separate field. It reuses `grantedUserIds` as its access-exception list (see `canAccessConfidentialCase`).

## Core access functions (`src/lib/utils.ts`)

```ts
function isAssignedToCase(item, user) {
  return item.responsibleOfficerId === user.id || (item.grantedUserIds?.includes(user.id) ?? false);
}

function hasEditGrant(item, user) {
  return item.responsibleOfficerId === user.id || (item.grantedEditUserIds?.includes(user.id) ?? false);
}

function caseAccess(action, item, user) {
  const access = PERMISSIONS[action][user.role];
  if (access === 'none') return false;
  if (access === 'assigned') {
    return action === 'editCases' ? hasEditGrant(item, user) : isAssignedToCase(item, user);
  }
  return true; // 'full'
}

function canAccessConfidentialCase(item, user) {
  if (!item.isConfidential) return true;
  if (user.role === 'CEO' || user.role === 'General Counsel') return true;
  if (user.role === 'Executive Officer') return item.grantedUserIds?.includes(user.id) ?? false;
  return item.responsibleOfficerId === user.id || (item.grantedUserIds?.includes(user.id) ?? false);
}

function canViewCase(item, user) {
  return canAccessConfidentialCase(item, user) && caseAccess('viewCases', item, user);
}
```

`caseService.ts` (`scopedRows`, `getById`, `update`) calls these same functions server-side (mock layer), so the UI and the "backend" never disagree about who can see or edit a case. `searchService.ts` uses `grantedUserIds`/ownership the same way when filtering search results for `'assigned'`-tier roles.

## Per-grantee read-only vs read & write access

When adding someone to a case's "Case team" / "Granted access" list, the granter (whoever can edit the case) picks a per-person access level from a dropdown, rather than the level being implicitly decided by the grantee's role.

The dropdown's *available options* are still bounded by what the grantee's role can actually do - the UI never offers a choice the RBAC layer can't enforce:

| Grantee's `editCases` tier | Options shown | Why |
|---|---|---|
| `'assigned'` (Legal Officer) | No access / Read only / Read & write | The only role where view and edit are independently grantable. |
| `'full'` (General Counsel, Legal Manager, Senior Legal Officer) | No access / Grant access | Edit is automatic once they can view the case - offering "read only" would be a lie, since their role bypasses the edit check entirely. Selecting "Grant access" adds them to `grantedUserIds` (and `grantedEditUserIds`, though that's inert for them). |
| `'none'` (Executive Officer) | No access / Read only | They can never get edit access, by role design (`editCases: 'none'`), regardless of any grant. |

Implementation: `defaultAccessFor(user)` in `CaseEditForm` (`src/App.tsx`) computes the current selection from `item.grantedUserIds`/`item.grantedEditUserIds`, and on submit each `<select name="access-${user.id}">` value (`'none' | 'view' | 'edit'`) is collected and split back into the two lists:

```ts
const viewGrants: string[] = [];
const editGrants: string[] = [];
for (const user of grantableUsers) {
  const access = String(form.get(`access-${user.id}`) ?? 'none');
  if (access === 'view' || access === 'edit') viewGrants.push(user.id);
  if (access === 'edit') editGrants.push(user.id);
}
```

The same control and submit logic exists in `CaseForm` (Register Case), using a locally-tracked `responsibleOfficerId` state so the grantable list correctly excludes whoever is currently selected as the responsible officer (it can't be a `defaultValue`-only field anymore, since the grant list needs to react live to that choice).

## Confidentiality auto-grant and downgrade lock

Two safeguards prevent confidentiality from accidentally locking people out or being casually removed:

1. **Auto-grant on confidential toggle.** If the acting user marks a case confidential but isn't the owner, CEO, or General Counsel, and isn't already in the view-grant list, they're automatically added to both `grantedUserIds` and `grantedEditUserIds` on save. Without this, an editor could check the confidential box and immediately lose their own access.
2. **Asymmetric downgrade gate.** Once a case is confidential, only `'full'`-tier `editCases` roles (Legal Manager, Senior Legal Officer, General Counsel) can remove or downgrade confidentiality. The checkbox is shown locked (with an explanatory hint) for anyone else (`confidentialityLocked` in `CaseEditForm`), so a Legal Officer working a confidential case they were granted into can't un-flag it.

## UI locations

- **Register Case** (`CaseForm`, `src/App.tsx`): Case team / access dropdowns sit directly under Responsible Officer + Status, before Registration date.
- **Edit Case** (`CaseEditForm`, `src/App.tsx`): same position - directly under Responsible Officer + Status, before Registration date and the confidentiality toggle. Section label switches between **"Case team"** (non-confidential) and **"Granted access"** (confidential) with matching help text.
- **Case detail Overview tab** (`CaseDetailPage`, `src/App.tsx`): a **Case Team** card sits below **Linked Entity** in the right column, listing:
  - The responsible officer, badged `Owner · Full access`.
  - Each granted user, badged `Read & write` (blue) or `Read only` (muted), computed with the same tier logic as the edit form's `defaultAccessFor`.
  - "No additional team members granted." when the grant lists are empty.

## Design rationale / edge cases

- **Why isn't "read only" offered for Legal Manager/Senior Legal Officer/General Counsel?** Their `editCases` permission is `'full'` - it doesn't check any per-case grant at all. Offering a "read only" option for them would silently fail to restrict anything, which is worse than not offering it.
- **Why does Executive Officer only ever get "Read only"?** `editCases` is `'none'` for that role unconditionally - there's no grant that can override it.
- **Why two list fields instead of one `{ userId, access }[]` array?** Every existing consumer (`isAssignedToCase`, `canAccessConfidentialCase`, `searchService.ts`, seed data in `db.ts`) already reads `grantedUserIds` as a flat membership list for "can view at all." Keeping that field's meaning unchanged and adding a second, narrower `grantedEditUserIds` list avoided rewriting every view-side check, while still letting `editCases` be evaluated independently for the one role where it matters.
- **What if someone is in `grantedEditUserIds` but not `grantedUserIds`?** It has no effect - `hasEditGrant` is only consulted for `editCases`, and a user must already pass `isAssignedToCase`/`canAccessConfidentialCase` (i.e., be in `grantedUserIds`) to view the case at all. The UI never produces this state since it writes both lists from a single per-row selection.

## Verification

```bash
npx tsc --noEmit && npm run build
```

Manually exercised: Legal Manager editing a confidential case, granting a Legal Officer "Read only" then switching to "Read & write"; Executive Officer never offered a write option; registering a new case with a Legal Officer pre-granted "Read & write" and confirming the resulting case's Overview tab shows them correctly.
