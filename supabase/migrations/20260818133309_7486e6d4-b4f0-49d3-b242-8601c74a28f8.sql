CREATE FUNCTION public.run_safety_assessment(
  p_health_event_id uuid,
  p_answers jsonb,
  p_trigger_type text DEFAULT 'event_created'
)
RETURNS TABLE(
  safety_assessment_id uuid,
  assessment_status text,
  result text,
  record_revision integer,
  rule_version text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  v_user_id uuid := auth.uid();
  v_rule_version constant text := 'safety_v1.0';
  v_keys constant text[] := array[
    'severe_breathing_difficulty',
    'significant_chest_discomfort',
    'stroke_warning_signs',
    'consciousness_change',
    'other_emergency_signs'
  ];
  v_key text;
  v_val jsonb;
  v_answers jsonb := '{}'::jsonb;
  v_any_true boolean := false;
  v_revision integer;
  v_existing_id uuid;
  v_existing_status text;
  v_existing_result text;
  v_existing_revision integer;
  v_new_id uuid;
  v_result text;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_trigger_type is null or p_trigger_type not in ('event_created', 'manual_retry') then
    raise exception using errcode = '22023', message = 'Unsupported Safety trigger type';
  end if;

  if p_health_event_id is null
     or not exists (
       select 1 from public.health_events he
       where he.id = p_health_event_id and he.user_id = v_user_id
     ) then
    raise exception using errcode = 'P0001', message = 'Health Event not available';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception using errcode = '22023', message = 'Safety answers must be a JSON object';
  end if;

  foreach v_key in array v_keys loop
    v_val := p_answers -> v_key;
    if v_val is null or jsonb_typeof(v_val) <> 'boolean' then
      raise exception using errcode = '22023', message = 'Each Safety answer requires a boolean value';
    end if;
    v_answers := v_answers || jsonb_build_object(v_key, (v_val)::text::boolean);
    if (v_val)::text::boolean then
      v_any_true := true;
    end if;
  end loop;

  if (select count(*) from jsonb_object_keys(p_answers)) <> array_length(v_keys, 1) then
    raise exception using errcode = '22023', message = 'Unexpected Safety answer keys';
  end if;

  -- Serialize concurrent submissions for the same Event on the owned Initial Record row.
  select ir.revision into v_revision
  from public.initial_records ir
  where ir.health_event_id = p_health_event_id
    and ir.user_id = v_user_id
  for update;

  if v_revision is null then
    raise exception using errcode = 'P0001', message = 'Initial Record not available';
  end if;

  if p_trigger_type = 'event_created' then
    select sa.id, sa.assessment_status, sa.result, sa.record_revision
      into v_existing_id, v_existing_status, v_existing_result, v_existing_revision
    from public.safety_assessments sa
    where sa.user_id = v_user_id
      and sa.health_event_id = p_health_event_id
      and sa.record_revision = v_revision
      and sa.rule_version = v_rule_version
      and sa.trigger_type = 'event_created'
      and sa.assessment_status = 'completed'
    order by sa.created_at asc
    limit 1;

    if v_existing_id is not null then
      return query select v_existing_id, v_existing_status, v_existing_result, v_existing_revision, v_rule_version;
      return;
    end if;
  end if;

  v_result := case when v_any_true then 'priority_care' else 'normal' end;

  insert into public.safety_assessments (
    user_id, health_event_id, source_daily_track_id, trigger_type,
    record_revision, assessment_status, answers_snapshot, result,
    rule_version, failure_reason, resolved_at
  )
  values (
    v_user_id, p_health_event_id, null, p_trigger_type,
    v_revision, 'completed', v_answers, v_result,
    v_rule_version, null, now()
  )
  returning id into v_new_id;

  return query select v_new_id, 'completed'::text, v_result, v_revision, v_rule_version;
end;
$$;

REVOKE ALL ON FUNCTION public.run_safety_assessment(uuid, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_safety_assessment(uuid, jsonb, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.run_safety_assessment(uuid, jsonb, text) TO authenticated;