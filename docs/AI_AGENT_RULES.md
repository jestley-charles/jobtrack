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
PATCH  /api/applications/{id}/status
DELETE /api/applications/{id}

GET    /api/interviews
GET    /api/interviews/{id}
POST   /api/interviews
PUT    /api/interviews/{id}
DELETE /api/interviews/{id}

GET    /api/contacts
GET    /api/contacts/{id}
POST   /api/contacts
PUT    /api/contacts/{id}
DELETE /api/contacts/{id}
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
- **2026-08-12:** Application CRUD uses JPA entity + repository with
  `findByIdAndUserId` for ownership checks. Request/response DTOs separate from
  entity; `user_id` always set from `AuthContext`, never from client body.
  Standalone MockMvc tests must use Jackson 3 (`JsonMapper` +
  `JacksonJsonHttpMessageConverter`), not `MappingJackson2HttpMessageConverter`.
- **2026-08-13:** Interview CRUD ownership is via parent application (no
  `user_id` on `interviews`). Service verifies `application_id` with
  `ApplicationRepository.findByIdAndUserId` on create; list/get/update/delete
  use JPQL joining through `Application.userId`. Extended documented API with
  `GET /{id}` and `DELETE /{id}` to match Application CRUD. `applicationId` is
  immutable after create (not on update DTO). `interview_date` is `Instant`
  (timestamptz / ISO 8601).
- **2026-08-13:** Contact CRUD follows Application pattern — direct `user_id`
  scoping via `findByIdAndUserId`. Extended documented API with GET/{id}, PUT,
  DELETE beyond original sketch. Optional `email` validated with `@Email` when
  provided.
- **2026-08-13:** Centralized API errors via `GlobalExceptionHandler`
  (`@RestControllerAdvice`) and `ApiErrorResponse` record (`error`, `message`,
  optional `errors[]` with `{field, message}`). Validation → 400 with field list;
  `ResponseStatusException` → matching status; malformed JSON / bad path params
  → 400; missing auth context → 401; unexpected exceptions → 500 with generic
  message (logged server-side, no stack traces).
- **2026-08-13:** Authenticated app pages share a duplicated HTML shell (header +
  sidebar + main) with common behavior in `js/app-shell.js` (`JobTrackAppShell.init`
  sets active nav, user menu, logout). Nav pages: `dashboard.html`, `jobs.html`,
  `interviews.html`, `offers.html`, `settings.html` (Contacts tab replaced by
  Offers — see 2026-08-14).
- **2026-08-13:** Application add/edit uses a modal on `jobs.html` with logic in
  `js/application-form.js` (`JobTrackApplicationForm`). Shared form field styles
  reuse `.form-field` from auth pages; modal is vanilla JS (no dialog element).
- **2026-08-13:** Application detail page is `application.html?id=<uuid>` (query
  param, no client-side router). Fetches `GET /api/applications/{id}` plus
  interviews filtered client-side from `GET /api/interviews`. Edit reuses
  `JobTrackApplicationForm`; delete via `DELETE /api/applications/{id}`.
- **2026-08-13:** Backend JWT validation supports Supabase JWT Signing Keys (ES256/RS256)
  via JWKS at `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`, with legacy HS256
  `SUPABASE_JWT_SECRET` as fallback. Requires `SUPABASE_URL` on backend after
  Supabase JWT migration.
- **2026-08-13:** Dashboard recent activity feed is synthesized client-side from
  existing `/api/applications` + `/api/interviews` payloads (no activity/audit
  API). Events: added, applied, interview, offer, rejection — sorted by date.
  Paged client-side (see 2026-08-14 paging decision).
- **2026-08-13:** Supabase direct DB host (`db.*.supabase.co`) is IPv6-only.
  Render and many dev networks are IPv4-only — use Supavisor session pooler
  (`aws-0-[region].pooler.supabase.com:5432`, user `postgres.[project-ref]`) for
  backend JDBC. Direct connection is fine only on IPv6-capable local networks.
- **2026-08-14:** Kanban board lives on `jobs.html` as a List/Board view toggle
  (not a separate nav page), preference stored in `localStorage` key
  `jobtrack.jobsView`. Columns use `data-status` / `data-application-id` so
  Phase 6 drag-and-drop can attach later without restructuring markup.
- **2026-08-14:** Status-only updates use `PATCH /api/applications/{id}/status`
  with body `{ "status": "<ApplicationStatus>" }` (`PatchApplicationStatusRequest`).
  Kanban drop calls this endpoint; full-field edits still use PUT.
- **2026-08-14:** Interview calendar lives on `interviews.html` as a month grid
  (vanilla JS, no calendar library). Days are selectable; chips show time +
  company (desktop), dots on mobile; agenda panel below lists that day's
  interviews with links to application detail. Add/edit UI is a separate Phase 7 task.
