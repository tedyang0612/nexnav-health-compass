import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/** 固定順序的狀況歷程導覽（不含 workflow gate）。 */
export const EVENT_JOURNEY = [
  { to: "/events/$eventId", label: "記錄不適", en: "Record", short: "記錄不適", exact: true },
  {
    to: "/events/$eventId/safety",
    label: "安全確認",
    en: "Safety",
    short: "安全確認",
    exact: false,
  },
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
    label: "專業協助",
    en: "Navigate",
    short: "專業協助",
    exact: false,
  },
  {
    to: "/events/$eventId/summary/new",
    label: "建立摘要",
    en: "Prepare",
    short: "建立摘要",
    exact: false,
  },
  {
    to: "/events/$eventId/connect",
    label: "醫療資源",
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
                          "text-[10px] leading-tight whitespace-nowrap",
                          active
                            ? "text-primary"
                            : completed
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {item.en}
                      </span>
                      <span
                        className={cn(
                          "text-xs leading-snug whitespace-nowrap",
                          active
                            ? "font-semibold text-primary"
                            : completed
                              ? "font-medium text-foreground"
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

        {/* Mobile：固定四個相鄰階段的圓形節點 */}
        <div className="py-4 md:hidden">
          <nav aria-label="狀況歷程導覽">
            <ol className="grid grid-cols-[minmax(0,1fr)_18px_minmax(0,1fr)_18px_minmax(0,1fr)_18px_minmax(0,1fr)] items-start">
              {mobileStages.map((item, index) => {
                const stageIndex = mobileStart + index;
                const active = stageIndex === currentIndex;
                const completed = stageIndex < currentIndex;
                return (
                  <li key={item.label} className="contents">
                    {index > 0 ? (
                      <span
                        aria-hidden="true"
                        className="relative mt-[21px] flex h-2 items-center justify-end"
                      >
                        <span
                          className={cn(
                            "absolute inset-x-0 h-0.5 rounded-full",
                            stageIndex <= currentIndex ? "bg-success" : "bg-border",
                          )}
                        />
                        {stageIndex === currentIndex ? (
                          <span className="relative h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-primary" />
                        ) : null}
                      </span>
                    ) : null}
                    <Link
                      to={item.to}
                      params={{ eventId }}
                      aria-current={active ? "page" : undefined}
                      className="flex min-w-0 flex-col items-center gap-1.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span
                        className={cn(
                          "grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition-colors",
                          active &&
                            "border-primary bg-primary text-primary-foreground shadow-[0_0_0_5px_color-mix(in_srgb,var(--primary)_18%,transparent)]",
                          completed && "border-success bg-card text-success",
                          !active && !completed && "border-transparent bg-muted",
                        )}
                      >
                        {completed ? (
                          <CheckIcon />
                        ) : active ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] leading-tight whitespace-nowrap",
                          active
                            ? "text-primary"
                            : completed
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {item.en}
                      </span>
                      <span
                        className={cn(
                          "text-[12px] leading-tight font-semibold whitespace-nowrap",
                          active
                            ? "text-primary"
                            : completed
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {item.short}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
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
