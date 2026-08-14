alter table public.applications
  add column if not exists rejection_reason text;
