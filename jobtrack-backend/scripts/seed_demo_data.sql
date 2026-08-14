-- JobTrack demo seed data for demo@jobtrack.com
--
-- Prerequisites:
--   1. Create the Auth user (see docs/DEMO_SEED.md)
--   2. Run this in Supabase SQL Editor (or psql as a role that bypasses RLS)
--
-- Idempotent: deletes existing rows owned by the demo user, then re-inserts.
-- Does NOT create the auth user (password hashing must go through Supabase Auth).

do $$
declare
  demo_user_id uuid;

  -- Applications (fixed UUIDs so interviews/notes stay stable across re-seeds)
  app_google     uuid := 'a1000000-0000-4000-8000-000000000001';
  app_microsoft  uuid := 'a1000000-0000-4000-8000-000000000002';
  app_amazon     uuid := 'a1000000-0000-4000-8000-000000000003';
  app_netflix    uuid := 'a1000000-0000-4000-8000-000000000004';
  app_accenture  uuid := 'a1000000-0000-4000-8000-000000000005';
  app_meta       uuid := 'a1000000-0000-4000-8000-000000000006';
  app_apple      uuid := 'a1000000-0000-4000-8000-000000000007';
  app_stripe     uuid := 'a1000000-0000-4000-8000-000000000008';
  app_shopify    uuid := 'a1000000-0000-4000-8000-000000000009';
  app_spotify    uuid := 'a1000000-0000-4000-8000-00000000000a';
  app_airbnb     uuid := 'a1000000-0000-4000-8000-00000000000b';
  app_uber       uuid := 'a1000000-0000-4000-8000-00000000000c';
  app_salesforce uuid := 'a1000000-0000-4000-8000-00000000000d';
  app_oracle     uuid := 'a1000000-0000-4000-8000-00000000000e';
  app_ibm        uuid := 'a1000000-0000-4000-8000-00000000000f';
  app_adobe      uuid := 'a1000000-0000-4000-8000-000000000010';
  app_twilio     uuid := 'a1000000-0000-4000-8000-000000000011';
  app_datadog    uuid := 'a1000000-0000-4000-8000-000000000012';
  app_cloudflare uuid := 'a1000000-0000-4000-8000-000000000013';
  app_notion     uuid := 'a1000000-0000-4000-8000-000000000014';
  app_figma      uuid := 'a1000000-0000-4000-8000-000000000015';
  app_dropbox    uuid := 'a1000000-0000-4000-8000-000000000016';
  app_atlassian  uuid := 'a1000000-0000-4000-8000-000000000017';
  app_linkedin   uuid := 'a1000000-0000-4000-8000-000000000018';
