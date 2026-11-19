-- Row Level Security for every table + atomic, idempotent write functions.

-- ---------------------------------------------------------------------------
-- Global content: readable by authenticated users (approved rows), never writable.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'content_versions','content_validation_results','curriculum_levels','curriculum_categories',
    'curriculum_courses','curriculum_modules','curriculum_units','grammar_topics','unit_grammar_topics',
    'vocabulary','vocabulary_meanings','vocabulary_examples','unit_vocabulary','audio_assets',
    'listening_materials','lessons','exercises','exercise_keys','assessment_items','assessment_item_keys',
    'profiles','user_preferences','learning_goals','assessments','assessment_answers','daily_plans',
    'daily_plan_items','learning_sessions','lesson_progress','exercise_attempts','user_vocabulary',
    'vocabulary_reviews','user_grammar_progress','learning_errors','writing_submissions','writing_feedback',
    'conversations','conversation_turns','conversation_feedback','push_subscriptions','notifications','ai_usage'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- content readable by any signed-in user
create policy read_levels on public.curriculum_levels for select to app_user using (true);
create policy read_categories on public.curriculum_categories for select to app_user using (true);
create policy read_courses on public.curriculum_courses for select to app_user using (status = 'approved');
create policy read_modules on public.curriculum_modules for select to app_user using (true);
create policy read_units on public.curriculum_units for select to app_user using (status = 'approved');
create policy read_grammar on public.grammar_topics for select to app_user using (true);
create policy read_unit_grammar on public.unit_grammar_topics for select to app_user using (true);
create policy read_unit_vocab on public.unit_vocabulary for select to app_user using (true);
create policy read_audio on public.audio_assets for select to app_user using (true);
create policy read_listening on public.listening_materials for select to app_user using (status = 'approved');
create policy read_lessons on public.lessons for select to app_user using (status = 'approved');
create policy read_exercises on public.exercises for select to app_user using (status = 'approved');
create policy read_assessment_items on public.assessment_items for select to app_user using (status = 'approved');
create policy read_content_versions on public.content_versions for select to app_user using (true);
-- exercise_keys, assessment_item_keys, content_validation_results: no policies => denied to users.

-- vocabulary: global rows readable; user-owned rows fully managed by owner
create policy vocab_read on public.vocabulary for select to app_user
  using (owner_id is null or owner_id = private.uid());
create policy vocab_insert_own on public.vocabulary for insert to app_user
  with check (owner_id = private.uid());
create policy vocab_update_own on public.vocabulary for update to app_user
  using (owner_id = private.uid()) with check (owner_id = private.uid());
create policy vocab_delete_own on public.vocabulary for delete to app_user
  using (owner_id = private.uid());

create policy meanings_read on public.vocabulary_meanings for select to app_user
  using (exists (select 1 from public.vocabulary v where v.id = vocabulary_id and (v.owner_id is null or v.owner_id = private.uid())));
create policy meanings_write_own on public.vocabulary_meanings for all to app_user
  using (exists (select 1 from public.vocabulary v where v.id = vocabulary_id and v.owner_id = private.uid()))
  with check (exists (select 1 from public.vocabulary v where v.id = vocabulary_id and v.owner_id = private.uid()));

create policy examples_read on public.vocabulary_examples for select to app_user
  using (exists (select 1 from public.vocabulary v where v.id = vocabulary_id and (v.owner_id is null or v.owner_id = private.uid())));
create policy examples_write_own on public.vocabulary_examples for all to app_user
  using (exists (select 1 from public.vocabulary v where v.id = vocabulary_id and v.owner_id = private.uid()))
  with check (exists (select 1 from public.vocabulary v where v.id = vocabulary_id and v.owner_id = private.uid()));

-- ---------------------------------------------------------------------------
-- Personal data: owner-only. profiles keyed by id, the rest by user_id.
-- ---------------------------------------------------------------------------
create policy profiles_own_select on public.profiles for select to app_user using (id = private.uid());
create policy profiles_own_update on public.profiles for update to app_user using (id = private.uid()) with check (id = private.uid());

do $$
declare t text;
begin
  foreach t in array array[
    'user_preferences','learning_goals','assessments','assessment_answers','daily_plans','daily_plan_items',
    'learning_sessions','lesson_progress','exercise_attempts','user_vocabulary','vocabulary_reviews',
    'user_grammar_progress','learning_errors','writing_submissions','writing_feedback','conversations',
    'conversation_turns','conversation_feedback','push_subscriptions','notifications'
  ] loop
    execute format('create policy %I on public.%I for select to app_user using (user_id = private.uid())', t || '_own_select', t);
    execute format('create policy %I on public.%I for insert to app_user with check (user_id = private.uid())', t || '_own_insert', t);
    execute format('create policy %I on public.%I for update to app_user using (user_id = private.uid()) with check (user_id = private.uid())', t || '_own_update', t);
    execute format('create policy %I on public.%I for delete to app_user using (user_id = private.uid())', t || '_own_delete', t);
  end loop;
