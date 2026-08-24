import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/event-wizard";
import type { ActiveEventItem } from "@/hooks/useActiveEvents";
import type { EventNextStepState } from "@/lib/event-next-step";

const STATUS_CLASSES: Record<EventNextStepState, string> = {
  safety_incomplete: "border-caution/60 bg-caution-muted text-caution-strong",
  priority_care: "border-urgent bg-urgent-muted text-urgent-strong",
  attention: "border-caution bg-caution-muted text-caution-strong",
  guide_pending: "border-chart-3/35 bg-chart-3/10 text-chart-3",
  track_pending: "border-primary/35 bg-secondary text-secondary-foreground",
  track_complete: "border-chart-3/30 bg-chart-3/10 text-chart-3",
};

const CTA_CLASSES: Record<EventNextStepState, string> = {
  safety_incomplete:
    "bg-caution text-foreground hover:bg-caution/90 focus-visible:ring-caution",
  priority_care:
    "bg-urgent text-white hover:bg-urgent/90 focus-visible:ring-urgent",
  attention:
    "bg-caution text-foreground hover:bg-caution/90 focus-visible:ring-caution",
  guide_pending:
    "bg-chart-3 text-white hover:bg-chart-3/90 focus-visible:ring-chart-3",
  track_pending: "",
  track_complete:
    "border-2 border-chart-3 bg-transparent text-chart-3 hover:bg-chart-3/10",
};

/** Dashboard active event card：依 Safety、Guide 與今日 Track 狀態顯示真正的下一步。 */
export function ActiveEventCard({ event }: { event: ActiveEventItem }) {
  const { nextStep } = event;
  const displayStartedOn = formatDisplayDate(event.startedOn);
  const mobileStartedOn = displayStartedOn.replace(/^\d{4}\//, "");
  const latestDesktopLabel =
    event.latestSeverity === null ? null : `最新困擾程度 ${event.latestSeverity}/10`;
  const latestMobileLabel =
    event.latestSeverity === null ? null : `困擾 ${event.latestSeverity}/10`;
  const mobileCtaLabel =
    nextStep.state === "priority_care" || nextStep.state === "attention"
      ? "查看專業協助"
      : nextStep.ctaLabel;

  return (
    <Card className="gap-3 border-border bg-surface-elevated p-5 sm:grid sm:grid-cols-[minmax(0,1.35fr)_minmax(10rem,0.8fr)_auto] sm:items-center sm:gap-6 sm:p-6">
      <div className="min-w-0 sm:space-y-1">
        <div className="flex items-center justify-between gap-3 sm:block">
          <h3 className="min-w-0 break-words text-lg font-semibold text-foreground">
            {event.primarySymptomLabel}
          </h3>
          <p className="shrink-0 whitespace-nowrap text-sm text-muted-foreground sm:hidden">
            {mobileStartedOn} · {event.trackCount}筆
            {latestMobileLabel ? ` · ${latestMobileLabel}` : ""}
          </p>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          開始日期 {displayStartedOn}．累計追蹤 {event.trackCount} 筆
          {latestDesktopLabel ? `．${latestDesktopLabel}` : ""}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 sm:contents">
        <p
          className={`inline-flex w-fit min-w-0 items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CLASSES[nextStep.state]}`}
        >
          {nextStep.statusLabel}
        </p>

        <Button
          asChild
          size="lg"
          variant={nextStep.state === "track_complete" ? "outline" : "default"}
          className={`min-h-11 shrink-0 ${CTA_CLASSES[nextStep.state]}`}
        >
          <Link to={nextStep.to} params={{ eventId: event.id }}>
            <span className="sm:hidden">{mobileCtaLabel}</span>
            <span className="hidden sm:inline">{nextStep.ctaLabel}</span>
          </Link>
        </Button>
      </div>
    </Card>
  );
}
