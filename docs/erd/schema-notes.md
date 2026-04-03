# Hope PMS — Database Schema Notes

Sprint 1 | Angela Militar (M3 — DB Engineer)
Last updated: 2026-04-03

---

## Table Overview

| Table | Domain | Sprint Added | Notes |
|---|---|---|---|
| product | Product | S1-T08 | Core product catalog. record_status added for soft-delete. |
| pricehist | Product | S1-T08 | One row per price change per product. PK is composite (effdate + prodcode). |
| salesdetail | Product | S1-T08 | Stores per-product sales quantities. Used by REP_002 top-selling report. |
| user | Auth / Rights | S1-T08 | Application user profiles. userid matches Supabase auth.users.id UUID. |
| module | Rights | S1-T08 | Feature group definitions. 3 seeded rows: Prod_Mod, Report_Mod, Adm_Mod. |
| rights | Rights | S1-T08 | Individual permission definitions. 6 seeded rows. FK to module. |
| user_module | Rights | S1-T08 | Junction: user ↔ module. Composite PK (userid + module_id). |
| usermodule_rights | Rights | S1-T08 | Junction: user ↔ rights. Composite PK (userid + right_id). |

---

## Critical Design Rules

- **No hard deletes.** The `DELETE` SQL keyword must never be used anywhere in the application.
  All removal operations set `record_status = 'INACTIVE'`.

- **record_status on product.** `ACTIVE` = visible to all users. `INACTIVE` = soft-deleted.
  USER accounts never see `INACTIVE` rows — enforced at RLS level (S2-T08) and in query filters.

- **record_status on user.** New users are provisioned as `INACTIVE`. An ADMIN or SUPERADMIN
  must activate them before they can log in.

- **stamp column.** Present on all tables. Format: `ACTION USERID YYYY-MM-DD HH:MM`.
  Hidden from USER accounts in all views. Visible to ADMIN and SUPERADMIN only.

- **userid is a TEXT UUID.** `public.user.userid` stores the UUID string from `auth.users.id`.
  Never use an auto-increment integer for userid.

---

## Rights Reference Data (seeded in S1-T08 migration 004)

### Modules

| Module_ID | Description |
|---|---|
| Prod_Mod | Product Management Module |
| Report_Mod | Reports Module |
| Adm_Mod | Admin / User Management Module |

### Rights

| Right_ID | Description | Module |
|---|---|---|
| PRD_ADD | Add Product | Prod_Mod |
| PRD_EDIT | Edit Product | Prod_Mod |
| PRD_DEL | Soft Delete Product | Prod_Mod |
| REP_001 | Product Report Listing | Report_Mod |
| REP_002 | Top Selling Report | Report_Mod |
| ADM_USER | Activate / Manage Users | Adm_Mod |

---

## Rights Matrix — Default Values per User Type

| Right | SUPERADMIN | ADMIN | USER |
|---|---|---|---|
| PRD_ADD | 1 | 1 | 1 |
| PRD_EDIT | 1 | 1 | 1 |
| PRD_DEL | 1 | 0 | 0 |
| REP_001 | 1 | 1 | 1 |
| REP_002 | 1 | 0 | 0 |
| ADM_USER | 1 | 0 | 0 |

---

## Stamp Format

All write operations generate a stamp string in this format:
ACTION USERID YYYY-MM-DD HH:MM

Examples:
- `ADDED user2 2025-10-20 14:30`
- `EDITED user3 2025-11-05 09:15`
- `DEACTIVATED user1 2025-11-10 16:00`

Stamp utility function is in `src/utils/stampHelper.js` (implemented in Sprint 2).

---

## Migration File Index

| File | Description | Sprint Task |
|---|---|---|
| 001_hopedb_core_tables.sql | product, pricehist, salesdetail | S1-T08 |
| 002_add_status_stamp_columns.sql | record_status + stamp on product and pricehist | S1-T08 |
| 003_rights_management_tables.sql | user, module, rights, user_module, usermodule_rights | S1-T08 |
| 004_seed_modules_and_rights.sql | module (3 rows) + rights (6 rows) reference data | S1-T08 |
| 005_enable_rls.sql | RLS enabled on all 8 tables | S1-T08 |
| 006_seed_superadmin.sql | 3 SUPERADMIN accounts seeded | S1-T09 |
| 007_rls_superadmin_protection.sql | RLS blocking ADMIN from modifying SUPERADMIN rows | S1-T09 |