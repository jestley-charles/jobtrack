# AI_AGENT_RULES.md

This file is the shared memory for this project. Every Cursor tab is a fresh AI
agent with no memory of other tabs. This file is how they stay in sync.

**Read this entire file before doing anything else.** Then look at the user's
message to see which command was used, and follow the matching instructions
in "Command Behavior" below.

**Before you finish your turn, you MUST update this file** — Current Status,
Task Backlog, Known Issues, and Session Log — so the next agent (in a new tab,
with no memory of this conversation) knows exactly what happened and what's
next. If you don't update this file, the next agent is flying blind. This is
not optional.

---

## 0. Command Behavior

The user will start prompts with one of these. Match the behavior exactly.

### `start the next task` / `start the project`
1. Look at **Task Backlog** below, find the first unchecked `[ ]` task in the
   earliest phase that isn't fully complete.
2. Check **In Progress / Interrupted** first — if something is sitting there,
   treat this as `continue` instead (see below), don't start something new.
3. Implement the task fully: code, tests if applicable, and update any docs.
4. Check it off, add an entry to **Session Log**, update **Current Status**.
5. If the task turned out to be bigger than expected, split it into subtasks
   in the backlog and leave the unfinished parts unchecked.

### `fix: A / B / C`
1. For each item, check **Known Issues** — if it's already listed, use that
   context (repro steps, suspected cause) instead of re-diagnosing from zero.
2. If not listed, diagnose it yourself first (reproduce if possible, read
   relevant files) before changing code.
3. Fix each item. If a fix is risky or touches shared code, say so in the
   Session Log even if you proceeded.
4. Remove fixed items from **Known Issues**. Add any new issues you *found*
   while fixing (don't fix scope-creep issues unless trivial — log them
   instead).

### `implement: <feature description>`
1. This is a new feature the user just thought of — it may not be in the
   Task Backlog yet.
