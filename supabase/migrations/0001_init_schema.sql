-- Phase 1: core schema for the live discovery-session tool.
--
-- Access model: there is no Supabase Auth / login. Two Postgres roles matter:
--   - anon           the browser client, used by attendees only
--   - service_role    used exclusively from server actions behind the
--                     facilitator PIN gate; bypasses RLS by default in
--                     Supabase, so it needs no explicit policies below.
--
-- Every table has RLS enabled. Where no `anon` policy is listed for an
-- operation, that operation is denied to anon by default (deny-by-default is
-- how RLS works once enabled) - that's intentional, not an omission.

create type exercise_type as enum (
  'values_tension',
  'word_choice',
  'keep_cut',
  'visual_reaction',
  'perceptual_map'
);

create type session_status as enum ('open', 'closed');
create type reveal_state as enum ('hidden', 'revealed');

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  status session_status not null default 'open',
  created_at timestamptz not null default now()
);

create index sessions_client_id_idx on sessions (client_id);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  type exercise_type not null,
  -- named `position`, not `order`, to sidestep the SQL reserved word
  position integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  reveal_state reveal_state not null default 'hidden',
  created_at timestamptz not null default now()
);

create index exercises_session_id_idx on exercises (session_id);

create table attendees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  name text not null,
  joined_at timestamptz not null default now()
);

create index attendees_session_id_idx on attendees (session_id);

create table responses (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises (id) on delete cascade,
  attendee_id uuid not null references attendees (id) on delete cascade,
  payload jsonb not null,
  -- lets one exercise (values_tension/word_choice/visual_reaction) accept
  -- one response row per pair/image, while keep_cut/perceptual_map (which
  -- have no pairId/imageId in their payload) still only get one row per
  -- attendee. Also makes attendee-side submit retries idempotent: a retried
  -- insert after a network blip hits this unique constraint (23505) instead
  -- of creating a duplicate - the client should treat that as success.
  item_key text generated always as (
    coalesce(payload ->> 'pairId', payload ->> 'imageId', '')
  ) stored,
  submitted_at timestamptz not null default now(),
  unique (exercise_id, attendee_id, item_key)
);

create index responses_exercise_id_idx on responses (exercise_id);
create index responses_attendee_id_idx on responses (attendee_id);

alter table clients enable row level security;
alter table sessions enable row level security;
alter table exercises enable row level security;
alter table attendees enable row level security;
alter table responses enable row level security;

-- sessions: attendees need to read session name/status when they open the
-- join link.
create policy "anon can read sessions" on sessions
  for select to anon using (true);

-- exercises: attendees need the config (pairs/images/axes) and reveal_state
-- to render the current exercise. This is facilitator-authored setup data,
-- never response content, so it's fine to expose in full.
create policy "anon can read exercises" on exercises
  for select to anon using (true);

-- attendees: anon can join (insert their own row) but never list attendees.
create policy "anon can join a session" on attendees
  for insert to anon with check (true);

-- responses: anon can submit but can never read any response, including
-- their own - the facilitator screen is a separate service-role-backed view.
create policy "anon can submit responses" on responses
  for insert to anon with check (true);

-- clients table: no anon policies at all. Only service_role (facilitator,
-- via the PIN-gated server actions) can touch it.

-- Deletes all responses for a session's exercises without touching the
-- session, its exercise configs, or any other session. Restricted to
-- service_role so it can only be called from a facilitator-gated server
-- action.
create or replace function reset_session_responses(p_session_id uuid)
returns void
language sql
as $$
  delete from responses
  where exercise_id in (
    select id from exercises where session_id = p_session_id
  );
$$;

revoke execute on function reset_session_responses(uuid) from public, anon;
grant execute on function reset_session_responses(uuid) to service_role;
