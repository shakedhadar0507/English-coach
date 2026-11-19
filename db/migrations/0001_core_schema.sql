-- English Coach core schema
-- Shared curriculum content is globally readable (approved rows only) and written
-- only by the service role (seed / content pipeline). Personal data is owned by
-- private.uid() and protected by RLS on every table.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

-- ---------------------------------------------------------------------------
-- Request identity. The server opens a transaction per request, switches to
-- the non-privileged role `app_user` (SET LOCAL ROLE) and sets `app.user_id`
-- to the verified session user. RLS policies compare against private.uid().
-- Works identically on any managed Postgres (Neon, Supabase, Render...).
-- ---------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then
    create role app_user nologin noinherit;
  end if;
end $$;
grant app_user to current_user;

create or replace function private.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

grant usage on schema public to app_user;
grant usage on schema private to app_user;
grant execute on function private.uid() to app_user;

-- ---------------------------------------------------------------------------
-- Authentication tables (Better Auth). Accessed only by the server's owner
-- connection; app_user has no grants on them.
-- ---------------------------------------------------------------------------
create table public.auth_users (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public.auth_users(id) on delete cascade,
  token text not null unique,
  "expiresAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index on public.auth_sessions ("userId");

create table public.auth_accounts (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public.auth_users(id) on delete cascade,
  "accountId" text not null,
  "providerId" text not null,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index on public.auth_accounts ("userId");

create table public.auth_verifications (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index on public.auth_verifications (identifier);

create table public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  count integer not null,
  "lastRequest" bigint not null
);

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.cefr_level as enum ('A1','A2','B1','B2','C1','C2');
create type public.skill as enum ('vocabulary','grammar','listening','reading','writing','speaking');
create type public.content_status as enum ('draft','approved','retired');
create type public.lesson_kind as enum ('vocabulary','grammar','listening','reading','writing','speaking','review','mixed');
create type public.exercise_type as enum (
  'multiple_choice','fill_blank','reorder','correct_sentence','rewrite',
  'translate_he_en','translate_en_he','write_sentence','identify_error',
  'dictation','listening_mc','reading_mc','free_writing','speaking_prompt'
);
create type public.learning_goal as enum ('everyday','business','academic','travel','job_interviews','presentations','general_fluency');
create type public.accent as enum ('american','british','australian');
create type public.correction_mode as enum ('immediate','end_of_conversation');
create type public.theme_pref as enum ('system','light','dark');
create type public.ui_locale as enum ('he','en');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function private.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Content versioning & validation
-- ---------------------------------------------------------------------------
create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  source text not null,              -- 'seed:hand-authored', 'pipeline:ai-generated', ...
  checksum text not null,
  item_counts jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table public.content_validation_results (
  id uuid primary key default gen_random_uuid(),
  content_version_id uuid references public.content_versions(id) on delete cascade,
  entity_type text not null,
  entity_slug text not null,
  severity text not null check (severity in ('error','warning','info')),
  code text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index on public.content_validation_results (content_version_id);

-- ---------------------------------------------------------------------------
-- Curriculum structure (global)
-- ---------------------------------------------------------------------------
create table public.curriculum_levels (
  code public.cefr_level primary key,
  ordinal smallint not null unique,
  title_en text not null,
  title_he text not null,
  description_en text not null,
  description_he text not null
);

create table public.curriculum_categories (
  slug text primary key,
  title_en text not null,
  title_he text not null,
  sort smallint not null default 0
);

create table public.curriculum_courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category_slug text not null references public.curriculum_categories(slug),
  level public.cefr_level not null references public.curriculum_levels(code),
  title_en text not null,
  title_he text not null,
  description_en text not null default '',
  description_he text not null default '',
  goals public.learning_goal[] not null default '{}',
  sort integer not null default 0,
  status public.content_status not null default 'draft',
  content_version_id uuid references public.content_versions(id)
);

create table public.curriculum_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.curriculum_courses(id) on delete cascade,
  slug text not null unique,
  title_en text not null,
  title_he text not null,
  sort integer not null default 0
);
create index on public.curriculum_modules (course_id);

create table public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.curriculum_modules(id) on delete cascade,
  slug text not null unique,
  level public.cefr_level not null,
  title_en text not null,
  title_he text not null,
  objectives jsonb not null default '[]'::jsonb,           -- [{en, he}]
  prerequisites text[] not null default '{}',               -- unit slugs
  completion_criteria jsonb not null default '{}'::jsonb,   -- {min_accuracy, required_lessons}
  sort integer not null default 0,
  status public.content_status not null default 'draft',
  content_version_id uuid references public.content_versions(id)
);
create index on public.curriculum_units (module_id);
create index on public.curriculum_units (level);

