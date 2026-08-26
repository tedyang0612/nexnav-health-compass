import { createFileRoute } from "@tanstack/react-router";
import { SafetyFlow } from "@/components/events/SafetyFlow";

export const Route = createFileRoute("/_app/events/$eventId/safety_/edit")({
  head: () => ({
    meta: [
      { title: "重新確認目前狀況 — NexNav" },
      {
        name: "description",
        content: "NexNav 狀況歷程：重新填寫狀況確認問卷並更新最新結果。",
      },
      { property: "og:title", content: "重新確認目前狀況 — NexNav" },
      {
        property: "og:description",
        content: "NexNav 狀況歷程：重新填寫狀況確認問卷並更新最新結果。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { eventId } = Route.useParams();
  return <SafetyFlow eventId={eventId} mode="edit" />;
}
