-- NexNav B2-A — Atomic Event + Initial Record RPC
-- Version: v1.0
-- Status: REVIEWED DRAFT — DO NOT RUN UNTIL EXPLICITLY APPROVED
-- Source of Truth: 03_Database_Schema.md v1.0 §13 + 04_Screen_Spec.md v1.0 S05
-- Scope: create one RPC function and its EXECUTE grants only.
-- No table, column, RLS policy, trigger, constraint, index, Auth, or Seed change.

begin;

create or replace function public.create_health_event(
  p_primary_symptom_id uuid,
  p_started_on date,
  p_severity integer,
  p_frequency_level integer,
  p_duration_value integer,
  p_duration_unit text,
  p_life_context jsonb,
  p_custom_primary_symptom text default null,
  p_frequency_description text default null,
  p_associated_symptoms jsonb default '[]'::jsonb,
  p_supplemental_description text default null
)
returns table (
  health_event_id uuid,
  initial_record_id uuid
)
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
  v_initial_record_id uuid;
  v_symptom_is_other boolean;
  v_custom_primary_symptom text := nullif(btrim(p_custom_primary_symptom), '');
  v_frequency_description text := nullif(btrim(p_frequency_description), '');
  v_supplemental_description text := nullif(btrim(p_supplemental_description), '');
  v_associated_input jsonb := coalesce(p_associated_symptoms, '[]'::jsonb);
  v_associated_normalized jsonb := '[]'::jsonb;
  v_life_context_normalized jsonb;
