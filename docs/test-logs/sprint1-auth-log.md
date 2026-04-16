# Sprint 1 Auth Test Log

**Tester:** Angel Florendo (M5 — QA / Documentation)  
**Date:** April 14, 2026  
**Branch tested:** test/sprint1-auth-flows  
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
| TC-13 | ACTIVE SUPERADMIN → /products → Navbar username | PASS | Verified with Janice's admin account. |
| TC-14 | INACTIVE account → /login?error=not_activated | PASS | Blocked correctly with red error alert. |
| TC-15 | New Google user → USER/INACTIVE via trigger | PASS | Row appeared in Supabase as expected. |
| TC-16 | Navbar displays currentUser.username | PASS | Correctly shows "Janice" instead of email. |

### TC-13 Observations
* **Google account used:** janice.h@gmail.com (Superadmin)
* **Navigation confirmed:** After Google popup closed, app showed the loading spinner and redirected to `/products` within 1.5 seconds.
* **Navbar content:** The top right corner correctly displays "Janice".

### TC-14 Observations
* **Account details:** Used a test account manually set to `record_status = 'INACTIVE'` in the Supabase dashboard.
* **Behavior:** System correctly prevented access to `/products` and pushed the user back to `/login?error=not_activated`.
* **UI:** The message "Your account is pending activation by an administrator" appeared clearly.

### TC-15 Observations
* **New User Account:** florendo.angel.test@gmail.com
* **Database Check:** Checked `public.user` table; a new row was automatically created. 
* **Trigger Verification:** Confirmed `user_type` was set to `USER` and `record_status` to `INACTIVE` by default.
* **Rights:** 6 default rows were created in `UserModule_Rights`.

### TC-16 Observations
* **Observation:** The Navbar successfully displays the `username` property. I verified that if the `username` is changed in the database, it updates in the Navbar after a page refresh.

---

## Issues Found
* **Fixed:** Resolved pathing issues in the test suite where mocks were not being found in the root directory.
* **Fixed:** Updated `ProtectedRoute` to allow entry when `session` is valid but `currentUser` profile is still in a null/loading state (TC-12).

---

## Sprint 1 Gate Verdict
- [x] All 12 automated tests pass
- [x] TC-13: ACTIVE SUPERADMIN → /products → Navbar username — PASS
- [x] TC-14: INACTIVE account blocked — PASS
- [x] TC-15: New Google user trigger provisioning — PASS
- [x] TC-16: Navbar shows currentUser.username — PASS

**Sprint 1 Gate Status:** [x] CLEARED  [ ] BLOCKED