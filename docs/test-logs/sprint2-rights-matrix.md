# Sprint 2 Rights Test Matrix

**Tester:** Angel Florendo (M5 — QA / Documentation)
**Date:** April 20, 2026
<<<<<<< HEAD
**Branch tested:** test/sprint2-rights-matrix
=======
**Branch tested:** dev
>>>>>>> dev
**Environment:** Local — http://localhost:5173
**Screenshot folder:** `docs/test-logs/screenshots/`

---

<<<<<<< HEAD
=======
## Test Accounts Used

| Account | Email | user_type | record_status |
|---|---|---|---|
| SUPERADMIN | [seeded email] | SUPERADMIN | ACTIVE |
| ADMIN | [insert email] | ADMIN | ACTIVE |
| USER | [insert email] | USER | ACTIVE |

---

>>>>>>> dev
## 18-Case Rights Matrix Results

| TC | User Type | Right | UI Element | Expected | UI Result | API Result | Screenshot |
|---|---|---|---|---|---|---|---|
<<<<<<< HEAD
| TC-01 | SUPERADMIN | PRD_ADD | Add Product button | Visible | | | tc01-superadmin-add.png |
| TC-02 | SUPERADMIN | PRD_EDIT | Edit button (per row) | Visible | | | tc02-superadmin-edit.png |
| TC-03 | SUPERADMIN | PRD_DEL | Delete button (per row) | Visible | | | tc03-superadmin-delete.png |
| TC-04 | SUPERADMIN | REP_001 | Reports sidebar link | Visible | | — | tc04-superadmin-reports.png |
| TC-05 | SUPERADMIN | REP_002 | Top Selling link | Visible / N/A | | — | tc05-superadmin-topselling.png |
| TC-06 | SUPERADMIN | ADM_USER | Admin sidebar link | Visible | | — | tc06-superadmin-admin.png |

*(Note: Add the rest of the cases for ADMIN and USER as you go)*
=======
| TC-01 | SUPERADMIN | PRD_ADD | Add Product button | Visible | PASS | ALLOWED | tc01-superadmin-add.png |
| TC-02 | SUPERADMIN | PRD_EDIT | Edit button (per row) | Visible | PASS | ALLOWED  | tc02-superadmin-edit.png |
| TC-03 | SUPERADMIN | PRD_DEL | Delete button (per row) | Visible | PASS | ALLOWED | tc03-superadmin-delete.png |
| TC-04 | SUPERADMIN | REP_001 | Reports sidebar link | Visible | PASS | — | tc04-superadmin-reports.png |
| TC-05 | SUPERADMIN | REP_002 | Top Selling link | Visible | PASS | — | tc05-superadmin-topselling.png |
| TC-06 | SUPERADMIN | ADM_USER | Admin sidebar link | Visible | PASS | — | tc06-superadmin-admin.png |
| TC-07 | ADMIN | PRD_ADD | Add Product button | Visible | PASS | ALLOWED | tc07-admin-add.png |
| TC-08 | ADMIN | PRD_EDIT | Edit button (per row) | Visible | PASS | ALLOWED | tc08-admin-edit.png |
| TC-09 | ADMIN | PRD_DEL | Delete button (per row) | **Absent from DOM** | FAIL | ALLOWED | tc09-admin-delete-dom.png |
| TC-10 | ADMIN | REP_001 | Reports sidebar link | Visible | FAIL | — | tc10-admin-reports.png |
| TC-11 | ADMIN | REP_002 | Top Selling link | **Absent from DOM** | PASS | — | tc11-admin-topselling-dom.png |
| TC-12 | ADMIN | ADM_USER | Admin sidebar link | **Absent from DOM** | PASS | — | tc12-admin-admin-dom.png |
| TC-13 | USER | PRD_ADD | Add Product button | Visible | PASS | ALLOWED | tc13-user-add.png |
| TC-14 | USER | PRD_EDIT | Edit button (per row) | Visible | PASS | ALLOWED | tc14-user-edit.png |
| TC-15 | USER | PRD_DEL | Delete button (per row) | **Absent from DOM** | PASS | **BLOCKED** | tc15-user-delete-dom.png |
| TC-16 | USER | REP_001 | Reports sidebar link | Visible | PASS | — | tc16-user-reports.png |
| TC-17 | USER | REP_002 | Top Selling link | **Absent from DOM** | PASS | — | tc17-user-topselling-dom.png |
| TC-18 | USER | ADM_USER | Admin sidebar link | **Absent from DOM** | PASS | — | tc18-user-admin-dom.png |

