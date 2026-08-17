import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "NexNav — 健康導航平台" },
      {
        name: "description",
        content:
          "NexNav 幫助您整理輕微健康困擾、追蹤症狀與生活因素，並準備好就醫資訊。",
      },
      { property: "og:title", content: "NexNav — 健康導航平台" },
      {
        property: "og:description",
        content:
          "NexNav 幫助您整理輕微健康困擾、追蹤症狀與生活因素，並準備好就醫資訊。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-3 py-1 text-sm text-muted-foreground">
          健康導航平台
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          整理健康困擾，
          <br className="hidden sm:block" />
          準備好就醫資訊
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          NexNav 協助您記錄症狀、追蹤生活因素，讓您在尋求專業協助時更有條理。
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            開始使用
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-surface-elevated px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            已有帳號？登入
          </Link>
        </div>
      </div>
    </div>
  );
}
