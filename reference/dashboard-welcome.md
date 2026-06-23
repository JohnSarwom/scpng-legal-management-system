# Dashboard Welcome

## Purpose

The dashboard now opens with a personalized welcome hero instead of a plain page header.

It shows:

- Current date
- Time-based greeting
- Officer first name
- Full officer name
- Current role
- Permission-aware quick actions

The metric cards below the hero remain the source of truth for operational counts.

## Code Location

Main implementation:

- `src/App.tsx`
- `DashboardPage()`

Supporting role state:

- `src/context/SessionContext.tsx`
- `src/services/mock/db.ts`

## Quick Actions

The hero quick actions are derived from permissions via `usePermission()`:

- `createCases` -> Register Case
- `uploadDocuments` -> Upload Document
- `registerCorrespondence` -> New Correspondence
- `viewReports` -> View Reports fallback

Only the first three permitted actions are shown.

## Editing Notes

- Avoid adding count cards back into the hero if the same count exists in the dashboard cards.
- Keep the hero personal and action-oriented.
- If adding new quick actions, make sure they are permission-aware.
- If a route changes, update the `to` values in `quickActions`.
