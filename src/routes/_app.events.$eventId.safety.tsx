import { createFileRoute } from "@tanstack/react-router";
import { SafetyFlow } from "@/components/events/SafetyFlow";

export const Route = createFileRoute("/_app/events/$eventId/safety")({
  head: () => ({
    meta: [
      { title: "先確認目前狀況 — NexNav" },
      {
        name: "description",
        content: "NexNav 狀況歷程：先確認是否有需要優先尋求醫療協助的情況。",
      },
      { property: "og:title", content: "先確認目前狀況 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：先確認是否有需要優先尋求醫療協助的情況。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { eventId } = Route.useParams();
  return <SafetyFlow eventId={eventId} mode="view" />;
}