- **2026-08-14:** Interview add/edit uses shared `js/interview-form.js`
  (`JobTrackInterviewForm`) modal — POST/PUT `/api/interviews`. Create locks
  `applicationId` on application detail; interviews page shows application
  select. `datetime-local` converted to/from ISO 8601 Instant. Delete available
  on application detail interview rows.
- **2026-08-14:** List API data (applications + interviews) is cached in
  `sessionStorage` via `js/data-cache.js` (`JobTrackDataCache`). Nav page
  switches reuse the cache (`ensureLoaded`); **Refresh** buttons and
  create/edit/delete flows call `refresh` / in-place cache updates. Cache is
  cleared on logout. Not an SPA — still multi-page HTML; cache bridges reloads.
- **2026-08-14:** Cache-first UI: pages call `JobTrackDataCache.peek()` sync and
  paint immediately on nav (no loading flash). Loading states only for cold
  start / Refresh / mutations. Matches common stale-while-revalidate UX.
- **2026-08-14:** Demo seed is a manual SQL script
  (`jobtrack-backend/scripts/seed_demo_data.sql`), not a Flyway migration —
  Auth user must exist first; script is idempotent (wipe + reinsert for
  `demo@jobtrack.com`). Docs: `docs/DEMO_SEED.md`.
- **2026-08-14:** List paging is client-side via `js/pagination.js`
  (`JobTrackPagination`) — Previous/Next + “N–M of Total”. Used on dashboard
  recent activity (8/page) and Jobs list view (10/page). Kanban stays unpaged.
  Full datasets still load through `JobTrackDataCache`; no API page/size params.
- **2026-08-14:** Sidebar **Contacts** replaced by **Offers** (`offers.html` +
  `js/offers.js`). Shows applications with `status === Offer`, sorted by salary
  (highest first), with comparison cards (salary emphasis, location, applied
  date, interview count). Decline → `PATCH .../status` to Rejected.
  `contacts.html` redirects to `offers.html`. Contact CRUD API/schema remains;
  no contacts UI for now (overrides original spec nav item).
- **2026-08-14:** Dashboard “Upcoming interviews” section removed. On login
  (and signup-with-session), `JobTrackInterviewBriefing.markPending()` sets a
  `sessionStorage` flag; `app-shell` calls `maybeShow()` which opens a closable
  assistant-style modal: **Last time | Today (emphasized center) | Next up**.
  Company links go to application detail; footer has Got it + Open calendar.
  Module: `js/interview-briefing.js`.

---

## 6. Current Status

**Phase:** Phase 10 — Polish (in progress)
**Last updated by:** Agent session 2026-08-14 (interview briefing modal)
**Summary:** Post-login interview briefing modal (last / today / next) replaces
  the dashboard upcoming-interviews section. Modal is closable (backdrop, ×,
  Escape, Got it).

Next actionable task: **Phase 10 — Responsive layout pass (mobile/tablet)**.

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

- *(no known issues)*

**User action after pooler fix:** In the Render dashboard, set backend env vars to the
Supavisor session pooler (see `docs/RENDER_SETUP.md`) and redeploy. Until then, deployed
API list calls may still return 500.

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
- [x] Application model/service/repository/controller (full CRUD)
- [x] Interview model/service/repository/controller
- [x] Contact model/service/repository/controller
- [x] Centralized error handling (`@ControllerAdvice`)

### Phase 4 — Frontend Base
- [x] Landing page ("Take control of your job search")
- [x] Sign up / log in pages
- [x] Dashboard shell with sidebar nav (Dashboard, Jobs, Interviews,
      Contacts, Settings)

### Phase 5 — Frontend Features
- [x] Dashboard stats (Applications / Interviews / Offers counts + status bar chart)
- [x] Applications list view
- [x] Add/Edit application form + modal
- [x] Application detail view
- [x] Recent activity feed

### Phase 6 — Kanban Board
- [x] Kanban columns (Wishlist, Applied, Interview, Offer, Rejected)
- [x] Drag-and-drop between columns
- [x] PATCH application status on drop

### Phase 7 — Interviews
- [x] Upcoming interviews widget on dashboard
      *(superseded 2026-08-14: post-login briefing modal instead)*
- [x] Interview calendar view
- [x] Add/edit interview tied to an application
- [x] Post-login interview briefing modal (last / today / next)

### Phase 8 — Deployment
- [x] Deploy backend to Render, confirm env vars set
- [x] Deploy frontend to Firebase Hosting, point at Render API URL
- [x] Confirm CORS config allows the Firebase domain

