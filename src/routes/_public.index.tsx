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
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
        <p className="nexnav-hero-badge mb-8 inline-flex items-center rounded-full px-3.5 py-1.5 text-sm">
          健康導航平台
        </p>

        {/* Desktop：兩行置中 */}
        <h1 className="nexnav-hero-title hidden max-w-3xl text-[38px] font-semibold leading-[1.35] tracking-tight sm:block">
          <span className="block whitespace-nowrap">
            NexNav 協助您記錄症狀 &amp; 追蹤生活因素
          </span>
          <span className="mt-4 block whitespace-nowrap">
            讓您在尋求專業協助時更有條理
          </span>
        </h1>

        {/* Mobile：兩行置中、字級縮小 */}
        <h1 className="nexnav-hero-title block max-w-[354px] text-[19px] font-semibold leading-[1.5] tracking-tight sm:hidden">
          <span className="block whitespace-nowrap">
            NexNav 協助您記錄症狀 &amp; 追蹤生活因素
          </span>
          <span className="mt-4 block whitespace-nowrap">
            讓您在尋求專業協助時更有條理
          </span>
        </h1>


        <div className="mt-9 flex w-full max-w-[190px] flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            to="/register"
            className="bg-gradient-brand shadow-brand inline-flex min-h-[50px] items-center justify-center rounded-xl px-6 text-base font-medium text-primary-foreground transition-all hover:brightness-105"
          >
            開始使用
          </Link>
          <Link
            to="/login"
            className="nexnav-secondary-cta inline-flex min-h-[50px] items-center justify-center rounded-xl px-6 text-base font-medium transition-all hover:brightness-110"
          >
            已有帳號？登入
          </Link>

        </div>
      </div>
    </div>
  );
}

