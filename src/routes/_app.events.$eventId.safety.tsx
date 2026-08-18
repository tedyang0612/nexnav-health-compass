import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

export const Route = createFileRoute("/_app/events/$eventId/safety")({
  head: () => ({
    meta: [
      { title: "先確認目前狀況 — NexNav" },
      {
        name: "description",
        content: "NexNav 狀況歷程：先確認是否有需要優先尋求醫療協助的情況。",
      },
      { property: "og:title", content: "先確認目前狀況 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：先確認是否有需要優先尋求醫療協助的情況。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type EventContext = {
  symptomLabel: string;
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
        .select("id, started_on, custom_primary_symptom, symptom_catalog(display_name)")
        .eq("id", eventId)
        .maybeSingle();

      if (error) throw error;
      if (!event) return null;

      const row = event as unknown as {
        started_on: string;
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

function Page() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
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
        void contextQuery.refetch();
      } catch {
        setSubmittedResult(null);
        setFailed(true);
      } finally {
        setSubmitting(false);
      }
    },
    [draft, eventId, submitting, contextQuery],
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

  const eventSummary = `${context.symptomLabel}．自 ${formatDisplayDate(context.startedOn)} 起`;
  const shownResult = submittedResult ?? context.currentResult;

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
        <PageHeader title="先確認目前狀況" description={eventSummary} />
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
    <PageContainer width="narrow" className="space-y-6">
      <PageHeader title="先確認目前狀況" description={eventSummary} />
      <p className="text-sm text-muted-foreground">
        在提供改善方向前，先確認是否有需要優先尋求醫療協助的情況。這項確認不代表醫療診斷。
      </p>

      <div className="space-y-4">
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

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          已完成 {answered} / {SAFETY_QUESTIONS.length} 題
          {submitting ? "　<狀況確認中>" : ""}
        </p>
        <PrimaryCta
          disabled={!complete || submitting}
          onClick={() => void runAssessment(attempted ? "manual_retry" : "event_created")}
        >
          {submitting ? "<狀況確認中>" : "確認目前狀況"}
        </PrimaryCta>
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
      <SectionCard
        className="border-heal/40 bg-heal-muted"
        title="目前有需要優先尋求醫療協助的訊號"
      >
        <p className="text-sm text-foreground">
          你在這次確認中回報了需要優先注意的情況。NexNav
          不提供醫療診斷，建議優先尋求適當的醫療協助。
        </p>
        <p className="text-sm font-medium text-foreground">
          如果目前情況嚴重、快速惡化，或你認為可能有立即危險，請優先尋求緊急醫療協助；在台灣可撥打
          119。
        </p>
        <div className="pt-2">
          <PrimaryCta onClick={onNavigate}>查看就醫與專業支持方向</PrimaryCta>
        </div>
      </SectionCard>
    );
  }

  if (result === "attention") {
    return (
      <SectionCard title="這次確認有需要留意的地方">
        <p className="text-sm text-muted-foreground">
          你可以先查看改善方向；若情況持續或加重，也可以查看就醫方向。
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <PrimaryCta onClick={onGuide}>查看改善方向</PrimaryCta>
          <Button
            variant="outline"
            size="lg"
            className="min-h-11 w-full sm:w-auto"
            onClick={onNavigate}
          >
            查看就醫方向
          </Button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="本次未回報需要優先處理的警訊">
      <p className="text-sm text-muted-foreground">
        根據這次簡短確認，你沒有回報上述需要優先處理的情況。這不代表醫療診斷；如果症狀持續、加重或讓你感到不安，仍可考慮尋求專業評估。
      </p>
      <div className="pt-2">
        <PrimaryCta onClick={onGuide}>查看改善方向</PrimaryCta>
      </div>
    </SectionCard>
  );
}
