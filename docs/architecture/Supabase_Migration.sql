-- NexNav MVP — Supabase Foundation Migration
-- Version: v1.0
-- Scope: Day 2 foundation (9 P0 tables, constraints, indexes, Auth profile trigger, RLS)
-- Source of Truth: 03_Database_Schema.md v1.0
-- Note: Module-specific RPC functions are added with their Screen Spec implementation.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birth_year smallint,
  gender text,
  health_background jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(btrim(display_name)) between 1 and 50
  ),
  constraint profiles_birth_year_sanity check (
    birth_year is null or birth_year between 1900 and extract(year from current_date)::smallint
  ),
  constraint profiles_gender_allowed check (
    gender is null or gender in ('male','female','non_binary','other','prefer_not_to_say')
  ),
  constraint profiles_health_background_object check (
    jsonb_typeof(health_background) = 'object'
  ),
  constraint profiles_onboarding_consistency check (
    onboarding_completed = false
    or (
      display_name is not null
      and birth_year is not null
      and gender is not null
      and onboarding_completed_at is not null
    )
  )
);

create table public.symptom_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category_code text not null,
  category_name text not null,
  display_name text not null,
  description text,
  is_primary_enabled boolean not null default true,
  is_hero_group boolean not null default false,
  is_other boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint symptom_catalog_code_format check (code ~ '^[a-z0-9_]+$'),
  constraint symptom_catalog_category_code_length check (char_length(category_code) between 1 and 50),
  constraint symptom_catalog_category_name_length check (char_length(category_name) between 1 and 50),
  constraint symptom_catalog_display_name_length check (char_length(display_name) between 1 and 100),
  constraint symptom_catalog_description_length check (description is null or char_length(description) <= 500),
  constraint symptom_catalog_display_order_nonnegative check (display_order >= 0)
);

create table public.health_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  primary_symptom_id uuid not null references public.symptom_catalog(id) on delete restrict,
  custom_primary_symptom text,
  status text not null default 'active',
  started_on date not null default (timezone('Asia/Taipei', now()))::date,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_events_id_user_unique unique (id, user_id),
  constraint health_events_status_allowed check (status in ('active','closed')),
  constraint health_events_custom_primary_length check (
    custom_primary_symptom is null or char_length(btrim(custom_primary_symptom)) between 1 and 100
  ),
  constraint health_events_status_closed_at_consistency check (
    (status = 'active' and closed_at is null)
    or (status = 'closed' and closed_at is not null)
  )
);

create table public.initial_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_event_id uuid not null unique,
  severity smallint not null,
  frequency_level smallint not null,
  frequency_description text,
  duration_value integer not null,
  duration_unit text not null,
  associated_symptoms jsonb not null default '[]'::jsonb,
  life_context jsonb not null,
  supplemental_description text,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint initial_records_event_owner_fk
    foreign key (health_event_id, user_id)
    references public.health_events(id, user_id) on delete cascade,
  constraint initial_records_severity_range check (severity between 1 and 10),
  constraint initial_records_frequency_range check (frequency_level between 1 and 5),
  constraint initial_records_frequency_description_length check (
    frequency_description is null or char_length(frequency_description) <= 200
  ),
  constraint initial_records_duration_positive check (duration_value > 0),
  constraint initial_records_duration_unit_allowed check (
    duration_unit in ('minutes','hours','days','weeks','months')
  ),
  constraint initial_records_associated_symptoms_array check (
    jsonb_typeof(associated_symptoms) = 'array'
  ),
  constraint initial_records_life_context_shape check (
    jsonb_typeof(life_context) = 'object'
    and life_context ?& array['sleep','diet','activity','stress']
  ),
  constraint initial_records_supplemental_length check (
    supplemental_description is null or char_length(supplemental_description) <= 1000
  ),
  constraint initial_records_revision_positive check (revision > 0)
);

