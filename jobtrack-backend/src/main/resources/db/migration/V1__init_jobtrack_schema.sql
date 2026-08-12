-- Phase 1 SQL migrations for JobTrack.
-- Flyway will apply this automatically on backend startup.
--
-- Tables:
--   applications, interviews, contacts, notes
-- Relationships:
--   interviews.application_id -> applications.id
--   notes.application_id     -> applications.id
--
-- User scoping:
--   RLS is enabled and policies use auth.uid().

create extension if not exists pgcrypto;

-- Trigger helper for "updated_at" columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- applications
-- =========================
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  company text not null,
  position text not null,
  location text,
  salary_min integer,
  salary_max integer,
  status text not null,
  date_applied date,
  job_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_status_check
    check (status in ('Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'))
);

create index if not exists applications_user_id_idx on public.applications(user_id);

drop trigger if exists set_applications_updated_at on public.applications;
create trigger set_applications_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

alter table public.applications enable row level security;
drop policy if exists applications_select_own on public.applications;
create policy applications_select_own
on public.applications
for select
using (user_id = auth.uid());

drop policy if exists applications_insert_own on public.applications;
create policy applications_insert_own
on public.applications
for insert
with check (user_id = auth.uid());

drop policy if exists applications_update_own on public.applications;
create policy applications_update_own
on public.applications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists applications_delete_own on public.applications;
create policy applications_delete_own
on public.applications
for delete
using (user_id = auth.uid());

-- =========================
-- interviews
-- =========================
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  interview_date timestamptz not null,
  interview_type text,
  interviewer text,
  notes text,
  result text,
  created_at timestamptz not null default now()
);

create index if not exists interviews_application_id_idx on public.interviews(application_id);

alter table public.interviews enable row level security;
drop policy if exists interviews_select_own on public.interviews;
create policy interviews_select_own
on public.interviews
for select
using (
  exists (
    select 1
    from public.applications a
    where a.id = interviews.application_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists interviews_insert_own on public.interviews;
create policy interviews_insert_own
on public.interviews
for insert
with check (
  exists (
    select 1
    from public.applications a
    where a.id = interviews.application_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists interviews_update_own on public.interviews;
create policy interviews_update_own
on public.interviews
for update
using (
  exists (
    select 1
    from public.applications a
    where a.id = interviews.application_id
      and a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.applications a
    where a.id = interviews.application_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists interviews_delete_own on public.interviews;
create policy interviews_delete_own
on public.interviews
for delete
using (
  exists (
    select 1
    from public.applications a
    where a.id = interviews.application_id
      and a.user_id = auth.uid()
  )
);

-- =========================
-- contacts
-- =========================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  company text,
  role text,
  email text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_user_id_idx on public.contacts(user_id);

drop trigger if exists set_contacts_updated_at on public.contacts;
create trigger set_contacts_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

alter table public.contacts enable row level security;
drop policy if exists contacts_select_own on public.contacts;
create policy contacts_select_own
on public.contacts
for select
using (user_id = auth.uid());

drop policy if exists contacts_insert_own on public.contacts;
create policy contacts_insert_own
on public.contacts
for insert
with check (user_id = auth.uid());

drop policy if exists contacts_update_own on public.contacts;
create policy contacts_update_own
on public.contacts
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists contacts_delete_own on public.contacts;
create policy contacts_delete_own
on public.contacts
for delete
using (user_id = auth.uid());

-- =========================
-- notes
-- =========================
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  application_id uuid not null references public.applications(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_application_id_idx on public.notes(application_id);

alter table public.notes enable row level security;
drop policy if exists notes_select_own on public.notes;
create policy notes_select_own
on public.notes
for select
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.applications a
    where a.id = notes.application_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists notes_insert_own on public.notes;
create policy notes_insert_own
on public.notes
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.applications a
    where a.id = notes.application_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists notes_update_own on public.notes;
create policy notes_update_own
on public.notes
for update
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.applications a
    where a.id = notes.application_id
      and a.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.applications a
    where a.id = notes.application_id
      and a.user_id = auth.uid()
  )
);

drop policy if exists notes_delete_own on public.notes;
create policy notes_delete_own
on public.notes
for delete
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.applications a
    where a.id = notes.application_id
      and a.user_id = auth.uid()
  )
);

