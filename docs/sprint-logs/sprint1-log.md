# Sprint 1 Log — Hope, Inc. Product Management System

*Sprint:* Sprint 1 — Project Setup, Database & Authentication
*Duration:* March 30 – April 12, 2026
*Documented by:* Angel Florendo (M5 — QA / Documentation)
*Last updated:* April 13, 2026

---

## Sprint 1 Goal
Establish the full development foundation: GitHub repository, Supabase database, Google OAuth authentication (only method), login guard (INACTIVE accounts blocked), auto-provisioning trigger, and app shell UI. Sprint 1 Gate requires all 15 tasks complete (S1-T12 dropped) and the login guard verified before Sprint 2 begins.

---

## Sprint 1 Summary

| Metric | Value |
| :--- | :--- |
| *Total Tasks* | 15 (S1-T12 dropped) |
| *Tasks Completed* | 15 |
| *Tasks Carried Over* | 0 |
| *Total PRs Merged* | 15 / 15 |
| *Sprint 1 Gate Status* | *[X] CLEARED* [ ] BLOCKED |

---

## Tasks Completed

| Task ID | Task Name | Assignee | PR | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| S1-T01 | Scaffold Vite + React + Tailwind | Janice (M1) | feat/project-scaffold | ✅ Done | |
| S1-T02 | Supabase Client & .env Config | Janice (M1) | feat/supabase-client | ✅ Done | |
| S1-T03 | React Router v6 + ProtectedRoute | Janice (M1) | feat/routing-skeleton | ✅ Done | |
| S1-T04 | Login Page (Google button) | Marlan (M2) | feat/ui-login-page | ✅ Done | |
| S1-T05 | Register Page | Marlan (M2) | feat/ui-register-page | ✅ Done | Redirects to /login |
| S1-T06 | App Shell — Navbar & Sidebar | Marlan (M2) | feat/ui-app-shell | ✅ Done | |
| S1-T07 | Auth Callback Page | Marlan (M2) | feat/ui-auth-callback | ✅ Done | |
| S1-T08 | HopeDB + Rights Scripts | Angela (M3) | db/initial-schema | ✅ Done | |
| S1-T09 | Seed SUPERADMIN Account | Angela (M3) | db/seed-superadmin | ✅ Done | |
| S1-T10 | ERD and Schema Documentation | Angela (M3) | docs/db-erd | ✅ Done | |
| S1-T11 | AuthContext & Session Listener | Maye (M4) | feat/auth-context | ✅ Done | |
| S1-T12 | Email Signup & Signin Wired | Maye (M4) | — | ❌ Dropped | |
| S1-T13 | Google OAuth + Callback + Guard | Maye (M4) | feat/auth-google-oauth | ✅ Done | |
| S1-T14 | provision_new_user() Trigger | Maye (M4) | db/trigger-provision-user | ✅ Done | |
| S1-T15 | Auth Test Cases | Angel (M5) | test/sprint1-auth-flows | ✅ Done | |
| S1-T16 | Sprint 1 Log & README | Angel (M5) | docs/sprint1-log-readme | ✅ Done | |

---

## Blockers and Resolutions

| # | Blocker | Resolution | Resolved By |
| :--- | :--- | :--- | :--- |
| 1 | onAuthStateChange race condition | Separated session setting from profile fetch | Maye (M4) |
| 2 | RLS SELECT policy too restrictive | Moved visibility gating to React layer | Angela/Maye |
| 3 | Email/Password redundancy | S1-T12 dropped in favor of Google OAuth | Team |

---

## Sprint 1 Gate Verification

| Gate Item | Status |
| :--- | :--- |
| Google OAuth sign-in works end-to-end | *PASS* |
| INACTIVE account blocked on /login | *PASS* |
| New user provisioned as USER/INACTIVE | *PASS* |
| Database fully seeded | *PASS* |

*Overall Gate Status:*
*CLEARED*
*Gate Cleared Date:* April 13, 2026
*Gate Signed Off By:* Janice Hernandez (M1)

---

## Sprint 1 Team Retrospective Notes

*What went well:*
* Decisive pivot to Google-only auth saved time.
* UI/UX for the login guard is clear for new users.

*What to improve:*
* Coordination between database schema updates and frontend logic.