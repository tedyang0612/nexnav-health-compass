import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  PrimaryCta,
  SectionCard,
} from "@/components/shell";
import { GuideSections } from "@/components/events/GuideSections";
import { useGuide } from "@/hooks/useGuide";
import { supabase } from "@/integrations/supabase/client";
import { isKnownResult, type SafetyResult } from "@/lib/safety";

export const Route = createFileRoute("/_app/events/$eventId/guide")({
  head: () => ({
    meta: [
      { title: "改善方向 — NexNav" },
      {
        name: "description",
        content: "NexNav 狀況歷程：查看可以先嘗試的生活調整與觀察方向。",
      },
      { property: "og:title", content: "改善方向 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：查看可以先嘗試的生活調整與觀察方向。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

/** 依 current revision 的最新 completed safety 結果決定 Guide 是否可用。 */
function useCurrentSafetyResult(eventId: string) {
  return useQuery({
    queryKey: ["guide-safety-gate", eventId],
    retry: 1,
    queryFn: async (): Promise<SafetyResult | null> => {
      const { data: records, error: recordError } = await supabase
        .from("initial_records")
        .select("revision")
        .eq("health_event_id", eventId)
        .order("revision", { ascending: false })
        .limit(1);
      if (recordError) throw recordError;

      const currentRevision = records?.[0]?.revision ?? null;
      if (currentRevision === null) return null;

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
      return isKnownResult(found) ? found : null;
    },
  });
}

function Page() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const safetyQuery = useCurrentSafetyResult(eventId);
  const safetyResult = safetyQuery.data ?? null;

  const guideQuery = useGuide({
    eventId,
    enabled: safetyQuery.isSuccess && safetyResult === "normal",
  });

  const header = (
    <PageHeader
      title="改善方向"
      description="根據目前紀錄，查看可以先嘗試的生活調整與觀察方向。"
    />
  );

  const goNavigate = () =>
    void navigate({ to: "/events/$eventId/navigate", params: { eventId } });

  if (safetyQuery.isLoading) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        {header}
        <LoadingState label="載入中…" />
      </PageContainer>
    );
  }

  if (safetyQuery.isError) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        {header}
        <ErrorState
          title="目前無法取得改善方向"
          description="請稍後再試一次。"
          retryLabel="再試一次"
          onRetry={() => void safetyQuery.refetch()}
        />
      </PageContainer>
    );
  }

  if (safetyResult === null) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        {header}
        <SectionCard
          title="完成狀況確認後再查看改善方向"
          description="需要先確認目前是否有應優先處理的安全警訊。"
        >
          <PrimaryCta
            onClick={() =>
              void navigate({ to: "/events/$eventId/safety", params: { eventId } })
            }
          >
            進行狀況確認
          </PrimaryCta>
        </SectionCard>
      </PageContainer>
    );
  }

  if (safetyResult === "priority_care") {
    return (
      <PageContainer width="narrow" className="space-y-6">
        {header}
        <SectionCard
          className="border-heal/40 bg-heal-muted"
          title="目前建議優先尋求專業協助"
        >
          <p className="text-sm text-foreground">
            你在狀況確認中回報了需要優先注意的情況。NexNav
            不提供醫療診斷，建議優先尋求適當的醫療協助。
          </p>
          <PrimaryCta onClick={goNavigate}>查看就醫與專業支持</PrimaryCta>
        </SectionCard>
      </PageContainer>
    );
  }

  if (safetyResult !== "normal") {
    return (
      <PageContainer width="narrow" className="space-y-6">
        {header}
        <SectionCard title="這次確認有需要留意的地方">
          <p className="text-sm text-muted-foreground">
            目前不提供改善方向，建議先查看就醫與專業支持方向。
          </p>
          <PrimaryCta onClick={goNavigate}>查看就醫與專業支持</PrimaryCta>
        </SectionCard>
      </PageContainer>
    );
  }

  if (guideQuery.isPending || guideQuery.isFetching) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        {header}
        <LoadingState label="<建立改善方向中>" />
      </PageContainer>
    );
  }

  if (guideQuery.isError || !guideQuery.data) {
    return (
      <PageContainer width="narrow" className="space-y-6">
        {header}
        <ErrorState
          title="目前無法取得改善方向"
          description="請稍後再試一次。"
          retryLabel="再試一次"
          onRetry={() => void guideQuery.refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" className="space-y-6">
      {header}
      <GuideSections guide={guideQuery.data} />
    </PageContainer>
  );
}
