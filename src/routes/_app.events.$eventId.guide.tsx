import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ErrorState,
  PageContainer,
  PageHeader,
  PrimaryCta,
  SectionCard,
} from "@/components/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { GuideSections } from "@/components/events/GuideSections";
import { useGuide, useExistingGuide, parseGuideTableRow } from "@/hooks/useGuide";
import { useGuideSafetyGate } from "@/hooks/useGuideSafetyGate";


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

function GuideHeader() {
  return (
    <PageHeader
      title="改善方向"
      description="根據目前紀錄，查看可以先嘗試的生活調整與觀察方向。"
    />
  );
}

/** 真實載入中的頁面骨架：預先呈現標題與 3 個內容區塊輪廓，降低 layout shift。 */
function GuideSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4 sm:space-y-6">
      <span className="sr-only">建立改善方向中</span>
      <div className="rounded-xl border border-heal/30 border-l-4 border-l-heal bg-heal-muted/40 p-4 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-5 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="space-y-3 rounded-xl border border-border/80 bg-surface-elevated p-4 sm:p-5"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function Page() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const gateQuery = useGuideSafetyGate(eventId);
  const existingQuery = useExistingGuide(eventId);
  const safetyResult = gateQuery.data?.currentResult ?? null;

  // 既有 Guide 只有在 Safety 為 normal，且 revision 與 safety assessment 皆相符時可重用。
  const existing = existingQuery.data ?? null;
  const reusable =
    safetyResult === "normal" &&
    existing !== null &&
    gateQuery.data != null &&
    existing.recordRevision === gateQuery.data.currentRevision &&
    existing.safetyAssessmentId === gateQuery.data.currentAssessmentId
      ? existing
      : null;

  const reusableGuide = (() => {
    if (!reusable) return null;
    try {
      return parseGuideTableRow(reusable);
    } catch {
      return null; // 驗證失敗時退回 RPC 流程
    }
  })();

  const guideQuery = useGuide({
    eventId,
    enabled:
      gateQuery.isSuccess &&
      safetyResult === "normal" &&
      existingQuery.isSuccess &&
      reusableGuide === null,
  });

  const goNavigate = () =>
    void navigate({ to: "/events/$eventId/navigate", params: { eventId } });

  if (gateQuery.isLoading || existingQuery.isLoading) {
    return (
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
        <GuideSkeleton />
      </PageContainer>
    );
  }




  if (gateQuery.isError) {
    return (
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
        <ErrorState
          title="目前無法取得改善方向"
          description="請稍後再試一次。"
          retryLabel="再試一次"
          onRetry={() => void gateQuery.refetch()}
        />
      </PageContainer>
    );
  }

  if (safetyResult === null) {
    return (
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
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
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
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
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
        <SectionCard title="這次確認有需要留意的地方">
          <p className="text-sm text-muted-foreground">
            目前不提供改善方向，建議先查看就醫與專業支持方向。
          </p>
          <PrimaryCta onClick={goNavigate}>查看就醫與專業支持</PrimaryCta>
        </SectionCard>
      </PageContainer>
    );
  }

  if (reusableGuide) {
    return (
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
        <GuideSections guide={reusableGuide} eventId={eventId} />
      </PageContainer>
    );
  }

  if (guideQuery.isPending) {
    return (
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
        <GuideSkeleton />
      </PageContainer>
    );
  }


  if (guideQuery.isError || !guideQuery.data) {
    return (
      <PageContainer width="default" className="space-y-5 sm:space-y-6">
        <GuideHeader />
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
    <PageContainer width="default" className="space-y-5 sm:space-y-6">
      <GuideHeader />
      <GuideSections guide={guideQuery.data} eventId={eventId} />
    </PageContainer>
  );
}