end $$;

-- ai_usage: read-only for owner; writes only through security-definer functions.
create policy ai_usage_own_select on public.ai_usage for select to app_user using (user_id = private.uid());

-- Child-row integrity: a user may only attach rows to parents they own.
create or replace function private.assert_owns_parent() returns trigger
language plpgsql security invoker as $$
begin
  if tg_table_name = 'assessment_answers' then
    if not exists (select 1 from public.assessments where id = new.assessment_id and user_id = new.user_id) then
      raise exception 'parent not owned';
    end if;
  elsif tg_table_name = 'daily_plan_items' then
    if not exists (select 1 from public.daily_plans where id = new.plan_id and user_id = new.user_id) then
      raise exception 'parent not owned';
    end if;
  elsif tg_table_name = 'conversation_turns' or tg_table_name = 'conversation_feedback' then
    if not exists (select 1 from public.conversations where id = new.conversation_id and user_id = new.user_id) then
      raise exception 'parent not owned';
    end if;
  elsif tg_table_name = 'writing_feedback' then
    if not exists (select 1 from public.writing_submissions where id = new.submission_id and user_id = new.user_id) then
      raise exception 'parent not owned';
    end if;
  end if;
  return new;
end $$;

create trigger assessment_answers_owner before insert or update on public.assessment_answers for each row execute function private.assert_owns_parent();
create trigger daily_plan_items_owner before insert or update on public.daily_plan_items for each row execute function private.assert_owns_parent();
create trigger conversation_turns_owner before insert or update on public.conversation_turns for each row execute function private.assert_owns_parent();
create trigger conversation_feedback_owner before insert or update on public.conversation_feedback for each row execute function private.assert_owns_parent();
create trigger writing_feedback_owner before insert or update on public.writing_feedback for each row execute function private.assert_owns_parent();

-- ---------------------------------------------------------------------------
-- Atomic exercise attempt recording (idempotent on client_attempt_id).
-- Grading happens server-side; this function only persists the verdict and
-- updates derived progress in one transaction. Runs with caller rights (RLS).
-- ---------------------------------------------------------------------------
create or replace function public.record_exercise_attempt(
  p_exercise_id uuid, p_session_id uuid, p_client_attempt_id text, p_response jsonb,
  p_is_correct boolean, p_score numeric, p_feedback jsonb, p_duration_ms integer
) returns table (attempt_id uuid, duplicate boolean)
language plpgsql security invoker set search_path = public as $$
declare
  v_user uuid := private.uid();
  v_id uuid;
  v_ex record;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  insert into public.exercise_attempts (user_id, exercise_id, session_id, client_attempt_id, response, is_correct, score, feedback, duration_ms)
  values (v_user, p_exercise_id, p_session_id, p_client_attempt_id, p_response, p_is_correct, p_score, coalesce(p_feedback,'{}'::jsonb), p_duration_ms)
  on conflict (user_id, client_attempt_id) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.exercise_attempts where user_id = v_user and client_attempt_id = p_client_attempt_id;
    return query select v_id, true;
    return;
  end if;

  select e.grammar_topic_id, e.lesson_id into v_ex from public.exercises e where e.id = p_exercise_id;

  if v_ex.grammar_topic_id is not null then
    insert into public.user_grammar_progress (user_id, grammar_topic_id, attempts, correct, last_practiced_at)
    values (v_user, v_ex.grammar_topic_id, 1, case when p_is_correct then 1 else 0 end, now())
    on conflict (user_id, grammar_topic_id) do update set
      attempts = user_grammar_progress.attempts + 1,
      correct = user_grammar_progress.correct + case when p_is_correct then 1 else 0 end,
      last_practiced_at = now();
  end if;

  if p_session_id is not null then
    update public.learning_sessions set
      items_completed = items_completed + 1,
      items_correct = items_correct + case when p_is_correct then 1 else 0 end,
      last_activity_at = now()
    where id = p_session_id and user_id = v_user;
  end if;

  return query select v_id, false;
end $$;

-- ---------------------------------------------------------------------------
-- Atomic, idempotent vocabulary review. FSRS math runs in the app; this
-- function applies it with optimistic concurrency (p_expected_version) and
-- writes an auditable review log in the same transaction.
-- ---------------------------------------------------------------------------
create or replace function public.apply_vocabulary_review(
  p_vocabulary_id uuid, p_client_review_id text, p_mode text, p_direction text,
  p_rating smallint, p_correct boolean, p_expected_version integer, p_next jsonb
) returns table (applied boolean, duplicate boolean, new_version integer)
language plpgsql security invoker set search_path = public as $$
declare
  v_user uuid := private.uid();
  v_prev public.user_vocabulary;
  v_rows integer;
  v_status text;
