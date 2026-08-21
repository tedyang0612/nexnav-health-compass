-- 1) Columns for versioning + idempotent submissions
alter table public.health_summaries
  add column if not exists version_number integer,
  add column if not exists submission_id uuid;

alter table public.health_summaries alter column version_number drop not null;
alter table public.health_summaries alter column version_number drop default;

create unique index if not exists health_summaries_submission_unique
  on public.health_summaries (user_id, submission_id)
  where submission_id is not null;

drop index if exists health_summaries_version_unique;
create unique index if not exists health_summaries_version_unique
  on public.health_summaries (health_event_id, summary_type, version_number)
  where version_number is not null;

create index if not exists health_summaries_listing_idx
  on public.health_summaries (health_event_id, summary_type, created_at desc);

-- 2) Lock down direct writes: RPC-only creation, owner-only read
drop policy if exists summaries_insert_own on public.health_summaries;
drop policy if exists summaries_update_own_draft on public.health_summaries;
drop policy if exists summaries_select_own on public.health_summaries;

create policy summaries_select_own
  on public.health_summaries
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.health_summaries from authenticated;
grant select on public.health_summaries to authenticated;
grant all on public.health_summaries to service_role;

drop function if exists public.confirm_health_summary(uuid, text, uuid, timestamptz, text, jsonb, jsonb);

