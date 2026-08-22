-- NexNav B1-B — symptom_catalog approved seed
-- Version: v1.0
-- Source: B1-A_Seed_Content_Definition_v1.0.md
-- Status: REVIEWED DRAFT — DO NOT RUN UNTIL EXPLICITLY APPROVED
-- Scope: Data rows in public.symptom_catalog only
-- No schema, RLS, trigger, constraint, index, function, RPC, Auth, or grant changes.

begin;

-- ---------------------------------------------------------------------------
-- Preflight: never overwrite or deactivate an unexpected active taxonomy.
-- The current audited state is zero rows, but this guard keeps later reruns safe.
-- ---------------------------------------------------------------------------

do $seed_preflight$
declare
  unexpected_active_codes text;
begin
  select string_agg(code, ', ' order by code)
    into unexpected_active_codes
  from public.symptom_catalog
  where is_active = true
    and code not in (
      'headache',
      'dizziness',
      'fatigue',
      'sleep_difficulty',
      'abdominal_gastrointestinal_discomfort',
      'muscle_joint_discomfort',
      'nose_throat_discomfort',
      'other'
    );

  if unexpected_active_codes is not null then
    raise exception
      'B1-B stopped: unexpected active symptom_catalog codes exist: %',
      unexpected_active_codes;
  end if;

  if exists (
    select 1
    from public.symptom_catalog
    where is_active = true
      and is_other = true
      and code <> 'other'
  ) then
    raise exception
      'B1-B stopped: an unexpected active Other row already exists';
  end if;
end
$seed_preflight$;

-- ---------------------------------------------------------------------------
-- Approved 5-category / 7-symptom + Other taxonomy.
-- UUIDs and created_at use the table defaults on first insert.
-- Existing IDs are preserved when an approved code already exists.
-- A true no-op rerun does not fire an update or change updated_at.
-- ---------------------------------------------------------------------------

insert into public.symptom_catalog (
  code,
  category_code,
  category_name,
  display_name,
  description,
  is_primary_enabled,
  is_hero_group,
  is_other,
  is_active,
  display_order
)
values
  (
    'headache',
    'head_balance',
    '頭部與平衡感受',
    '頭痛',
    '頭部出現疼痛、緊繃或壓迫等不適感。',
    true, true, false, true, 10
  ),
  (
    'dizziness',
    'head_balance',
    '頭部與平衡感受',
    '頭暈或不穩感',
    '感覺頭昏、輕飄、不穩，或周遭有旋轉感。',
    true, false, false, true, 20
  ),
  (
    'fatigue',
    'energy_sleep',
    '精力與睡眠',
    '疲倦或精神不濟',
    '感覺容易疲倦、精神不濟，或進行日常活動時比平常更容易感到耗力。',
    true, true, false, true, 30
  ),
  (
    'sleep_difficulty',
    'energy_sleep',
    '精力與睡眠',
    '睡眠困擾',
    '包含難以入睡、容易醒來、過早醒來或睡眠品質不佳。',
    true, true, false, true, 40
  ),
  (
    'abdominal_gastrointestinal_discomfort',
    'digestive_abdominal',
    '消化與腹部',
    '腹部或腸胃不適',
    '腹部出現疼痛、脹悶、噁心、消化不適或排便狀況改變等感受。',
    true, false, false, true, 50
  ),
  (
    'muscle_joint_discomfort',
    'musculoskeletal',
    '肌肉與關節',
    '肌肉或關節不適',
    '肌肉或關節出現痠痛、僵硬、緊繃或活動時不舒服的感受；可在補充描述中記錄部位。',
    true, false, false, true, 60
  ),
  (
    'nose_throat_discomfort',
    'nose_throat',
    '鼻子與喉嚨',
    '鼻子或喉嚨不適',
    '包含鼻塞、流鼻水、鼻子不舒服、喉嚨疼痛或刺激感；請以目前最困擾的感受進行評分，其他感受可填入相關症狀。',
    true, false, false, true, 70
  ),
  (
    'other',
    'other',
    '其他',
    '其他不適',
    '若上述選項不符合，可自行描述目前最主要的不適。',
    true, false, true, true, 999
  )
on conflict (code) do update
set
  category_code = excluded.category_code,
  category_name = excluded.category_name,
  display_name = excluded.display_name,
  description = excluded.description,
  is_primary_enabled = excluded.is_primary_enabled,
  is_hero_group = excluded.is_hero_group,
  is_other = excluded.is_other,
  is_active = excluded.is_active,
  display_order = excluded.display_order
where row(
  symptom_catalog.category_code,
  symptom_catalog.category_name,
  symptom_catalog.display_name,
  symptom_catalog.description,
  symptom_catalog.is_primary_enabled,
  symptom_catalog.is_hero_group,
  symptom_catalog.is_other,
  symptom_catalog.is_active,
  symptom_catalog.display_order
) is distinct from row(
  excluded.category_code,
  excluded.category_name,
  excluded.display_name,
  excluded.description,
  excluded.is_primary_enabled,
  excluded.is_hero_group,
  excluded.is_other,
  excluded.is_active,
  excluded.display_order
);

-- ---------------------------------------------------------------------------
-- Transactional assertions. Any failure rolls back the complete seed load.
-- ---------------------------------------------------------------------------

do $seed_verify$
declare
  approved_active_count integer;
  all_active_count integer;
  active_other_count integer;
  active_hero_count integer;
  health_category_count integer;
begin
  select count(*)
    into approved_active_count
  from public.symptom_catalog
  where is_active = true
    and code in (
      'headache',
      'dizziness',
      'fatigue',
      'sleep_difficulty',
      'abdominal_gastrointestinal_discomfort',
      'muscle_joint_discomfort',
      'nose_throat_discomfort',
      'other'
    );

  select count(*)
    into all_active_count
  from public.symptom_catalog
  where is_active = true;

  select count(*)
    into active_other_count
  from public.symptom_catalog
  where is_active = true
    and is_other = true
    and code = 'other';

  select count(*)
    into active_hero_count
  from public.symptom_catalog
  where is_active = true
    and is_hero_group = true
    and code in ('headache', 'fatigue', 'sleep_difficulty');

  select count(distinct category_code)
    into health_category_count
  from public.symptom_catalog
  where is_active = true
    and is_other = false;

  if approved_active_count <> 8 or all_active_count <> 8 then
    raise exception
      'B1-B verification failed: expected exactly 8 approved active rows';
  end if;

  if active_other_count <> 1 then
    raise exception
      'B1-B verification failed: expected exactly one active Other row';
  end if;

  if active_hero_count <> 3 then
    raise exception
      'B1-B verification failed: expected exactly three approved Hero rows';
  end if;

  if health_category_count <> 5 then
    raise exception
      'B1-B verification failed: expected exactly five health categories';
  end if;

  if exists (
    select 1
    from public.symptom_catalog
    where is_active = true
      and is_primary_enabled = false
  ) then
    raise exception
      'B1-B verification failed: every approved active row must be primary-enabled';
  end if;
end
$seed_verify$;

-- Review result returned by the SQL Editor after a successful transaction.
select
  code,
  category_code,
  category_name,
  display_name,
  is_primary_enabled,
  is_hero_group,
  is_other,
  is_active,
  display_order
from public.symptom_catalog
where is_active = true
order by display_order, code;

commit;