begin
  if v_user is null then raise exception 'not authenticated'; end if;

  if exists (select 1 from public.vocabulary_reviews where user_id = v_user and client_review_id = p_client_review_id) then
    return query select false, true, (select version from public.user_vocabulary where user_id = v_user and vocabulary_id = p_vocabulary_id);
    return;
  end if;

  select * into v_prev from public.user_vocabulary where user_id = v_user and vocabulary_id = p_vocabulary_id for update;
  if not found then raise exception 'vocabulary not in user library'; end if;
  if v_prev.version <> p_expected_version then
    return query select false, false, v_prev.version;
    return;
  end if;

  -- Mastery requires successful *production* evidence, not just recognition.
  v_status := case
    when (p_next->>'fsrs_state')::smallint = 0 then 'new'
    when (p_next->>'fsrs_state')::smallint in (1,3) then 'learning'
    when (p_next->>'stability')::float >= 21
         and v_prev.production_correct + case when p_direction = 'production' and p_correct then 1 else 0 end >= 2
      then 'mastered'
    else 'review' end;

  update public.user_vocabulary set
    due = (p_next->>'due')::timestamptz,
    stability = (p_next->>'stability')::float,
    difficulty = (p_next->>'difficulty')::float,
    scheduled_days = (p_next->>'scheduled_days')::int,
    learning_steps = (p_next->>'learning_steps')::int,
    reps = (p_next->>'reps')::int,
    lapses = (p_next->>'lapses')::int,
    fsrs_state = (p_next->>'fsrs_state')::smallint,
    last_review = (p_next->>'last_review')::timestamptz,
    recognition_correct = recognition_correct + case when p_direction = 'recognition' and p_correct then 1 else 0 end,
    production_correct = production_correct + case when p_direction = 'production' and p_correct then 1 else 0 end,
    difficult = case when not p_correct and lapses >= 2 then true else difficult end,
    status = case when status = 'suspended' then status else v_status end,
    version = version + 1
  where user_id = v_user and vocabulary_id = p_vocabulary_id;
  get diagnostics v_rows = row_count;

  insert into public.vocabulary_reviews (user_id, vocabulary_id, client_review_id, mode, direction, rating, correct, prev_state, next_state)
  values (v_user, p_vocabulary_id, p_client_review_id, p_mode, p_direction, p_rating, p_correct,
          to_jsonb(v_prev) - 'user_id', p_next);

  return query select v_rows = 1, false, v_prev.version + 1;
end $$;

-- Record (or bump) a recurring error pattern.
create or replace function public.record_learning_error(
  p_source text, p_category text, p_pattern text, p_wrong text, p_right text, p_explanation text, p_grammar_topic_id uuid
) returns void
language plpgsql security invoker set search_path = public as $$
begin
  insert into public.learning_errors (user_id, source, category, pattern, example_wrong, example_right, explanation, grammar_topic_id)
  values (private.uid(), p_source, left(p_category, 80), left(lower(p_pattern), 200), left(p_wrong, 500), left(p_right, 500), left(p_explanation, 1000), p_grammar_topic_id)
  on conflict (user_id, category, pattern) do update set
    occurrences = learning_errors.occurrences + 1,
    example_wrong = excluded.example_wrong,
    example_right = excluded.example_right,
    explanation = coalesce(excluded.explanation, learning_errors.explanation),
    resolved = false,
    last_seen_at = now();
end $$;

-- Lock down function execution.
revoke execute on all functions in schema private from public;
revoke execute on function public.reserve_ai_budget(text,text,text,numeric) from public;
revoke execute on function public.settle_ai_usage(uuid,text,integer,integer,numeric,numeric,text) from public;
revoke execute on function public.ai_month_summary() from public;
revoke execute on function public.record_exercise_attempt(uuid,uuid,text,jsonb,boolean,numeric,jsonb,integer) from public;
revoke execute on function public.apply_vocabulary_review(uuid,text,text,text,smallint,boolean,integer,jsonb) from public;
revoke execute on function public.record_learning_error(text,text,text,text,text,text,uuid) from public;
grant execute on function public.reserve_ai_budget(text,text,text,numeric) to app_user;
grant execute on function public.settle_ai_usage(uuid,text,integer,integer,numeric,numeric,text) to app_user;
grant execute on function public.ai_month_summary() to app_user;
grant execute on function public.record_exercise_attempt(uuid,uuid,text,jsonb,boolean,numeric,jsonb,integer) to app_user;
grant execute on function public.apply_vocabulary_review(uuid,text,text,text,smallint,boolean,integer,jsonb) to app_user;
grant execute on function public.record_learning_error(text,text,text,text,text,text,uuid) to app_user;



-- ---------------------------------------------------------------------------
-- Table privileges for the request role. RLS narrows these further.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on all tables in schema public to app_user;
revoke all on public.auth_users, public.auth_sessions, public.auth_accounts,
  public.auth_verifications, public.auth_rate_limits,
  public.exercise_keys, public.assessment_item_keys, public.content_validation_results
  from app_user;
alter table public.auth_users enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.auth_accounts enable row level security;
alter table public.auth_verifications enable row level security;
alter table public.auth_rate_limits enable row level security;
