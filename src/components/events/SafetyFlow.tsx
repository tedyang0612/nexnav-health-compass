import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  LoadingState,
  PageContainer,
  PageHeader,
  PrimaryCta,
  SectionCard,
  StatusBanner,
} from "@/components/shell";
import { Button } from "@/components/ui/button";
import { SafetyQuestionCard } from "@/components/events/SafetyQuestionCard";
import { ClosedEventNotice } from "@/components/events/ClosedEventNotice";
import { supabase } from "@/integrations/supabase/client";
import { formatDisplayDate } from "@/lib/event-wizard";
import {
  SAFETY_QUESTIONS,
  buildAnswersPayload,
  isComplete,
  isKnownResult,
  type SafetyAnswerDraft,
  type SafetyAnswerKey,
  type SafetyResult,
} from "@/lib/safety";

type EventContext = {
  symptomLabel: string;
  status: string;
  startedOn: string;
  currentRevision: number | null;
  currentResult: SafetyResult | null;
};

function useSafetyContext(eventId: string) {
  return useQuery({
    queryKey: ["safety-context", eventId],
    retry: 1,
    queryFn: async (): Promise<EventContext | null> => {
      const { data: event, error } = await supabase
        .from("health_events")
        .select("id, started_on, status, custom_primary_symptom, symptom_catalog(display_name)")
        .eq("id", eventId)
        .maybeSingle();

      if (error) throw error;
      if (!event) return null;

      const row = event as unknown as {
        started_on: string;
        status: string;
        custom_primary_symptom: string | null;
        symptom_catalog: { display_name: string } | null;
      };

      const { data: records, error: recordError } = await supabase
        .from("initial_records")
        .select("revision")
        .eq("health_event_id", eventId)
        .order("revision", { ascending: false })
        .limit(1);
      if (recordError) throw recordError;

      const currentRevision = records?.[0]?.revision ?? null;

      let currentResult: SafetyResult | null = null;
      if (currentRevision !== null) {
        const { data: assessments, error: assessmentError } = await supabase
          .from("safety_assessments")
          .select("result, assessment_status, record_revision, created_at")
          .eq("health_event_id", eventId)
          .eq("record_revision", currentRevision)
          .eq("assessment_status", "completed")
          .not("result", "is", null)
          .order("created_at", { ascending: false })
          .limit(1);
        if (assessmentError) throw assessmentError;
        const found = assessments?.[0]?.result;
        currentResult = isKnownResult(found) ? found : null;
      }

      return {
        status: row.status,
        symptomLabel:
          row.custom_primary_symptom?.trim() ||
          row.symptom_catalog?.display_name ||
          "未指定不適",
        startedOn: row.started_on,
        currentRevision,
        currentResult,
      };
    },
  });
}

/**
 * mode="view"：既有行為，若目前 revision 已有結果則直接顯示結果頁。
 * mode="edit"：重新確認入口，一律先顯示五題問卷，提交後才顯示最新結果。
 */
