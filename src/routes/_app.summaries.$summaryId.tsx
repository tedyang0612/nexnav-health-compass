import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
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

  const title = SUMMARY_TYPE_LABEL[snapshot.summary_type as SummaryType] ?? "摘要檢視";
  const confirmedDate = formatTaipeiDate(row.confirmed_at ?? row.created_at);

  // 以 document.title 影響 browser-native「另存為 PDF」的預設檔名。
  const handleExportPdf = () => {
    const previousTitle = document.title;
    const versionSuffix = row.version_number ? ` v${row.version_number}` : "";
    document.title = `${title}${versionSuffix}`;

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };

    window.addEventListener("afterprint", restore);
    window.print();
    // 部分瀏覽器不會觸發 afterprint（或延後觸發），保留延遲後備還原。
    window.setTimeout(restore, 3000);
  };



  return (
    <PageContainer className="space-y-6">
      <p className="hidden text-sm font-semibold tracking-wide text-foreground print:block">
        NexNav
      </p>
      <header className="space-y-4 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:space-y-0">
        <div className="min-w-0 space-y-1">
          <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">已於 {confirmedDate} 確認保存</span>
            {row.version_number ? (
              <span className="whitespace-nowrap">版本 v{row.version_number}</span>
            ) : null}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row print:hidden">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={handleExportPdf}
          >
            <Printer aria-hidden="true" className="size-4" />
            匯出 PDF
          </Button>
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link to="/events/$eventId/navigate" params={{ eventId: row.health_event_id }}>
              回到就醫與專業協助
            </Link>
          </Button>
        </div>
      </header>
      <SummarySnapshotView snapshot={snapshot} />
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4 print:hidden">
        <div>
          <h2 className="font-semibold text-foreground">下一步｜尋找醫療資源</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            摘要已準備完成，你可以接著查看附近的醫療與專業協助資源。
          </p>
        </div>
        <Button asChild className="mt-3 min-h-11 w-full sm:mt-0 sm:w-auto">
          <Link to="/events/$eventId/connect" params={{ eventId: row.health_event_id }}>
            查看附近醫療資源
          </Link>
        </Button>
      </section>


    </PageContainer>
  );
}
