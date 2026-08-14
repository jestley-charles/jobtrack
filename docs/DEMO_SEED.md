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
3. Confirm the email with SQL (Dashboard UI often has no obvious “Confirm” button):

```sql
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = lower('demo@jobtrack.com');
```

---

## Troubleshooting

### “Failed to delete user: Database error deleting user”

JobTrack tables reference `auth.users(id)` **without** `ON DELETE CASCADE`, so Auth
cannot remove a user who still owns applications/contacts/notes.

**You usually do not need to delete.** If the account already exists, confirm
email (SQL above), reset the password if needed, then run the seed.

To fully remove the demo user and recreate it:

```sql
-- 1) Wipe owned rows (interviews/notes cascade from applications)
do $$
declare
  demo_user_id uuid;
begin
  select id into demo_user_id
  from auth.users
  where lower(email) = lower('demo@jobtrack.com')
  limit 1;

  if demo_user_id is null then
    raise notice 'No demo user found — nothing to delete.';
    return;
  end if;

  delete from public.contacts where user_id = demo_user_id;
  delete from public.applications where user_id = demo_user_id;
end $$;

-- 2) Delete Auth user (run separately after step 1 succeeds)
delete from auth.users
where lower(email) = lower('demo@jobtrack.com');
```

Then recreate via Dashboard (**Add user** + Auto Confirm) or signup, and run the seed.

### Reset password without deleting

```sql
-- Prefer Dashboard: Authentication → Users → demo user → … → Reset password / Send recovery
-- Or create a new user with Auto Confirm if you deleted successfully.
```

If you only need login to work and the password is already `jobtrackdemoaccount`,
confirming email is enough.

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
2. Dashboard should show non-zero Applications / Interviews / Offers (stat cards
   link to Jobs / Interviews / Offers).
3. Jobs list + Kanban should show companies across Wishlist → Offer / Rejected.
4. Interviews calendar should show upcoming rounds (mid/late August 2026).
5. Offers tab should list active offers; Rejected tab should list rejections with
   sample rejection reasons.
6. Contacts page redirects to Offers (Contact API still exists; no Contacts UI).

---

## Notes

- Do **not** put this seed in Flyway migrations — it depends on an Auth user and
  would wipe/reseed on every deploy if made destructive.
- Re-run anytime you want a clean demo dataset.
- Application IDs in the script are fixed UUIDs so re-seeds stay predictable.
