import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({
    meta: [
      { title: "新手上路 — NexNav" },
      { name: "description", content: "認識 NexNav 健康導航平台的基本功能。" },
      { property: "og:title", content: "新手上路 — NexNav" },
      {
        property: "og:description",
        content: "認識 NexNav 健康導航平台的基本功能。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-heal-muted text-heal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            歡迎使用 NexNav
          </h1>
          <p className="text-lg text-muted-foreground">
            這裡將引導您完成初次設定。正式的上路流程會在後續版本推出。
          </p>
        </div>

        <div className="grid gap-4 text-left sm:grid-cols-3">
          <OnboardingCard
            step="01"
            title="記錄"
            description="記下您想追蹤的健康困擾與生活因素。"
          />
          <OnboardingCard
            step="02"
            title="整理"
            description="彙整資訊，讓描述更有條理。"
          />
          <OnboardingCard
            step="03"
            title="準備"
            description="為尋求專業協助做好準備。"
          />
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          前往儀表板
        </Link>
      </div>
    </div>
  );
}

function OnboardingCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm">
      <span className="text-xs font-semibold text-heal">{step}</span>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
