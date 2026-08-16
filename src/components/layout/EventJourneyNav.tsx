import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** 固定順序的狀況歷程導覽（不含 workflow gate）。 */
export const EVENT_JOURNEY = [
  { to: "/events/$eventId", label: "狀況總覽", exact: true },
  { to: "/events/$eventId/directions", label: "改善方向", exact: false },
  { to: "/events/$eventId/today", label: "今日追蹤", exact: false },
  { to: "/events/$eventId/changes", label: "追蹤變化", exact: false },
  { to: "/events/$eventId/care", label: "就醫與專業支持方向", exact: false },
  { to: "/events/$eventId/summary", label: "摘要", exact: false },
] as const;

export function EventJourneyNav({ eventId }: { eventId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = `/events/${eventId}`;
  const current =
    EVENT_JOURNEY.find((item) =>
      item.exact
        ? pathname === base || pathname === `${base}/`
        : pathname.startsWith(item.to.replace("$eventId", eventId)),
    ) ?? EVENT_JOURNEY[0];

  return (
    <div className="border-b border-border/60 bg-surface">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Desktop：水平選單 */}
        <nav
          aria-label="狀況歷程導覽"
          className="hidden items-center gap-1 overflow-x-auto md:flex"
        >
          {EVENT_JOURNEY.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              params={{ eventId }}
              activeOptions={{ exact: item.exact }}
              activeProps={{
                className:
                  "border-primary text-foreground",
              }}
              className="inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile：Dropdown */}
        <div className="py-2 md:hidden">
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
            <DropdownMenuContent
              align="start"
              className="w-[calc(100vw-2rem)] max-w-sm"
            >
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
