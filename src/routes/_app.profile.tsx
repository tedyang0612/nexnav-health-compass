import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, SectionCard } from "@/components/shell";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "健康檔案 — NexNav" },
      { name: "description", content: "NexNav 健康檔案頁面。" },
      { property: "og:title", content: "健康檔案 — NexNav" },
      { property: "og:description", content: "NexNav 健康檔案頁面。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <PageContainer width="narrow" className="space-y-6">
      <PageHeader title="健康檔案" description="此頁面的內容將於後續步驟建立。" />
      <SectionCard title="版型預留區" description="尚未加入任何內容。" />
    </PageContainer>
  );
}
