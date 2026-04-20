# Sprint 2 Log — Hope, Inc. Product Management System

**Sprint:** Sprint 2 — Product CRUD, Rights Enforcement & Soft Delete Visibility
**Duration:** April 13 – April 26, 2026
**Documented by:** Angel Florendo (M5 — QA / Documentation)
**Last updated:** April 26, 2026

---

## Sprint 2 Goal

Deliver full product CRUD (Add, Edit, Soft-Delete, Recover) with price history, enforce all
six rights at both the UI and DB layers, implement two-layer soft-delete visibility rules
(USER cannot see INACTIVE rows even via direct API), and pass the 18-case rights matrix
and seven soft-delete visibility tests before Sprint 3 begins.

---

## Sprint 2 Summary

| Metric | Value |
|---|---|
| Total Tasks | 16 |
| Tasks Completed | 16 |
| Tasks Carried Over to Sprint 3 | 0 |
| Total PRs Merged into dev | 16 / 16 |
| Bugs Found | 2 |
| Bugs Fixed in Sprint 2 | 2 |
| Sprint 2 Gate Status | [x] CLEARED  [ ] BLOCKED |

---

## Tasks Completed

| Task ID | Task Name | Assignee | PR | Status | Notes |
|---|---|---|---|---|---|
| S2-T01 | Product Service Functions | Janice (M1) | feat/product-api | ✅ Done | makeStamp utility included |
| S2-T02 | PriceHist Service Functions | Janice (M1) | feat/pricehist-api | ✅ Done | getAllCurrentPrices() added |
| S2-T03 | Route Guard – Deleted Items | Janice (M1) | feat/route-guard-deleted | ✅ Done | RoleRoute + UserRightsProvider mounted |
| S2-T04 | Product List Page | Marlan (M2) | feat/ui-product-list | ✅ Done | Integrated stamp gating & status filters |
| S2-T05 | Product CRUD Modals | Marlan (M2) | feat/ui-product-crud | ✅ Done | Full lifecycle: Add, Edit, Soft-Delete |
| S2-T06 | Price History Panel | Marlan (M2) | feat/ui-price-history | ✅ Done | Real-time entry form for price history |
| S2-T07 | Deleted Items Page | Marlan (M2) | feat/ui-deleted-items | ✅ Done | Recovery function restricted to Admins |
| S2-T08 | RLS SELECT Policy – Product | Angela (M3) | db/rls-product-select | ✅ Done | Migration 016 |
| S2-T09 | RLS Write Policies – Product | Angela (M3) | db/rls-product-write | ✅ Done | Migration 017; pricehist policies included |
| S2-T10 | current_product_price View | Angela (M3) | db/view-current-price | ✅ Done | Migration 018; security_invoker set |
| S2-T11 | UserRightsContext | Maye (M4) | feat/rights-context | ✅ Done | Migration 019 (UMR SELECT policy) |
| S2-T12 | Button & Stamp Gating | Maye (M4) | feat/rights-ui-gating | ✅ Done | useProductRights hook; modal guards |
| S2-T13 | Sidebar Link Gating | Maye (M4) | feat/rights-sidebar | ✅ Done | Dynamic link visibility for Admin/Deleted |
| S2-T14 | Rights Test Matrix | Angel (M5) | test/sprint2-rights-matrix | ✅ Done | 18 cases + 6 stamp checks |
| S2-T15 | Soft-Delete & Visibility Tests | Angel (M5) | test/sprint2-softdelete-visibility | ✅ Done | 7 tests + hard-delete audit |
| S2-T16 | Sprint 2 Log | Angel (M5) | docs/sprint2-log | ✅ Done | This document |

---

## Bugs Found and Fixed

| # | Bug | Found During | Task | Root Cause | Fix | Fixed By | Date Fixed | Re-test |
|---|---|---|---|---|---|---|---|---|
| 1 | Delete button visible for ADMIN | S2-T14 | S2-T12 | UMR seed error (PRD_DEL set to 1) | Updated Migration 019 seed data | Maye (M4) | April 24 | PASS |
| 2 | RLS blocks valid ADMIN edits | S2-T15 | S2-T09 | Logic error in USING clause SQL | Revised RLS policy for write access | Angela (M3) | April 25 | PASS |

---

## Blockers and Resolutions

| # | Blocker | Task Affected | Resolution | Resolved By | Date |
|---|---|---|---|---|---|
| 1 | Column naming mismatch | S2-T09 | Synced camelCase vs snake_case across UI and DB | Team Sync | April 18 |

---

## Rights Test Matrix Summary

Full results in: `docs/test-logs/sprint2-rights-matrix.md`

| User Type | PRD_ADD | PRD_EDIT | PRD_DEL | REP_001 | REP_002 | ADM_USER | All Pass? |
|---|---|---|---|---|---|---|---|
| SUPERADMIN | PASS | PASS | PASS | PASS | N/A | PASS | YES |
| ADMIN | PASS | PASS | PASS (absent) | PASS | N/A | PASS (absent) | YES |
| USER | PASS | PASS | PASS (absent) | PASS | N/A | PASS (absent) | YES |

**18-case matrix result:** 15/18 PASS (3 N/A for REP_002)
**Stamp visibility supplementary checks (6 cases):** 6/6 PASS

---

## Soft-Delete & Visibility Test Summary

Full results in: `docs/test-logs/sprint2-softdelete-visibility.md`

| Test | Description | Result |
|---|---|---|
| Test 1 | Soft-delete → product absent from USER list | ✅ PASS |
| Test 2 | Recovery → product reappears for all users | ✅ PASS |
| Test 3 | USER direct API bypass → RLS returns 0 INACTIVE rows | ✅ PASS |
| Test 4 | Price history visible + writable; pricehist stamp gated | ✅ PASS |
| Test 5 | Product table stamp absent from DOM for USER | ✅ PASS |
| Test 6 | USER soft-delete via direct API blocked by RLS | ✅ PASS |
| Test 7 | No hard deletes — grep audit: 0 violations | ✅ PASS |

---

## Sprint 2 Gate Verification Checklist

| Gate Item | Status |
|---|---|
| All 18 rights test cases PASS (or N/A for REP_002) | [x] PASS |
| Soft-delete: USER cannot see INACTIVE rows in UI | [x] PASS |
| Soft-delete: USER direct API bypass blocked by RLS (Test 3) | [x] PASS |
| USER soft-delete via direct API blocked by RLS (Test 6) | [x] PASS |
| Stamp absent from DOM for USER in product table | [x] PASS |
| Stamp absent from DOM for USER in price history panel | [x] PASS |
| No hard deletes found in codebase or migrations (Test 7) | [x] PASS |
| Price history accessible and writable by all user types | [x] PASS |
| All 16 Sprint 2 PRs merged into dev | [x] PASS |

**Overall Gate Status:** [x] CLEARED — Sprint 3 can begin
**Gate Cleared Date:** April 26, 2026
**Gate Signed Off By:** Janice Hernandez (M1 — Project Lead)

---

## Sprint 2 Team Retrospective Notes

**What went well:**
- Parallel tracks for UI and DB worked efficiently due to early placeholder stubs.
- RLS migration pattern successfully secured the database against direct API bypasses.

**What to improve:**
- Column name casing (snake vs camel) caused minor delays; need a stricter audit before Sprint 3 starts.
- Initial UserRightsContext debugging was slow due to missing SELECT policies on system tables.

**Action items for Sprint 3:**
1. Agree on final column naming conventions for all new tables before writing migrations.
2. Remove all temporary developer RLS bypass policies on day one of Sprint 3.
3. Apply automatic stamp visibility checks to all newly developed components.