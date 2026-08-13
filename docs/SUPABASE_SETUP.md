# Supabase Setup — JobTrack

JobTrack uses Supabase for **PostgreSQL** (backend) and **Auth** (frontend, Phase 2).
Complete this once; credentials go in local `.env` files (never commit real values).

---

## 1. Create the project

1. Sign in at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. **New project** → choose an organization (or create one).
3. Set:
   - **Name:** `jobtrack` (or any name you prefer)
   - **Database password:** generate a strong password and **save it** — you need it for `SUPABASE_DB_PASSWORD`
   - **Region:** pick the closest to you (or to Render when you deploy)
4. Wait until the project finishes provisioning (~1–2 minutes).

---

## 2. Collect backend credentials

Open **Project Settings** (gear icon) in the Supabase dashboard.

### Database connection (Spring Boot / JDBC)

Go to **Database** → **Connection string** → **URI**.

Supabase shows a URI like:

```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

For Spring Boot, use the **direct** connection (port **5432**, not the pooler) unless you configure pooling separately:

| Variable | Where to find it |
|---|---|
| `SUPABASE_DB_URL` | `jdbc:postgresql://db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require` — replace `[PROJECT-REF]` with your project reference (also visible in **Settings → General → Reference ID**) |
| `SUPABASE_DB_USER` | `postgres` |
| `SUPABASE_DB_PASSWORD` | The database password you set when creating the project |

**Alternative:** Under **Database → Connection string → JDBC**, Supabase may show a ready-made JDBC URL. Append `?sslmode=require` if it is missing.

### JWT secret (backend token validation — Phase 2)

Go to **Settings → API** (or **JWT Keys**).

| Variable | Where to find it |
|---|---|
| `SUPABASE_JWT_SECRET` | **JWT Secret** (legacy) or the **JWT Signing Secret** for the `anon` / service keys section — copy the secret used to sign user access tokens |

> The backend validates `Authorization: Bearer <token>` headers against this secret in Phase 2. You can add it to `.env` now even though the filter is not wired yet.

---

## 3. Collect frontend credentials (needed in Phase 2)

Go to **Settings → API**.

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | **Project URL** — `https://[PROJECT-REF].supabase.co` |
| `SUPABASE_ANON_KEY` | **anon public** key (safe to use in the browser with Row Level Security) |

---

## 4. Create local `.env` files

From the repo root:

```powershell
copy jobtrack-backend\.env.example jobtrack-backend\.env
copy frontend\.env.example frontend\.env
```

Edit both files and paste your real values. `.env` files are gitignored.

**`jobtrack-backend/.env` example:**

```env
SUPABASE_DB_URL=jdbc:postgresql://db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

**`frontend/.env` example:**

```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_URL=http://localhost:8080
```

`API_URL` is the Spring Boot base URL (no trailing slash). Use `http://localhost:8080`
only when running the backend locally. For Firebase Hosting deploy or the Hosting
emulator without a local backend, set this to your Render service URL, then run
`npm run config` from `frontend/`.

---

## 5. Verify the database connection

After Phase 1 migrations exist, start the backend with env vars loaded:

```powershell
cd jobtrack-backend
# PowerShell — load .env manually or use an env loader
$env:SUPABASE_DB_URL = "jdbc:postgresql://db.[REF].supabase.co:5432/postgres?sslmode=require"
$env:SUPABASE_DB_USER = "postgres"
$env:SUPABASE_DB_PASSWORD = "your-password"
mvn spring-boot:run
```

When the backend starts, Flyway will automatically apply the SQL migration
from `jobtrack-backend/src/main/resources/db/migration/` (if not already
applied).

Hit `http://localhost:8080/api/health` — should return OK. A failed DB connection usually means wrong URL, password, or SSL settings.

You can also test the raw connection in the Supabase dashboard under **SQL Editor** → run `SELECT 1;`.

---

## 6. Checklist

- [ ] Supabase project created
- [ ] Database password saved
- [ ] `jobtrack-backend/.env` filled in (`SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, `SUPABASE_JWT_SECRET`)
- [ ] `frontend/.env` filled in (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- [ ] Health endpoint runs without datasource errors (after JDK 21 + Maven are available locally)
- [ ] Supabase tables exist after startup: `applications`, `interviews`,
      `contacts`, `notes`

When all boxes are checked, Phase 0 task **Create Supabase project** is complete. The next agent can proceed to **Phase 1 — SQL migrations**.
