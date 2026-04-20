# Sprint 2 Soft-Delete & Visibility Test Log

**Tester:** Angel Florendo (M5 — QA / Documentation)
**Date:** April 20, 2026
**Branch tested:** dev
**Environment:** Local — http://localhost:5173
**Screenshot folder:** docs/test-logs/screenshots/

---

## Test 1 — Soft-Delete Visibility

| Step | Expected | Result | Screenshot |
|---|---|---|---|
| AK0001 visible in SUPERADMIN list before delete | Visible | PASS | t1a-before-delete-superadmin.png |
| AK0001 visible in USER list before delete | Visible | PASS | t1b-before-delete-user.png |
| AK0001 absent from SUPERADMIN list after delete | Absent immediately | PASS | t1c-after-delete-superadmin.png |
| AK0001 absent from USER list after delete | **Absent** | PASS | t1d-after-delete-user.png |
| AK0001 visible in Deleted Items (SUPERADMIN) | Visible with stamp | PASS | t1e-deleted-items-superadmin.png |
| DB: record_status = INACTIVE | Confirmed | PASS | — |
| DB: stamp starts with DEACTIVATED | Confirmed | PASS | — |

**Test 1 Result:** PASS
**Observations:** [notes]

---

## Test 2 — Recovery

| Step | Expected | Result | Screenshot |
|---|---|---|---|
| AK0001 visible in ADMIN Deleted Items | Visible | PASS | t2a-admin-deleted-items.png |
| AK0001 absent from Deleted Items after Recover | Absent | PASS | t2b-after-recovery-deleted-items.png |
| Success flash message shown | Shown | PASS | — |
| AK0001 visible in ADMIN products list | Visible | PASS | t2c-recovered-admin-products.png |
| AK0001 visible in USER products list | Visible | PASS | t2d-recovered-user-products.png |
| DB: record_status = ACTIVE | Confirmed | PASS | — |
| DB: stamp starts with REACTIVATED | Confirmed | PASS | — |

**Test 2 Result:** PASS
**Observations:** [notes]

---

## Test 3 — Direct API Bypass (RLS Enforcement)

| Check | Expected | Result | Screenshot |
|---|---|---|---|
| USER DevTools query — INACTIVE rows returned | 0 rows | PASS | t3a-rls-bypass-user-blocked.png |
| ADMIN DevTools query — INACTIVE rows returned | ≥ 1 row | PASS | t3b-rls-admin-sees-inactive.png |

**Test 3 Result:** PASS
**Critical finding:** [state how many INACTIVE rows USER received — must be 0]

---

## Test 4 — Price History Visibility and Write Access

| Check | Expected | Result | Screenshot |
|---|---|---|---|
| USER can view price history panel | Panel loads with rows | PASS | t4a-pricehist-visible-user.png |
| USER pricehist stamp — absent from DOM | 0 DOM results for Stamp | PASS | t4b-pricehist-stamp-absent-user.png |
| USER can add a price entry | New row appears at top | PASS | t4c-pricehist-add-user.png |
| ADMIN can see stamp in price history | Stamp column visible | PASS | t4d-pricehist-stamp-visible-admin.png |
| DB: new pricehist row with ADDED stamp | Confirmed | PASS | — |

**Test 4 Result:** PASS
**Observations:** [notes]

---

## Test 5 — Product Table Stamp Visibility

| Check | Expected | Result | Screenshot |
|---|---|---|---|
| USER product table stamp — absent from DOM | 0 DOM search results | PASS | t5a-stamp-absent-user-products.png |
| ADMIN product table stamp — visible with values | Column present | PASS | t5b-stamp-visible-admin-products.png |
| SUPERADMIN product table stamp — visible | Column present | PASS | t5c-stamp-visible-superadmin-products.png |
| ADMIN Deleted Items stamp — always visible | Column present | PASS | t5d-stamp-visible-deleted-items.png |

**Test 5 Result:** PASS
**Observations:** [notes]

---

## Test 6 — USER Cannot Soft-Delete via Direct API

| Check | Expected | Result | Screenshot |
|---|---|---|---|
| USER calls softDeleteProduct() directly | BLOCKED by RLS | PASS | t6a-rls-softdelete-user-blocked.png |
| AK0001 record_status after USER attempt | ACTIVE (unchanged) | PASS | — |

**Test 6 Result:** PASS
**RLS error message returned:** [paste exact error message from console]

---

## Test 7 — No Hard Deletes Audit

| Check | Expected | Result | Screenshot |
|---|---|---|---|
| `.delete()` on product/user in src/ | 0 results | PASS / FAIL | t7-no-hard-deletes-audit.png |
| `DELETE FROM <product/user>` in db/ | 0 results | PASS / FAIL | — |
| `no-hard-deletes-audit.txt` committed | File present | PASS / FAIL | — |

**Violations found:** [list any .delete() calls, or write "None"]
**Test 7 Result:** PASS / FAIL

---

## Overall Sprint 2 Soft-Delete Gate

| Test | Result |
|---|---|
| Test 1 — Soft-Delete Visibility | PASS|
| Test 2 — Recovery | PASS |
| Test 3 — RLS Bypass Blocked | PASS |
| Test 4 — Price History Visibility & Write | PASS |
| Test 5 — Product Table Stamp Visibility | PASS |
| Test 6 — USER API Soft-Delete Blocked | PASS |
| Test 7 — No Hard Deletes Audit | PASS |

**Gate Status:** [X] CLEARED  [ ] BLOCKED
**Signed off by:** Janice Hernandez (M1 — Project Lead)
**Date:** April 20, 2026