create table public.grammar_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  level public.cefr_level not null,
  title_en text not null,
  title_he text not null,
  summary_en text not null,
  summary_he text not null,
  rules jsonb not null default '[]'::jsonb,      -- [{en, he}]
  examples jsonb not null default '[]'::jsonb,   -- [{en, he, note?}]
  common_mistakes jsonb not null default '[]'::jsonb, -- [{wrong, right, he}]
  sort integer not null default 0
);

create table public.unit_grammar_topics (
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  grammar_topic_id uuid not null references public.grammar_topics(id) on delete cascade,
  primary key (unit_id, grammar_topic_id)
);

-- ---------------------------------------------------------------------------
-- Vocabulary (global rows have owner_id null; user-added rows are owned)
-- ---------------------------------------------------------------------------
create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.auth_users(id) on delete cascade,
  lemma text not null,
  part_of_speech text not null,
  level public.cefr_level,
  ipa_us text,
  ipa_uk text,
  tags text[] not null default '{}',
  synonyms text[] not null default '{}',
  antonyms text[] not null default '{}',
  related text[] not null default '{}',
  created_at timestamptz not null default now()
);
create unique index vocabulary_global_uniq on public.vocabulary (lower(lemma), part_of_speech) where owner_id is null;
create unique index vocabulary_owner_uniq on public.vocabulary (owner_id, lower(lemma), part_of_speech) where owner_id is not null;
create index on public.vocabulary (owner_id);
create index on public.vocabulary (level);
create index on public.vocabulary using gin (tags);

create table public.vocabulary_meanings (
  id uuid primary key default gen_random_uuid(),
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  sense_order smallint not null default 1,
  definition_en text not null,
  translations_he text[] not null,     -- several valid Hebrew renderings
  usage_note_en text,
  usage_note_he text,
  register text,                       -- 'formal','informal','neutral','business',...
  unique (vocabulary_id, sense_order)
);

create table public.vocabulary_examples (
  id uuid primary key default gen_random_uuid(),
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  meaning_id uuid references public.vocabulary_meanings(id) on delete set null,
  sentence_en text not null,
  translation_he text
);
create index on public.vocabulary_examples (vocabulary_id);

create table public.unit_vocabulary (
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  primary key (unit_id, vocabulary_id)
);
create index on public.unit_vocabulary (vocabulary_id);

-- ---------------------------------------------------------------------------
-- Listening / audio
-- ---------------------------------------------------------------------------
create table public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  text_hash text not null,
  voice text not null,
  provider text not null,
  storage_path text not null,
  mime_type text not null default 'audio/mpeg',
  duration_ms integer,
  created_at timestamptz not null default now(),
  unique (text_hash, voice, provider)
);

create table public.listening_materials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  level public.cefr_level not null,
  format text not null check (format in ('sentence','dialogue','conversation','workplace','academic','story','passage')),
  title_en text not null,
  title_he text not null,
  context_he text,
  segments jsonb not null,             -- [{speaker, text}] ordered
  glossary jsonb not null default '[]'::jsonb, -- [{term, he, en}]
  accent public.accent not null default 'american',
  audio_asset_id uuid references public.audio_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  content_version_id uuid references public.content_versions(id)
);

-- ---------------------------------------------------------------------------
-- Lessons & exercises
-- ---------------------------------------------------------------------------
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  slug text not null unique,
  kind public.lesson_kind not null,
  title_en text not null,
  title_he text not null,
  intro_en text not null default '',
  intro_he text not null default '',
  estimated_minutes smallint not null default 5 check (estimated_minutes between 1 and 60),
  sort integer not null default 0,
  status public.content_status not null default 'draft',
  content_version_id uuid references public.content_versions(id)
);
create index on public.lessons (unit_id, sort);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  lesson_id uuid references public.lessons(id) on delete cascade,
  type public.exercise_type not null,
  skill public.skill not null,
  level public.cefr_level not null,
  prompt jsonb not null,               -- public payload, never contains answers
  explanation_en text not null default '',
  explanation_he text not null default '',
  grammar_topic_id uuid references public.grammar_topics(id) on delete set null,
  vocabulary_id uuid references public.vocabulary(id) on delete set null,
  listening_material_id uuid references public.listening_materials(id) on delete set null,
  sort integer not null default 0,
  status public.content_status not null default 'draft',
  content_version_id uuid references public.content_versions(id)
);
create index on public.exercises (lesson_id, sort);
create index on public.exercises (grammar_topic_id);
create index on public.exercises (vocabulary_id);
create index on public.exercises (skill, level);

