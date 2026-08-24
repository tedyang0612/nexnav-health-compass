import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ErrorState, LoadingState, PageContainer } from "@/components/shell";
import { useActiveEvents } from "@/hooks/useActiveEvents";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/events/$eventId/")({
  head: () => ({
    meta: [
      { title: "前往目前步驟 — NexNav" },
      {
        name: "description",
        content: "NexNav 會依目前狀況進度，前往最適合的下一步。",
      },
    ],
  }),
  component: Page,
});

/** 舊的 Event Overview 路由保留為相容入口，但不再顯示 placeholder。 */
function Page() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const eventsQuery = useActiveEvents(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!eventsQuery.isSuccess) return;
    const event = eventsQuery.data.find((item) => item.id === eventId);
    if (!event) {
      void navigate({ to: "/dashboard", replace: true });
      return;
    }
    void navigate({
      to: event.nextStep.to,
      params: { eventId },
      replace: true,
    });
  }, [eventId, eventsQuery.data, eventsQuery.isSuccess, navigate]);

  if (eventsQuery.isError) {
    return (
      <PageContainer className="space-y-6">
        <ErrorState
          title="目前無法確認狀況進度"
          description="請稍後再試一次。"
          retryLabel="再試一次"
          onRetry={() => void eventsQuery.refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <LoadingState label="前往目前步驟中…" />
    </PageContainer>
  );
}
