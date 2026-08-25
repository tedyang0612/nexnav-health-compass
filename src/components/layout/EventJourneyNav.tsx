import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** 固定順序的狀況歷程導覽（不含 workflow gate）。 */
export const EVENT_JOURNEY = [
  { to: "/events/$eventId", label: "狀況總覽", en: "Overview", short: "狀況總覽", exact: true },
  { to: "/events/$eventId/guide", label: "改善方向", en: "Guide", short: "改善方向", exact: false },
  {
    to: "/events/$eventId/track/today",
    label: "每日追蹤",
    en: "Track",
    short: "每日追蹤",
    exact: false,
  },
  {
    to: "/events/$eventId/reassess",
    label: "追蹤變化",
    en: "Reassess",
    short: "追蹤變化",
    exact: false,
  },
  {
    to: "/events/$eventId/navigate",
    label: "就醫與專業協助",
    en: "Navigate",
    short: "專業協助",
    exact: false,
  },
  {
    to: "/events/$eventId/summary/new",
    label: "摘要",
    en: "Prepare",
    short: "建立摘要",
    exact: false,
  },
  {
    to: "/events/$eventId/connect",
    label: "尋找醫療資源",
    en: "Connect",
    short: "醫療資源",
    exact: false,
  },
] as const;

export function EventJourneyNav({ eventId }: { eventId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = `/events/${eventId}`;

  function isCurrent(item: (typeof EVENT_JOURNEY)[number]) {
    return item.exact
      ? pathname === base || pathname === `${base}/`
      : pathname.startsWith(item.to.replace("$eventId", eventId));
  }

  const currentIndex = Math.max(
    0,
    EVENT_JOURNEY.findIndex((item) => isCurrent(item)),
  );
  const current = EVENT_JOURNEY[currentIndex] ?? EVENT_JOURNEY[0];

  // Mobile：固定顯示 4 個相鄰階段（僅視覺，不改流程順序）。
  const MOBILE_WINDOW = 4;
  const mobileStart = Math.min(
    Math.max(0, currentIndex - 2),
    Math.max(0, EVENT_JOURNEY.length - MOBILE_WINDOW),
  );
  const mobileStages = EVENT_JOURNEY.slice(mobileStart, mobileStart + MOBILE_WINDOW);

  return (
    <div className="border-b border-border bg-[color-mix(in_srgb,var(--primary)_5%,var(--muted))]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Desktop：完整階段與連接線 */}
        <div className="hidden py-5 md:block">
          <nav aria-label="狀況歷程導覽">
            <ol className="flex w-full items-start">
              {EVENT_JOURNEY.map((item, index) => {
                const active = index === currentIndex;
                const completed = index < currentIndex;
                return (
                  <li
                    key={item.label}
                    className={cn(
                      "flex min-w-0 items-start",
                      index === EVENT_JOURNEY.length - 1 ? "shrink-0" : "flex-1",
                    )}
                  >
                    <Link
                      to={item.to}
                      params={{ eventId }}
                      aria-current={active ? "page" : undefined}
                      className="flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold transition-colors",
                          active &&
                            "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_color-mix(in_srgb,var(--primary)_16%,transparent)]",
                          completed && "border-success bg-card text-success",
                          !active &&
                            !completed &&
                            "border-transparent bg-muted text-muted-foreground",
                        )}
                      >
                        {completed ? <CheckIcon /> : index + 1}
                      </span>
                      <span
                        className={cn(
                          "line-clamp-2 text-xs leading-snug",
                          active
                            ? "font-semibold text-primary"
                            : completed
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                    {index < EVENT_JOURNEY.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-[18px] h-0.5 min-w-2 flex-1 rounded-full",
                          index < currentIndex ? "bg-success" : "bg-border",
                        )}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Mobile：已完成 ＋ 目前階段，另提供完整清單 */}
        <div className="space-y-2 py-3 md:hidden">
          <nav aria-label="狀況歷程導覽">
            <ol className="flex items-center gap-1.5 overflow-hidden">
              {mobileStages.map((item, index) => {
                const stageIndex = mobileStart + index;
                const active = stageIndex === currentIndex;
                return (
                  <li key={item.label} className="flex min-w-0 items-center gap-1.5">
                    {index > 0 ? (
                      <span
                        aria-hidden="true"
                        className="h-0.5 w-3 shrink-0 rounded-full bg-success"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                        active
                          ? "bg-primary font-semibold text-primary-foreground"
                          : "bg-card text-success",
                      )}
                    >
                      {active ? null : <CheckIcon />}
                      <span className="truncate">{item.label}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-h-11 w-full justify-between"
                aria-label="切換狀況歷程頁面"
              >
                <span className="truncate">{current.label}</span>
                <ChevronIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[calc(100vw-2rem)] max-w-sm">
              {EVENT_JOURNEY.map((item) => (
                <DropdownMenuItem key={item.label} asChild className="min-h-11">
                  <Link to={item.to} params={{ eventId }}>
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M5 12 l5 5 l9 -9" />
    </svg>
  );
}


function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
