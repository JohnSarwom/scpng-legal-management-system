# Supabase Integration Contract

- `caseService.getAll` -> `supabase.from('cases').select('*')`, with RBAC/confidential filters applied in SQL policies and service parameters.
- `caseService.create/update/remove` -> `cases` table plus `audit_logs` insert; auto numbers should use a database sequence that preserves `CASE-YYYY-NNN`.
- `documentService` metadata -> `documents`; versions -> `document_versions`; binary files -> Storage bucket `legal-documents`.
- `documentService.download` -> create a signed URL and insert an audit `Download` row.
- `correspondenceService` -> `correspondence` table, attachment links through `correspondence_documents`.
- `entityService` remains read-only and maps to the Licensing / Entity Management API or a read replica view.
- `searchService` can become a database view or RPC that unions entity, case, document, and correspondence search rows.
- `reportService` should use database views for dashboard metrics but keep the same return shapes.
- UI components import only from hooks/services exports, so this file's implementation can replace mocks without changing feature code.
