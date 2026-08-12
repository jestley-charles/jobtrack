# Render Setup — JobTrack Backend

JobTrack deploys the Spring Boot backend from `jobtrack-backend/` to Render.

Render no longer offers a native Java runtime, so this project uses **Docker**:

- `render.yaml` — Render Blueprint (repo root)
- `jobtrack-backend/Dockerfile` — multi-stage build (JDK 21 → JRE 21)

---

## 1. Prerequisite

Render needs access to a Git repository. If the GitHub remote has not been
created yet, do that first:

```powershell
gh auth login
gh repo create jobtrack --public --source=. --remote=origin
git push -u origin main
```

---

## 2. Create the Render web service

1. Open [Render Dashboard](https://dashboard.render.com/).
2. Click **New** → **Blueprint**.
3. Connect the GitHub repo for this project.
4. Render should detect the repo-root `render.yaml`.
5. Review the generated service named `jobtrack-backend` (runtime: **Docker**).
6. Continue to the environment variable prompt.

---

## 3. Provide environment variables

Render should prompt for the `sync: false` values from `render.yaml`:

- `SUPABASE_DB_URL`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_JWT_SECRET`

Notes:

- `SUPABASE_DB_URL` should be the JDBC form used by Spring Boot, for example:

```text
jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
```

- Render automatically provides `PORT`, which already matches
  `server.port=${PORT:8080}` in `application.properties`.
- Java version is pinned in the Dockerfile (`eclipse-temurin:21`), not via a
  Render env var.

---

## 4. Build and start details

The Blueprint uses:

- `runtime: docker`
- `rootDir: jobtrack-backend`
- `dockerfilePath: ./Dockerfile`
- `healthCheckPath: /api/health`

The Dockerfile:

1. Builds the jar with `./mvnw clean package -DskipTests`
2. Runs `java -jar app.jar` on Eclipse Temurin 21 JRE

---

## 5. After first deploy

Once deployment succeeds, verify:

1. The service reaches a healthy state.
2. `GET /api/health` returns successfully.
3. Startup logs do not show datasource errors.

If startup fails with datasource validation errors, confirm:

- Supabase credentials are correct
- the database is reachable from Render
- Phase 1 tables exist before switching from setup to real API work

---

## 6. Checklist

- [ ] GitHub remote created and pushed
- [ ] Render account connected to GitHub
- [ ] Blueprint created from repo-root `render.yaml`
- [ ] Supabase env vars entered in Render
- [ ] First deploy reaches healthy state

When those are done, the Phase 0 Render setup task is complete.