create table public.safety_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_event_id uuid not null,
  source_daily_track_id uuid,
  trigger_type text not null,
  record_revision integer not null,
  assessment_status text not null default 'in_progress',
  answers_snapshot jsonb not null default '{}'::jsonb,
  result text,
  rule_version text not null,
  failure_reason text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint safety_assessments_id_event_user_unique unique (id, health_event_id, user_id),
  constraint safety_assessments_event_owner_fk
    foreign key (health_event_id, user_id)
    references public.health_events(id, user_id) on delete cascade,
  constraint safety_assessments_trigger_allowed check (
    trigger_type in ('event_created','initial_record_updated','daily_track_recheck','manual_retry')
  ),
  constraint safety_assessments_revision_positive check (record_revision > 0),
  constraint safety_assessments_status_allowed check (
    assessment_status in ('in_progress','completed','failed')
  ),
  constraint safety_assessments_result_allowed check (
    result is null or result in ('normal','attention','priority_care')
  ),
  constraint safety_assessments_failure_length check (
    failure_reason is null or char_length(failure_reason) <= 1000
  ),
  constraint safety_assessments_resolution_consistency check (
    (assessment_status = 'in_progress' and result is null and failure_reason is null and resolved_at is null)
    or (assessment_status = 'completed' and result is not null and failure_reason is null and resolved_at is not null)
    or (assessment_status = 'failed' and result is null and failure_reason is not null and resolved_at is not null)
  ),
  constraint safety_assessments_track_trigger_consistency check (
    (trigger_type = 'daily_track_recheck' and source_daily_track_id is not null)
    or (trigger_type <> 'daily_track_recheck' and source_daily_track_id is null)
  )
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_event_id uuid not null,
  safety_assessment_id uuid not null,
  record_revision integer not null,
  version_number integer not null,
  content_snapshot jsonb not null,
  suggestions_snapshot jsonb not null,
  template_code text not null,
  template_version text not null,
  created_at timestamptz not null default now(),
  constraint guides_id_event_user_unique unique (id, health_event_id, user_id),
  constraint guides_event_version_unique unique (health_event_id, version_number),
  constraint guides_event_owner_fk
    foreign key (health_event_id, user_id)
    references public.health_events(id, user_id) on delete cascade,
  constraint guides_safety_same_event_fk
    foreign key (safety_assessment_id, health_event_id, user_id)
    references public.safety_assessments(id, health_event_id, user_id) on delete restrict,
  constraint guides_revision_positive check (record_revision > 0),
  constraint guides_version_positive check (version_number > 0),
  constraint guides_content_object check (jsonb_typeof(content_snapshot) = 'object'),
  constraint guides_suggestions_array check (
    jsonb_typeof(suggestions_snapshot) = 'array'
    and jsonb_array_length(suggestions_snapshot) between 2 and 3
  ),
  constraint guides_template_code_length check (char_length(template_code) between 1 and 100),
  constraint guides_template_version_length check (char_length(template_version) between 1 and 50)
);

create table public.daily_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_event_id uuid not null,
  guide_id uuid,
  track_date date not null default (timezone('Asia/Taipei', now()))::date,
  severity smallint not null,
  frequency_level smallint not null,
  frequency_description text,
  subjective_change text not null,
  life_context jsonb not null,
  suggestion_execution jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_tracks_id_event_user_unique unique (id, health_event_id, user_id),
  constraint daily_tracks_event_date_unique unique (health_event_id, track_date),
  constraint daily_tracks_event_owner_fk
    foreign key (health_event_id, user_id)
    references public.health_events(id, user_id) on delete cascade,
  constraint daily_tracks_guide_same_event_fk
    foreign key (guide_id, health_event_id, user_id)
    references public.guides(id, health_event_id, user_id) on delete set null (guide_id),
  constraint daily_tracks_severity_range check (severity between 1 and 10),
  constraint daily_tracks_frequency_range check (frequency_level between 1 and 5),
  constraint daily_tracks_frequency_description_length check (
    frequency_description is null or char_length(frequency_description) <= 200
  ),
  constraint daily_tracks_subjective_change_allowed check (
    subjective_change in ('much_better','slightly_better','no_clear_change','slightly_worse','much_worse')
  ),
  constraint daily_tracks_life_context_shape check (
    jsonb_typeof(life_context) = 'object'
    and life_context ?& array['sleep','diet','activity','stress']
  ),
  constraint daily_tracks_suggestion_execution_array check (
    jsonb_typeof(suggestion_execution) = 'array'
  ),
  constraint daily_tracks_notes_length check (notes is null or char_length(notes) <= 1000)
);

