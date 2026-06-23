# Verification Notes

## Build

Run:

```bash
npm run build
```

Expected:

- TypeScript build passes
- Vite production build completes
- Existing large chunk warning may appear

## Useful Preview URLs

Dashboard:

```text
http://127.0.0.1:5173/
```

Cases:

```text
http://127.0.0.1:5173/cases
```

Documents:

```text
http://127.0.0.1:5173/documents
```

CEO Correspondence:

```text
http://127.0.0.1:5173/correspondence
```

Search & Relationships:

```text
http://127.0.0.1:5173/search?focus=entity:ENT-001&q=ca
```

## Manual Checks

Dashboard:

- Switch role in the header.
- Confirm greeting, name badge, and initials update.
- Confirm quick actions match role permissions.

Filters:

- Open Filters popovers on Cases, Documents, and CEO Correspondence.
- Apply a filter.
- Confirm active chip appears.
- Click chip and confirm it clears.

Search:

- Search by visible number such as `CASE-2026`.
- Search by title/subject fragment.
- Search by document number such as `DOC-2026`.

Relationship Map:

- Hover a node.
- Confirm only the styled tooltip appears.
- Click a case/document/correspondence node.
- Confirm it opens the detail page.
