import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader, SectionCard } from "@/components/shell";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      { title: "初次設定 — NexNav" },
      { name: "description", content: "完成 NexNav 初次設定。" },
      { property: "og:title", content: "初次設定 — NexNav" },
      { property: "og:description", content: "完成 NexNav 初次設定。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <PageContainer width="narrow" className="space-y-6">
      <PageHeader title="初次設定" description="此流程的內容將於後續步驟建立。" />
      <SectionCard title="版型預留區" description="尚未加入任何內容。" />
    </PageContainer>
  );
}