-- 3) Atomic, trusted confirmation RPC
create or replace function public.confirm_health_summary(
  p_health_event_id uuid,
  p_summary_type text,
  p_submission_id uuid,
  p_expected_record_revision integer,
  p_expected_source_updated_at timestamptz,
  p_expected_latest_track_date date default null,
  p_selected_background_keys text[] default '{}',
  p_selected_track_ids uuid[] default '{}',
  p_target_professional text default null,
  p_questions jsonb default '[]'::jsonb
)
returns table(
  summary_id uuid,
  version_number integer,
  status text,
  summary_type text,
  snapshot_content jsonb,
  source_record_revision integer,
  latest_track_date date,
  source_data_updated_at timestamptz,
  confirmed_at timestamptz,
  created_new boolean
)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_user_id uuid := auth.uid();
  v_schema_version constant text := 'summary_v1.0';
  v_event public.health_events%rowtype;
  v_ir public.initial_records%rowtype;
  v_profile public.profiles%rowtype;
  v_safety public.safety_assessments%rowtype;
  v_symptom_label text;
  v_categories text[] := '{}'::text[];
  v_cat text;
  v_track_ids uuid[] := '{}'::uuid[];
  v_selected_count integer;
  v_source_updated timestamptz;
  v_latest_track date;
  v_suggestion_map jsonb := '{}'::jsonb;
  v_tracks jsonb := '[]'::jsonb;
  v_notes jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_background jsonb := '[]'::jsonb;
  v_questions jsonb := '[]'::jsonb;
  v_q text;
  v_snapshot jsonb;
  v_target_label text;
  v_type_label text;
  v_disclaimer text;
  v_safety_at timestamptz;
  v_next_version integer;
  v_existing public.health_summaries%rowtype;
  v_new public.health_summaries%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'AUTH_REQUIRED';
  end if;
  if p_submission_id is null then
    raise exception using errcode = '22023', message = 'SUBMISSION_ID_REQUIRED';
  end if;
  if p_summary_type not in ('medical', 'professional_support') then
    raise exception using errcode = '22023', message = 'INVALID_SUMMARY_TYPE';
  end if;

  v_type_label := case p_summary_type
    when 'medical' then '就醫溝通摘要'
    else '其他健康專業諮詢摘要' end;
  v_disclaimer := case p_summary_type
    when 'medical' then '本摘要依使用者自行記錄的資訊整理，僅供就醫溝通參考，不構成醫療診斷，也不能取代醫療人員的實際評估。'
    else '本摘要整理使用者自行記錄的資訊，不構成醫療診斷，也不能取代專業人員的實際評估。' end;

  if p_summary_type = 'professional_support' then
    if p_target_professional is null then
      raise exception using errcode = '22023', message = 'TARGET_PROFESSIONAL_REQUIRED';
    end if;
    v_target_label := case p_target_professional
      when 'nutritionist' then '營養師'
      when 'psychologist' then '諮商心理師／臨床心理師'
      when 'pharmacist' then '藥師'
      when 'fitness_coach' then '具相關資格的運動教練'
      when 'rehab_physio' then '復健科醫師／物理治療師'
      when 'undecided' then '尚未確定'
      else null end;
    if v_target_label is null then
      raise exception using errcode = '22023', message = 'INVALID_TARGET_PROFESSIONAL';
    end if;
  elsif p_target_professional is not null then
    raise exception using errcode = '22023', message = 'TARGET_PROFESSIONAL_NOT_ALLOWED';
  end if;

  -- Questions: 0-3 trimmed, non-empty, max 200 chars
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' then
    raise exception using errcode = '22023', message = 'INVALID_QUESTIONS';
  end if;
  if jsonb_array_length(p_questions) > 3 then
    raise exception using errcode = '22023', message = 'TOO_MANY_QUESTIONS';
  end if;
  for v_q in select btrim(value) from jsonb_array_elements_text(p_questions) as t(value) loop
    if v_q is null or v_q = '' or char_length(v_q) > 200 then
      raise exception using errcode = '22023', message = 'INVALID_QUESTIONS';
    end if;
    v_questions := v_questions || to_jsonb(v_q);
  end loop;

  -- Idempotency fast path
  select * into v_existing
  from public.health_summaries hs
  where hs.user_id = v_user_id and hs.submission_id = p_submission_id;
  if found then
    return query select v_existing.id, v_existing.version_number, v_existing.status,
      v_existing.summary_type, v_existing.snapshot_content, v_existing.source_record_revision,
      v_existing.latest_track_date, v_existing.source_data_updated_at, v_existing.confirmed_at, false;
    return;
  end if;

  -- Serialize concurrent confirmations for this Event
  select * into v_event
  from public.health_events he
  where he.id = p_health_event_id and he.user_id = v_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'EVENT_NOT_AVAILABLE';
  end if;

  select * into v_ir
  from public.initial_records ir
  where ir.health_event_id = p_health_event_id and ir.user_id = v_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'INITIAL_RECORD_NOT_AVAILABLE';
  end if;

  -- Effective Safety assessment for the current revision is mandatory
  select * into v_safety
  from public.safety_assessments sa
  where sa.health_event_id = p_health_event_id
    and sa.user_id = v_user_id
    and sa.record_revision = v_ir.revision
    and sa.assessment_status = 'completed'
    and sa.result is not null
  order by sa.resolved_at desc nulls last, sa.created_at desc
  limit 1;
  if not found then
    raise exception using errcode = 'P0001', message = 'SAFETY_NOT_AVAILABLE';
  end if;
  v_safety_at := coalesce(v_safety.resolved_at, v_safety.created_at);

  if p_summary_type = 'professional_support' and v_safety.result = 'priority_care' then
    raise exception using errcode = 'P0001', message = 'PROFESSIONAL_SUPPORT_BLOCKED_BY_SAFETY';
  end if;

  select * into v_profile from public.profiles p where p.id = v_user_id;

  -- Selected health-background keys
  select coalesce(array_agg(distinct k), '{}'::text[]) into v_categories
  from unnest(coalesce(p_selected_background_keys, '{}'::text[])) as k;
  foreach v_cat in array v_categories loop
    if v_cat not in ('chronic_conditions', 'allergies', 'medications', 'other_notes') then
      raise exception using errcode = '22023', message = 'INVALID_HEALTH_BACKGROUND_SELECTION';
    end if;
  end loop;

  -- Selected Daily Track IDs (private Notes only; default none)
  select coalesce(array_agg(distinct t), '{}'::uuid[]) into v_track_ids
  from unnest(coalesce(p_selected_track_ids, '{}'::uuid[])) as t;

  if array_length(v_track_ids, 1) is not null then
    select count(*) into v_selected_count
    from public.daily_tracks dt
    where dt.id = any(v_track_ids)
      and dt.health_event_id = p_health_event_id
      and dt.user_id = v_user_id
      and btrim(coalesce(dt.notes, '')) <> '';
    if v_selected_count <> array_length(v_track_ids, 1) then
      raise exception using errcode = '22023', message = 'INVALID_TRACK_SELECTION';
    end if;
  end if;

  -- Trusted source fingerprints across ALL tracks (never filtered by selection)
  select max(dt.track_date), max(dt.updated_at)
  into v_latest_track, v_source_updated
  from public.daily_tracks dt
  where dt.health_event_id = p_health_event_id
    and dt.user_id = v_user_id;

  v_source_updated := greatest(
    v_event.updated_at,
    v_ir.updated_at,
    v_safety_at,
    coalesce(v_source_updated, v_ir.updated_at),
    case when array_length(v_categories, 1) is null then v_ir.updated_at
         else coalesce(v_profile.updated_at, v_ir.updated_at) end
  );

  if p_expected_record_revision is null
     or p_expected_record_revision is distinct from v_ir.revision then
    raise exception using errcode = 'P0001', message = 'SOURCE_CHANGED';
  end if;
  if p_expected_latest_track_date is distinct from v_latest_track then
    raise exception using errcode = 'P0001', message = 'SOURCE_CHANGED';
  end if;
  if p_expected_source_updated_at is null
     or p_expected_source_updated_at is distinct from v_source_updated then
    raise exception using errcode = 'P0001', message = 'SOURCE_CHANGED';
  end if;

  select sc.display_name into v_symptom_label
  from public.symptom_catalog sc where sc.id = v_event.primary_symptom_id;

  -- Trusted suggestion display content from immutable Guide snapshots
  select coalesce(jsonb_object_agg(s.value->>'code', jsonb_build_object(
           'title', s.value->>'title', 'description', s.value->>'description')), '{}'::jsonb)
  into v_suggestion_map
  from public.guides g
  cross join lateral jsonb_array_elements(g.suggestions_snapshot) as s(value)
  where g.health_event_id = p_health_event_id and g.user_id = v_user_id
    and s.value->>'code' is not null;

  -- Positive Safety warnings with locked labels
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', a.key,
           'label', case a.key
             when 'severe_breathing_difficulty' then '明顯呼吸困難'
             when 'significant_chest_discomfort' then '明顯胸悶或胸痛'
             when 'stroke_warning_signs' then '疑似中風徵兆（臉部歪斜、單側無力、說話困難）'
             when 'consciousness_change' then '意識改變或昏厥'
             when 'other_emergency_signs' then '其他需要立即處理的緊急徵兆'
             else a.key end)
         order by a.key), '[]'::jsonb)
  into v_warnings
  from jsonb_each(v_safety.answers_snapshot) as a(key, value)
  where a.value = 'true'::jsonb;

  -- ALL Daily Tracks for trusted trend content (notes excluded here)
  select coalesce(jsonb_agg(jsonb_build_object(
           'track_id', dt.id,
           'track_date', dt.track_date,
           'severity', dt.severity,
           'frequency_level', dt.frequency_level,
           'frequency_label', case dt.frequency_level
             when 1 then '目前沒有發生' when 2 then '偶爾出現' when 3 then '反覆出現'
             when 4 then '多數時間出現' when 5 then '幾乎一直發生' else null end,
           'frequency_description', dt.frequency_description,
           'subjective_change', dt.subjective_change,
           'subjective_change_label', case dt.subjective_change
             when 'much_better' then '改善很多' when 'slightly_better' then '好一點'
             when 'no_clear_change' then '差不多' when 'slightly_worse' then '差一點'
             when 'much_worse' then '加重' else dt.subjective_change end,
           'life_context', dt.life_context,
           'actions_tried', (
             select coalesce(jsonb_agg(jsonb_build_object(
                      'code', c.value,
                      'title', coalesce(v_suggestion_map->c.value->>'title', c.value),
                      'description', v_suggestion_map->c.value->>'description')
                    order by c.ordinality), '[]'::jsonb)
             from jsonb_array_elements_text(dt.suggestion_execution) with ordinality as c(value, ordinality)
           ))
         order by dt.track_date), '[]'::jsonb)
  into v_tracks
  from public.daily_tracks dt
  where dt.health_event_id = p_health_event_id
    and dt.user_id = v_user_id;

  -- Only explicitly selected private Notes
  select coalesce(jsonb_agg(jsonb_build_object(
           'track_id', dt.id,
           'track_date', dt.track_date,
           'notes', dt.notes)
         order by dt.track_date), '[]'::jsonb)
  into v_notes
  from public.daily_tracks dt
  where dt.health_event_id = p_health_event_id
    and dt.user_id = v_user_id
    and dt.id = any(v_track_ids);

  -- Selected health background only
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', c,
           'label', case c
             when 'chronic_conditions' then '慢性病或長期健康狀況'
             when 'allergies' then '過敏史'
             when 'medications' then '目前用藥或保健品'
             else '其他補充' end,
           'content', coalesce(v_profile.health_background -> c, '""'::jsonb))
         order by c), '[]'::jsonb)
  into v_background
  from unnest(v_categories) as c;

  v_snapshot := jsonb_build_object(
    'schema_version', v_schema_version,
    'summary_type', p_summary_type,
    'summary_type_label', v_type_label,
    'disclaimer', v_disclaimer,
    'questions', v_questions,
    'target_professional', case when p_target_professional is null then null
      else jsonb_build_object('value', p_target_professional, 'label', v_target_label) end,
    'event', jsonb_build_object(
      'health_event_id', v_event.id,
      'started_on', v_event.started_on,
      'status', v_event.status,
      'primary_symptom_label', coalesce(v_event.custom_primary_symptom, v_symptom_label),
      'custom_primary_symptom', v_event.custom_primary_symptom),
    'initial_record', jsonb_build_object(
      'revision', v_ir.revision,
      'severity', v_ir.severity,
      'frequency_level', v_ir.frequency_level,
      'frequency_label', case v_ir.frequency_level
        when 1 then '目前沒有發生' when 2 then '偶爾出現' when 3 then '反覆出現'
        when 4 then '多數時間出現' when 5 then '幾乎一直發生' else null end,
      'frequency_description', v_ir.frequency_description,
      'duration_value', v_ir.duration_value,
      'duration_unit', v_ir.duration_unit,
      'duration_unit_label', case v_ir.duration_unit
        when 'minutes' then '分鐘' when 'hours' then '小時' when 'days' then '天'
        when 'weeks' then '週' when 'months' then '個月' else v_ir.duration_unit end,
      'associated_symptoms', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'label', coalesce(item.value->>'custom_text',
                   (select sc.display_name from public.symptom_catalog sc
                     where sc.id = (item.value->>'symptom_id')::uuid)))
               order by item.ordinality), '[]'::jsonb)
        from jsonb_array_elements(v_ir.associated_symptoms) with ordinality as item(value, ordinality)),
      'life_context', v_ir.life_context,
      'supplemental_description', v_ir.supplemental_description),
    'life_context_labels', jsonb_build_object(
      'sleep', '睡眠', 'diet', '飲食', 'activity', '活動', 'stress', '壓力'),
    'daily_tracks', v_tracks,
    'selected_track_notes', v_notes,
    'latest_track_date', v_latest_track,
    'safety', jsonb_build_object(
      'safety_assessment_id', v_safety.id,
      'result', v_safety.result,
      'result_label', case v_safety.result
        when 'normal' then '本次未回報需要優先處理的警訊'
        when 'attention' then '本次有需要留意的狀況'
        when 'priority_care' then '目前有需要優先尋求醫療協助的訊號'
        else v_safety.result end,
      'assessed_at', v_safety_at,
      'assessed_on', (v_safety_at at time zone 'Asia/Taipei')::date,
      'rule_version', v_safety.rule_version,
      'record_revision', v_safety.record_revision,
      'warnings', v_warnings),
    'health_background', v_background,
    'generated_at', now()
  );

  select coalesce(max(hs.version_number), 0) + 1 into v_next_version
  from public.health_summaries hs
  where hs.health_event_id = p_health_event_id and hs.summary_type = p_summary_type;

  insert into public.health_summaries (
    user_id, health_event_id, summary_type, status, snapshot_content,
    source_record_revision, latest_track_date, source_data_updated_at,
    confirmed_at, version_number, submission_id
  )
  values (
    v_user_id, p_health_event_id, p_summary_type, 'ready', v_snapshot,
    v_ir.revision, v_latest_track, v_source_updated,
    now(), v_next_version, p_submission_id
  )
  on conflict (user_id, submission_id) where submission_id is not null
  do nothing
  returning * into v_new;

  if v_new.id is null then
    select * into v_existing
    from public.health_summaries hs
    where hs.user_id = v_user_id and hs.submission_id = p_submission_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'CONFIRMATION_CONFLICT';
    end if;
    return query select v_existing.id, v_existing.version_number, v_existing.status,
      v_existing.summary_type, v_existing.snapshot_content, v_existing.source_record_revision,
      v_existing.latest_track_date, v_existing.source_data_updated_at, v_existing.confirmed_at, false;
    return;
  end if;

  return query select v_new.id, v_new.version_number, v_new.status, v_new.summary_type,
    v_new.snapshot_content, v_new.source_record_revision, v_new.latest_track_date,
    v_new.source_data_updated_at, v_new.confirmed_at, true;
end;
$$;

revoke all on function public.confirm_health_summary(uuid, text, uuid, integer, timestamptz, date, text[], uuid[], text, jsonb) from public, anon;
grant execute on function public.confirm_health_summary(uuid, text, uuid, integer, timestamptz, date, text[], uuid[], text, jsonb) to authenticated;