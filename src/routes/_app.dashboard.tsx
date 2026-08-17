import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "儀表板 — NexNav" },
      { name: "description", content: "NexNav 個人健康導航儀表板。" },
      { property: "og:title", content: "儀表板 — NexNav" },
      { property: "og:description", content: "NexNav 個人健康導航儀表板。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            儀表板
          </h1>
          <p className="text-muted-foreground">
            這裡會顯示您的健康追蹤概覽。完整功能將於後續版本推出。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="症狀紀錄"
            value="—"
            description="您追蹤中的症狀數量"
          />
          <DashboardCard
            title="生活因素"
            value="—"
            description="您記錄的生活因素數量"
          />
          <DashboardCard
            title="待整理項目"
            value="—"
            description="需要進一步彙整的項目"
          />
        </div>

        <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">近期活動</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            開始使用 NexNav 後，您的活動紀錄將會顯示在這裡。
          </p>
          <div className="mt-6">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              查看新手上路
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-6 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <p className="mt-3 text-4xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
