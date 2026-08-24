import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader, SectionCard } from "@/components/shell";
import { useReassessData } from "@/hooks/useReassess";
import { CONNECT_DEMO_FACILITIES, connectSearchTarget } from "@/lib/connect-demo";

export const Route = createFileRoute("/_app/events/$eventId/connect")({
  head: () => ({ meta: [{ title: "尋找附近醫療院所 — NexNav" }] }),
  component: Page,
});

function Page() {
  const { eventId } = Route.useParams();
  const query = useReassessData(eventId);
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<"match" | "distance">("match");

  const safety = useMemo(() => {
    if (!query.data?.initial) return null;
    return query.data.safety.find((item) => item.recordRevision === query.data!.initial!.revision) ?? null;
  }, [query.data]);

  if (query.isLoading) return <PageContainer><LoadingState label="正在準備附近協助資訊…" /></PageContainer>;
  if (query.isError) return <PageContainer><ErrorState onRetry={() => void query.refetch()} /></PageContainer>;
  if (!query.data?.initial) return <PageContainer><EmptyState title="找不到此狀況追蹤" /></PageContainer>;

  const symptom = query.data.event.symptomName;
  const target = connectSearchTarget(symptom);
  const targetWords = target.split(" ");
  const ranked = [...CONNECT_DEMO_FACILITIES].sort((a, b) => {
    if (sort === "distance") return a.distanceKm - b.distanceKm;
    const aMatch = targetWords.some((word) => a.specialty.includes(word)) ? 1 : 0;
    const bMatch = targetWords.some((word) => b.specialty.includes(word)) ? 1 : 0;
    return bMatch - aMatch || a.distanceKm - b.distanceKm;
  });
  const visible = showAll ? ranked : ranked.slice(0, 5);
  const mapsUrl = (specialty: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`南京復興捷運站 ${specialty}`)}`;

  if (safety?.result === "priority_care") {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="尋找附近醫療院所" description="依目前安全確認結果，先處理需要優先注意的狀況。" />
        <section role="alert" className="rounded-xl border-2 border-urgent bg-urgent-muted p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-urgent-strong" aria-hidden="true" />
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-urgent-strong">目前有需要優先尋求醫療協助的訊號</h2>
              <p className="font-bold text-urgent-strong">若情況緊急或快速惡化，請立即撥打 119 或前往就近急診。</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="min-h-11 bg-urgent text-white hover:bg-urgent/90"><a href="tel:119">撥打 119</a></Button>
                <Button asChild variant="outline" className="min-h-11 border-urgent text-urgent-strong">
                  <a href={mapsUrl("急診")} target="_blank" rel="noreferrer">搜尋附近急診 <ExternalLink className="ml-2 size-4" /></a>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <Button asChild variant="outline"><Link to="/events/$eventId/navigate" params={{ eventId }}>回到就醫與專業協助</Link></Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="尋找附近醫療院所" description="以南京復興捷運站為中心，查看 5 公里內的醫療院所清單。" />
      <SectionCard title="搜尋條件">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div><dt className="text-sm text-muted-foreground">搜尋中心</dt><dd className="font-medium">南京復興捷運站</dd></div>
          <div><dt className="text-sm text-muted-foreground">範圍</dt><dd className="font-medium">方圓 5 公里</dd></div>
          <div><dt className="text-sm text-muted-foreground">目前狀況</dt><dd className="font-medium">{symptom}</dd></div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">參考方向：{target.replaceAll(" ", "／")}</p>
      </SectionCard>
      <section aria-labelledby="connect-results" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 id="connect-results" className="text-xl font-semibold">附近院所清單</h2><p className="text-sm text-muted-foreground">預設顯示 5 筆，共 20 筆。</p></div>
          <label className="flex items-center gap-2 text-sm">排序
            <select className="min-h-11 rounded-lg border border-border bg-surface px-3" value={sort} onChange={(e) => setSort(e.target.value as "match" | "distance")}>
              <option value="match">符合程度</option><option value="distance">距離優先</option>
            </select>
          </label>
        </div>
        <div className="space-y-3">
          {visible.map((facility, index) => (
            <article key={facility.id} className="rounded-xl border border-border bg-card p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">#{index + 1}</span><h3 className="font-semibold">{facility.name}</h3><span className="rounded-full bg-muted px-2 py-0.5 text-xs">{facility.specialty}</span></div>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" /> 約 {facility.distanceKm.toFixed(1)} km・{facility.area}</p>
              </div>
              <Button asChild variant="outline" className="mt-3 min-h-11 w-full sm:mt-0 sm:w-auto"><a href={mapsUrl(facility.specialty)} target="_blank" rel="noreferrer">在 Google Maps 搜尋 <ExternalLink className="ml-2 size-4" /></a></Button>
            </article>
          ))}
        </div>
        <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => setShowAll((value) => !value)}>{showAll ? "收合為 5 筆" : "展開全部 20 筆"}</Button>
      </section>
      <p className="text-sm text-muted-foreground">院所資訊可能有所變動，實際資訊請以 Google Maps 顯示內容為準。</p>
    </PageContainer>
  );
}
