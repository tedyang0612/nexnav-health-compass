import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from "@/components/shell";
import { useReassessData } from "@/hooks/useReassess";
import { CONNECT_DEMO_FACILITIES, connectSearchTarget } from "@/lib/connect-demo";

const DEFAULT_LOCATION = "南京復興捷運站";
type Filter = "recommended" | "nearby" | "open" | "all";

export const Route = createFileRoute("/_app/events/$eventId/connect")({
  head: () => ({ meta: [{ title: "尋找醫療資源 — NexNav" }] }),
  component: Page,
});

function Page() {
  const { eventId } = Route.useParams();
  const query = useReassessData(eventId);
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<"match" | "distance">("match");
  const [filter, setFilter] = useState<Filter>("recommended");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [placeType, setPlaceType] = useState("全部");

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
  const isRecommended = (specialty: string) => targetWords.some((word) => specialty.includes(word));
  const filtered = CONNECT_DEMO_FACILITIES.filter((facility) => {
    const matchesPlaceType = placeType === "全部"
      || (placeType === "醫院" && facility.name.includes("醫院"))
      || (placeType === "診所" && facility.name.includes("診所"));
    if (!matchesPlaceType) return false;
    if (filter === "recommended") return isRecommended(facility.specialty);
    if (filter === "nearby") return facility.distanceKm <= 2;
    if (filter === "open") return facility.openToday;
    return true;
  });
  const ranked = [...filtered].sort((a, b) => {
    if (sort === "distance") return a.distanceKm - b.distanceKm;
    return Number(isRecommended(b.specialty)) - Number(isRecommended(a.specialty)) || a.distanceKm - b.distanceKm;
  });
  const visible = showAll ? ranked : ranked.slice(0, 5);
  const mapsUrl = (searchQuery: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedLocation = location.trim() || DEFAULT_LOCATION;
    if (normalizedLocation === DEFAULT_LOCATION) {
      setLocation(DEFAULT_LOCATION);
      setShowAll(false);
      return;
    }
    const placeQuery = placeType === "全部" ? "醫院 診所" : placeType;
    window.open(mapsUrl(`${normalizedLocation}附近的${placeQuery}`), "_blank", "noopener,noreferrer");
  };

  const selectFilter = (nextFilter: Filter) => {
    setFilter(nextFilter);
    setShowAll(false);
  };

  if (safety?.result === "priority_care") {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="尋找醫療資源" description="依目前安全確認結果，先處理需要優先注意的狀況。" />
        <section role="alert" className="rounded-xl border-2 border-urgent bg-urgent-muted p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-urgent-strong" aria-hidden="true" />
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-urgent-strong">目前有需要優先尋求醫療協助的訊號</h2>
              <p className="font-bold text-urgent-strong">若情況緊急或快速惡化，請立即撥打 119 或前往就近急診。</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="min-h-11 bg-urgent text-white hover:bg-urgent/90"><a href="tel:119">撥打 119</a></Button>
                <Button asChild variant="outline" className="min-h-11 border-urgent text-urgent-strong">
                  <a href={mapsUrl(`${DEFAULT_LOCATION} 急診`)} target="_blank" rel="noreferrer">搜尋附近急診 <GoogleMapsIcon className="ml-2 size-4" /></a>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <Button asChild variant="outline"><Link to="/events/$eventId/navigate" params={{ eventId }}>回到就醫與專業協助</Link></Button>
      </PageContainer>
    );
  }

  const filterOptions: Array<{ value: Filter; label: string }> = [
    { value: "recommended", label: "建議科別" },
    { value: "nearby", label: "2 公里內" },
    { value: "open", label: "今日有看診" },
    { value: "all", label: "全部" },
  ];

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="尋找醫療資源" />

      <section aria-label="搜尋醫療院所" className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end" onSubmit={handleSearch}>
          <label className="grid gap-1.5 text-sm font-medium">
            位置
            <input
              className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 font-normal"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="輸入地點或捷運站"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            搜尋類型
            <select className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 font-normal" value={placeType} onChange={(event) => { setPlaceType(event.target.value); setShowAll(false); }}>
              <option>全部</option>
              <option>醫院</option>
              <option>診所</option>
            </select>
          </label>
          <Button type="submit" className="min-h-11 w-full sm:w-auto"><Search className="mr-2 size-4" />搜尋</Button>
        </form>
        <p className="mt-3 text-sm text-muted-foreground">更換位置後，將前往 Google Maps 查看該地點的即時搜尋結果。</p>
      </section>

      <section aria-labelledby="connect-results" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 id="connect-results" className="text-xl font-semibold">結果</h2>
            <p className="text-sm text-muted-foreground">共 {ranked.length} 筆。</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm sm:hidden">排序
            <select className="h-9 max-w-[9rem] rounded-lg border border-border bg-surface px-2.5 text-sm" value={sort} onChange={(event) => setSort(event.target.value as "match" | "distance")}>
              <option value="match">符合程度</option><option value="distance">距離優先</option>
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="院所篩選">
            {filterOptions.map((option) => (
              <Button key={option.value} type="button" size="sm" variant={filter === option.value ? "default" : "outline"} aria-pressed={filter === option.value} onClick={() => selectFilter(option.value)}>
                {option.label}
              </Button>
            ))}
          </div>
          <label className="hidden shrink-0 items-center gap-2 text-sm sm:ml-auto sm:flex">排序
            <select className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm" value={sort} onChange={(event) => setSort(event.target.value as "match" | "distance")}>
              <option value="match">符合程度</option><option value="distance">距離優先</option>
            </select>
          </label>
        </div>

        <div className="space-y-3">
          {visible.map((facility, index) => (
            <article key={facility.id} className="overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <h3 className="min-w-0 break-words font-semibold">{facility.name}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{facility.specialty}</span>
                  <span className={`${facility.openToday
                    ? "rounded-full border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "rounded-full border border-caution bg-caution-muted px-2.5 py-1 text-xs font-semibold text-caution-strong"
                  } hidden sm:inline-flex`}>{facility.openToday ? "今日有看診" : "今日休診"}</span>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0" /> 約 <strong className="font-semibold text-primary">{facility.distanceKm.toFixed(1)} km</strong><span aria-hidden="true">・</span>{facility.area}<span className={`${facility.openToday
                    ? "rounded-full border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "rounded-full border border-caution bg-caution-muted px-2.5 py-1 text-xs font-semibold text-caution-strong"
                  } ml-1 inline-flex sm:hidden`}>{facility.openToday ? "今日有看診" : "今日休診"}</span></p>
              </div>
              <Button asChild variant="outline" className="mt-3 min-h-11 w-full shrink-0 sm:mt-0 sm:w-auto">
                <a href={mapsUrl(`${DEFAULT_LOCATION} ${facility.specialty}`)} target="_blank" rel="noreferrer">在 Google Maps 中顯示 <GoogleMapsIcon className="ml-2 h-4 w-auto" /></a>
              </Button>
            </article>
          ))}
        </div>

        {ranked.length > 5 && (
          <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => setShowAll((value) => !value)}>{showAll ? "收合為 5 筆" : `展開全部 ${ranked.length} 筆`}</Button>
        )}
      </section>
      <p className="text-sm text-muted-foreground">院所資訊可能有所變動，實際資訊請以 Google Maps 顯示內容為準。</p>
    </PageContainer>
  );
}

function GoogleMapsIcon({ className }: { className?: string }) {
  return <img className={className} src="/google-maps.svg" alt="" aria-hidden="true" />;
}