begin
  -- Authentication and onboarding gate.
  if v_user_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and onboarding_completed = true
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'Completed onboarding is required';
  end if;

  -- Active, supported Primary Symptom.
  select sc.is_other
    into v_symptom_is_other
  from public.symptom_catalog as sc
  where sc.id = p_primary_symptom_id
    and sc.is_active = true
    and sc.is_primary_enabled = true;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Active supported Primary Symptom is required';
  end if;

  if v_symptom_is_other then
    if v_custom_primary_symptom is null
       or char_length(v_custom_primary_symptom) > 100 then
      raise exception using
        errcode = '22023',
        message = 'Other Primary Symptom text must contain 1 to 100 characters';
    end if;
  elsif v_custom_primary_symptom is not null then
    raise exception using
      errcode = '22023',
      message = 'Custom Primary Symptom text is only allowed for Other';
  end if;

  -- Date and scalar Initial Record validation.
  if p_started_on is null
     or p_started_on > (timezone('Asia/Taipei', now()))::date then
    raise exception using
      errcode = '22023',
      message = 'Start date must be today or earlier in Asia/Taipei';
  end if;

  if p_severity is null or p_severity not between 1 and 10 then
    raise exception using
      errcode = '22023',
      message = 'Severity must be an integer from 1 to 10';
  end if;

  if p_frequency_level is null or p_frequency_level not between 1 and 5 then
    raise exception using
      errcode = '22023',
      message = 'Frequency level must be an integer from 1 to 5';
  end if;

  if v_frequency_description is not null
     and char_length(v_frequency_description) > 200 then
    raise exception using
      errcode = '22023',
      message = 'Frequency description must not exceed 200 characters';
  end if;

  if p_duration_value is null or p_duration_value <= 0 then
    raise exception using
      errcode = '22023',
      message = 'Duration value must be a positive integer';
  end if;

  if p_duration_unit is null
     or p_duration_unit not in ('minutes', 'hours', 'days', 'weeks', 'months') then
    raise exception using
      errcode = '22023',
      message = 'Unsupported duration unit';
  end if;

  if v_supplemental_description is not null
     and char_length(v_supplemental_description) > 1000 then
    raise exception using
      errcode = '22023',
      message = 'Supplemental description must not exceed 1000 characters';
  end if;

  -- P05 life-context contract: exactly the four required 1–5 values.
  if p_life_context is null
     or jsonb_typeof(p_life_context) <> 'object'
     or coalesce(p_life_context->>'sleep', '') !~ '^[1-5]$'
     or coalesce(p_life_context->>'diet', '') !~ '^[1-5]$'
     or coalesce(p_life_context->>'activity', '') !~ '^[1-5]$'
     or coalesce(p_life_context->>'stress', '') !~ '^[1-5]$' then
    raise exception using
      errcode = '22023',
      message = 'Life context requires sleep, diet, activity, and stress values from 1 to 5';
  end if;

  v_life_context_normalized := jsonb_build_object(
    'sleep', (p_life_context->>'sleep')::integer,
    'diet', (p_life_context->>'diet')::integer,
    'activity', (p_life_context->>'activity')::integer,
    'stress', (p_life_context->>'stress')::integer
  );

  -- Associated Symptoms contract:
  -- each item contains exactly one source: approved symptom_id or custom_text.
  if jsonb_typeof(v_associated_input) <> 'array' then
    raise exception using
      errcode = '22023',
      message = 'Associated Symptoms must be a JSON array';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_associated_input) as item(value)
    where jsonb_typeof(item.value) <> 'object'
      or (
        nullif(btrim(item.value->>'symptom_id'), '') is null
        and nullif(btrim(item.value->>'custom_text'), '') is null
      )
      or (
        nullif(btrim(item.value->>'symptom_id'), '') is not null
        and nullif(btrim(item.value->>'custom_text'), '') is not null
      )
      or char_length(coalesce(nullif(btrim(item.value->>'custom_text'), ''), '')) > 100
  ) then
    raise exception using
      errcode = '22023',
      message = 'Each Associated Symptom requires one approved symptom ID or 1 to 100 characters of custom text';
  end if;

  begin
    if exists (
      select 1
      from jsonb_array_elements(v_associated_input) as item(value)
      where nullif(btrim(item.value->>'symptom_id'), '') is not null
        and not exists (
          select 1
          from public.symptom_catalog as sc
          where sc.id = (item.value->>'symptom_id')::uuid
            and sc.is_active = true
            and sc.is_primary_enabled = true
            and sc.is_other = false
            and sc.id <> p_primary_symptom_id
        )
    ) then
      raise exception using
        errcode = '22023',
        message = 'Associated Symptom IDs must be active, approved, non-Other, and different from the Primary Symptom';
    end if;
  exception
    when invalid_text_representation then
      raise exception using
        errcode = '22023',
        message = 'Associated Symptom ID must be a valid UUID';
  end;

  if exists (
    select 1
    from jsonb_array_elements(v_associated_input) as item(value)
    where nullif(btrim(item.value->>'symptom_id'), '') is not null
    group by item.value->>'symptom_id'
    having count(*) > 1
  ) then
    raise exception using
      errcode = '22023',
      message = 'Duplicate Associated Symptom IDs are not allowed';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'symptom_id', case
          when nullif(btrim(item.value->>'symptom_id'), '') is not null
            then item.value->>'symptom_id'
          else null
        end,
        'custom_text', case
          when nullif(btrim(item.value->>'custom_text'), '') is not null
            then btrim(item.value->>'custom_text')
          else null
        end
      )
      order by item.ordinality
    ),
    '[]'::jsonb
  )
    into v_associated_normalized
  from jsonb_array_elements(v_associated_input)
    with ordinality as item(value, ordinality);

  -- Atomic write. An unhandled failure in either INSERT rolls back both rows.
  insert into public.health_events (
    user_id,
    primary_symptom_id,
    custom_primary_symptom,
    status,
    started_on
  )
  values (
    v_user_id,
    p_primary_symptom_id,
    v_custom_primary_symptom,
    'active',
    p_started_on
  )
  returning id into v_event_id;

  insert into public.initial_records (
    user_id,
    health_event_id,
    severity,
    frequency_level,
    frequency_description,
    duration_value,
    duration_unit,
    associated_symptoms,
    life_context,
    supplemental_description,
    revision
  )
  values (
    v_user_id,
    v_event_id,
    p_severity::smallint,
    p_frequency_level::smallint,
    v_frequency_description,
    p_duration_value,
    p_duration_unit,
    v_associated_normalized,
    v_life_context_normalized,
    v_supplemental_description,
    1
  )
  returning id into v_initial_record_id;

  return query
  select v_event_id, v_initial_record_id;
end
$function$;

-- PostgreSQL grants EXECUTE to PUBLIC by default for new functions.
-- Restrict this controlled operation to authenticated application users only.
revoke all on function public.create_health_event(
  uuid, date, integer, integer, integer, text, jsonb, text, text, jsonb, text
) from public;

revoke all on function public.create_health_event(
  uuid, date, integer, integer, integer, text, jsonb, text, text, jsonb, text
) from anon;

grant execute on function public.create_health_event(
  uuid, date, integer, integer, integer, text, jsonb, text, text, jsonb, text
) to authenticated;

commit;