2. Add it to the Task Backlog under the most relevant phase (create a new
   phase if it doesn't fit), then implement it.
3. If it conflicts with an existing architecture decision (see **Decisions
   Log**), flag the conflict in your response to the user instead of
   silently overriding the decision.

### `continue`
1. Read **In Progress / Interrupted** — this is the only place that matters.
2. It should contain: which task, what was already done, what's left, and
   any blockers or decisions the previous agent needs the next one to make.
3. Resume from there. If the notes are unclear or missing, say so and ask
   the user rather than guessing at half-finished work.
4. Once finished, clear that task from **In Progress** and move it to
   **Session Log** as completed.

**General rules for every command:**
- Don't ask the user for information that's already answered in this file
  (tech stack, schema, conventions, decisions). Only ask if it's genuinely
  missing here.
- Keep changes scoped to what was asked. Don't refactor unrelated code.
- If you make an architectural choice not already covered below (e.g. naming
  convention, library choice, folder layout), add it to **Decisions Log** so
  it isn't relitigated by the next agent.

---

## 1. Project Overview

**JobTrack** — a full-stack job application tracker. Users sign up, log in,
and manage companies/positions they're applying to: status, interviews,
deadlines, notes, contacts, and follow-ups. Should feel like a real SaaS
product, not a school CRUD demo.

Core entities: **applications, interviews, contacts, notes**, scoped per
authenticated user.

Standout feature: a **Kanban board** (Wishlist → Applied → Interview → Offer,
with a Rejected branch) with drag-and-drop that updates status via the API.

Full original spec (flows, ASCII mockups, portfolio blurb, demo account
requirements) lives in `docs/app_idea.txt` — copy the uploaded doc there if
it isn't already in the repo. Agents should treat that file as the source of
truth for UX details not covered here.

---

## 2. Tech Stack (fixed — do not substitute without updating Decisions Log)

| Layer | Choice |
|---|---|
| Frontend | HTML + CSS + vanilla JavaScript (no framework) |
| Frontend hosting | Firebase Hosting (static) |
| Backend | Java + Spring Boot |
| Backend hosting | Render |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Version control | GitHub |

Frontend talks to backend only via REST + JSON (`fetch`, `Authorization:
Bearer <token>`). Backend talks to Supabase Postgres directly (not through
Supabase's JS client — this is a Java backend).

---

## 3. Architecture Reference

### Repo layout
```
jobtrack/
├── frontend/                  # static HTML/CSS/JS, deployed to Firebase
│   ├── index.html
│   ├── dashboard.html
│   ├── js/
│   ├── css/
│   └── firebase.json
├── jobtrack-backend/           # Spring Boot, deployed to Render
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── model/
│   └── config/
└── docs/
    ├── app_idea.txt
    └── AI_AGENT_RULES.md
```

### REST API surface (extend, don't restructure, without logging a decision)
```
GET    /api/applications
GET    /api/applications/{id}
POST   /api/applications
PUT    /api/applications/{id}
DELETE /api/applications/{id}

GET    /api/interviews
POST   /api/interviews
PUT    /api/interviews/{id}

GET    /api/contacts
POST   /api/contacts
```

### Database schema (Supabase / Postgres)
```
users          (managed by Supabase Auth)
applications   id, user_id, company, position, location, salary_min,
               salary_max, status, date_applied, job_url, created_at, updated_at
interviews     id, application_id, interview_date, interview_type,
               interviewer, notes, result
contacts       id, user_id, name, company, role, email, linkedin_url, notes
notes          id, user_id, application_id, body, created_at
```
All user-scoped tables must filter by the authenticated user's ID at the
service layer (Row Level Security in Supabase is a bonus, not a substitute
for backend checks).

### Environment variables the backend needs
```
SUPABASE_DB_URL
SUPABASE_DB_USER
SUPABASE_DB_PASSWORD
SUPABASE_JWT_SECRET      # for validating tokens issued by Supabase Auth
```
Never commit real values — use `.env.example` with placeholder keys.

---

## 4. Conventions

- **Backend**: standard Spring Boot layering — Controller → Service →
  Repository → Model. DTOs for request/response bodies, don't expose JPA
  entities directly over the API.
- **Validation**: use `@Valid` + Bean Validation annotations on request DTOs.
  Return 400 with a clear JSON error body on validation failure.
- **Error handling**: centralize with a `@ControllerAdvice` exception
  handler. Don't leak stack traces to the client.
- **Frontend JS**: no build step, no bundler. Keep one JS file per page/
  feature area, plain `fetch` calls, no jQuery.
- **Commits**: `<type>: <short description>` e.g. `feat: add kanban drag
  handler`, `fix: interview date timezone bug`. One logical change per commit.
- **Dates**: store and transmit as ISO 8601. Convert to local display format
  only in the frontend.

---

## 5. Decisions Log

*(Append here whenever an agent makes a non-trivial architectural choice not
already specified above. Newest at the bottom.)*

- **2026-08-12:** Spring Boot skeleton generated via Spring Initializr — Maven
  (not Gradle), Java 21, Spring Boot 4.1.0. Package root: `com.jobtrack`.
  Layer packages (`controller`, `service`, `repository`, `model`, `config`)
  scaffolded under `src/main/java/com/jobtrack/`.
- **2026-08-12:** Supabase credentials use per-env `.env` files (gitignored);
  `.env.example` templates in `jobtrack-backend/` and `frontend/`. Setup guide
  at `docs/SUPABASE_SETUP.md`. JDBC URL must use `jdbc:postgresql://...` with
  `?sslmode=require`.
- **2026-08-12:** Firebase Hosting config lives inside `frontend/` to match the
  static frontend deployment boundary. Use `npm exec --yes firebase-tools -- ...`
  instead of assuming a global Firebase CLI install.
- **2026-08-12:** Render deployment is managed from a repo-root `render.yaml`
  Blueprint, with `jobtrack-backend/` as the service `rootDir` and secrets
  provided in the Render dashboard via `sync: false` env vars.
- **2026-08-12:** Render has no native Java runtime — backend deploys via Docker
  (`jobtrack-backend/Dockerfile`, Eclipse Temurin 21 multi-stage build).
- **2026-08-12:** Render/container startup fix — Hibernate schema validation
  disabled by default (`HIBERNATE_DDL_AUTO=none`) and Hikari fail-fast turned
  off (`spring.datasource.hikari.initialization-fail-timeout=0`) so the service
  can start before Phase 1 migrations / DB connectivity is ready.
- **2026-08-12:** Added Flyway (`flyway-core`) and configured it to load SQL
  migrations from `classpath:db/migration` so Phase 1 can apply schema changes
  automatically on backend startup.
- **2026-08-12:** Frontend Supabase credentials use `frontend/.env` (gitignored)
  plus a generated `frontend/js/config.js` (also gitignored). Run
  `npm run config` from `frontend/` after editing `.env`. Committed templates:
  `frontend/.env.example` and `frontend/js/config.example.js`. Auth uses
  `@supabase/supabase-js` via CDN (no bundler).
- **2026-08-12:** Backend JWT validation uses `jjwt` (HS256) with
  `SUPABASE_JWT_SECRET`, a servlet `JwtAuthenticationFilter` on `/api/*`, and
  `AuthContext.getUserId(request)` for controllers. `/api/health` stays public.

---

## 6. Current Status

**Phase:** Phase 2 — Auth (complete)
**Last updated by:** Agent session 2026-08-12 (backend JWT filter + user id)
**Summary:** Phase 2 auth is complete. Frontend uses Supabase Auth; backend
validates `Authorization: Bearer` tokens with `JwtAuthenticationFilter` (jjwt,
HS256, `role=authenticated`). Controllers get the user id via
`AuthContext.getUserId(request)` — never from client input. `GET /api/health`
is public; `GET /api/me` verifies auth wiring.

Next actionable task: **Phase 3 — Application model/service/repository/controller
(full CRUD)**.

---

## 7. In Progress / Interrupted

*(An agent should only write here if it stops mid-task — e.g. ran low on
context, hit a blocker, or needs a user decision. Clear this section once
the task is finished.)*

- *(nothing in progress)*

---

## 8. Known Issues

*(Bugs discovered but not yet fixed. Format: short description, where it
lives, repro steps if known, suspected cause if known.)*

- **GitHub remote not created** — `gh auth status` reports not logged in.
  User must run `gh auth login`, then from repo root:
  `gh repo create jobtrack --public --source=. --remote=origin`

---

## 9. Task Backlog

### Phase 0 — Project Setup
- [x] Initialize GitHub repo with `frontend/`, `jobtrack-backend/`, `docs/`
      (local git init + folder layout done; GitHub remote pending — see Known Issues)
- [x] Create Spring Boot project skeleton (Spring Web, Spring Data JPA,
      Validation, PostgreSQL driver)
- [x] Prepare Supabase setup (`docs/SUPABASE_SETUP.md`, `.env.example` templates)
- [x] **User:** Create Supabase project + fill `jobtrack-backend/.env` and
      `frontend/.env` (stubs created; paste real values) (see
      `docs/SUPABASE_SETUP.md`) — blocks Phase 1
- [x] Prepare Firebase Hosting setup (`frontend/firebase.json`,
      `frontend/.firebaserc.example`, `docs/FIREBASE_SETUP.md`)
- [x] **User:** Create Firebase project, log in with Firebase CLI, and create
      `frontend/.firebaserc` from the example file
- [x] Prepare Render backend deployment (`render.yaml`, `docs/RENDER_SETUP.md`)
- [x] **User:** Create Render Blueprint/service from `render.yaml`, connect
      GitHub repo, and set backend env vars
- [x] Add `.env.example` and `.gitignore` for both frontend and backend
      (`.env.example` done; confirm `.gitignore` coverage)

### Phase 1 — Database
- [x] Write SQL migrations for `applications`, `interviews`, `contacts`, `notes`
- [x] Apply migrations to Supabase, verify tables + foreign keys

### Phase 2 — Auth
- [x] Wire up Supabase Auth sign up / log in on frontend
- [x] Backend JWT validation filter (verify Supabase-issued tokens)
- [x] Backend: derive `user_id` from validated token, never trust client input

### Phase 3 — Backend CRUD
- [ ] Application model/service/repository/controller (full CRUD)
- [ ] Interview model/service/repository/controller
- [ ] Contact model/service/repository/controller
- [ ] Centralized error handling (`@ControllerAdvice`)

### Phase 4 — Frontend Base
- [ ] Landing page ("Take control of your job search")
- [ ] Sign up / log in pages
- [ ] Dashboard shell with sidebar nav (Dashboard, Jobs, Interviews,
      Contacts, Settings)

### Phase 5 — Frontend Features
- [ ] Dashboard stats (Applications / Interviews / Offers counts + status bar chart)
- [ ] Applications list view
- [ ] Add/Edit application form + modal
- [ ] Application detail view
- [ ] Recent activity feed

### Phase 6 — Kanban Board
- [ ] Kanban columns (Wishlist, Applied, Interview, Offer, Rejected)
- [ ] Drag-and-drop between columns
- [ ] PATCH application status on drop

### Phase 7 — Interviews
- [ ] Upcoming interviews widget on dashboard
- [ ] Interview calendar view
- [ ] Add/edit interview tied to an application

### Phase 8 — Deployment
- [ ] Deploy backend to Render, confirm env vars set
- [ ] Deploy frontend to Firebase Hosting, point at Render API URL
- [ ] Confirm CORS config allows the Firebase domain

### Phase 9 — Demo Data
- [ ] Seed script or SQL for demo account (`demo@jobtrack.com`)
- [ ] Populate realistic sample applications/interviews/contacts

### Phase 10 — Polish
- [ ] Responsive layout pass (mobile/tablet)
- [ ] Empty states (no applications yet, etc.)
- [ ] Loading/error states on all fetch calls
- [ ] README with setup instructions + screenshots

---

## 10. Session Log

*(Every agent appends one entry here when it finishes a task. Keep entries
short — this is a log, not a diary.)*

- **2026-08-12 — Phase 0, task 1:** Initialized local git repo and top-level
  layout (`frontend/`, `jobtrack-backend/`, `docs/`). Added root `.gitignore`,
  minimal `frontend/index.html` + `css/styles.css`, copied spec to
  `docs/app_idea.txt`. Could not create GitHub remote (`gh` not authenticated).
- **2026-08-12 — Phase 0, task 2:** Spring Boot skeleton via Initializr (Maven,
  Java 21, Boot 4.1.0). Dependencies: webmvc, data-jpa, validation, postgresql.
  Added `controller/HealthController` (`GET /api/health`), package scaffolding
  for config/model/repository/service, `application.properties` with Supabase
  placeholders. Build not run — `JAVA_HOME` unset / JDK not on PATH.
- **2026-08-12 — Phase 0, task 3:** Supabase agent prep — `docs/SUPABASE_SETUP.md`
  (project creation, JDBC/JWT/frontend keys, verification steps),
  `jobtrack-backend/.env.example`, `frontend/.env.example`. Actual Supabase
  project creation requires user dashboard access; split into separate user
  backlog item.
- **2026-08-12 — Phase 0, task 4:** Firebase Hosting agent prep —
  `frontend/firebase.json`, `frontend/.firebaserc.example`, and
  `docs/FIREBASE_SETUP.md` added. Verified `firebase-tools` can be run via
  `npm exec`; actual project creation and CLI login require user account
  access, so split into a separate user backlog item.
- **2026-08-12 — Phase 0, task 5:** Render backend deployment prep —
  repo-root `render.yaml` and `docs/RENDER_SETUP.md` added. Blueprint targets
  `jobtrack-backend/` with Java 21, `/api/health`, and Supabase env var names.
  Actual Render service creation depends on GitHub remote setup plus Render
  dashboard access, so split into a separate user backlog item.
- **2026-08-12 — Render fix:** Replaced invalid `runtime: java` with Docker
  deployment — added `jobtrack-backend/Dockerfile` (Temurin 21 multi-stage)
  and updated `render.yaml` / `docs/RENDER_SETUP.md`.
- **2026-08-12 — Render startup fix:** Prevent startup crash when Supabase
  is unreachable / migrations aren’t applied yet by disabling Hibernate DDL
  validation by default and disabling Hikari fail-fast.
- **2026-08-12 — Phase 1:** Added Flyway + initial schema migration
  (`V1__init_jobtrack_schema.sql`) creating `applications`, `interviews`,
  `contacts`, and `notes` with RLS policies.
- **2026-08-12 — Phase 2, task 1:** Wired frontend Supabase Auth — login/signup
  pages, auth module (`js/auth.js`), Supabase client init, session guards,
  protected dashboard placeholder, `js/api.js` Bearer helper. Added
  `frontend/.env.example`, `js/config.example.js`, `npm run config` script.
  Fixed `.gitignore` to allow `.env.example` files; added
  `jobtrack-backend/.env.example`.
- **2026-08-12 — Phase 2, tasks 2–3:** Backend JWT auth — `JwtAuthenticationFilter`
  on `/api/*`, `SupabaseJwtValidator` (jjwt HS256), `AuthContext.getUserId()`,
  `GET /api/me` test endpoint. Unit + context tests pass.