alter table public.safety_assessments
  add constraint safety_assessments_source_track_same_event_fk
  foreign key (source_daily_track_id, health_event_id, user_id)
  references public.daily_tracks(id, health_event_id, user_id)
  on delete set null (source_daily_track_id);

create table public.navigation_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  symptom_id uuid references public.symptom_catalog(id) on delete restrict,
  navigation_type text not null,
  safety_context text not null,
  title text not null,
  content jsonb not null,
  sources jsonb not null default '[]'::jsonb,
  is_fallback boolean not null default false,
  is_active boolean not null default true,
  version integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint navigation_templates_code_version_unique unique (code, version),
  constraint navigation_templates_type_allowed check (
    navigation_type in ('medical_care','professional_support')
  ),
  constraint navigation_templates_safety_context_allowed check (
    safety_context in ('general','attention','priority_care','fallback')
  ),
  constraint navigation_templates_title_length check (char_length(title) between 1 and 200),
  constraint navigation_templates_content_object check (jsonb_typeof(content) = 'object'),
  constraint navigation_templates_sources_array check (jsonb_typeof(sources) = 'array'),
  constraint navigation_templates_version_positive check (version > 0),
  constraint navigation_templates_priority_medical_only check (
    safety_context <> 'priority_care' or navigation_type = 'medical_care'
  ),
  constraint navigation_templates_medical_sources check (
    navigation_type <> 'medical_care' or jsonb_array_length(sources) > 0
  ),
  constraint navigation_templates_nonfallback_symptom check (
    is_fallback or symptom_id is not null
  )
);

create table public.health_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  health_event_id uuid not null,
  summary_type text not null,
  status text not null default 'draft',
  snapshot_content jsonb not null,
  source_record_revision integer not null,
  latest_track_date date,
  source_data_updated_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_summaries_event_owner_fk
    foreign key (health_event_id, user_id)
    references public.health_events(id, user_id) on delete cascade,
  constraint health_summaries_type_allowed check (
    summary_type in ('medical','professional_support')
  ),
  constraint health_summaries_status_allowed check (status in ('draft','ready')),
  constraint health_summaries_snapshot_object check (jsonb_typeof(snapshot_content) = 'object'),
  constraint health_summaries_source_revision_positive check (source_record_revision > 0),
  constraint health_summaries_status_confirmation_consistency check (
    (status = 'draft' and confirmed_at is null)
    or (status = 'ready' and confirmed_at is not null)
  )
);

-- ---------------------------------------------------------------------------
-- Partial uniqueness and query indexes
-- ---------------------------------------------------------------------------

create unique index symptom_catalog_one_active_other_idx
  on public.symptom_catalog ((is_other))
  where is_other = true and is_active = true;

create index symptom_catalog_active_order_idx
  on public.symptom_catalog (is_active, display_order);

create index health_events_active_dashboard_idx
  on public.health_events (user_id, updated_at desc)
  where status = 'active';

create index health_events_user_history_idx
  on public.health_events (user_id, created_at desc);

create index safety_current_idx
  on public.safety_assessments (health_event_id, record_revision, created_at desc)
  where assessment_status = 'completed';

create index safety_user_event_history_idx
  on public.safety_assessments (user_id, health_event_id, created_at desc);