begin
  select id
  into demo_user_id
  from auth.users
  where lower(email) = lower('demo@jobtrack.com')
  limit 1;

  if demo_user_id is null then
    raise exception
      'Demo user demo@jobtrack.com not found in auth.users. Create the account in Supabase Auth first (see docs/DEMO_SEED.md).';
  end if;

  -- Wipe previous demo-owned rows (interviews/notes cascade from applications)
  delete from public.contacts where user_id = demo_user_id;
  delete from public.applications where user_id = demo_user_id;

  insert into public.applications (
    id, user_id, company, position, location,
    salary_min, salary_max, status, date_applied, job_url,
    rejection_reason, created_at, updated_at
  ) values
    (app_google, demo_user_id, 'Google', 'Software Engineer', 'Remote',
      140000, 180000, 'Interview', '2026-07-15',
      'https://careers.google.com/jobs/results/', null,
      '2026-07-14 10:00:00+00', '2026-08-01 15:00:00+00'),
    (app_microsoft, demo_user_id, 'Microsoft', 'Backend Developer', 'Redmond, WA',
      130000, 165000, 'Applied', '2026-08-01',
      'https://careers.microsoft.com/', null,
      '2026-07-30 12:00:00+00', '2026-08-01 12:00:00+00'),
    (app_amazon, demo_user_id, 'Amazon', 'Java Developer', 'Seattle, WA',
      145000, 190000, 'Offer', '2026-06-20',
      'https://www.amazon.jobs/', null,
      '2026-06-18 09:00:00+00', '2026-08-10 18:00:00+00'),
    (app_netflix, demo_user_id, 'Netflix', 'Software Engineer', 'Los Gatos, CA',
      160000, 210000, 'Rejected', '2026-06-05',
      'https://jobs.netflix.com/',
      'Mixed feedback on system design depth during the technical round.',
      '2026-06-04 11:00:00+00', '2026-07-22 16:00:00+00'),
    (app_accenture, demo_user_id, 'Accenture', 'Java Developer', 'Chicago, IL',
      95000, 125000, 'Applied', '2026-08-05',
      'https://www.accenture.com/careers', null,
      '2026-08-04 14:00:00+00', '2026-08-05 14:00:00+00'),
    (app_meta, demo_user_id, 'Meta', 'Full Stack Engineer', 'Menlo Park, CA',
      150000, 200000, 'Interview', '2026-07-22',
      'https://www.metacareers.com/', null,
      '2026-07-20 10:00:00+00', '2026-08-08 11:00:00+00'),
    (app_apple, demo_user_id, 'Apple', 'iOS Engineer', 'Cupertino, CA',
      155000, 195000, 'Applied', '2026-08-08',
      'https://jobs.apple.com/', null,
      '2026-08-07 09:00:00+00', '2026-08-08 09:00:00+00'),
    (app_stripe, demo_user_id, 'Stripe', 'Backend Engineer', 'Remote',
      160000, 220000, 'Interview', '2026-07-10',
      'https://stripe.com/jobs', null,
      '2026-07-08 13:00:00+00', '2026-08-05 10:00:00+00'),
    (app_shopify, demo_user_id, 'Shopify', 'Software Developer', 'Remote',
      120000, 160000, 'Applied', '2026-08-10',
      'https://www.shopify.com/careers', null,
      '2026-08-09 16:00:00+00', '2026-08-10 16:00:00+00'),
    (app_spotify, demo_user_id, 'Spotify', 'Platform Engineer', 'New York, NY',
      135000, 175000, 'Wishlist', null,
      'https://www.lifeatspotify.com/jobs', null,
      '2026-08-12 08:00:00+00', '2026-08-12 08:00:00+00'),
    (app_airbnb, demo_user_id, 'Airbnb', 'Software Engineer', 'San Francisco, CA',
      145000, 185000, 'Applied', '2026-07-28',
      'https://careers.airbnb.com/', null,
      '2026-07-27 11:00:00+00', '2026-07-28 11:00:00+00'),
    (app_uber, demo_user_id, 'Uber', 'Backend Engineer', 'San Francisco, CA',
      140000, 180000, 'Rejected', '2026-05-18',
      'https://www.uber.com/careers/',
      'Position filled by internal transfer before final round.',
      '2026-05-15 10:00:00+00', '2026-06-30 17:00:00+00'),
    (app_salesforce, demo_user_id, 'Salesforce', 'Java Engineer', 'San Francisco, CA',
      125000, 160000, 'Applied', '2026-08-02',
      'https://careers.salesforce.com/', null,
      '2026-08-01 15:00:00+00', '2026-08-02 15:00:00+00'),
    (app_oracle, demo_user_id, 'Oracle', 'Cloud Engineer', 'Austin, TX',
      115000, 150000, 'Rejected', '2026-06-12',
      'https://www.oracle.com/careers/',
      'Cloud networking questions were rough; need more OCI practice.',
      '2026-06-10 09:00:00+00', '2026-07-15 14:00:00+00'),
    (app_ibm, demo_user_id, 'IBM', 'Software Developer', 'Remote',
      100000, 135000, 'Offer', '2026-06-25',
      'https://www.ibm.com/careers', null,
      '2026-06-22 12:00:00+00', '2026-08-09 19:00:00+00'),
    (app_adobe, demo_user_id, 'Adobe', 'Full Stack Developer', 'San Jose, CA',
      130000, 170000, 'Interview', '2026-07-18',
      'https://careers.adobe.com/', null,
      '2026-07-16 10:00:00+00', '2026-08-06 12:00:00+00'),
    (app_twilio, demo_user_id, 'Twilio', 'API Engineer', 'Remote',
      125000, 165000, 'Applied', '2026-08-06',
      'https://www.twilio.com/company/jobs', null,
      '2026-08-05 13:00:00+00', '2026-08-06 13:00:00+00'),
    (app_datadog, demo_user_id, 'Datadog', 'Software Engineer', 'New York, NY',
      145000, 185000, 'Applied', '2026-07-25',
      'https://careers.datadoghq.com/', null,
      '2026-07-24 09:00:00+00', '2026-07-25 09:00:00+00'),
    (app_cloudflare, demo_user_id, 'Cloudflare', 'Systems Engineer', 'Remote',
      140000, 180000, 'Wishlist', null,
      'https://www.cloudflare.com/careers/', null,
      '2026-08-11 17:00:00+00', '2026-08-11 17:00:00+00'),
    (app_notion, demo_user_id, 'Notion', 'Full Stack Engineer', 'San Francisco, CA',
      135000, 175000, 'Applied', '2026-08-03',
      'https://www.notion.so/careers', null,
      '2026-08-02 10:00:00+00', '2026-08-03 10:00:00+00'),
    (app_figma, demo_user_id, 'Figma', 'Software Engineer', 'San Francisco, CA',
      140000, 185000, 'Rejected', '2026-05-28',
      'https://www.figma.com/careers/',
      'Culture-fit interview felt off; maybe over-prepared for product questions.',
      '2026-05-26 14:00:00+00', '2026-07-08 16:00:00+00'),
    (app_dropbox, demo_user_id, 'Dropbox', 'Backend Engineer', 'Remote',
      130000, 170000, 'Applied', '2026-08-09',
      'https://jobs.dropbox.com/', null,
      '2026-08-08 11:00:00+00', '2026-08-09 11:00:00+00'),
    (app_atlassian, demo_user_id, 'Atlassian', 'Java Developer', 'Austin, TX',
      120000, 155000, 'Interview', '2026-07-08',
      'https://www.atlassian.com/company/careers', null,
      '2026-07-06 08:00:00+00', '2026-08-04 09:00:00+00'),
    (app_linkedin, demo_user_id, 'LinkedIn', 'Software Engineer', 'Sunnyvale, CA',
      145000, 185000, 'Rejected', '2026-06-01',
      'https://careers.linkedin.com/',
      'Recruiter said they went with a stronger distributed-systems candidate.',
      '2026-05-30 10:00:00+00', '2026-07-01 15:00:00+00');

  insert into public.interviews (
    id, application_id, interview_date, interview_type, interviewer, notes, result, created_at
  ) values
    (gen_random_uuid(), app_google, '2026-08-18 16:00:00+00', 'Technical',
      'Priya Sharma', 'System design + coding round. Prep graphs and caching.', null,
      '2026-08-01 15:30:00+00'),
    (gen_random_uuid(), app_google, '2026-08-05 17:30:00+00', 'Phone Screen',
      'Jordan Lee', 'Recruiter screen — strong culture fit.', 'Passed',
      '2026-07-28 12:00:00+00'),
    (gen_random_uuid(), app_meta, '2026-08-20 18:00:00+00', 'Technical',
      'Alex Chen', 'Two coding problems, medium difficulty expected.', null,
      '2026-08-08 11:30:00+00'),
    (gen_random_uuid(), app_stripe, '2026-08-15 15:00:00+00', 'Behavioral',
      'Sam Rivera', 'Values interview — prepare STAR stories.', null,
      '2026-08-05 10:30:00+00'),
    (gen_random_uuid(), app_adobe, '2026-08-22 19:00:00+00', 'Panel',
      'Morgan Blake', 'Team + hiring manager panel.', null,
      '2026-08-06 12:30:00+00'),
    (gen_random_uuid(), app_atlassian, '2026-08-16 14:00:00+00', 'Technical',
      'Casey Ng', 'Java + Spring Boot deep dive.', null,
      '2026-08-04 09:30:00+00'),
    (gen_random_uuid(), app_amazon, '2026-07-28 16:00:00+00', 'Onsite',
      'Taylor Brooks', 'Final loop — leadership principles.', 'Offer',
      '2026-07-20 10:00:00+00'),
    (gen_random_uuid(), app_netflix, '2026-07-10 18:00:00+00', 'Technical',
      'Riley Quinn', 'Coding + culture. Feedback was mixed on system design.', 'Rejected',
      '2026-07-01 09:00:00+00');

  insert into public.contacts (
    id, user_id, name, company, role, email, linkedin_url, notes, created_at, updated_at
  ) values
    (gen_random_uuid(), demo_user_id, 'Jordan Lee', 'Google', 'Technical Recruiter',
      'jordan.lee@google.com', 'https://www.linkedin.com/in/example-jordan-lee',
      'Primary contact for SWE pipeline. Prefers email.',
      '2026-07-15 10:00:00+00', '2026-08-01 10:00:00+00'),
    (gen_random_uuid(), demo_user_id, 'Priya Sharma', 'Google', 'Staff Engineer',
      'priya.sharma@google.com', null,
      'Interviewed for system design. Follow up after onsite.',
      '2026-08-01 16:00:00+00', '2026-08-01 16:00:00+00'),
    (gen_random_uuid(), demo_user_id, 'Chris Delgado', 'Microsoft', 'Recruiter',
      'chris.delgado@microsoft.com', 'https://www.linkedin.com/in/example-chris-delgado',
      'Sent application confirmation. Waiting on hiring manager review.',
      '2026-08-01 13:00:00+00', '2026-08-01 13:00:00+00'),
    (gen_random_uuid(), demo_user_id, 'Sam Rivera', 'Stripe', 'Engineering Manager',
      'sam.rivera@stripe.com', null,
      'Behavioral interviewer. Connected via referral.',
      '2026-08-05 11:00:00+00', '2026-08-05 11:00:00+00'),
    (gen_random_uuid(), demo_user_id, 'Taylor Brooks', 'Amazon', 'Senior SDM',
      'taylor.brooks@amazon.com', 'https://www.linkedin.com/in/example-taylor-brooks',
      'Extended offer — negotiate start date and signing bonus.',
      '2026-07-28 17:00:00+00', '2026-08-10 18:00:00+00'),
    (gen_random_uuid(), demo_user_id, 'Ava Nguyen', 'IBM', 'Talent Partner',
      'ava.nguyen@ibm.com', null,
      'Offer package sent. Deadline Aug 25.',
      '2026-08-09 19:30:00+00', '2026-08-09 19:30:00+00'),
    (gen_random_uuid(), demo_user_id, 'Morgan Blake', 'Adobe', 'Hiring Manager',
      'morgan.blake@adobe.com', null,
      'Panel interview scheduled for Aug 22.',
      '2026-08-06 13:00:00+00', '2026-08-06 13:00:00+00'),
    (gen_random_uuid(), demo_user_id, 'Casey Ng', 'Atlassian', 'Senior Engineer',
      'casey.ng@atlassian.com', 'https://www.linkedin.com/in/example-casey-ng',
      'Asked about Spring Boot experience and team ownership.',
      '2026-08-04 10:00:00+00', '2026-08-04 10:00:00+00');

  insert into public.notes (
    id, user_id, application_id, body, created_at
  ) values
    (gen_random_uuid(), demo_user_id, app_google,
      'Referred by college classmate on Cloud team. Emphasize distributed systems projects.',
      '2026-07-14 10:30:00+00'),
    (gen_random_uuid(), demo_user_id, app_amazon,
      'Offer: $175k base + 15% bonus + RSUs. Compare with IBM package before deciding.',
      '2026-08-10 18:30:00+00'),
    (gen_random_uuid(), demo_user_id, app_stripe,
      'Take-home was solid. Behavioral round next — research Stripe values.',
      '2026-08-05 10:45:00+00'),
    (gen_random_uuid(), demo_user_id, app_netflix,
      'Rejected after technical. Ask for feedback before reapplying in 6 months.',
      '2026-07-22 16:30:00+00'),
    (gen_random_uuid(), demo_user_id, app_ibm,
      'Remote-friendly team. Slightly lower cash than Amazon but better WLB.',
      '2026-08-09 19:15:00+00');

  raise notice 'Demo seed complete for user % (demo@jobtrack.com): 24 applications, 8 interviews, 8 contacts, 5 notes.',
    demo_user_id;
end $$;
