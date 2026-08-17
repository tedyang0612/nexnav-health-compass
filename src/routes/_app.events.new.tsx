import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, SectionCard } from "@/components/shell";

export const Route = createFileRoute("/_app/events/new")({
  head: () => ({
    meta: [
      { title: "新增狀況追蹤 — NexNav" },
      { name: "description", content: "建立新的狀況追蹤流程。" },
      { property: "og:title", content: "新增狀況追蹤 — NexNav" },
      { property: "og:description", content: "建立新的狀況追蹤流程。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewEventPage,
});

function NewEventPage() {
  return (
    <PageContainer width="narrow" className="space-y-6">
      <PageHeader title="新增狀況追蹤" description="此流程的內容將於後續步驟建立。" />
      <SectionCard title="版型預留區" description="尚未加入任何內容。" />
    </PageContainer>
  );
}