create index safety_source_track_idx
  on public.safety_assessments (source_daily_track_id)
  where source_daily_track_id is not null;

create index guides_current_idx
  on public.guides (health_event_id, record_revision, version_number desc);

create index guides_user_event_history_idx
  on public.guides (user_id, health_event_id, created_at desc);

create index guides_safety_idx on public.guides (safety_assessment_id);

create index daily_tracks_user_recent_idx
  on public.daily_tracks (user_id, track_date desc);

create index daily_tracks_guide_idx
  on public.daily_tracks (guide_id)
  where guide_id is not null;

create unique index navigation_templates_one_active_code_idx
  on public.navigation_templates (code)
  where is_active = true;

create index navigation_templates_active_lookup_idx
  on public.navigation_templates (symptom_id, navigation_type, safety_context)
  where is_active = true;

create index navigation_templates_fallback_lookup_idx
  on public.navigation_templates (navigation_type, safety_context)
  where is_active = true and is_fallback = true;

create unique index health_summaries_one_draft_idx
  on public.health_summaries (health_event_id, summary_type)
  where status = 'draft';

create index health_summaries_event_history_idx
  on public.health_summaries (health_event_id, created_at desc);

create index health_summaries_user_history_idx
  on public.health_summaries (user_id, created_at desc);

create index health_summaries_ready_idx
  on public.health_summaries (health_event_id, confirmed_at desc)
  where status = 'ready';

-- ---------------------------------------------------------------------------
-- Timestamp triggers
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger symptom_catalog_set_updated_at
before update on public.symptom_catalog
for each row execute function public.set_updated_at();

create trigger health_events_set_updated_at
before update on public.health_events
for each row execute function public.set_updated_at();

create trigger initial_records_set_updated_at
before update on public.initial_records
for each row execute function public.set_updated_at();

create trigger daily_tracks_set_updated_at
before update on public.daily_tracks
for each row execute function public.set_updated_at();

create trigger navigation_templates_set_updated_at
before update on public.navigation_templates
for each row execute function public.set_updated_at();

create trigger health_summaries_set_updated_at
before update on public.health_summaries
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth user -> profile trigger
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Immutability and lifecycle guards
-- ---------------------------------------------------------------------------

create or replace function public.guard_health_event_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.primary_symptom_id is distinct from old.primary_symptom_id
     or new.custom_primary_symptom is distinct from old.custom_primary_symptom
     or new.started_on is distinct from old.started_on
     or new.created_at is distinct from old.created_at then
    raise exception 'Immutable Health Event fields cannot be changed';
  end if;
  if old.status = 'closed' and new.status <> 'closed' then
    raise exception 'Closed Health Event cannot be reopened in P0';
  end if;
  return new;
end;
$$;

create trigger health_events_guard_update
before update on public.health_events
for each row execute function public.guard_health_event_update();

create or replace function public.guard_resolved_safety_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.assessment_status in ('completed','failed') then
    raise exception 'Resolved Safety Assessment is immutable';
  end if;
  return new;
end;
$$;

create trigger safety_assessments_guard_update
before update on public.safety_assessments
for each row execute function public.guard_resolved_safety_update();

create or replace function public.block_guide_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception 'Guide snapshots are immutable';
end;
$$;

create trigger guides_block_update
before update on public.guides
for each row execute function public.block_guide_mutation();

create trigger guides_block_delete
before delete on public.guides
for each row execute function public.block_guide_mutation();

create or replace function public.guard_ready_summary_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.status = 'ready' then
    raise exception 'Ready Summary is immutable';
  end if;
  if old.status = 'draft' and new.status = 'ready' and new.confirmed_at is null then
    new.confirmed_at = now();
  end if;
  return new;
end;
$$;

create trigger health_summaries_guard_update
before update on public.health_summaries
for each row execute function public.guard_ready_summary_update();

