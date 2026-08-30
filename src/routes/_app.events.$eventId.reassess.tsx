import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ShieldQuestion, TrendingDown, TrendingUp, Minus } from "lucide-react";
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
import { FrequencyDots, ReassessTimeline } from "@/components/events/ReassessTimeline";
import { SeverityTrendChart } from "@/components/events/SeverityTrendChart";
import { EventNotFoundError, useReassessData } from "@/hooks/useReassess";
import { CloseEventSection } from "@/components/events/CloseEventSection";
import { taipeiToday } from "@/lib/event-wizard";
import {
  MIN_TRACKS_FOR_TREND,
  MISMATCH_TEXT,
  buildChartPoints,
  buildFrequencyComparison,
  buildSeverityConclusion,
  buildTimeline,
  formatDisplayDate,
  hasDirectionMismatch,
  subjectiveDirection,
  subjectiveLabel,
  type SeverityDirection,
} from "@/lib/reassess";

export const Route = createFileRoute("/_app/events/$eventId/reassess")({
  head: () => ({
    meta: [
      { title: "追蹤變化 — NexNav" },
      { name: "description", content: "NexNav 狀況歷程：依已記錄的資料回顧困擾程度與頻率變化。" },
      { property: "og:title", content: "追蹤變化 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：依已記錄的資料回顧困擾程度與頻率變化。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

/** 四張主要卡片一致的標題貼齊上緣間距。 */
const CARD_TIGHT = "gap-3 pt-4 sm:pt-5";

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
        <PageHeader title="追蹤變化" description="依你已記錄的資料，回顧困擾程度與頻率的變化。" />
        <SectionCard>
          <LoadingState label="載入中…" />
        </SectionCard>
      </PageContainer>
    );
  }

  if (query.isError) {
    if (query.error instanceof EventNotFoundError) {
      return (
        <PageContainer className="space-y-6">
          <PageHeader title="追蹤變化" />
          <EmptyState
            title="找不到此狀況追蹤"
            description="此紀錄可能不存在，或你目前無法查看。"
            action={<BackToEvents />}
          />
        </PageContainer>
      );
    }
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="追蹤變化" />
        <SectionCard>
          <div role="alert" className="space-y-3">
            <p className="text-base font-medium text-foreground">目前無法取得追蹤變化</p>
            <p className="text-sm text-muted-foreground">請稍後再試一次。</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                type="button"
                className="min-h-11"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {query.isFetching ? "<載入>中" : "重新載入"}
              </Button>
              <BackToEvents />
            </div>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return <ReassessView eventId={eventId} data={query.data} />;
}

function ReassessView({
  eventId,
  data,
}: {
  eventId: string;
  data: NonNullable<ReturnType<typeof useReassessData>["data"]>;
}) {
  const { event, initial, tracks, safety } = data;
  const isClosed = event.status !== "active";

  const currentSafety = useMemo(() => {
    if (!initial) return null;
    return safety.find((s) => s.recordRevision === initial.revision) ?? null;
  }, [safety, initial]);

  const lastSafety = safety[0] ?? null;

  const timeline = useMemo(
    () => (initial ? buildTimeline({ initial, tracks, safety }) : []),
    [initial, tracks, safety],
  );

  const chartPoints = useMemo(
    () => (initial ? buildChartPoints(initial, tracks) : []),
    [initial, tracks],
  );

  if (!initial) {
    return (
      <PageContainer className="space-y-6">
        <PageHeader title="追蹤變化" />
        <EmptyState
          title="找不到此狀況追蹤"
          description="此紀錄可能不存在，或你目前無法查看。"
          action={<BackToEvents />}
        />
      </PageContainer>
    );
  }

  const hasEnoughTracks = tracks.length >= MIN_TRACKS_FOR_TREND;
  const latestTrack = tracks[tracks.length - 1] ?? null;
  const earliestTrack = tracks[0] ?? null;
  const todayTracked = tracks.some((t) => t.trackDate === taipeiToday());

  const conclusion =
    hasEnoughTracks && latestTrack
      ? buildSeverityConclusion(initial.severity, latestTrack.severity)
      : null;
  const frequency =
    hasEnoughTracks && earliestTrack && latestTrack
      ? buildFrequencyComparison(earliestTrack, latestTrack)
      : null;

  const activeSafetyBlocking =
    !isClosed && (currentSafety === null || currentSafety.result !== "normal");
  const showConclusion = !!conclusion && !activeSafetyBlocking;
  const showFrequency = !!frequency && !activeSafetyBlocking;
  const showChart = hasEnoughTracks;

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="追蹤變化" description="依你已記錄的資料，回顧困擾程度與頻率的變化。" />

      {isClosed ? (
        <StatusBanner tone="note" title="此狀況追蹤已結束，以下為結束前的追蹤紀錄。" />
      ) : null}

      {initial.revision > 1 ? (
        <StatusBanner
          tone="note"
          title="初始紀錄曾更新，目前比較以最新初始紀錄為基準，先前的追蹤紀錄仍會保留。"
        />
      ) : null}

      {/* 安全性內容一律在趨勢內容之前 */}
      {isClosed ? (
        lastSafety && lastSafety.result !== "normal" ? (
          <StatusBanner
            tone="attention"
            icon={<AlertTriangle aria-hidden="true" className="size-4" />}
            title="結束前最後一次狀況確認曾出現需要優先處理的提醒。"
            description="此為歷史結果；若目前仍有相同警訊，請立即尋求專業協助。"
          />
        ) : null
      ) : currentSafety === null ? (
        <StatusBanner
          tone="attention"
          icon={<ShieldQuestion aria-hidden="true" className="size-4" />}
          title="初始紀錄更新後，請先完成目前的狀況確認。"
          actions={
            <Button asChild className="min-h-11">
              <Link to="/events/$eventId/safety" params={{ eventId }}>
                前往狀況確認
              </Link>
            </Button>
          }
        />
      ) : currentSafety.result !== "normal" ? (
        <StatusBanner
          tone="attention"
          icon={<AlertTriangle aria-hidden="true" className="size-4" />}
          title={
            currentSafety.result === "priority_care"
              ? "目前有需要優先尋求醫療協助的訊號。"
              : "目前有需要持續留意的狀況。"
          }
          description="即使紀錄中的困擾程度有所變化，仍應優先依目前的安全提醒採取行動。"
          actions={
            <Button asChild className="min-h-11">
              <Link to="/events/$eventId/navigate" params={{ eventId }}>
                查看就醫與專業支持
              </Link>
            </Button>
          }
        />
      ) : null}

      {!hasEnoughTracks ? (
        <SectionCard title="還需要更多追蹤紀錄">
          <p className="text-sm text-muted-foreground">
            目前 {tracks.length} 筆，還需要 {MIN_TRACKS_FOR_TREND - tracks.length} 筆
          </p>
          {!isClosed ? (
            <div className="space-y-3 pt-1">
              {todayTracked ? (
                <p className="text-sm text-muted-foreground">
                  今天已完成追蹤，明天可以再繼續記錄。
                </p>
              ) : null}
              <PrimaryCta asChild>
                <Link to="/events/$eventId/track/today" params={{ eventId }}>
                  {todayTracked ? "查看今日追蹤" : "新增今日追蹤"}
                </Link>
              </PrimaryCta>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {showConclusion && conclusion ? (
        <SectionCard title="困擾程度變化" className={CARD_TIGHT}>
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">初始</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">
                      {conclusion.initial}
                    </p>
                  </div>
                  <span className="text-lg text-primary" aria-hidden="true">
                    →
                  </span>
                  <div>
                    <p className="text-xs text-muted-foreground">最新</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">
                      {conclusion.latest}
                    </p>
                  </div>
                </div>
                <p className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <DirectionIcon direction={conclusion.direction} />
                  {conclusion.text}
                </p>
              </div>
            </div>
            {latestTrack ? (
              <p className="text-sm text-foreground">
                你在最新追蹤中的感受：{subjectiveLabel(latestTrack.subjectiveChange)}
              </p>
            ) : null}
            {latestTrack &&
            hasDirectionMismatch(
              conclusion.direction,
              subjectiveDirection(latestTrack.subjectiveChange),
            ) ? (
              <div className="mt-1 flex items-start gap-2 rounded-lg border border-caution/50 bg-caution-muted px-3 py-2">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-caution-strong"
                />
                <p className="text-sm leading-6 text-foreground">{MISMATCH_TEXT}</p>
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      {showChart ? (
        <SectionCard title="困擾程度" className={CARD_TIGHT}>
          <SeverityTrendChart
            points={chartPoints}
            accessibleText={`困擾程度折線圖：初始 ${initial.severity}／10，最新 ${
              latestTrack?.severity ?? initial.severity
            }／10，${
              conclusion
                ? conclusion.text
                : buildSeverityConclusion(
                    initial.severity,
                    latestTrack?.severity ?? initial.severity,
                  ).text
            }。`}
          />
        </SectionCard>
      ) : null}

      {showFrequency && frequency ? (
        <SectionCard title="發生頻率" className={CARD_TIGHT}>
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-base font-semibold text-foreground">
              <DirectionIcon direction={frequency.direction} />
              {frequency.text}
            </p>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch sm:gap-4">
              <FrequencyEnd
                label="最早追蹤"
                date={frequency.earliest.date}
                text={frequency.earliest.label}
                level={frequency.earliest.level}
              />
              <div
                aria-hidden="true"
                className="self-center text-sm leading-none text-muted-foreground"
              >
                <span className="sm:hidden">↓</span>
                <span className="hidden sm:inline">→</span>
              </div>
              <FrequencyEnd
                label="最新追蹤"
                date={frequency.latest.date}
                text={frequency.latest.label}
                level={frequency.latest.level}
              />
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="追蹤時間軸" className={CARD_TIGHT}>
        <ReassessTimeline
          entries={timeline}
          symptomName={event.symptomName}
          symptomStartedOn={event.startedOn}
        />
      </SectionCard>

      {!isClosed && currentSafety?.result === "normal" ? (
        <SectionCard
          title="需要進一步確認嗎？"
          description={
            <>
              <span className="block sm:inline">你可以依目前的追蹤變化，</span>
              <span className="block sm:inline">查看適合的就醫方向或其他專業協助。</span>
            </>
          }
          footer={
            <PrimaryCta asChild>
              <Link to="/events/$eventId/navigate" params={{ eventId }}>
                查看就醫與專業協助
              </Link>
            </PrimaryCta>
          }
        />
      ) : null}

      {isClosed ? (
        <div>
          <BackToEvents />
        </div>
      ) : (
        <CloseEventSection
          eventId={eventId}
          isPriorityCare={currentSafety?.result === "priority_care"}
        />
      )}
    </PageContainer>
  );
}

function FrequencyEnd({
  label,
  date,
  text,
  level,
}: {
  label: string;
  date: string;
  text: string;
  level: number;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-base font-semibold text-foreground">{text}</p>
      <p className="mt-1">
        <FrequencyDots level={level} label={label} />
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{formatDisplayDate(date)}</p>
    </div>
  );
}

function DirectionIcon({ direction }: { direction: SeverityDirection }) {
  if (direction === "down") {
    return <TrendingDown aria-hidden="true" className="size-4 shrink-0 text-primary" />;
  }
  if (direction === "up") {
    return <TrendingUp aria-hidden="true" className="size-4 shrink-0 text-caution-strong" />;
  }
  return <Minus aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />;
}

