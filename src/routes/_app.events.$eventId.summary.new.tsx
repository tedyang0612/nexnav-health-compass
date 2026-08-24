import { useMemo, useRef, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ErrorState,
  FormField,
  LoadingState,
  PageContainer,
  PageHeader,
  PrimaryCta,
  SectionCard,
  StatusBanner,
} from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FieldError } from "@/components/events/FieldError";
import { UnsavedChangesGuard } from "@/components/profile/UnsavedChangesGuard";
import { SummarySnapshotView } from "@/components/summary/SummarySnapshotView";
import { sourceFingerprint, useSummarySource, type SummarySource } from "@/hooks/useSummarySource";
import {
  backgroundContentToText,
  DURATION_UNIT_LABELS,
  formatTaipeiDate,
  frequencyLabel,
  HEALTH_BACKGROUND_KEYS,
  normalizeQuestions,
  QUESTION_MAX_COUNT,
  QUESTION_MAX_LENGTH,
  subjectiveLabel,
  summaryErrorMessage,
  SUMMARY_DISCLAIMER,
  SUMMARY_TYPE_DESCRIPTION,
  SUMMARY_TYPE_LABEL,
  TARGET_PROFESSIONALS,
  validateQuestions,
  type HealthBackgroundKey,
  type SummarySnapshot,
  type SummaryType,
  type TargetProfessional,
} from "@/lib/summary";

type SummarySearch = { type?: "medical" | "professional" };

const TARGET_ERROR = "請選擇想諮詢的對象，或選擇「尚未確定」。";
const SOURCE_CHANGED_MESSAGE = "來源紀錄已更新，請重新產生預覽並再次確認。";

