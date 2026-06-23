# Hybrid Filters

## Purpose

The Cases, Documents, and CEO Correspondence pages use a compact hybrid filter pattern.

Visible controls stay easy to reach, while detailed filters are grouped inside a single Filters popover.

## Pattern

Each page keeps:

- Search input visible
- Filters button
- Reset button
- Active filter chips under the toolbar

Cases also keeps:

- Sort dropdown
- Archived checkbox

Documents and CEO Correspondence also keep:

- Sort dropdown

## Date Range Filters

Date ranges limit which rows are included. They do not change record status.

- Cases use the stored `dateOpened` field, but the UI labels it as registration timing to avoid confusion with the `Open` status:
  - `Registered from`
  - `Registered to`
  - `Newest registered`
  - `Oldest registered`
- Documents use `uploadDate`:
  - `Uploaded from`
  - `Uploaded to`
  - `Newest uploaded`
  - `Oldest uploaded`
- CEO Correspondence uses `date`:
  - `Dated from`
  - `Dated to`
  - `Newest date`
  - `Oldest date`

## Code Location

Main components in `src/App.tsx`:

- `CaseFilters()`
- `DocumentFilters()`
- `CorrespondenceFilters()`

Page usage:

- `CasesPage()`
- `DocumentsPage()`
- `CorrespondencePage()`

## Active Chips

Active chips show selected filter state and can be clicked to clear individual filters.

Examples:

- `Status: Open`
- `Type: Compliance`
- `Officer: Tyson Yapao`
- `Registered from: 2026-05-01`
- `Uploaded to: 2026-06-30`
- `Dated from: 2026-04-01`
- `Category: Legal Opinions`
- `Direction: Incoming`

## Editing Notes

- Keep search outside the popover.
- Keep Sort separate from Filters because sorting changes order, not inclusion.
- If a new filter is added, update both the popover control and the active chip list.
- Keep date range labels tied to the page's business meaning, not only the data field name.
- Avoid "Opened from/to" on cases because it can be confused with the `Open` status.
- Keep CEO Correspondence sort labels short enough for the toolbar (`Newest date`, `Oldest date`, `Letter no.`, `Status`).
- Keep filter popovers compact and aligned with the existing maroon/white styling.