-- Answer keys are never readable by end users (no RLS policies). The server
-- reads them with the service role to grade deterministically.
create table public.exercise_keys (
  exercise_id uuid primary key references public.exercises(id) on delete cascade,
  answer jsonb not null
);

-- Placement assessment item bank
create table public.assessment_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  skill public.skill not null,
  level public.cefr_level not null,
  type public.exercise_type not null,
  prompt jsonb not null,
  status public.content_status not null default 'approved',
  content_version_id uuid references public.content_versions(id)
);
create index on public.assessment_items (skill, level);

create table public.assessment_item_keys (
  item_id uuid primary key references public.assessment_items(id) on delete cascade,
  answer jsonb not null
);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
create table private.allowed_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references public.auth_users(id) on delete cascade,
  display_name text,
  current_level public.cefr_level,
  level_source text check (level_source in ('placement','manual')),
  onboarding_step text not null default 'welcome',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

create table public.user_preferences (
  user_id uuid primary key references public.auth_users(id) on delete cascade,
  locale public.ui_locale not null default 'he',
  theme public.theme_pref not null default 'system',
  daily_minutes smallint not null default 15 check (daily_minutes between 5 and 120),
  accent public.accent not null default 'american',
  voice_rate numeric(3,2) not null default 1.00 check (voice_rate between 0.5 and 1.5),
  correction_mode public.correction_mode not null default 'end_of_conversation',
  timezone text not null default 'Asia/Jerusalem',
  reminder_enabled boolean not null default false,
  reminder_time time not null default '08:00',
  monthly_ai_budget_usd numeric(8,2) not null default 15.00 check (monthly_ai_budget_usd >= 0 and monthly_ai_budget_usd <= 1000),
  vocab_new_per_day smallint not null default 8 check (vocab_new_per_day between 0 and 50),
  store_raw_audio boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger user_preferences_touch before update on public.user_preferences
  for each row execute function private.touch_updated_at();

create table public.learning_goals (
  user_id uuid not null references public.auth_users(id) on delete cascade,
  goal public.learning_goal not null,
  priority smallint not null check (priority between 1 and 7),
  primary key (user_id, goal)
);

-- ---------------------------------------------------------------------------
-- Assessments
-- ---------------------------------------------------------------------------
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  kind text not null default 'placement',
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  state jsonb not null default '{}'::jsonb,      -- adaptive engine state
  overall_level public.cefr_level,
  overall_confidence text check (overall_confidence in ('low','medium','high')),
  skill_results jsonb,                           -- {skill: {level, confidence, n, accuracy}}
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index on public.assessments (user_id, started_at desc);

create table public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  item_id uuid not null references public.assessment_items(id),
  response jsonb not null,
  is_correct boolean,
  score numeric(4,3),
  feedback jsonb,
  answered_at timestamptz not null default now(),
  unique (assessment_id, item_id)
);
create index on public.assessment_answers (user_id);

-- ---------------------------------------------------------------------------
-- Learning activity
-- ---------------------------------------------------------------------------
create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  plan_date date not null,
  target_minutes smallint not null,
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  rationale jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.daily_plans(id) on delete cascade,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  seq smallint not null,
  kind text not null check (kind in ('vocab_review','vocab_new','lesson','listening','writing','speaking','error_review')),
  lesson_id uuid references public.lessons(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  estimated_minutes smallint not null default 3,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','skipped')),
  completed_at timestamptz,
  unique (plan_id, seq)
);
create index on public.daily_plan_items (user_id);

