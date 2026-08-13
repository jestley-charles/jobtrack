# Demo account seed — JobTrack

Populate `demo@jobtrack.com` with realistic applications, interviews, contacts,
and notes so visitors can explore the live demo immediately.

**Credentials (from `docs/app_idea.txt`):**

| Field | Value |
|---|---|
| Email | `demo@jobtrack.com` |
| Password | `jobtrackdemoaccount` |

---

## 1. Create the Auth user

The seed SQL only inserts into JobTrack tables. The Auth user must exist first.

### Option A — Supabase Dashboard (recommended)

1. Open your project → **Authentication** → **Users**.
2. **Add user** → **Create new user**.
3. Email: `demo@jobtrack.com`
4. Password: `jobtrackdemoaccount`
5. Enable **Auto Confirm User** (so login works without email verification).
6. Create the user.

### Option B — Sign up in the app

1. Open the deployed (or local) signup page.
2. Register with the email/password above.
3. If email confirmation is required, confirm via Supabase Dashboard
   (**Users** → select user → confirm) or disable confirmations for the project.

---

## 2. Run the seed script

1. Open Supabase → **SQL Editor**.
2. Paste the contents of
   [`jobtrack-backend/scripts/seed_demo_data.sql`](../jobtrack-backend/scripts/seed_demo_data.sql)
   (or run it via `psql` against the same database).
3. Run the script.

On success you should see a notice like:

```text
Demo seed complete for user … (demo@jobtrack.com): 24 applications, 8 interviews, 8 contacts, 5 notes.
```

If you see `Demo user demo@jobtrack.com not found`, finish step 1 and re-run.

The script is **idempotent**: each run deletes that user’s existing applications
(and cascaded interviews/notes) plus contacts, then re-inserts the sample set.

---

## 3. Verify

1. Log in as `demo@jobtrack.com` / `jobtrackdemoaccount`.
2. Dashboard should show non-zero Applications / Interviews / Offers.
3. Jobs list + Kanban should show companies across Wishlist → Offer / Rejected.
4. Interviews calendar should show upcoming rounds (mid/late August 2026).
5. Contacts page should list recruiters and interviewers.

---

## Notes

- Do **not** put this seed in Flyway migrations — it depends on an Auth user and
  would wipe/reseed on every deploy if made destructive.
- Re-run anytime you want a clean demo dataset.
- Application IDs in the script are fixed UUIDs so re-seeds stay predictable.
