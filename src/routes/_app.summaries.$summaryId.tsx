import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, SectionCard } from "@/components/shell";

export const Route = createFileRoute("/_app/summaries/$summaryId")({
  head: () => ({
    meta: [
      { title: "摘要檢視 — NexNav" },
      { name: "description", content: "NexNav：摘要檢視頁面。" },
      { property: "og:title", content: "摘要檢視 — NexNav" },
      { property: "og:description", content: "NexNav：摘要檢視頁面。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader title="摘要檢視" description="此頁面的內容將於後續步驟建立。" />
      <SectionCard title="版型預留區" description="尚未加入任何內容。" />
    </PageContainer>
  );
}
