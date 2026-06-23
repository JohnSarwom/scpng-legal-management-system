# Search Behavior

## Purpose

Search inputs should match both record identifiers and human-readable text.

This makes searching work whether a user remembers a number, ID, title, or subject.

## Matching Rules

Cases match:

- Internal `id`
- `caseNumber`
- `caseTitle`
- `caseType`
- Related entity name

Documents match:

- Internal `id`
- `documentNumber`
- `title`
- `category`

CEO Correspondence matches:

- Internal `id`
- `correspondenceNumber`
- `subject`
- `sender`
- `recipient`

Global search follows the same general ID/number/title/subject behavior.

## Code Location

Service-level search:

- `src/services/mock/caseService.ts`
- `src/services/mock/documentService.ts`
- `src/services/mock/correspondenceService.ts`
- `src/services/mock/searchService.ts`

Local picker searches:

- `LinkDocumentModal()` in `src/App.tsx`
- `LinkCorrespondenceModal()` in `src/App.tsx`

## Editing Notes

- Keep matching case-insensitive using lowercase comparisons.
- When adding a new searchable field, update both list services and global search if relevant.
- Picker searches are local component filters, not service filters.
