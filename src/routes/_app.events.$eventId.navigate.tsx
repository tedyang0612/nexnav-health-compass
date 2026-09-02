import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ShieldQuestion } from "lucide-react";
import {
  EmptyState,
  LoadingState,
  PageContainer,
  PageHeader,
  SectionCard,
  StatusBanner,
} from "@/components/shell";
import { Button } from "@/components/ui/button";
import { EventNotFoundError, useReassessData, type ReassessData } from "@/hooks/useReassess";
import {
  MIN_TRACKS_FOR_TREND,
  buildSeverityConclusion,
  formatDisplayDate,
  type SafetyResultValue,
} from "@/lib/reassess";
import { NAVIGATE_DISCLAIMER, START_POINTS, SUPPORT_OPTIONS } from "@/lib/navigate-support";

export const Route = createFileRoute("/_app/events/$eventId/navigate")({
  head: () => ({
    meta: [
      { title: "就醫與專業協助 — NexNav" },
      {
        name: "description",
        content: "NexNav 狀況歷程：依目前紀錄提供一般性的就醫與專業協助方向。",
      },
      { property: "og:title", content: "就醫與專業協助 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：依目前紀錄提供一般性的就醫與專業協助方向。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const PAGE_TITLE = "就醫與專業協助";
const PAGE_DESCRIPTION = "依目前紀錄，提供一般性的就醫與專業協助方向。";

function GoogleMapsIcon({ className }: { className?: string }) {
  return <img className={className} src="/google-maps.svg" alt="" aria-hidden="true" />;
}

function BackToEvents() {
  return (
    <Button asChild variant="outline" className="min-h-11">
      <Link to="/dashboard">返回我的狀況</Link>
    </Button>
  );
}

function Page() {
  const { eventId } = Route.useParams();
  const query = useReassessData(eventId);

  if (query.isPending) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <SectionCard>
          <LoadingState label="<載入中>" />
        </SectionCard>
      </PageContainer>
    );
  }

  if (query.isError) {
    if (query.error instanceof EventNotFoundError) {
      return <NotFoundView />;
    }
    return (
      <PageContainer className="space-y-6">
        <PageHeader title={PAGE_TITLE} />
        <SectionCard>
          <div role="alert" className="space-y-3">
            <p className="text-base font-medium text-foreground">目前無法取得就醫與專業協助內容</p>
            <p className="text-sm text-muted-foreground">請稍後再試一次。</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                type="button"
                className="min-h-11"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {query.isFetching ? "<載入中>" : "重新載入"}
              </Button>
              <BackToEvents />
            </div>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return <NavigateView eventId={eventId} data={query.data} />;
}

function NotFoundView() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader title={PAGE_TITLE} />
      <EmptyState
        title="找不到此狀況追蹤"
        description="此紀錄可能不存在，或你目前無法查看。"
        action={<BackToEvents />}
      />
    </PageContainer>
  );
}

const SAFETY_PRIORITY: Record<SafetyResultValue, number> = {
  priority_care: 3,
  attention: 2,
  normal: 1,
};

function NavigateView({ eventId, data }: { eventId: string; data: ReassessData }) {
  const { event, initial, tracks, safety } = data;

  /** 只採用目前 revision 已完成的狀況確認；同時間衝突時取較高優先序。 */
  const currentSafety = useMemo(() => {
    if (!initial) return null;
    const current = safety.filter((s) => s.recordRevision === initial.revision);
    if (current.length === 0) return null;
    const latestAt = current[0]!.occurredAt;
    const sameTime = current.filter((s) => s.occurredAt === latestAt);
    return sameTime.reduce((a, b) =>
      SAFETY_PRIORITY[b.result] > SAFETY_PRIORITY[a.result] ? b : a,
    );
  }, [safety, initial]);

  if (!initial) return <NotFoundView />;

  const isClosed = event.status !== "active";
  const latestTrack = tracks[tracks.length - 1] ?? null;
  const severityValue = latestTrack ? latestTrack.severity : initial.severity;
  const severitySource = latestTrack ? "最新追蹤" : "初始紀錄";
  const conclusion =
    tracks.length >= MIN_TRACKS_FOR_TREND && latestTrack
      ? buildSeverityConclusion(initial.severity, latestTrack.severity)
      : null;

  const result = currentSafety?.result ?? null;

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />

      {isClosed ? (
        <StatusBanner tone="note" title="此狀況追蹤已結束，以下內容僅供回顧參考。" />
      ) : null}

      <SafetySection eventId={eventId} result={result} />

      {result !== "priority_care" ? (
        <>
          <SectionCard title="可以從哪裡開始">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                以下為一般性方向，不是個人化醫療建議。
              </p>
              <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {START_POINTS.map((item) => (
                  <li
                    key={item}
                    className="flex min-w-0 gap-2 text-sm font-medium text-foreground"
                  >
                    <span aria-hidden="true" className="shrink-0 text-primary">
                      ◆
                    </span>
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-block h-5 w-1 shrink-0 rounded-full bg-brand-teal"
                />
                <p className="text-sm font-medium text-foreground">
                  後續可依目前紀錄，查看可參考的就醫科別與附近醫療資源。
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="哪些情況可考慮尋求專業協助"
            description={
              <span className="mt-2 block">
                以下提供常見的諮詢方向參考，系統並未判定你需要其中任何一項服務。
              </span>
            }
          >
            <ul className="mt-2 divide-y divide-border">
              {SUPPORT_OPTIONS.map((option) => (
                <li key={option.topic} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                    <h3 className="min-w-0 text-sm font-semibold text-foreground">
                      {option.topic}
                    </h3>
                    <p className="min-w-0 text-sm font-medium text-primary sm:text-right">
                      {option.people}
                    </p>
                  </div>
                  {option.note ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">補充：{option.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      ) : null}


      <SectionCard title="目前紀錄摘要">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">主要症狀</dt>
            <dd className="text-base font-medium text-foreground">{event.symptomName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">症狀開始日期</dt>
            <dd className="text-base font-medium text-foreground">
              {formatDisplayDate(event.startedOn)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">最新困擾程度</dt>
            <dd className="text-base font-medium text-foreground">
              {severityValue}／10
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {severitySource}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">累計追蹤筆數</dt>
            <dd className="text-base font-medium text-foreground">{tracks.length} 筆</dd>
          </div>
        </dl>
        {conclusion ? (
          <p className="mt-4 text-sm text-foreground">
            {conclusion.text}（初始 {conclusion.initial}／10 → 最新 {conclusion.latest}／10）
          </p>
        ) : null}
        <div className="pt-4">
          <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
            <Link to="/events/$eventId/reassess" params={{ eventId }}>
              查看追蹤變化
            </Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="建立摘要"
        description="整理目前紀錄，方便與專業人員溝通。"
        className="gap-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="min-h-11 w-full">
            <Link
              to="/events/$eventId/summary/new"
              params={{ eventId }}
              search={{ type: "medical" }}
            >
              建立醫療溝通摘要
            </Link>
          </Button>
          {result !== "priority_care" ? (
            <Button asChild variant="outline" className="min-h-11 w-full">
              <Link
                to="/events/$eventId/summary/new"
                params={{ eventId }}
                search={{ type: "professional" }}
              >
                建立其他健康專業諮詢摘要
              </Link>
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="尋找附近醫療資源" className="mt-4 gap-3">
        <Button asChild className="min-h-11 w-full sm:w-auto">
          <Link to="/events/$eventId/connect" params={{ eventId }}>
            查看地圖
            <GoogleMapsIcon className="ml-2 size-4" />
          </Link>
        </Button>
      </SectionCard>


      <p className="text-sm text-muted-foreground">{NAVIGATE_DISCLAIMER}</p>
    </PageContainer>
  );
}

function SafetySection({ eventId, result }: { eventId: string; result: SafetyResultValue | null }) {
  if (result === null) {
    return (
      <StatusBanner
        tone="attention"
        icon={<ShieldQuestion aria-hidden="true" className="size-4" />}
        title="目前無法判斷下一步方向"
        description="請先完成目前的狀況確認，再參考以下一般性方向。"
        actions={
          <Button asChild className="min-h-11">
            <Link to="/events/$eventId/safety" params={{ eventId }}>
              前往狀況確認
            </Link>
          </Button>
        }
      />
    );
  }

  if (result === "priority_care") {
    return (
      <section
        role="alert"
        className="rounded-xl border-2 border-urgent bg-urgent-muted p-5 sm:p-6"
        aria-labelledby="safety-priority-title"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-urgent-strong" />
          <div className="min-w-0 space-y-2">
            <h2 id="safety-priority-title" className="text-lg font-bold text-urgent-strong">
              目前有需要優先尋求醫療協助的訊號
            </h2>
            <p className="text-sm text-foreground">建議儘快尋求醫療專業協助。</p>
            <p className="text-base font-bold text-urgent-strong">
              若情況緊急或快速惡化，請立即撥打 119 或前往就近急診就醫。
            </p>
            <ul className="space-y-1 text-sm text-foreground">
              <li>優先處理目前的不適，其他整理與紀錄可稍後再做。</li>
              <li>就醫時可簡要說明症狀開始時間、變化與目前困擾程度。</li>
            </ul>
            <div className="pt-1">
              <Button
                asChild
                variant="outline"
                className="min-h-11 border-urgent text-urgent-strong hover:bg-urgent-muted"
              >
                <Link to="/events/$eventId/safety/edit" params={{ eventId }}>
                  重新確認目前狀況
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (result === "attention") {
    return (
      <section
        role="alert"
        className="rounded-xl border border-caution bg-caution-muted p-5 sm:p-6"
        aria-labelledby="safety-attention-title"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-caution-strong"
          />
          <div className="min-w-0 space-y-2">
            <h2 id="safety-attention-title" className="text-base font-semibold text-caution-strong">
              目前有需要持續留意的狀況
            </h2>
            <p className="text-sm text-foreground">
              建議持續觀察症狀變化；若症狀持續、加重或影響日常活動，可考慮尋求專業評估。
            </p>
            <p className="text-sm font-medium text-foreground">
              若出現明顯警訊或快速惡化，請立即尋求醫療協助。
            </p>
            <div className="pt-1">
              <Button
                asChild
                variant="outline"
                className="min-h-11 border-caution text-caution-strong hover:bg-caution-muted"
              >
                <Link to="/events/$eventId/safety/edit" params={{ eventId }}>
                  重新確認目前狀況
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <StatusBanner
      tone="info"
      icon={<CheckCircle2 aria-hidden="true" className="size-4" />}
      title="本次狀況確認未回報需要優先處理的警訊"
      description="仍建議持續記錄與觀察；若症狀持續、加重或影響日常活動，請尋求專業評估。"
    />
  );
}
