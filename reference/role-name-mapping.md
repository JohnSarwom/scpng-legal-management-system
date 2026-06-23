# Role Name Mapping

## Purpose

The top-right role selector now maps roles to real SCPNG staff names from the intranet data.

Changing the role updates:

- Dashboard greeting
- Name badge
- Header initials
- Permission behavior
- Responsible officer name resolution

## Source Reference

Names were taken from the intranet project:

- `C:\Users\IT_UNIT\Desktop\Coding\scpng-intranet\db\seed_all_staff.sql`
- `C:\Users\IT_UNIT\Desktop\Coding\scpng-intranet\src\mockData\mockOfficerProfiles.ts`
- `C:\Users\IT_UNIT\Desktop\Coding\scpng-intranet\src\data\employeeData.ts`

## Current Mapping

| Role | Name |
| --- | --- |
| CEO | James Joshua |
| General Counsel | Andy Ambulu |
| Legal Manager | Tyson Yapao |
| Senior Legal Officer | Isaac Mel |
| Legal Officer | Immanuel Minoga |
| Executive Officer | Ninipe Gurumo |

Additional seeded legal officers:

- Tony Kawas
- Johnson Tengere

## Code Location

Main roster:

- `src/services/mock/db.ts`

Session source:

- `src/context/SessionContext.tsx`

Role list:

- `src/config/enums.ts`

## Editing Notes

- Keep `SessionContext` using the seeded user records as the single source of truth.
- If staff names change, update `users` in `src/services/mock/db.ts`.
- Be careful with user IDs because cases, documents, and correspondence reference them.