create or replace function public.guard_daily_track_write()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  event_status text;
  local_today date := (timezone('Asia/Taipei', now()))::date;
begin
  select status into event_status
  from public.health_events
  where id = new.health_event_id and user_id = new.user_id;

  if event_status is distinct from 'active' then
    raise exception 'Daily Track requires an active Health Event';
  end if;
  if new.track_date <> local_today then
    raise exception 'Only today''s Daily Track can be created or updated';
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.user_id is distinct from old.user_id
       or new.health_event_id is distinct from old.health_event_id
       or new.track_date is distinct from old.track_date
       or new.created_at is distinct from old.created_at
       or new.guide_id is distinct from old.guide_id then
      raise exception 'Immutable Daily Track fields cannot be changed';
    end if;
  end if;
  return new;
end;
$$;

create trigger daily_tracks_guard_write
before insert or update on public.daily_tracks
for each row execute function public.guard_daily_track_write();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.symptom_catalog enable row level security;
alter table public.health_events enable row level security;
alter table public.initial_records enable row level security;
alter table public.safety_assessments enable row level security;
alter table public.guides enable row level security;
alter table public.daily_tracks enable row level security;
alter table public.navigation_templates enable row level security;
alter table public.health_summaries enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using (auth.uid() = id);

create policy profiles_update_own on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy symptoms_select_active on public.symptom_catalog
for select to authenticated using (is_active = true);

create policy health_events_select_own on public.health_events
for select to authenticated using (auth.uid() = user_id);

create policy health_events_insert_own on public.health_events
for insert to authenticated with check (auth.uid() = user_id);

create policy health_events_update_own on public.health_events
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy initial_records_select_own on public.initial_records
for select to authenticated using (auth.uid() = user_id);

create policy initial_records_insert_own on public.initial_records
for insert to authenticated with check (auth.uid() = user_id);

create policy initial_records_update_own on public.initial_records
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy safety_select_own on public.safety_assessments
for select to authenticated using (auth.uid() = user_id);

create policy safety_insert_own on public.safety_assessments
for insert to authenticated with check (auth.uid() = user_id);

create policy safety_update_own_in_progress on public.safety_assessments
for update to authenticated
using (auth.uid() = user_id and assessment_status = 'in_progress')
with check (auth.uid() = user_id);

create policy guides_select_own on public.guides
for select to authenticated using (auth.uid() = user_id);

create policy guides_insert_own on public.guides
for insert to authenticated with check (auth.uid() = user_id);

create policy daily_tracks_select_own on public.daily_tracks
for select to authenticated using (auth.uid() = user_id);

create policy daily_tracks_insert_own on public.daily_tracks
for insert to authenticated with check (auth.uid() = user_id);

create policy daily_tracks_update_own on public.daily_tracks
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy navigation_select_active on public.navigation_templates
for select to authenticated using (is_active = true);

create policy summaries_select_own on public.health_summaries
for select to authenticated using (auth.uid() = user_id);

create policy summaries_insert_own on public.health_summaries
for insert to authenticated with check (auth.uid() = user_id);

create policy summaries_update_own_draft on public.health_summaries
for update to authenticated
using (auth.uid() = user_id and status = 'draft')
with check (auth.uid() = user_id);

-- Explicit table grants; RLS remains the row-level enforcement layer.
grant select, update on public.profiles to authenticated;
grant select on public.symptom_catalog to authenticated;
grant select, insert, update on public.health_events to authenticated;
grant select, insert, update on public.initial_records to authenticated;
grant select, insert, update on public.safety_assessments to authenticated;
grant select, insert on public.guides to authenticated;
grant select, insert, update on public.daily_tracks to authenticated;
grant select on public.navigation_templates to authenticated;
grant select, insert, update on public.health_summaries to authenticated;

commit;

-- End of Day 2 foundation migration.
-- Before production use, load reviewed symptom/navigation seed data and add
-- module-specific RPC functions as Screen Spec input contracts are finalized.