create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  daily_plan_item_id uuid references public.daily_plan_items(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  kind text not null,
  status text not null default 'active' check (status in ('active','paused','completed','abandoned')),
  position integer not null default 0,           -- resume pointer
  state jsonb not null default '{}'::jsonb,
  active_seconds integer not null default 0,
  items_completed integer not null default 0,
  items_correct integer not null default 0,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  ended_at timestamptz
);
create index on public.learning_sessions (user_id, started_at desc);

create table public.lesson_progress (
  user_id uuid not null references public.auth_users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  best_accuracy numeric(4,3),
  attempts integer not null default 0,
  first_completed_at timestamptz,
  last_activity_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  session_id uuid references public.learning_sessions(id) on delete set null,
  client_attempt_id text not null,               -- idempotency key from the client
  response jsonb not null,
  is_correct boolean not null,
  score numeric(4,3) not null,
  feedback jsonb not null default '{}'::jsonb,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, client_attempt_id)
);
create index on public.exercise_attempts (user_id, created_at desc);
create index on public.exercise_attempts (exercise_id);

create table public.user_vocabulary (
  user_id uuid not null references public.auth_users(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  status text not null default 'new' check (status in ('new','learning','review','mastered','suspended')),
  saved boolean not null default false,
  difficult boolean not null default false,
  -- FSRS card state
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  scheduled_days integer not null default 0,
  learning_steps integer not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  fsrs_state smallint not null default 0,        -- 0 New,1 Learning,2 Review,3 Relearning
  last_review timestamptz,
  recognition_correct integer not null default 0,
  production_correct integer not null default 0,
  first_seen_at timestamptz not null default now(),
  version integer not null default 0,            -- optimistic concurrency
  primary key (user_id, vocabulary_id)
);
create index on public.user_vocabulary (user_id, due);
create index on public.user_vocabulary (user_id, status);

create table public.vocabulary_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  vocabulary_id uuid not null references public.vocabulary(id) on delete cascade,
  client_review_id text not null,
  mode text not null,
  direction text not null check (direction in ('recognition','production')),
  rating smallint not null check (rating between 1 and 4),
  correct boolean not null,
  prev_state jsonb not null,
  next_state jsonb not null,
  reviewed_at timestamptz not null default now(),
  unique (user_id, client_review_id)
);
create index on public.vocabulary_reviews (user_id, reviewed_at desc);

create table public.user_grammar_progress (
  user_id uuid not null references public.auth_users(id) on delete cascade,
  grammar_topic_id uuid not null references public.grammar_topics(id) on delete cascade,
  attempts integer not null default 0,
  correct integer not null default 0,
  last_practiced_at timestamptz,
  primary key (user_id, grammar_topic_id)
);

create table public.learning_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  source text not null check (source in ('exercise','writing','conversation','assessment')),
  category text not null,                        -- e.g. 'grammar:present-perfect', 'vocab:collocation'
  grammar_topic_id uuid references public.grammar_topics(id) on delete set null,
  pattern text not null,                         -- normalized key
  example_wrong text,
  example_right text,
  explanation text,
  occurrences integer not null default 1,
  resolved boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, category, pattern)
);
create index on public.learning_errors (user_id, last_seen_at desc);

create table public.writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  task_slug text,
  task_prompt text not null,
  body text not null check (char_length(body) between 1 and 8000),
  word_count integer not null,
  client_submission_id text not null,
  status text not null default 'submitted' check (status in ('submitted','evaluated','evaluation_failed','evaluation_disabled')),
  created_at timestamptz not null default now(),
  unique (user_id, client_submission_id)
);
create index on public.writing_submissions (user_id, created_at desc);

create table public.writing_feedback (
  submission_id uuid primary key references public.writing_submissions(id) on delete cascade,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  feedback jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  mode text not null check (mode in ('free_talk','role_play','guided','interview')),
  scenario text,
  topic text,
  level public.cefr_level,
  correction_mode public.correction_mode not null,
  transport text not null check (transport in ('realtime','turn_based','text')),
  status text not null default 'active' check (status in ('active','ended')),
  context_summary text not null default '',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  user_speaking_seconds integer not null default 0
);
create index on public.conversations (user_id, started_at desc);

create table public.conversation_turns (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  seq integer not null,
  role text not null check (role in ('user','tutor')),
  text text not null check (char_length(text) <= 4000),
  created_at timestamptz not null default now(),
  unique (conversation_id, seq)
);
create index on public.conversation_turns (user_id);

