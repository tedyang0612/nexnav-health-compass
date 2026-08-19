-- A. Guide Template table
CREATE TABLE public.guide_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_code text NOT NULL REFERENCES public.symptom_catalog(code) ON UPDATE CASCADE ON DELETE RESTRICT,
  template_code text NOT NULL,
  template_version text NOT NULL,
  content jsonb NOT NULL,
  suggestions jsonb NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guide_templates_code_version_unique UNIQUE (template_code, template_version),
  CONSTRAINT guide_templates_template_code_format CHECK (template_code ~ '^[a-z0-9_]+$'),
  CONSTRAINT guide_templates_template_version_length CHECK (char_length(btrim(template_version)) BETWEEN 1 AND 20),
  CONSTRAINT guide_templates_content_object CHECK (jsonb_typeof(content) = 'object'),
  CONSTRAINT guide_templates_content_no_sources_key CHECK (NOT (content ? 'sources')),
  CONSTRAINT guide_templates_suggestions_array CHECK (
    jsonb_typeof(suggestions) = 'array'
    AND jsonb_array_length(suggestions) BETWEEN 2 AND 3
  ),
  CONSTRAINT guide_templates_sources_array CHECK (jsonb_typeof(sources) = 'array')
);

CREATE UNIQUE INDEX guide_templates_one_active_per_symptom
  ON public.guide_templates (symptom_code)
  WHERE is_active;

CREATE INDEX guide_templates_active_lookup
  ON public.guide_templates (symptom_code, is_active);

GRANT SELECT ON public.guide_templates TO authenticated;
GRANT ALL ON public.guide_templates TO service_role;

ALTER TABLE public.guide_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY guide_templates_select_active
  ON public.guide_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- B. Atomic Guide creation RPC
CREATE OR REPLACE FUNCTION public.create_guide_for_event(p_health_event_id uuid)
RETURNS TABLE(
  guide_id uuid,
  version_number integer,
  record_revision integer,
  safety_assessment_id uuid,
  template_code text,
  template_version text,
  content_snapshot jsonb,
  suggestions_snapshot jsonb,
  created_new boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_event_status text;
  v_symptom_id uuid;
  v_symptom_code text;
  v_revision integer;
  v_safety_id uuid;
  v_safety_result text;
  v_template public.guide_templates%rowtype;
  v_existing public.guides%rowtype;
  v_next_version integer;
  v_content_snapshot jsonb;
  v_new_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required';
  end if;

  if p_health_event_id is null then
    raise exception using errcode = '22023', message = 'Health Event is required';
  end if;

  -- Lock the owned Event row: serializes concurrent Guide creation for this Event.
  select he.status, he.primary_symptom_id
    into v_event_status, v_symptom_id
  from public.health_events he
  where he.id = p_health_event_id
    and he.user_id = v_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'Health Event not available';
  end if;

  if v_event_status <> 'active' then
    raise exception using errcode = 'P0001', message = 'Guide requires an active Health Event';
  end if;

  -- Current revision: exactly one Initial Record per Event (UNIQUE health_event_id).
  select ir.revision
    into v_revision
  from public.initial_records ir
  where ir.health_event_id = p_health_event_id
    and ir.user_id = v_user_id;

  if v_revision is null then
    raise exception using errcode = 'P0001', message = 'Initial Record not available';
  end if;

  -- Latest completed Safety Assessment for the current revision.
  select sa.id, sa.result
    into v_safety_id, v_safety_result
  from public.safety_assessments sa
  where sa.health_event_id = p_health_event_id
    and sa.user_id = v_user_id
    and sa.record_revision = v_revision
    and sa.assessment_status = 'completed'
  order by sa.resolved_at desc, sa.created_at desc
  limit 1;

  if v_safety_id is null then
    raise exception using errcode = 'P0001', message = 'Completed Safety Assessment is required';
  end if;

  if v_safety_result is distinct from 'normal' then
    raise exception using errcode = 'P0001', message = 'Guide requires a normal Safety result';
  end if;

  -- Safety validated first; only then may an existing Guide be returned.
  select g.*
    into v_existing
  from public.guides g
  where g.health_event_id = p_health_event_id
    and g.user_id = v_user_id
    and g.record_revision = v_revision
  order by g.version_number desc
  limit 1;

  if found then
    return query
    select v_existing.id, v_existing.version_number, v_existing.record_revision,
           v_existing.safety_assessment_id, v_existing.template_code,
           v_existing.template_version, v_existing.content_snapshot,
           v_existing.suggestions_snapshot, false;
    return;
  end if;

  select sc.code
    into v_symptom_code
  from public.symptom_catalog sc
  where sc.id = v_symptom_id;

  if v_symptom_code is null then
    raise exception using errcode = 'P0001', message = 'Primary Symptom not available';
  end if;

  select gt.*
    into v_template
  from public.guide_templates gt
  where gt.symptom_code = v_symptom_code
    and gt.is_active = true
  limit 1;

  if not found then
    raise exception using errcode = 'P0001', message = 'Approved Guide template not available';
  end if;

  select coalesce(max(g.version_number), 0) + 1
    into v_next_version
  from public.guides g
  where g.health_event_id = p_health_event_id;

  v_content_snapshot := v_template.content || jsonb_build_object('sources', v_template.sources);

  insert into public.guides (
    user_id, health_event_id, safety_assessment_id, record_revision,
    version_number, content_snapshot, suggestions_snapshot,
    template_code, template_version
  )
  values (
    v_user_id, p_health_event_id, v_safety_id, v_revision,
    v_next_version, v_content_snapshot, v_template.suggestions,
    v_template.template_code, v_template.template_version
  )
  returning id into v_new_id;

  return query
  select v_new_id, v_next_version, v_revision, v_safety_id,
         v_template.template_code, v_template.template_version,
         v_content_snapshot, v_template.suggestions, true;
end
$function$;

REVOKE ALL ON FUNCTION public.create_guide_for_event(uuid) FROM public;
REVOKE ALL ON FUNCTION public.create_guide_for_event(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_guide_for_event(uuid) TO authenticated;