### Phase 9 — Demo Data
- [x] Seed script or SQL for demo account (`demo@jobtrack.com`)
- [x] Populate realistic sample applications/interviews/contacts
      (**User:** create Auth user + run `seed_demo_data.sql` — see
      `docs/DEMO_SEED.md`)

### Phase 10 — Polish
- [x] Client-side paging — dashboard recent activity; Jobs list view (not kanban)
- [x] Replace Contacts nav with Offers comparison page
- [x] Post-login interview briefing modal; remove dashboard upcoming section
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
  repo-root `render.yaml` and `docs/RENDER_SETUP.md`. Blueprint targets
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
- **2026-08-12 — Phase 3, task 1:** Application CRUD — JPA entity, repository,
  service, controller (`/api/applications`), create/update DTOs with validation,
  user-scoped queries via `findByIdAndUserId`. Service + controller unit tests;
  all 20 backend tests pass.
- **2026-08-13 — Phase 3, task 2:** Interview CRUD — JPA entity, repository,
  service, controller (`/api/interviews`). Ownership via parent application;
  create/update DTOs with `@NotNull` on required fields; GET/{id} + DELETE
  added beyond original API sketch. Service + controller unit tests; all 34
  backend tests pass.
- **2026-08-13 — Phase 3, task 3:** Contact CRUD — JPA entity, repository,
  service, controller (`/api/contacts`). User-scoped via `findByIdAndUserId`;
  create/update DTOs with `@NotBlank` name and optional `@Email`. Full CRUD
  beyond original GET/POST sketch. Service + controller unit tests; all 47
  backend tests pass.
- **2026-08-13 — Phase 3, task 4:** Centralized error handling —
  `GlobalExceptionHandler` (`@RestControllerAdvice`) + `ApiErrorResponse` DTO.
  Handles validation (400 + field errors), `ResponseStatusException` (404 etc.),
  malformed JSON, bad path params, missing auth (401), and unexpected errors
  (500, generic message). `GlobalExceptionHandlerTest` with 6 cases; all 53
  backend tests pass. Phase 3 complete.
- **2026-08-13 — Phase 4, task 1:** Landing page — rebuilt `index.html` as
  full SaaS landing (hero, product preview mock, feature cards, bottom CTA,
  header nav). Added `js/landing.js` for auth redirect; extended
  `css/styles.css` with landing layout and responsive preview grid.
- **2026-08-13 — Phase 4, task 2:** Sign up / log in pages — verified Phase 2
  Supabase auth works; polished `signup.html` and `login.html` with split
  branding aside + form layout matching landing visual style. Added redirect
  sanitization in `login.js`.
- **2026-08-13 — Phase 4, task 3:** Dashboard shell — rebuilt `dashboard.html`
  with header + sidebar layout matching app mockup. Added `jobs.html`,
  `interviews.html`, `contacts.html`, `settings.html` placeholders and
  `js/app-shell.js` (auth guard, active nav, user initials dropdown, logout).
  Extended `css/styles.css` with app shell styles + mobile horizontal nav.
  Phase 4 complete.
- **2026-08-13 — Phase 5, task 1:** Dashboard stats — `dashboard.js` fetches
  `/api/applications` + `/api/interviews` in parallel via `JobTrackApi`.
  Stat cards: total applications, interview record count, offer status count.
  Bar chart: Applied / Interview / Offer / Rejected from application statuses.
  Added dashboard stats CSS; loading + error UI on fetch failure.
- **2026-08-13 — Phase 5, task 2:** Applications list view — `jobs.html` +
  `jobs.js` fetch `/api/applications`, render sortable table (company,
  position, status badge, location, date applied, salary). Responsive card
  layout on mobile; empty/loading/error states. Status badge colors match
  dashboard chart palette.
- **2026-08-13 — Phase 5, task 3:** Add/Edit application modal — `application-form.js`
  + modal markup in `jobs.html`. Create via POST, update via PUT; backend
  validation errors surfaced in form. Edit button on each list row; add buttons
  in header and empty state. Modal CSS + select/form-row styles.
- **2026-08-13 — Phase 5, task 4:** Application detail view — `application.html`
  + `application-detail.js`. Fetches single application + filters interviews by
  `applicationId`. Detail grid (location, salary, dates, job URL link); interview
  list with type/date/interviewer/result/notes. Edit via shared modal; delete with
  confirm. Jobs list: company link + View button to detail page.
- **2026-08-13 — Phase 5, task 5:** Recent activity feed — dashboard section
  built from existing API data (no new endpoint). Timeline events for added,
  applied, interviews, offers, rejections; company links to detail page; empty
  state. Phase 5 complete.
