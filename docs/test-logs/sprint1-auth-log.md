# Sprint 1 Auth Test Log

**Tester:** Angel Florendo (M5 — QA / Documentation)
**Date:** [insert date]
**Branch tested:** dev (after S1-T13 and S1-T14 merge)
**Environment:** Local — http://localhost:5173

---

## Automated Test Results

| Test ID | Test Name | Result |
|---|---|---|
| TC-01 | LoginPage: renders title and Google button | PASS |
| TC-02 | LoginPage: no email or password fields | PASS |
| TC-03 | Google button calls signInWithOAuth with google provider | PASS |
| TC-04 | redirectTo includes /auth/callback | PASS |
| TC-05 | Shows activation error when ?error=not_activated | PASS |
| TC-06 | No activation error without error param | PASS |
| TC-07 | Shows loading spinner when loading=true | PASS |
| TC-08 | ProtectedRoute shows spinner while loading | PASS |
| TC-09 | ProtectedRoute redirects to /login when session=null | PASS |
| TC-10 | ProtectedRoute redirects INACTIVE account | PASS |
| TC-11 | ProtectedRoute renders content for ACTIVE account | PASS |
| TC-12 | ProtectedRoute renders content when currentUser=null but session exists | PASS |

**Command:** `npm test`
**Total automated:** 12 | **Passed:** 12 | **Failed:** 0

---

## Manual Test Results

| Test ID | Test Name | Result | Notes |
|---|---|---|---|
| TC-13 | ACTIVE SUPERADMIN → /products → Navbar username | [ ] PASS / [ ] FAIL | |
| TC-14 | INACTIVE account → /login?error=not_activated | [ ] PASS / [ ] FAIL | |
| TC-15 | New Google user → USER/INACTIVE via trigger | [ ] PASS / [ ] FAIL | |
| TC-16 | Navbar displays currentUser.username | [ ] PASS / [ ] FAIL | |

### TC-13 Observations
_[Fill in: Google account used, navigation confirmed, Navbar content]_

### TC-14 Observations
_[Fill in: account details, exact error message seen, any unexpected behaviour]_

### TC-15 Observations
_[Fill in: Google account used, Supabase Dashboard row verification, username value]_

### TC-16 Observations
_[Fill in: username shown in Navbar, whether it matched public.user.username]_

---

## Issues Found

_[Format: TEST_ID — Description — Status (Open / Fixed)]_

---

## Sprint 1 Gate Verdict

- [ ] All 12 automated tests pass
- [ ] TC-13: ACTIVE SUPERADMIN → /products → Navbar username — PASS
- [ ] TC-14: INACTIVE account blocked — PASS
- [ ] TC-15: New Google user trigger provisioning — PASS
- [ ] TC-16: Navbar shows currentUser.username — PASS

**Sprint 1 Gate Status:** [ ] CLEARED  [ ] BLOCKED