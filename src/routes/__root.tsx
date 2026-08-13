import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          找不到頁面
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          您要找的頁面不存在或已經移動。
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            回到首頁
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          頁面載入失敗
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          系統發生了一些問題，請重新整理或回到首頁。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            重試
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            回到首頁
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "NexNav — 健康導航平台" },
      {
        name: "description",
        content:
          "NexNav 幫助您整理輕微健康困擾、追蹤症狀與生活因素，並準備好就醫資訊。",
      },
      { name: "author", content: "NexNav" },
      { property: "og:title", content: "NexNav — 健康導航平台" },
      {
        property: "og:description",
        content:
          "NexNav 幫助您整理輕微健康困擾、追蹤症狀與生活因素，並準備好就醫資訊。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@NexNav" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            N
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            NexNav
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/login">登入</NavLink>
          <NavLink to="/register">註冊</NavLink>
          <NavLink to="/onboarding">新手上路</NavLink>
          <NavLink to="/dashboard">儀表板</NavLink>
        </nav>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label={isOpen ? "關閉選單" : "開啟選單"}
          aria-expanded={isOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {isOpen ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M4 12h16" />
                <path d="M4 18h16" />
                <path d="M4 6h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border/50 bg-surface md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6 lg:px-8">
            <MobileNavLink to="/login" onClick={() => setIsOpen(false)}>
              登入
            </MobileNavLink>
            <MobileNavLink to="/register" onClick={() => setIsOpen(false)}>
              註冊
            </MobileNavLink>
            <MobileNavLink to="/onboarding" onClick={() => setIsOpen(false)}>
              新手上路
            </MobileNavLink>
            <MobileNavLink to="/dashboard" onClick={() => setIsOpen(false)}>
              儀表板
            </MobileNavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-accent text-accent-foreground" }}
      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  to,
  onClick,
  children,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeProps={{ className: "bg-accent text-accent-foreground" }}
      className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </Link>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
        <footer className="border-t border-border/50 bg-surface py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            © {new Date().getFullYear()} NexNav. 保留所有權利。
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
