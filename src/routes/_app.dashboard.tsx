import { createFileRoute } from "@tanstack/react-router";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/shell";

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
  return (
    <PageContainer className="space-y-6">
      <PageHeader title="我的狀況" description="此頁面的內容將於後續步驟建立。" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="版型預留區" description="尚未加入任何內容。" />
        <SectionCard title="版型預留區" description="尚未加入任何內容。">
          <EmptyState title="目前沒有可顯示的項目" description="此區塊僅為版型示意。" />
        </SectionCard>
      </div>
    </PageContainer>
  );
}
