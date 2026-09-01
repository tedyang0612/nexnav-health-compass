import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SymptomIcon } from "@/lib/symptom-icons";
import { formatDisplayDate } from "@/lib/event-wizard";
import type { ClosedEventItem } from "@/hooks/useEventLifecycle";

function formatClosedAt(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  const iso = new Date(parsed).toLocaleDateString("en-CA", {
    timeZone: "Asia/Taipei",
  });
  return formatDisplayDate(iso);
}

/** Dashboard 極簡「已結束的狀況」列表；沒有 closed event 時不渲染。 */
export function ClosedEventsSection({ events }: { events: ClosedEventItem[] }) {
  const [expanded, setExpanded] = useState(false);
  if (events.length === 0) return null;

  const visibleEvents = expanded ? events : events.slice(0, 3);
  const remainingCount = events.length - 3;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">已結束的狀況</h2>
      <ul className="space-y-2">
        {visibleEvents.map((event) => {
          const closedAt = formatClosedAt(event.closedAt);
          return (
            <li
              key={event.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <SymptomIcon code={event.symptomCode} className="size-9" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {event.primarySymptomLabel}
                    </p>
                    <Badge variant="secondary">已結束</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDisplayDate(event.startedOn)} 起
                    {closedAt ? `．${closedAt} 結束` : ""}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="min-h-10 sm:shrink-0">
                <Link to="/events/$eventId/reassess" params={{ eventId: event.id }}>
                  查看紀錄
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
      {remainingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((prev) => !prev)}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {expanded ? "收合紀錄 ↑" : `查看其他 ${remainingCount} 筆 ↓`}
        </Button>
      )}
    </section>
  );
}
