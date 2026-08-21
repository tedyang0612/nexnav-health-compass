import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { SummarySnapshotView } from "@/components/summary/SummarySnapshotView";
import { sourceFingerprint, useSummarySource } from "@/hooks/useSummarySource";
import {
  backgroundContentToText,
  formatTaipeiDate,
  HEALTH_BACKGROUND_KEYS,
  normalizeQuestions,
  QUESTION_MAX_COUNT,
  QUESTION_MAX_LENGTH,
  summaryErrorMessage,
  summaryTypeFromSearch,
  SUMMARY_DISCLAIMER,
  SUMMARY_TYPE_LABEL,
  TARGET_PROFESSIONALS,
  validateQuestions,
  type HealthBackgroundKey,
  type SummarySnapshot,
  type SummaryType,
  type TargetProfessional,
} from "@/lib/summary";

type SummarySearch = { type: "medical" | "professional" };

export const Route = createFileRoute("/_app/events/$eventId/summary/new")({
  validateSearch: (search: Record<string, unknown>): SummarySearch => ({
    type: search["type"] === "professional" ? "professional" : "medical",
  }),
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

function Page() {
  const { eventId } = Route.useParams();
  const search = Route.useSearch();
  const summaryType: SummaryType = summaryTypeFromSearch(search.type);
  const navigate = useNavigate();
  const query = useSummarySource(eventId);

  const [backgroundKeys, setBackgroundKeys] = useState<HealthBackgroundKey[]>([]);
  const [trackIds, setTrackIds] = useState<string[]>([]);
  const [target, setTarget] = useState<TargetProfessional | "">("");
  const [questions, setQuestions] = useState<string[]>(["", "", ""]);
  const [stage, setStage] = useState<"build" | "preview">("build");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const source = query.data;
  const notesTracks = useMemo(
    () => (source?.tracks ?? []).filter((t) => (t.notes ?? "").trim().length > 0),
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
          description="依最新的安全確認結果，這個時候先準備就醫溝通摘要會比較合適。"
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
              改為建立就醫溝通摘要
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const previewSnapshot: SummarySnapshot = buildPreviewSnapshot();

  function buildPreviewSnapshot(): SummarySnapshot {
    const selectedNotes = notesTracks
      .filter((t) => trackIds.includes(t.id))
      .map((t) => ({ track_id: t.id, track_date: t.track_date, notes: (t.notes ?? "").trim() }));
    const targetOption = TARGET_PROFESSIONALS.find((o) => o.value === target);
    return {
      summary_type: summaryType,
      summary_type_label: SUMMARY_TYPE_LABEL[summaryType],
      disclaimer: SUMMARY_DISCLAIMER[summaryType],
      questions: normalizeQuestions(questions),
      target_professional: targetOption
        ? { value: targetOption.value, label: targetOption.label }
        : null,
      event: {
        health_event_id: source!.event.id,
        started_on: source!.event.started_on,
        status: source!.event.status,
        primary_symptom_label:
          source!.event.custom_primary_symptom ?? source!.event.primary_symptom_label,
        custom_primary_symptom: source!.event.custom_primary_symptom,
      },
      initial_record: {
        revision: source!.initialRecord.revision,
        severity: source!.initialRecord.severity,
        frequency_level: 0,
        duration_value: 0,
        duration_unit: "",
      },
      daily_tracks: (source!.tracks ?? []).map((t) => ({
        track_id: t.id,
        track_date: t.track_date,
        severity: t.severity,
        frequency_level: 0,
        subjective_change: "",
      })),
      selected_track_notes: selectedNotes,
      latest_track_date: source!.latestTrackDate ?? null,
      safety: {
        safety_assessment_id: safety!.id,
        result: safety!.result,
        assessed_at: safety!.assessed_at,
      },
      health_background: backgroundKeys.map((key) => ({
        code: key,
        label: HEALTH_BACKGROUND_KEYS.find((o) => o.value === key)?.label ?? key,
        content: source!.healthBackground[key] ?? "",
      })),
    };
  }

  function toggleBackground(key: HealthBackgroundKey, checked: boolean) {
    setBackgroundKeys((prev) =>
      checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key),
    );
  }

  function toggleTrack(id: string, checked: boolean) {
    setTrackIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((t) => t !== id)));
  }

  function goPreview() {
    if (summaryType === "professional_support" && !target) {
      setFormError("請先選擇想諮詢的對象");
      return;
    }
    const questionError = validateQuestions(questions);
    if (questionError) {
      setFormError(questionError);
      return;
    }
    setFormError(undefined);
    setSubmitError(undefined);
    setSubmissionId(crypto.randomUUID());
    setStage("preview");
  }

  async function confirm() {
    if (!source || !fingerprint || !submissionId) return;
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
    setSubmitting(false);

    if (error || !data || data.length === 0) {
      setSubmitError(summaryErrorMessage(error));
      return;
    }
    const row = data[0]!;
    void navigate({ to: "/summaries/$summaryId", params: { summaryId: row.summary_id } });
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={SUMMARY_TYPE_LABEL[summaryType]}
        description={
          stage === "build"
            ? "選擇你願意一併提供的內容，下一步可以先預覽再確認。"
            : "以下是確認後會保存的內容，確認後就不會再變動。"
        }
      />

      {stage === "build" ? (
        <>
          {summaryType === "professional_support" ? (
            <SectionCard title="想諮詢的對象" description="選擇後會一併記錄在摘要中。">
              <RadioGroup
                value={target}
                onValueChange={(v) => setTarget(v as TargetProfessional)}
                className="grid gap-2 sm:grid-cols-2"
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
            </SectionCard>
          ) : null}

          <SectionCard
            title="健康背景"
            description="只有你勾選的項目會出現在摘要中。"
          >
            <div className="space-y-2">
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
            description="嚴重度與變化趨勢一律完整呈現；備註屬於私人內容，只有勾選的才會加入。"
          >
            {notesTracks.length === 0 ? (
              <p className="text-sm text-muted-foreground">目前沒有含備註的追蹤紀錄。</p>
            ) : (
              <div className="space-y-2">
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
            title="我想問的問題"
            description={`最多 ${QUESTION_MAX_COUNT} 則，每則 ${QUESTION_MAX_LENGTH} 字以內。`}
          >
            <div className="space-y-3">
              {questions.map((value, index) => (
                <FormField key={index} id={`question-${index}`} label={`問題 ${index + 1}`}>
                  <Input
                    id={`question-${index}`}
                    value={value}
                    maxLength={QUESTION_MAX_LENGTH}
                    className="min-h-11"
                    onChange={(e) =>
                      setQuestions((prev) =>
                        prev.map((q, i) => (i === index ? e.target.value : q)),
                      )
                    }
                  />
                </FormField>
              ))}
            </div>
          </SectionCard>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

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
        </>
      ) : (
        <>
          <StatusBanner
            tone="note"
            title="這只是預覽"
            description="確認後會保存為固定版本，之後不會再隨紀錄變動。"
          />
          <SummarySnapshotView snapshot={previewSnapshot} />

          {submitError ? (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <PrimaryCta disabled={submitting} onClick={() => void confirm()}>
              {submitting ? "確認中…" : "確認並保存摘要"}
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
