# Hope, Inc. — Product Management System

*BS Computer Science Capstone Project*
New Era University | College of Computer Studies | AY 2025–2026
Software Engineering 2 | Instructor: Jeremias C. Esperanza

---

## Team

| Member | Role |
|---|---|
| Janice Hernandez | M1 — Project Lead / Full-Stack |
| Marlan Alfonso | M2 — Frontend Developer |
| Angela Militar | M3 — Database Engineer |
| Maye Finlean Limbaring | M4 — Rights & Auth Specialist |
| Angel Florendo | M5 — QA / Documentation |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Google OAuth 2.0 via Supabase Auth |
| State Management | React Context API |
| Testing | Vitest + React Testing Library |
| Version Control | Git + GitHub |
| Deployment | Vercel or Netlify (Sprint 3) |

---

## Authentication

*Google OAuth is the only sign-in method.* There is no email/password registration.

New users who sign in with Google are automatically provisioned as USER / INACTIVE
by the provision_new_user() trigger. A SUPERADMIN or ADMIN must activate the account
before the user can access the application.

---

## Local Setup

### 1. Prerequisites

- Node.js v18 or higher — check with node -v
- npm v9 or higher — check with npm -v
- Git configured — git config --global user.name and git config --global user.email

### 2. Clone the repository

```bash
git clone git@github.com:<your-org>/hope-pms.git
cd hope-pms
```

### 3. Install dependencies

```bash
npm install
```

### 4. Set up environment variables

```bash
cp .env.example .env
```

Open .env and fill in the Supabase credentials (get from Angela, M3):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Hope PMS
```

**Never commit `.env`.** It is gitignored. Share actual values only via secure channel.


### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:5173. You will be redirected to /login. Sign in with your Google account.

### 6. Run tests

```bash
npm test
```

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| main | Production-only. Never push directly. |
| dev | Integration branch. Always stable. Pull before starting any task. |
| feat/* | New features |
| fix/* | Bug fixes |
| db/* | Database / migration changes |
| test/* | Test files |
| docs/* | Documentation |
| refactor/* | Code cleanup |
| chore/* | Config, tooling |

**All changes go through Pull Requests. Never push directly to main or dev.**

Flow: feature/task → PR → dev → sprint release PR → main

---

## Project Structure
```
hope-pms/
├── db/
│   └── migrations/        SQL migration files (001–009 after Sprint 1)
├── docs/
│   ├── erd/               ERD diagram and schema notes
│   ├── sprint-logs/       Sprint 1, 2, 3 logs
│   └── test-logs/         QA test logs
├── public/
│   └── google-icon.svg
└── src/
    ├── __tests__/         Vitest tests and mocks
    ├── components/
    │   └── layout/        AppLayout, Navbar, Sidebar
    ├── context/           AuthContext
    ├── hooks/             useAuth
    ├── lib/               supabaseClient.js
    ├── pages/             One component per route
    ├── services/          Supabase service functions (Sprint 2)
    └── utils/             Helper functions (Sprint 2)
```

---

## User Types & Access

| user_type | Description |
|---|---|
| SUPERADMIN | Full access. Seeded directly into DB — never created via UI. |
| ADMIN | Product and report management. Can activate USER accounts. |
| USER | Standard user. Auto-assigned on first Google sign-in. INACTIVE until activated. |

---

## Sprint Schedule

| Sprint | Theme | Dates |
|---|---|---|
| Sprint 1 | Setup, Database & Authentication | Mar 30 – Apr 12, 2026 |
| Sprint 2 | Product CRUD, Rights & Soft Delete | Apr 13 – Apr 26, 2026 |
| Sprint 3 | Reports, Admin Module, Deployment | Apr 27 – May 2, 2026 |