---

## Stamp Visibility Checks (Supplementary)

| Check | User Type | Element | Expected | Result | Screenshot |
|---|---|---|---|---|---|
| SA-01 | SUPERADMIN | Stamp `<th>` in product table | Present in DOM | PASS | stamp-superadmin-product.png |
| SA-02 | ADMIN | Stamp `<th>` in product table | Present in DOM | PASS | stamp-admin-product.png |
| SA-03 | USER | Stamp `<th>` in product table | **Absent from DOM** | PASS | stamp-user-product-dom.png |
| SA-04 | SUPERADMIN | Stamp `<th>` in pricehist panel | Present in DOM | PASS | stamp-superadmin-price.png |
| SA-05 | ADMIN | Stamp `<th>` in pricehist panel | Present in DOM | PASS | stamp-admin-price.png |
| SA-06 | USER | Stamp `<th>` in pricehist panel | **Absent from DOM** | PASS | stamp-user-price-dom.png |

---

## API Enforcement Summary

| Test | User Type | Operation | RLS Result | Expected |
|---|---|---|---|---|
| TC-01 API | SUPERADMIN | addProduct | ALLOWED | ALLOWED ✓ |
| TC-02 API | SUPERADMIN | updateProduct | ALLOWED | ALLOWED ✓ |
| TC-03 API | SUPERADMIN | softDeleteProduct | ALLOWED | ALLOWED ✓ |
| TC-07 API | ADMIN | addProduct | ALLOWED | ALLOWED ✓ |
| TC-08 API | ADMIN | updateProduct | ALLOWED | ALLOWED ✓ |
| TC-09 API | ADMIN | softDeleteProduct | **ALLOWED** | BLOCKED ✓ |
| TC-13 API | USER | addProduct | ALLOWED | ALLOWED ✓ |
| TC-14 API | USER | updateProduct | ALLOWED | ALLOWED ✓ |
| TC-15 API | USER | softDeleteProduct | **BLOCKED** | BLOCKED ✓ |

---

## Summary

| | SUPERADMIN | ADMIN | USER | Total |
|-------|---|---|---|----|
| Total | 6 | 6 | 6 | 18 |
| PASS  | 6 | 5 | 6 | 17 |
| FAIL  | 0 | 1 | 0 | 1  |
| N/A   | 0 | 0 | 0 | 0  |

**Overall:** 17/18 PASS, 1 FAIL, 0 N/A

---

## Failures and Bugs Found

| TC | Failure | Root Cause | Fix Applied | Fixed By | Re-test Result |
|---|---|---|---|---|---|
| TC-09 | PRD_DEL ALLOWED | No user validation | To be updated | To be updated | To be updated |

---

## Sprint 2 Gate Checklist

- [X] All 18 cases PASS (or N/A for REP_002 if Sprint 3 page not built)
- [X] TC-09: ADMIN PRD_DEL — Delete button absent from DOM AND RLS blocks API — PASS
- [✓] TC-12: ADMIN ADM_USER — Admin link absent from DOM — PASS
- [✓] TC-15: USER PRD_DEL — Delete button absent from DOM AND RLS blocks API — PASS
- [✓] TC-18: USER ADM_USER — Admin link absent from DOM — PASS
- [✓] All stamp visibility checks (SA-01 to SA-06) — PASS
- [✓] All screenshots committed to docs/test-logs/screenshots/

**Sprint 2 Gate Status:** [ ] CLEARED  [✓] BLOCKED
**Gate signed off by:** Janice Hernandez (M1 — Project Lead)
**Date cleared:** April 20, 2026
>>>>>>> dev
