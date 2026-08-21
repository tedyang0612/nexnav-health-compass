import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@/components/shell";
import { Button } from "@/components/ui/button";
import { SummarySnapshotView } from "@/components/summary/SummarySnapshotView";
import {
  formatTaipeiDate,
  SUMMARY_TYPE_LABEL,
  type SummarySnapshot,
  type SummaryType,
} from "@/lib/summary";

export const Route = createFileRoute("/_app/summaries/$summaryId")({
  head: () => ({
    meta: [
      { title: "摘要檢視 — NexNav" },
      { name: "description", content: "檢視你已確認保存的溝通摘要內容。" },
      { property: "og:title", content: "摘要檢視 — NexNav" },
      { property: "og:description", content: "檢視你已確認保存的溝通摘要內容。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { summaryId } = Route.useParams();

  const query = useQuery({
    queryKey: ["health-summary", summaryId],
    retry: 1,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_summaries")
        .select(
          "id, health_event_id, summary_type, status, version_number, snapshot_content, confirmed_at, created_at",
        )
        .eq("id", summaryId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (query.isLoading) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="摘要檢視" />
        <LoadingState label="正在載入摘要…" />
      </PageContainer>
    );
  }

  if (query.isError) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="摘要檢視" />
        <ErrorState onRetry={() => void query.refetch()} />
      </PageContainer>
    );
  }

  const row = query.data;
  if (!row) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="摘要檢視" />
        <EmptyState title="找不到這份摘要" description="它可能已不存在，或不屬於你的帳號。" />
      </PageContainer>
    );
  }

  const snapshot = row.snapshot_content as unknown as SummarySnapshot;

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={SUMMARY_TYPE_LABEL[snapshot.summary_type as SummaryType] ?? "摘要檢視"}
        description={`已於 ${formatTaipeiDate(row.confirmed_at ?? row.created_at)} 確認保存${
          row.version_number ? `．版本 v${row.version_number}` : ""
        }`}
        actions={
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/events/$eventId/navigate" params={{ eventId: row.health_event_id }}>
              回到就醫與專業協助
            </Link>
          </Button>
        }
      />
      <SummarySnapshotView snapshot={snapshot} />
    </PageContainer>
  );
}
