import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/event-wizard";
import type { ActiveEventItem } from "@/hooks/useActiveEvents";

/**
 * Active Event Card（P04）。
 * 目前僅實作「尚未完成狀況確認」的主要行動；其餘狀態於後續模組驗收後再擴充。
 */
export function ActiveEventCard({ event }: { event: ActiveEventItem }) {
  const cta =
    event.safetyState === "incomplete"
      ? {
          label: "完成目前狀況確認",
          to: "/events/$eventId/safety" as const,
        }
      : {
          label: "查看狀況內容",
          to: "/events/$eventId" as const,
        };

  const safetyLabel =
    event.safetyState === "incomplete" ? "尚未完成狀況確認" : "已完成狀況確認";

  return (
    <Card className="gap-4 border-border bg-surface-elevated p-5 sm:p-6">
      <div className="min-w-0 space-y-1">
        <h3 className="break-words text-lg font-semibold text-foreground">
          {event.primarySymptomLabel}
        </h3>
        <p className="text-sm text-muted-foreground">
          開始日期 {formatDisplayDate(event.startedOn)}．已追蹤 {event.trackedDays} 天
        </p>
      </div>

      <p className="inline-flex w-fit items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground">
        {safetyLabel}
      </p>

      <Button asChild size="lg" className="min-h-11 w-full sm:w-auto">
        <Link to={cta.to} params={{ eventId: event.id }}>
          {cta.label}
        </Link>
      </Button>
    </Card>
  );
}
