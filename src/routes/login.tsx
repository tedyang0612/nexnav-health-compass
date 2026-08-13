import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "登入 — NexNav" },
      { name: "description", content: "登入 NexNav 健康導航平台。" },
      { property: "og:title", content: "登入 — NexNav" },
      { property: "og:description", content: "登入 NexNav 健康導航平台。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-surface-elevated p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            登入 NexNav
          </h1>
          <p className="text-sm text-muted-foreground">
            此為登入頁面雛形，認證功能將於後續實作。
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              電子郵件
            </label>
            <input
              id="email"
              type="email"
              placeholder="hello@example.com"
              disabled
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              密碼
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground opacity-60 transition-colors hover:bg-primary/90"
          >
            登入
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          還沒有帳號？{" "}
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            註冊
          </Link>
        </p>
      </div>
    </div>
  );
}