- **2026-08-13 — fix:** Session-expiry redirect loop — on API 401,
  `JobTrackAuth.handleSessionExpired()` clears local Supabase session before
  redirecting to login (prevents login page from seeing stale session and
  bouncing back to dashboard). Login page shows expired-session message when
  `?expired=1`.
- **2026-08-13 — fix (v2):** Stronger session-expiry handling — auth guards use
  `getUser()` instead of cached `getSession()`; `clearLocalSession()` wipes
  `sb-*-auth-token` from localStorage; login with `?expired=1` never auto-redirects;
  API 401 with valid Supabase user shows server-token error instead of logout loop.
- **2026-08-13 — fix:** Backend JWKS validation — after Supabase JWT Signing Keys
  migration, user tokens are ES256 (not HS256 legacy secret). Added
  `SupabaseJwksProvider` + `SUPABASE_URL` env; validator supports both algorithms.
  Root cause of login-then-immediate-401 loop when legacy secret matched but tokens
  were asymmetrically signed.
- **2026-08-13 — fix:** Dashboard/jobs error instead of empty state — Supabase direct
  DB host is IPv6-only; Render (IPv4) could not connect, so `/api/applications` and
  `/api/interviews` returned 500. Fix: use Supavisor session pooler JDBC URL + user
  `postgres.[project-ref]`. Flattened `SupabaseJwtProperties` binding for
  `supabase.jwt-secret`. Frontend: `JobTrackApi.fetchJsonList` for list endpoints.
- **2026-08-14 — Phase 6, task 1:** Kanban columns on Jobs — List/Board toggle,
  five status columns with cards (company/position/location) linking to detail.
  Preference in `localStorage`; column/`data-application-id` hooks for upcoming
  drag-and-drop. No DnD or status PATCH yet.
- **2026-08-14 — Phase 6, task 2:** Kanban drag-and-drop — HTML5 DnD on board
  cards; drop moves status locally and re-renders list + board. Click after drag
  suppressed so detail links don't fire. No API call yet (next: PATCH on drop).
- **2026-08-14 — Phase 6, task 3:** PATCH status on drop —
  `PATCH /api/applications/{id}/status` + service/DTO/tests; board drop
  optimistic update with rollback on failure. Phase 6 complete.
- **2026-08-14 — Phase 7, task 1:** Upcoming interviews widget on dashboard —
  filters future interviews from existing API data, groups by day (Today /
  Tomorrow / date), shows time + company link + type; empty state; cap 8.
- **2026-08-14 — Phase 7, task 2:** Interview calendar view — month grid on
  `interviews.html` with month nav, day chips/dots, selectable day agenda
  linking to application detail. Add/edit deferred to next task.
- **2026-08-14 — Phase 7, task 3:** Add/edit interview — shared
  `JobTrackInterviewForm` modal (POST/PUT); application detail Add + Edit/Delete;
  interviews page Add with application select + Edit from agenda. Phase 7 complete.
- **2026-08-14 — fix:** Tab/nav switches no longer re-fetch all list data.
  Added `js/data-cache.js` (sessionStorage cache for applications + interviews),
  Refresh buttons on dashboard/jobs/interviews/application detail, cache
  invalidation on logout, and force-refresh after create/edit/delete + kanban
  status PATCH updates the cache in place.
- **2026-08-14 — fix:** Removed loading flash on tab switch — sync
  `peek()` + paint-from-cache before auth; loading UI only for cold start /
  Refresh.
- **2026-08-14 — Phase 9:** Demo seed — `docs/DEMO_SEED.md` +
  `jobtrack-backend/scripts/seed_demo_data.sql` (idempotent wipe/reinsert for
  `demo@jobtrack.com`: 24 apps across all statuses, 8 interviews with upcoming
  dates, 8 contacts, 5 notes). Auth user creation is a user/dashboard step.
  Phase 9 complete.
- **2026-08-14 — implement: list paging:** Shared `JobTrackPagination`
  (`js/pagination.js`). Dashboard upcoming (5/page) + activity (8/page);
  Jobs table (10/page). Kanban unchanged. Hard caps removed so all items
  are reachable via pages. Still client-side over full cache (no API paging).
- **2026-08-14 — implement: Offers tab:** Replaced Contacts nav with Offers
  (`offers.html` / `offers.js`). Comparison cards for `status=Offer`, sorted by
  salary; Decline → Rejected via status PATCH. `contacts.html` redirects;
  Contact API kept. Overrides original Contacts nav from app spec.
- **2026-08-14 — implement: interview briefing:** Removed dashboard Upcoming
  interviews section. Login/signup sets briefing flag; `interview-briefing.js`
  modal shows Last / Today (center, emphasized) / Next with company links,
  Got it, Open calendar. Closable via backdrop, ×, Escape.
