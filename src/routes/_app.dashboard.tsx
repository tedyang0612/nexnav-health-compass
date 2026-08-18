import { createFileRoute, Link } from "@tanstack/react-router";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@/components/shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { ActiveEventCard } from "@/components/dashboard/ActiveEventCard";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "我的狀況 — NexNav" },
      { name: "description", content: "NexNav 個人狀況追蹤總覽。" },
      { property: "og:title", content: "我的狀況 — NexNav" },
      { property: "og:description", content: "NexNav 個人狀況追蹤總覽。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const query = useActiveEvents(user?.id);
  const events = query.data ?? [];

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="我的狀況"
        description="以下是目前正在追蹤的狀況。"
        actions={
          <Button asChild className="min-h-11">
            <Link to="/events/new">新增狀況追蹤</Link>
          </Button>
        }
      />

      {query.isPending ? (
        <LoadingState label="正在載入目前追蹤中的狀況…" />
      ) : query.isError ? (
        <ErrorState
          title="目前無法載入追蹤中的狀況"
          description="請稍後再試一次。"
          onRetry={() => void query.refetch()}
        />
      ) : events.length === 0 ? (
        <EmptyState
          title="目前沒有追蹤中的狀況"
          description="您現在沒有正在追蹤的身體狀況。若最近有不適，可以先建立一筆狀況追蹤。"
          action={
            <Button asChild size="lg" className="min-h-11">
              <Link to="/events/new">新增狀況追蹤</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <ActiveEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