export const Route = createFileRoute("/_app/events/$eventId/summary/new")({
  validateSearch: (search: Record<string, unknown>): SummarySearch =>
    search["type"] === "professional" || search["type"] === "medical"
      ? { type: search["type"] }
      : {},
  head: () => ({
    meta: [
      { title: "建立摘要 — NexNav" },
      { name: "description", content: "整理你的紀錄，準備與醫療或健康專業人員溝通。" },
      { property: "og:title", content: "建立摘要 — NexNav" },
      { property: "og:description", content: "整理你的紀錄，準備與醫療或健康專業人員溝通。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function useExistingSummaries(eventId: string) {
  return useQuery({
    queryKey: ["health-summaries", eventId],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_summaries")
        .select("id, summary_type, version_number, confirmed_at, created_at")
        .eq("health_event_id", eventId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function Page() {
  const { eventId } = Route.useParams();
  const search = Route.useSearch();
  const summaryType: SummaryType | null =
    search.type === "professional"
      ? "professional_support"
      : search.type === "medical"
        ? "medical"
        : null;

  if (!summaryType) return <SelectionPage eventId={eventId} />;
  return <BuilderPage key={summaryType} eventId={eventId} summaryType={summaryType} />;
}

/* ---------- 未指定類型：兩張卡片的選擇頁 ---------- */

function SelectionPage({ eventId }: { eventId: string }) {
  const summaries = useExistingSummaries(eventId);
  const sourceQuery = useSummarySource(eventId);

  if (sourceQuery.isLoading) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="建立摘要" />
        <LoadingState label="正在確認可建立的摘要類型…" />
      </PageContainer>
    );
  }

  if (sourceQuery.isError || !sourceQuery.data) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="建立摘要" />
        <ErrorState onRetry={() => void sourceQuery.refetch()} />
      </PageContainer>
    );
  }

  const types: SummaryType[] =
    sourceQuery.data.safety?.result === "priority_care"
      ? ["medical"]
      : ["medical", "professional_support"];

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="建立摘要" description="選擇你這次想準備的摘要類型。" />

      <div className={types.length === 1 ? "grid max-w-xl gap-4" : "grid gap-4 md:grid-cols-2"}>
        {types.map((type) => (
          <SectionCard
            key={type}
            title={SUMMARY_TYPE_LABEL[type]}
            description={
              type === "professional_support" ? (
                <>
                  <span className="block">整理生活狀況、已嘗試的調整與追蹤紀錄，</span>
                  <span className="mt-3 block">方便與其他健康專業人員討論。</span>
                </>
              ) : (
                SUMMARY_TYPE_DESCRIPTION[type]
              )
            }
            footer={
              <Button asChild className="min-h-11 w-full sm:w-auto">
                <Link
                  to="/events/$eventId/summary/new"
                  params={{ eventId }}
                  search={{ type: type === "medical" ? "medical" : "professional" }}
                >
                  建立{SUMMARY_TYPE_LABEL[type]}
                </Link>
              </Button>
            }
          />
        ))}
      </div>

      <ExistingSummaries query={summaries} />
    </PageContainer>
  );
}

function ExistingSummaries({ query }: { query: ReturnType<typeof useExistingSummaries> }) {
  const rows = query.data ?? [];
  if (rows.length === 0) return null;
  return (
    <SectionCard title="已建立的摘要">
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {SUMMARY_TYPE_LABEL[row.summary_type as SummaryType] ?? row.summary_type}
                {row.version_number ? ` v${row.version_number}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                確認日期：{formatTaipeiDate(row.confirmed_at ?? row.created_at)}
              </p>
            </div>
            <Button asChild variant="outline" className="min-h-11 sm:w-auto">
              <Link to="/summaries/$summaryId" params={{ summaryId: row.id }}>
                檢視
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* ---------- 指定類型：Builder ＋ Preview ---------- */

function BuilderPage({ eventId, summaryType }: { eventId: string; summaryType: SummaryType }) {
  const navigate = useNavigate();
  const query = useSummarySource(eventId);
  const summaries = useExistingSummaries(eventId);

  const [backgroundKeys, setBackgroundKeys] = useState<HealthBackgroundKey[]>([]);
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [target, setTarget] = useState<TargetProfessional | "">("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [dirty, setDirty] = useState(false);
  const [stage, setStage] = useState<"build" | "preview">("build");
  const [submissionId] = useState(() => crypto.randomUUID());
  const [previewFingerprint, setPreviewFingerprint] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | undefined>(undefined);
  const [questionError, setQuestionError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [sourceChanged, setSourceChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const targetSectionRef = useRef<HTMLDivElement | null>(null);
  const submitLockRef = useRef(false);
  const successNavigationRef = useRef(false);

  const source = query.data;
  const notesTracks = useMemo(
    () =>
      (source?.tracks ?? [])
        .filter((t) => (t.notes ?? "").trim().length > 0)
        .slice()
        .sort((a, b) => b.track_date.localeCompare(a.track_date)),
    [source],
  );
  const fingerprint = useMemo(
    () => (source ? sourceFingerprint(source, backgroundKeys) : null),
    [source, backgroundKeys],
  );

  if (query.isLoading) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title={SUMMARY_TYPE_LABEL[summaryType]} />
        <LoadingState label="正在整理你的紀錄…" />
      </PageContainer>
    );
  }

  if (query.isError || !source) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title={SUMMARY_TYPE_LABEL[summaryType]} />
        <ErrorState onRetry={() => void query.refetch()} />
      </PageContainer>
    );
  }

  const safety = source.safety;

  if (!safety) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title={SUMMARY_TYPE_LABEL[summaryType]} />
        <StatusBanner
          tone="attention"
          title="需要先完成最新的安全確認"
          description="請先回到安全確認頁完成一次確認，之後就能建立摘要。"
          actions={
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => void navigate({ to: "/events/$eventId/safety", params: { eventId } })}
            >
              前往安全確認
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (summaryType === "professional_support" && safety.result === "priority_care") {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title={SUMMARY_TYPE_LABEL[summaryType]} />
        <StatusBanner
          tone="attention"
          title="目前建議優先尋求醫療協助"
          description="依最新的安全確認結果，這個時候先準備醫療溝通摘要會比較合適。"
          actions={
            <Button
              className="min-h-11"
              onClick={() =>
                void navigate({
                  to: "/events/$eventId/summary/new",
                  params: { eventId },
                  search: { type: "medical" },
                })
              }
            >
              改為建立醫療溝通摘要
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const previewSnapshot = buildPreviewSnapshot(source, {
    summaryType,
    backgroundKeys,
    trackIds,
    target,
    questions,
  });

  function markDirty() {
    setDirty(true);
  }

  function toggleBackground(key: HealthBackgroundKey, checked: boolean) {
    markDirty();
    setBackgroundKeys((prev) =>
      checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key),
    );
  }

  function toggleTrack(id: string, checked: boolean) {
    markDirty();
    setTrackIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((t) => t !== id)));
  }

  function goPreview() {
    if (summaryType === "professional_support" && !target) {
      setTargetError(TARGET_ERROR);
      targetSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const first = targetSectionRef.current?.querySelector<HTMLElement>("button[role='radio']");
      first?.focus();
      return;
    }
    const error = validateQuestions(questions);
    if (error) {
      setQuestionError(error);
      return;
    }
    setQuestionError(undefined);
    setSubmitError(undefined);
    setSourceChanged(false);
    setPreviewFingerprint(fingerprint);
    setStage("preview");
  }

  async function regeneratePreview() {
    const next = await query.refetch();
    setSubmitError(undefined);
    setSourceChanged(false);
    setPreviewFingerprint(
      next.data ? sourceFingerprint(next.data, backgroundKeys) : (fingerprint ?? null),
    );
  }

  async function confirm() {
    if (!source || !fingerprint || submitLockRef.current) return;
    if (previewFingerprint && previewFingerprint !== fingerprint) {
      setSourceChanged(true);
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitError(undefined);

    const { data, error } = await supabase.rpc("confirm_health_summary", {
      p_health_event_id: eventId,
      p_summary_type: summaryType,
      p_submission_id: submissionId,
      p_expected_record_revision: source.initialRecord.revision,
      p_expected_source_updated_at: fingerprint,
      ...(source.latestTrackDate ? { p_expected_latest_track_date: source.latestTrackDate } : {}),
      p_selected_background_keys: backgroundKeys,
      p_selected_track_ids: trackIds,
      ...(summaryType === "professional_support" && target
        ? { p_target_professional: target }
        : {}),
      p_questions: normalizeQuestions(questions),
    });

    if (error || !data || data.length === 0) {
      submitLockRef.current = false;
      setSubmitting(false);
      const message = typeof error?.message === "string" ? error.message : "";
      if (message.includes("SOURCE_CHANGED")) {
        setSourceChanged(true);
        return;
      }
      setSubmitError(summaryErrorMessage(error));
      return;
    }

    const row = data[0]!;
    successNavigationRef.current = true;
    setConfirmed(true);
    setDirty(false);
    void navigate({ to: "/summaries/$summaryId", params: { summaryId: row.summary_id } });
  }

  return (
    <PageContainer className="space-y-6">
      <UnsavedChangesGuard enabled={dirty && !confirmed} bypassRef={successNavigationRef} />
      <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {SUMMARY_TYPE_LABEL[summaryType]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {stage === "build"
            ? "選擇你願意一併提供的內容，下一步可以先預覽再確認。"
            : "以下是確認後會保存的內容，確認後就不會再變動。"}
        </p>
      </header>

      {stage === "build" ? (
        <>
          {summaryType === "professional_support" ? (
            <div ref={targetSectionRef}>
              <SectionCard
                title="想諮詢的對象"
                description="選擇後會一併記錄在摘要中。"
                {...(targetError ? { className: "border-caution ring-1 ring-caution" } : {})}
              >
                <RadioGroup
                  value={target}
                  aria-describedby={targetError ? "target-error" : undefined}
                  aria-invalid={targetError ? true : undefined}
                  onValueChange={(v) => {
                    markDirty();
                    setTarget(v as TargetProfessional);
                    setTargetError(undefined);
                  }}
                  className="mt-3 grid gap-2 sm:grid-cols-2"
                >
                  {TARGET_PROFESSIONALS.map((option) => (
                    <label
                      key={option.value}
                      className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                    >
                      <RadioGroupItem value={option.value} id={`target-${option.value}`} />
                      {option.label}
                    </label>
                  ))}
                </RadioGroup>
                <FieldError id="target-error" message={targetError} />
              </SectionCard>
            </div>
          ) : null}

          <div
            role="note"
            aria-label="可選填的私人資訊"
            className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/40 text-xs font-semibold text-primary"
            >
              i
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">可選填的私人資訊</p>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                以下資訊預設不會帶入。只有你勾選的內容會出現在這份摘要中，不會修改個人資料或其他版本。
              </p>
              <p className="mt-1 text-sm text-muted-foreground sm:hidden">
                <span className="block">以下資訊預設不會帶入。</span>
                <span className="block">只有你勾選的內容會出現在這份摘要中，</span>
                <span className="block">不會修改個人資料或其他版本。</span>
              </p>
            </div>
          </div>

          <SectionCard title="健康背景" description="只有你勾選的項目會出現在摘要中。">
            <div className="mt-3 space-y-2">
              {HEALTH_BACKGROUND_KEYS.map((option) => {
                const content = backgroundContentToText(source.healthBackground[option.value]);
                return (
                  <label
                    key={option.value}
                    className="flex min-h-11 items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={backgroundKeys.includes(option.value)}
                      onCheckedChange={(checked) =>
                        toggleBackground(option.value, checked === true)
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {option.label}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {content || "尚未填寫"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="每日追蹤的個人備註"
            description="困擾程度與變化趨勢一律完整呈現；備註屬於私人內容，只有勾選的才會加入。"
          >
            {notesTracks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">目前沒有含備註的追蹤紀錄。</p>
            ) : (
              <div className="mt-3 space-y-2">
                {notesTracks.map((track) => (
                  <label
                    key={track.id}
                    className="flex min-h-11 items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={trackIds.includes(track.id)}
                      onCheckedChange={(checked) => toggleTrack(track.id, checked === true)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {formatTaipeiDate(track.track_date)}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {(track.notes ?? "").trim()}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="我想問的問題（選填）"
            description={`最多 ${QUESTION_MAX_COUNT} 則，每則 ${QUESTION_MAX_LENGTH} 字以內。`}
          >
            <div className="mt-3 space-y-3">
              {questions.map((value, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id={`question-${index}`}
                    aria-label={`問題 ${index + 1}`}
                    placeholder={`問題 ${index + 1}`}
                    value={value}
                    maxLength={QUESTION_MAX_LENGTH}
                    className="min-h-11 min-w-0 flex-1"
                    onChange={(e) => {
                      markDirty();
                      setQuestionError(undefined);
                      setQuestions((prev) =>
                        prev.map((q, i) => (i === index ? e.target.value : q)),
                      );
                    }}
                  />
                  {index > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 self-start px-3 text-muted-foreground sm:w-14 sm:self-auto"
                      aria-label={`移除問題 ${index + 1}`}
                      onClick={() => {
                        markDirty();
                        setQuestionError(undefined);
                        setQuestions((prev) => prev.filter((_, i) => i !== index));
                      }}
                    >
                      移除
                    </Button>
                  ) : (
                    <span aria-hidden="true" className="hidden min-h-11 w-14 shrink-0 sm:block" />
                  )}
                </div>
              ))}
              {questions.length < QUESTION_MAX_COUNT ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    markDirty();
                    setQuestions((prev) => [...prev, ""]);
                  }}
                >
                  ＋ 新增問題
                </Button>
              ) : null}
              <FieldError id="question-error" message={questionError} />
            </div>
          </SectionCard>

          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryCta onClick={goPreview}>預覽摘要</PrimaryCta>
            <Button
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              onClick={() =>
                void navigate({ to: "/events/$eventId/navigate", params: { eventId } })
              }
            >
              返回
            </Button>
          </div>

          <ExistingSummaries query={summaries} />
        </>
      ) : (
        <>
          <StatusBanner
            tone="note"
            title="這只是預覽"
            description="確認後會保存為固定版本，不再隨紀錄變動。"
          />
          <SummarySnapshotView snapshot={previewSnapshot} />

          {sourceChanged ? (
            <section
              role="alert"
              className="rounded-xl border border-caution bg-caution-muted p-4 sm:p-5"
            >
              <p className="text-sm font-medium text-foreground">{SOURCE_CHANGED_MESSAGE}</p>
              <Button
                variant="outline"
                className="mt-3 min-h-11"
                disabled={query.isFetching}
                onClick={() => void regeneratePreview()}
              >
                {query.isFetching ? "產生摘要中…" : "重新產生預覽"}
              </Button>
            </section>
          ) : null}

          {submitError ? (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryCta disabled={submitting || sourceChanged} onClick={() => void confirm()}>
              {submitting ? "確認中…" : "確認正確"}
            </PrimaryCta>
            <Button
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              disabled={submitting}
              onClick={() => setStage("build")}
            >
              返回修改
            </Button>
          </div>
        </>
      )}
    </PageContainer>
  );
}

/* ---------- 預覽用 Snapshot 組裝（與 RPC 欄位一致） ---------- */

function buildPreviewSnapshot(
  source: SummarySource,
  input: {
    summaryType: SummaryType;
    backgroundKeys: HealthBackgroundKey[];
    trackIds: string[];
    target: TargetProfessional | "";
    questions: string[];
  },
): SummarySnapshot {
  const { summaryType, backgroundKeys, trackIds, target, questions } = input;
  const safety = source.safety!;
  const selectedNotes = source.tracks
    .filter((t) => trackIds.includes(t.id) && (t.notes ?? "").trim().length > 0)
    .map((t) => ({ track_id: t.id, track_date: t.track_date, notes: (t.notes ?? "").trim() }));
  const targetOption = TARGET_PROFESSIONALS.find((o) => o.value === target);

  return {
    summary_type: summaryType,
    summary_type_label: SUMMARY_TYPE_LABEL[summaryType],
    disclaimer: SUMMARY_DISCLAIMER[summaryType],
    questions: normalizeQuestions(questions),
    target_professional:
      summaryType === "professional_support" && targetOption
        ? { value: targetOption.value, label: targetOption.label }
        : null,
    event: {
      health_event_id: source.event.id,
      started_on: source.event.started_on,
      status: source.event.status,
      primary_symptom_label:
        source.event.custom_primary_symptom ?? source.event.primary_symptom_label,
      custom_primary_symptom: source.event.custom_primary_symptom,
    },
    initial_record: {
      revision: source.initialRecord.revision,
      severity: source.initialRecord.severity,
      frequency_level: source.initialRecord.frequency_level ?? 0,
      frequency_label: frequencyLabel(source.initialRecord.frequency_level),
      frequency_description: source.initialRecord.frequency_description,
      duration_value: source.initialRecord.duration_value ?? 0,
      duration_unit: source.initialRecord.duration_unit ?? "",
      duration_unit_label: source.initialRecord.duration_unit
        ? (DURATION_UNIT_LABELS[source.initialRecord.duration_unit] ??
          source.initialRecord.duration_unit)
        : null,
      associated_symptoms: source.initialRecord.associated_symptoms,
      life_context: source.initialRecord.life_context,
      supplemental_description: source.initialRecord.supplemental_description,
    },
    daily_tracks: source.tracks.map((t) => ({
      track_id: t.id,
      track_date: t.track_date,
      severity: t.severity,
      frequency_level: t.frequency_level ?? 0,
      frequency_label: frequencyLabel(t.frequency_level),
      frequency_description: t.frequency_description,
      subjective_change: t.subjective_change ?? "",
      subjective_change_label: subjectiveLabel(t.subjective_change),
      life_context: t.life_context,
      actions_tried: t.suggestion_execution.map((code) => ({
        code,
        title: source.suggestionMap[code]?.title ?? code,
        description: source.suggestionMap[code]?.description ?? null,
      })),
    })),
    selected_track_notes: selectedNotes,
    latest_track_date: source.latestTrackDate ?? null,
    safety: {
      safety_assessment_id: safety.id,
      result: safety.result,
      assessed_at: safety.assessed_at,
      record_revision: safety.record_revision,
      warnings: safety.warnings,
    },
    health_background: backgroundKeys.map((key) => ({
      code: key,
      label: HEALTH_BACKGROUND_KEYS.find((o) => o.value === key)?.label ?? key,
      content: source.healthBackground[key] ?? "",
    })),
  };
}