export function SafetyFlow({
  eventId,
  mode = "view",
}: {
  eventId: string;
  mode?: "view" | "edit";
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contextQuery = useSafetyContext(eventId);

  const [draft, setDraft] = useState<SafetyAnswerDraft>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<SafetyResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const complete = isComplete(draft);
  const answered = useMemo(
    () => SAFETY_QUESTIONS.filter((q) => typeof draft[q.key] === "boolean").length,
    [draft],
  );

  const runAssessment = useCallback(
    async (triggerType: "event_created" | "manual_retry") => {
      if (!isComplete(draft) || submitting) return;
      setSubmitting(true);
      setFailed(false);
      setAttempted(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      try {
        const { data, error } = await supabase.rpc("run_safety_assessment", {
          p_health_event_id: eventId,
          p_answers: buildAnswersPayload(draft),
          p_trigger_type: triggerType,
        });
        if (error) throw error;
        const rows = data ?? [];
        if (rows.length !== 1) throw new Error("unexpected_response");
        const row = rows[0]!;
        if (row.assessment_status !== "completed" || !isKnownResult(row.result)) {
          throw new Error("incomplete_assessment");
        }
        setSubmittedResult(row.result);
        await contextQuery.refetch();
        // 讓所有依賴 Safety 狀態的畫面改讀最新結果。
        await Promise.all(
          [
            ["safety-context", eventId],
            ["guide-safety-gate", eventId],
            ["existing-guide", eventId],
            ["guide", eventId],
            ["reassess", eventId],
            ["track-event", eventId],
            ["summary-source", eventId],
            ["active-events"],
          ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      } catch {
        setSubmittedResult(null);
        setFailed(true);
      } finally {
        setSubmitting(false);
      }
    },
    [draft, eventId, submitting, contextQuery, queryClient],
  );

  if (contextQuery.isLoading) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        <LoadingState label="載入中…" />
      </PageContainer>
    );
  }

  if (contextQuery.isError) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        <PageHeader title="先確認目前狀況" />
        <StatusBanner
          tone="attention"
          title="目前無法載入這筆狀況"
          description="請稍後再試一次。"
          actions={
            <Button variant="outline" onClick={() => void contextQuery.refetch()}>
              重新載入
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const context = contextQuery.data;
  if (!context) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        <EmptyState
          title="找不到這筆狀況紀錄"
          description="這筆紀錄可能已不存在，或你目前沒有查看權限。"
          action={
            <Button variant="outline" onClick={() => void navigate({ to: "/dashboard" })}>
              回到我的狀況
            </Button>
          }
        />
      </PageContainer>
    );
  }

  // 已結束的狀況不得執行新的 safety assessment（view / edit 兩種模式皆適用）。
  if (context.status !== "active") {
    return (
      <ClosedEventNotice
        eventId={eventId}
        description="已結束的狀況無法重新進行安全確認，你仍可查看過去的追蹤紀錄。"
      />
    );
  }

  const eventSummary = `${context.symptomLabel}．自 ${formatDisplayDate(context.startedOn)} 起`;
  const shownResult = mode === "edit" ? submittedResult : submittedResult ?? context.currentResult;

  // 失敗優先於任何結果呈現：RPC 失敗永遠不得顯示為一般狀態。
  if (failed) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        <PageHeader title="先確認目前狀況" description={eventSummary} />
        <SectionCard title="目前無法判斷下一步方向">
          <p className="text-sm text-muted-foreground">
            這次狀況確認未能完成，因此 NexNav
            不會把目前狀況視為一般狀態。你可以重新嘗試，或先查看就醫方向。
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <PrimaryCta
              disabled={submitting}
              onClick={() => void runAssessment("manual_retry")}
            >
              {submitting ? "<狀況確認中>" : "重新嘗試"}
            </PrimaryCta>
            <Button
              variant="outline"
              size="lg"
              className="min-h-11 w-full sm:w-auto"
              onClick={() =>
                void navigate({
                  to: "/events/$eventId/navigate",
                  params: { eventId },
                })
              }
            >
              先查看就醫方向
            </Button>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (shownResult) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            安全確認
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{eventSummary}</p>
        </div>

        <ResultView
          result={shownResult}
          onGuide={() =>
            void navigate({ to: "/events/$eventId/guide", params: { eventId } })
          }
          onNavigate={() =>
            void navigate({ to: "/events/$eventId/navigate", params: { eventId } })
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {mode === "edit" ? "重新確認目前狀況" : "先確認幾個重要問題"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{eventSummary}</p>
        </div>
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm leading-relaxed text-foreground/80 lg:max-w-xs">
          <p>先確認目前是否有需要優先尋求醫療協助的情況。</p>
          <p className="mt-1">這項確認不代表醫療診斷。</p>
        </div>
      </div>

      <div className="space-y-3">
        {SAFETY_QUESTIONS.map((question, index) => (
          <SafetyQuestionCard
            key={question.key}
            index={index}
            total={SAFETY_QUESTIONS.length}
            question={question}
            value={draft[question.key as SafetyAnswerKey]}
            disabled={submitting}
            onChange={(next) =>
              setDraft((prev) => ({ ...prev, [question.key]: next }))
            }
          />
        ))}
      </div>

      <div className="flex flex-row items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted-foreground" aria-live="polite">
          已完成 {answered}／{SAFETY_QUESTIONS.length} 題
          {submitting ? "　<狀況確認中>" : ""}
        </p>
        <Button
          size="lg"
          className="min-h-12 shrink-0 whitespace-nowrap"
          disabled={!complete || submitting}
          onClick={() =>
            void runAssessment(
              mode === "edit" || attempted ? "manual_retry" : "event_created",
            )
          }
        >
          {submitting ? "<狀況確認中>" : "確認目前狀況"}
        </Button>
      </div>
    </PageContainer>
  );
}

function ResultView({
  result,
  onGuide,
  onNavigate,
}: {
  result: SafetyResult;
  onGuide: () => void;
  onNavigate: () => void;
}) {
  if (result === "priority_care") {
    return (
      <section className="overflow-hidden rounded-xl border border-urgent border-l-4 border-l-urgent bg-urgent-muted p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-urgent/15 text-urgent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </span>
          <div className="min-w-0 space-y-3">
            <h2 className="text-lg font-semibold text-urgent-strong sm:text-xl">
              目前有需要優先尋求協助的訊號
            </h2>
            <p className="text-sm leading-relaxed text-foreground">
              你在這次確認中回報了需要優先注意的情況。
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              NexNav 不提供醫療診斷，但建議您優先尋求適當的醫療協助。
            </p>
            <p className="text-sm font-bold leading-relaxed text-urgent-strong">
              如果目前情況嚴重、快速惡化，或你認為可能有立即危險，請優先撥打 119 尋求緊急支援。
            </p>
            <PrimaryCta
              className="mt-1 bg-urgent bg-none text-white shadow-none hover:bg-urgent/90 focus-visible:ring-urgent"
              onClick={onNavigate}
            >
              查看就醫與專業協助
            </PrimaryCta>
          </div>
        </div>
      </section>
    );
  }

  if (result === "attention") {
    return (
      <SectionCard title="這次確認有需要留意的地方">
        <p className="text-sm text-muted-foreground">
          目前不提供改善方向，建議先查看就醫與專業支持方向。
        </p>
        <div className="pt-2">
          <PrimaryCta onClick={onNavigate}>查看就醫與專業支持</PrimaryCta>
        </div>
      </SectionCard>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-primary/30 border-l-4 border-l-primary bg-surface-elevated p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12l5 5l9 -9" />
          </svg>
        </span>
        <div className="min-w-0 space-y-3">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            已完成安全確認
          </h2>
          <p className="text-sm leading-relaxed text-foreground">
            根據這次簡短確認，你沒有回報需要優先處理的情況。
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            <strong className="font-bold">這不代表醫療診斷</strong>
            ，如果症狀持續、加重或讓你感到不安，仍應尋求專業評估。
          </p>
          <PrimaryCta className="mt-1" onClick={onGuide}>
            查看改善方向
          </PrimaryCta>
        </div>
      </div>
    </section>
  );
}