create table public.conversation_feedback (
  conversation_id uuid primary key references public.conversations(id) on delete cascade,
  user_id uuid not null references public.auth_users(id) on delete cascade,
  feedback jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index on public.push_subscriptions (user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  dedupe_key text not null,
  unique (user_id, dedupe_key)
);
create index on public.notifications (status, scheduled_for);

-- ---------------------------------------------------------------------------
-- AI usage & cost control
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.auth_users(id) on delete cascade,
  feature text not null,          -- 'writing_feedback','tutor_turn','conversation_feedback','realtime','tts','stt','content_generation'
  provider text not null,
  model text not null,
  status text not null default 'reserved' check (status in ('reserved','committed','released','failed')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  audio_seconds numeric(10,2) not null default 0,
  estimated_cost_usd numeric(10,6) not null default 0,
  reserved_cost_usd numeric(10,6) not null default 0,
  error text,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index on public.ai_usage (user_id, created_at desc);

-- Monthly spend (committed + outstanding reservations) for the current UTC month.
create or replace function private.month_spend(p_user uuid) returns numeric
language sql stable as $$
  select coalesce(sum(case when status = 'reserved' then reserved_cost_usd
                           when status in ('committed','failed') then estimated_cost_usd
                           else 0 end), 0)
  from public.ai_usage
  where user_id = p_user and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc';
$$;

-- Atomically reserve budget. Serializes per user by locking the preferences row,
-- so concurrent requests cannot jointly exceed the cap. Returns null when the
-- reservation would exceed the user's monthly budget.
create or replace function public.reserve_ai_budget(p_feature text, p_provider text, p_model text, p_estimate numeric)
returns uuid
language plpgsql security definer set search_path = public, private as $$
declare
  v_user uuid := private.uid();
  v_budget numeric;
  v_id uuid;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  if p_estimate < 0 or p_estimate > 5 then raise exception 'invalid estimate'; end if;
  select monthly_ai_budget_usd into v_budget from public.user_preferences where user_id = v_user for update;
  if v_budget is null then raise exception 'preferences missing'; end if;
  -- Expire stale reservations (crashed requests) so they do not block forever.
  update public.ai_usage set status = 'released', settled_at = now()
    where user_id = v_user and status = 'reserved' and created_at < now() - interval '15 minutes';
  if private.month_spend(v_user) + p_estimate > v_budget then
    return null;
  end if;
  insert into public.ai_usage (user_id, feature, provider, model, reserved_cost_usd)
    values (v_user, p_feature, p_provider, p_model, p_estimate) returning id into v_id;
  return v_id;
end $$;

create or replace function public.settle_ai_usage(p_id uuid, p_status text, p_input_tokens integer, p_output_tokens integer,
  p_audio_seconds numeric, p_cost numeric, p_error text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('committed','released','failed') then raise exception 'invalid status'; end if;
  update public.ai_usage set status = p_status,
    input_tokens = greatest(p_input_tokens, 0), output_tokens = greatest(p_output_tokens, 0),
    audio_seconds = greatest(p_audio_seconds, 0), estimated_cost_usd = greatest(p_cost, 0),
    error = left(p_error, 500), settled_at = now()
  where id = p_id and user_id = private.uid() and status = 'reserved';
end $$;

create or replace function public.ai_month_summary()
returns table (spent numeric, budget numeric, requests bigint)
language sql security definer set search_path = public, private stable as $$
  select private.month_spend(private.uid()),
         (select monthly_ai_budget_usd from public.user_preferences where user_id = private.uid()),
         (select count(*) from public.ai_usage where user_id = private.uid()
            and created_at >= date_trunc('month', now() at time zone 'utc') at time zone 'utc');
$$;

-- ---------------------------------------------------------------------------
-- Signup restriction & bootstrap: only allow-listed emails can ever get an
-- account, even if the auth layer were misconfigured.
-- ---------------------------------------------------------------------------
create or replace function private.enforce_allowed_signup() returns trigger
language plpgsql security definer set search_path = private, public as $$
begin
  if not exists (select 1 from private.allowed_emails where email = lower(new.email)) then
    raise exception 'Signups are disabled for this application';
  end if;
  return new;
end $$;

create trigger enforce_allowed_signup before insert on public.auth_users
  for each row execute function private.enforce_allowed_signup();

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.name) on conflict do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on public.auth_users
  for each row execute function private.handle_new_user();
